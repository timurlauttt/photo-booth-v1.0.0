import { useState, useRef, useCallback, useEffect } from "react";
import WebcamComponent from "./components/Webcam";
import PhotoStrip from "./components/PhotoStrip";
import PrivacyBadge from "./components/PrivacyBadge";
import DeveloperBadge from "./components/DeveloperBadge";
import GuideModal from "./components/GuideModal";
import SessionGallery from "./components/SessionGallery";
import {
  FRAME_STYLES,
  LAYOUT_OPTIONS,
  FILTER_OPTIONS,
  RETRO_STAMPS,
  CAPTION_FONTS,
} from "./constants/frames";
import {
  Camera,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Volume2,
  VolumeX,
  History,
  Layers,
  Minimize,
} from "lucide-react";
import { playPrintSound } from "./utils/audio";
import { GIFEncoder, quantize } from "gifenc";
import { applyPaletteWithDither } from "./utils/dither";
import { getGestureRecognizer, checkOpenPalm } from "./utils/gestureRecognizer";
import "./App.css";

const getDefaultDateStamp = () => {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `'${yy} ${mm} ${dd}`;
};

function App() {
  const webcamRef = useRef(null);
  const stripRef = useRef(null);

  // States
  const [activeLayout, setActiveLayout] = useState(LAYOUT_OPTIONS[0]); // 3-vert default
  const [frameStyle, setFrameStyle] = useState(FRAME_STYLES[0]); // Classic White default
  const [filter, setFilter] = useState("none");
  const [selectedStamps, setSelectedStamps] = useState([RETRO_STAMPS[1]]); // default 1 sticker: ☺ SMILE
  const retroStamp = selectedStamps[0] || RETRO_STAMPS[0];

  // Toggle / append stickers (supports duplicate stickers up to 4 max)
  const handleStampToggle = useCallback((stamp) => {
    if (stamp.id === "none") {
      setSelectedStamps([]);
      return;
    }
    setSelectedStamps((prev) => {
      if (prev.length < 4) {
        // Can add more of any sticker (including duplicate)
        return [...prev, stamp];
      }
      // When at 4, if this stamp is in the list, remove one instance of it
      const lastIndex = prev.map((s) => s.id).lastIndexOf(stamp.id);
      if (lastIndex !== -1) {
        const next = [...prev];
        next.splice(lastIndex, 1);
        return next;
      }
      // If not in the list, replace the oldest sticker
      return [...prev.slice(1), stamp];
    });
  }, []);

  const handleRemoveStampAt = useCallback((index) => {
    setSelectedStamps((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleClearStamps = useCallback(() => {
    setSelectedStamps([]);
  }, []);

  // Capture Mode: 'photo' (PNG) or 'video' (MP4, max 5s per slot)
  const [captureMode, setCaptureMode] = useState("photo");
  const [videoClips, setVideoClips] = useState([]);
  const videoClipsRef = useRef([]);
  useEffect(() => {
    videoClipsRef.current = videoClips;
  }, [videoClips]);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [videoRecordProgress, setVideoRecordProgress] = useState(0); // 0 to 10 seconds
  const stopVideoRecordingRef = useRef(null);
  const sessionCancelledRef = useRef(false);
  const lastGestureTriggerTimeRef = useRef(0);

  const [photos, setPhotos] = useState([]);
  const [rawPhotos, setRawPhotos] = useState([]);
  const [countdown, setCountdown] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingVideo, setIsDownloadingVideo] = useState(false);
  const [isDownloadingGif, setIsDownloadingGif] = useState(false);
  const [isDownloadingStopMotion, setIsDownloadingStopMotion] = useState(false);
  const [exportFormat, setExportFormat] = useState("story"); // 'story' (Instagram Story 9:16) or 'strip' (Strip Pas)
  const [livePreview, setLivePreview] = useState(null);
  const [activeTab, setActiveTab] = useState("layout");
  const [facingMode, setFacingMode] = useState("user"); // 'user' (kamera depan) | 'environment' (kamera belakang)
  const [isMirrored, setIsMirrored] = useState(true); // Mirror mode on/off (consistent across viewfinder, preview, and output)
  const [timerDuration, setTimerDuration] = useState(3); // 3, 5, or 10 seconds
  const [customCaption, setCustomCaption] = useState(""); // Custom text printed on strip
  const [customFrameColor, setCustomFrameColor] = useState(null); // Hex color override for strip frame
  const [isSoundEnabled, setIsSoundEnabled] = useState(true); // SFX audio toggle
  const [sessionHistory, setSessionHistory] = useState([]); // Array of { id, mode, layoutName, caption, timestamp, thumbnailUrl, blob, filename }
  const [isGalleryOpen, setIsGalleryOpen] = useState(false); // Session gallery modal
  const [mobileTab, setMobileTab] = useState("camera"); // 'camera' or 'strip' for mobile tab navigation

  // Neo-Brutalist Enhancements
  const [framePattern, setFramePattern] = useState("none"); // 'none' | 'checkerboard' | 'polkadot' | 'hearts' | 'stars' | 'filmgrain'
  const [captionFont, setCaptionFont] = useState("mono"); // 'mono' | 'digital' | 'typewriter' | 'cursive' | 'bubble'
  const [isRingLightOn, setIsRingLightOn] = useState(false);
  const [ringLightColor, setRingLightColor] = useState("white"); // 'white' | 'warm' | 'rose'
  const [placedStickers, setPlacedStickers] = useState([]); // Array of { id, sticker, x, y, scale, rotation }

  // Hands-Free Gesture Recognition (5 Jari / Open Palm)
  const [isGestureEnabled, setIsGestureEnabled] = useState(false);
  const [isGestureDetected, setIsGestureDetected] = useState(false);

  // Retake Specific Pose Slot
  const [retakeIndex, setRetakeIndex] = useState(null);

  // Vintage Digicam Orange Quartz Date Stamp
  const [showDateStamp, setShowDateStamp] = useState(false);
  const [dateStampText, setDateStampText] = useState(getDefaultDateStamp());

  // Kiosk / Fullscreen Mode
  const [isKioskMode, setIsKioskMode] = useState(false);

  const handleAddPlacedSticker = useCallback((stickerChar) => {
    if (!stickerChar) return;
    setPlacedStickers((prev) => [
      ...prev,
      {
        id: `stk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        sticker: stickerChar,
        x: 50,
        y: 50,
        scale: 1,
        rotation: 0,
      },
    ]);
  }, []);

  const handleUpdatePlacedSticker = useCallback((id, updates) => {
    setPlacedStickers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  }, []);

  const handleRemovePlacedSticker = useCallback((id) => {
    setPlacedStickers((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const handleClearPlacedStickers = useCallback(() => {
    setPlacedStickers([]);
  }, []);

  const handleToggleRingLight = useCallback(() => {
    setIsRingLightOn((prev) => !prev);
  }, []);

  const handleToggleSound = useCallback(() => {
    setIsSoundEnabled((prev) => !prev);
  }, []);

  const handleFacingModeChange = useCallback((newMode) => {
    setFacingMode(newMode);
    // Auto sync mirror mode: Front camera -> mirrored by default, Back camera -> unmirrored by default
    setIsMirrored(newMode === "user");
  }, []);

  const handleToggleMirror = useCallback(() => {
    setIsMirrored((prev) => !prev);
  }, []);

  // Ensure light mode on html / root
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  // Apply filters on canvas with mirror support
  const applyFilter = useCallback(
    (imageSrc, filterType, mirror = isMirrored) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const size = Math.min(img.width, img.height);
          canvas.width = size;
          canvas.height = size;

          const ctx = canvas.getContext("2d");
          if (ctx) {
            if (mirror) {
              // Mirror / flip horizontal
              ctx.translate(size, 0);
              ctx.scale(-1, 1);
            }

            // Crop center square
            const startX = (img.width - size) / 2;
            const startY = (img.height - size) / 2;
            ctx.drawImage(img, startX, startY, size, size, 0, 0, size, size);

            // Reset transform
            ctx.setTransform(1, 0, 0, 1, 0, 0);

          // Apply selected filter
          if (filterType === "lores" || filterType === "pixelated") {
            // Instagram Story Lo-Res / Y2K Digicam & Camphone Aesthetic:
            // Downsample to low-res sensor resolution (~130-160px), apply flash/sensor bloom and subtle digital grain
            const lowResSize = Math.max(120, Math.floor(size / 3.6));
            const tempCanvas = document.createElement("canvas");
            tempCanvas.width = lowResSize;
            tempCanvas.height = lowResSize;
            const tempCtx = tempCanvas.getContext("2d");
            if (tempCtx) {
              tempCtx.imageSmoothingEnabled = true;
              tempCtx.drawImage(canvas, 0, 0, lowResSize, lowResSize);

              // Low-dynamic-range sensor processing: punchy highlights, warm tone & digital sensor noise
              const imgData = tempCtx.getImageData(0, 0, lowResSize, lowResSize);
              const data = imgData.data;
              for (let i = 0; i < data.length; i += 4) {
                let r = data[i];
                let g = data[i + 1];
                let b = data[i + 2];

                // Contrast curve with brightened highlights (Insta story flash look)
                r = (r - 128) * 1.28 + 128 + 10;
                g = (g - 128) * 1.24 + 128 + 6;
                b = (b - 128) * 1.20 + 128 - 2;

                // Subtle digital sensor grain
                const noise = (Math.random() - 0.5) * 14;
                r += noise;
                g += noise;
                b += noise;

                data[i] = Math.max(0, Math.min(255, r));
                data[i + 1] = Math.max(0, Math.min(255, g));
                data[i + 2] = Math.max(0, Math.min(255, b));
              }
              tempCtx.putImageData(imgData, 0, 0);

              // Upscale with soft bilinear interpolation for that dreamy, soft low-res digital cam aesthetic
              ctx.imageSmoothingEnabled = true;
              ctx.drawImage(tempCanvas, 0, 0, size, size);
            }
          } else if (filterType === "goldenhour") {
            // Sunset Golden Hour: Warm honey glow, amber highlights, radiant skin tones
            const imageData = ctx.getImageData(0, 0, size, size);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              data[i] = Math.min(255, r * 1.18 + 18);
              data[i + 1] = Math.min(255, g * 1.05 + 10);
              data[i + 2] = Math.max(0, b * 0.84 - 2);
            }
            ctx.putImageData(imageData, 0, 0);
          } else if (filterType === "anime") {
            // Japanese Anime / Pastel Ghibli film: Clean lifted shadows, rich cyan-blues and vivid greens
            const imageData = ctx.getImageData(0, 0, size, size);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
              let r = data[i];
              let g = data[i + 1];
              let b = data[i + 2];
              r = Math.min(255, Math.max(12, r * 1.05 + 4));
              g = Math.min(255, Math.max(14, g * 1.12 + 6));
              b = Math.min(255, Math.max(20, b * 1.16 + 8));
              data[i] = r;
              data[i + 1] = g;
              data[i + 2] = b;
            }
            ctx.putImageData(imageData, 0, 0);
          } else if (filterType === "grayscale") {
            const imageData = ctx.getImageData(0, 0, size, size);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              // High contrast monochrome
              let gray = r * 0.299 + g * 0.587 + b * 0.114;
              gray = (gray - 128) * 1.25 + 128; // boost contrast
              gray = Math.max(0, Math.min(255, gray));
              data[i] = gray;
              data[i + 1] = gray;
              data[i + 2] = gray;
            }
            ctx.putImageData(imageData, 0, 0);
          } else if (filterType === "vintage") {
            // Low res pixelated + sepia 90s effect
            const tempCanvas = document.createElement("canvas");
            const tempSize = Math.floor(size / 3.5);
            tempCanvas.width = tempSize;
            tempCanvas.height = tempSize;
            const tempCtx = tempCanvas.getContext("2d");

            if (tempCtx) {
              tempCtx.drawImage(canvas, 0, 0, tempSize, tempSize);
              const imageData = tempCtx.getImageData(0, 0, tempSize, tempSize);
              const data = imageData.data;
              for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
                data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
                data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
              }
              tempCtx.putImageData(imageData, 0, 0);
              ctx.imageSmoothingEnabled = false;
              ctx.drawImage(tempCanvas, 0, 0, size, size);
            }
          } else if (filterType === "sepia") {
            // Warm golden sepia
            const imageData = ctx.getImageData(0, 0, size, size);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              data[i] = Math.min(255, r * 0.45 + g * 0.78 + b * 0.2);
              data[i + 1] = Math.min(255, r * 0.38 + g * 0.69 + b * 0.18);
              data[i + 2] = Math.min(255, r * 0.28 + g * 0.5 + b * 0.14);
            }
            ctx.putImageData(imageData, 0, 0);
          } else if (filterType === "cyber") {
            // Futuristic cyan/magenta high contrast
            const imageData = ctx.getImageData(0, 0, size, size);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
              data[i] = Math.min(255, data[i] * 1.25); // boost red/magenta
              data[i + 1] = Math.max(0, data[i + 1] * 0.9);
              data[i + 2] = Math.min(255, data[i + 2] * 1.35); // boost blue/cyan
            }
            ctx.putImageData(imageData, 0, 0);
          } else if (filterType === "fisheye") {
            // Y2K Fisheye Barrel Distortion Lens (Normal Scale, No Excessive Zoom)
            const srcData = ctx.getImageData(0, 0, size, size);
            const srcPixels = new Uint32Array(srcData.data.buffer);
            const dstData = ctx.createImageData(size, size);
            const dstPixels = new Uint32Array(dstData.data.buffer);

            const cx = size / 2;
            const cy = size / 2;
            // Full-diagonal radius so photo is preserved without dark cutout
            const R = size * 0.708;
            const invR = 1 / R;

            for (let y = 0; y < size; y++) {
              const dy = (y - cy) * invR;
              const dy2 = dy * dy;
              const rowIdx = y * size;
              for (let x = 0; x < size; x++) {
                const dx = (x - cx) * invR;
                const r2 = dx * dx + dy2;

                // Natural optical barrel distortion: 1:1 scale at center (no crazy zoom!)
                const factor = 0.98 + 0.35 * r2;
                const srcX = Math.min(size - 1, Math.max(0, Math.round(cx + (x - cx) * factor)));
                const srcY = Math.min(size - 1, Math.max(0, Math.round(cy + (y - cy) * factor)));

                // Edge optical chromatic aberration (Y2K retro lens)
                let pixel = srcPixels[srcY * size + srcX];
                let r = pixel & 0xff;
                let g = (pixel >> 8) & 0xff;
                let b = (pixel >> 16) & 0xff;

                if (r2 > 0.4) {
                  const shift = Math.floor((r2 - 0.4) * 2.5);
                  const shiftX = Math.min(size - 1, Math.max(0, srcX + shift));
                  const shiftedPixel = srcPixels[srcY * size + shiftX];
                  r = shiftedPixel & 0xff; // RGB chromatic fringe
                }

                // Subtle corner lens vignette
                if (r2 > 0.7) {
                  const vig = Math.max(0.7, 1 - (r2 - 0.7) * 0.75);
                  r = Math.floor(r * vig);
                  g = Math.floor(g * vig);
                  b = Math.floor(b * vig);
                }

                dstPixels[rowIdx + x] = (0xff << 24) | (b << 16) | (g << 8) | r;
              }
            }
            ctx.putImageData(dstData, 0, 0);
          } else if (filterType === "softglow") {
            // Korean Photobooth Dreamy Soft Glow / Film Bloom
            const tempCanvas = document.createElement("canvas");
            tempCanvas.width = size;
            tempCanvas.height = size;
            const tempCtx = tempCanvas.getContext("2d");
            if (tempCtx) {
              tempCtx.drawImage(canvas, 0, 0);
              // Blend screen overlay with slight blur & warmth
              ctx.save();
              ctx.globalAlpha = 0.42;
              ctx.globalCompositeOperation = "screen";
              ctx.filter = "blur(8px)";
              ctx.drawImage(tempCanvas, 0, 0);
              ctx.restore();

              // Warm romantic pastel boost
              const imgData = ctx.getImageData(0, 0, size, size);
              const data = imgData.data;
              for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.min(255, data[i] * 1.05 + 10); // soft rose/peach
                data[i + 1] = Math.min(255, data[i + 1] * 1.02 + 5);
                data[i + 2] = Math.min(255, data[i + 2] * 0.98 + 4);
              }
              ctx.putImageData(imgData, 0, 0);
            }
          } else if (filterType === "warmfilm") {
            // Kodak Gold Warm 90s Disposable Film
            const imageData = ctx.getImageData(0, 0, size, size);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              // Warm golden highlights, rich skin tones, nostalgic film curve
              data[i] = Math.min(255, r * 1.15 + 12);
              data[i + 1] = Math.min(255, g * 1.06 + 8);
              data[i + 2] = Math.min(255, b * 0.92 + 5);
            }
            ctx.putImageData(imageData, 0, 0);
          } else if (filterType === "digicam") {
            // 2000s Digicam (Canon IXY / CCD sensor): punchy flash highlights, rich skin tones, crisp contrast
            const imageData = ctx.getImageData(0, 0, size, size);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
              let r = data[i];
              let g = data[i + 1];
              let b = data[i + 2];
              // S-curve contrast boost
              r = r > 128 ? Math.min(255, 128 + (r - 128) * 1.2 + 8) : Math.max(0, 128 - (128 - r) * 1.15);
              g = g > 128 ? Math.min(255, 128 + (g - 128) * 1.15 + 6) : Math.max(0, 128 - (128 - g) * 1.1);
              b = b > 128 ? Math.min(255, 128 + (b - 128) * 1.1 + 4) : Math.max(0, 128 - (128 - b) * 1.18);
              if (r > 200) r = Math.min(255, r * 1.06);
              if (g > 200) g = Math.min(255, g * 1.04);
              data[i] = r;
              data[i + 1] = g;
              data[i + 2] = b;
            }
            ctx.putImageData(imageData, 0, 0);
          } else if (filterType === "cybershot") {
            // Sony Cybershot: Cool Y2K cyan undertone, vibrant saturated highlights
            const imageData = ctx.getImageData(0, 0, size, size);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
              let r = data[i];
              let g = data[i + 1];
              let b = data[i + 2];
              r = Math.min(255, Math.max(0, (r - 128) * 1.18 + 128 - 4));
              g = Math.min(255, Math.max(0, (g - 128) * 1.15 + 128 + 2));
              b = Math.min(255, Math.max(0, (b - 128) * 1.12 + 128 + 12));
              data[i] = r;
              data[i + 1] = g;
              data[i + 2] = b;
            }
            ctx.putImageData(imageData, 0, 0);
          } else if (filterType === "fujifilm") {
            // Fuji FinePix / Classic Chrome: Rich greens, creamy pastel skin, deep matte shadows
            const imageData = ctx.getImageData(0, 0, size, size);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
              let r = data[i];
              let g = data[i + 1];
              let b = data[i + 2];
              r = Math.min(255, Math.max(14, r * 1.08));
              g = Math.min(255, Math.max(14, g * 1.12 + 4));
              b = Math.min(255, Math.max(18, b * 0.96));
              data[i] = r;
              data[i + 1] = g;
              data[i + 2] = b;
            }
            ctx.putImageData(imageData, 0, 0);
          } else if (filterType === "flashpop") {
            // Direct Flash Night Party Look: High center highlight exposure with darker perimeter fall-off
            const imageData = ctx.getImageData(0, 0, size, size);
            const data = imageData.data;
            const cx = size / 2;
            const cy = size / 2;
            const maxR = size * 0.65;
            for (let y = 0; y < size; y++) {
              const dy = y - cy;
              for (let x = 0; x < size; x++) {
                const idx = (y * size + x) * 4;
                const dx = x - cx;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const flashFactor = Math.max(0.72, 1.25 - (dist / maxR) * 0.48);

                let r = data[idx] * flashFactor;
                let g = data[idx + 1] * flashFactor;
                let b = data[idx + 2] * flashFactor;

                r = Math.min(255, Math.max(0, (r - 128) * 1.22 + 128 + 10));
                g = Math.min(255, Math.max(0, (g - 128) * 1.18 + 128 + 6));
                b = Math.min(255, Math.max(0, (b - 128) * 1.14 + 128));

                data[idx] = r;
                data[idx + 1] = g;
                data[idx + 2] = b;
              }
            }
            ctx.putImageData(imageData, 0, 0);
          } else if (filterType === "camedia") {
            // Olympus Camedia (Early 2000s 3MP CCD): Warm olive-amber nostalgia, soft digital clarity
            const imageData = ctx.getImageData(0, 0, size, size);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              data[i] = Math.min(255, r * 1.10 + 10);
              data[i + 1] = Math.min(255, g * 1.07 + 8);
              data[i + 2] = Math.min(255, b * 0.88 + 4);
            }
            ctx.putImageData(imageData, 0, 0);
          } else if (filterType === "lightleak") {
            // 35mm Analog Light Leak: Warm color curve + corner flare
            const imageData = ctx.getImageData(0, 0, size, size);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
              let r = data[i];
              let g = data[i + 1];
              let b = data[i + 2];
              r = Math.min(255, r * 1.15 + 14);
              g = Math.min(255, g * 1.05 + 6);
              b = Math.max(0, b * 0.92 - 2);
              data[i] = r;
              data[i + 1] = g;
              data[i + 2] = b;
            }
            ctx.putImageData(imageData, 0, 0);

            // Diagonal warm light leak flare
            ctx.save();
            ctx.globalCompositeOperation = "screen";
            const leak = ctx.createRadialGradient(0, 0, 10, size * 0.35, size * 0.35, size * 0.85);
            leak.addColorStop(0, "rgba(255, 120, 40, 0.65)");
            leak.addColorStop(0.3, "rgba(255, 175, 60, 0.4)");
            leak.addColorStop(0.65, "rgba(255, 100, 120, 0.18)");
            leak.addColorStop(1, "rgba(255, 180, 50, 0)");
            ctx.fillStyle = leak;
            ctx.fillRect(0, 0, size, size);
            ctx.restore();
          } else if (filterType === "filmgrain") {
            // Authentic 35mm High-ISO Grain: Warm film tone + analog noise
            const imageData = ctx.getImageData(0, 0, size, size);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
              let r = data[i];
              let g = data[i + 1];
              let b = data[i + 2];
              r = (r - 128) * 1.12 + 128 + 8;
              g = (g - 128) * 1.08 + 128 + 4;
              b = (b - 128) * 1.04 + 128 - 2;

              const grain = (Math.random() - 0.5) * 32;
              r += grain;
              g += grain * 0.9;
              b += grain * 0.8;

              data[i] = Math.max(0, Math.min(255, r));
              data[i + 1] = Math.max(0, Math.min(255, g));
              data[i + 2] = Math.max(0, Math.min(255, b));
            }
            ctx.putImageData(imageData, 0, 0);
          }

          if (filterType === "none") {
            resolve(canvas.toDataURL("image/png"));
          } else {
            resolve(canvas.toDataURL("image/jpeg", 0.98));
          }
        }
      };
      img.src = imageSrc;
    });
  },
  [isMirrored],
);

  // Update live preview in empty slot (only in Photo mode to prevent CPU lag during video recording)
  useEffect(() => {
    if (captureMode !== "photo") {
      setLivePreview(null);
      return;
    }

    const interval = setInterval(async () => {
      if (
        webcamRef.current &&
        captureMode === "photo" &&
        photos.length < activeLayout.count &&
        isCapturing
      ) {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
          const processedPreview = await applyFilter(imageSrc, filter, isMirrored);
          setLivePreview(processedPreview);
        }
      }
    }, 150);

    return () => clearInterval(interval);
  }, [photos.length, activeLayout.count, filter, applyFilter, isCapturing, captureMode, isMirrored]);

  // Capture single high-quality photo with flash
  const capturePhoto = useCallback(async () => {
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 250);

    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      const processed = await applyFilter(imageSrc, filter, isMirrored);
      setPhotos((prev) => [...prev, processed]);
      setRawPhotos((prev) => [...prev, imageSrc]);
    }
  }, [filter, isMirrored, applyFilter]);

  // Re-apply filter and mirror when user changes filter or toggles mirror after photos are taken
  const prevFilterRef = useRef(filter);
  const prevMirrorRef = useRef(isMirrored);
  useEffect(() => {
    if (rawPhotos.length === 0) {
      prevFilterRef.current = filter;
      prevMirrorRef.current = isMirrored;
      return;
    }

    if (prevFilterRef.current === filter && prevMirrorRef.current === isMirrored) return;
    prevFilterRef.current = filter;
    prevMirrorRef.current = isMirrored;

    let isCancelled = false;

    const reapplyFilters = async () => {
      try {
        const newPhotos = await Promise.all(
          rawPhotos.map((raw) => applyFilter(raw, filter, isMirrored))
        );

        if (!isCancelled) {
          setPhotos(newPhotos);
        }
      } catch (err) {
        console.error("Error reapplying filter:", err);
      }
    };

    reapplyFilters();

    return () => {
      isCancelled = true;
    };
  }, [filter, isMirrored, rawPhotos, applyFilter]);

  // Record 1 video slot (max 10 seconds) using MediaRecorder on live webcam stream
  const recordVideoSlot = useCallback(() => {
    return new Promise((resolve) => {
      const stream = webcamRef.current?.video?.srcObject;
      if (!stream) {
        resolve(null);
        return;
      }

      const supportedTypes = [
        "video/mp4;codecs=avc1",
        "video/mp4",
        "video/webm;codecs=h264",
        "video/webm;codecs=vp9",
        "video/webm",
      ];
      const mimeType = supportedTypes.find((t) => MediaRecorder.isTypeSupported(t)) || "";

      let recorder;
      try {
        recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      } catch {
        recorder = new MediaRecorder(stream);
      }

      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      let timer = null;
      const startTime = Date.now();

      const finalizeAndStop = () => {
        if (timer) clearInterval(timer);
        if (recorder.state === "recording") {
          recorder.stop();
        }
        setIsRecordingVideo(false);
        setVideoRecordProgress(0);
      };

      stopVideoRecordingRef.current = finalizeAndStop;

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: recorder.mimeType || "video/mp4" });
        const videoUrl = URL.createObjectURL(blob);
        resolve(videoUrl);
      };

      recorder.start(100);
      setIsRecordingVideo(true);
      setVideoRecordProgress(0);

      timer = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        setVideoRecordProgress(Math.min(10, elapsed));
        if (elapsed >= 10) {
          finalizeAndStop();
        }
      }, 100);
    });
  }, []);

  const handleStopVideoRecording = useCallback(() => {
    if (stopVideoRecordingRef.current) {
      stopVideoRecordingRef.current();
    }
  }, []);

  // Helper to safely revoke video clip URLs and free memory
  const revokeOldVideoClips = useCallback(() => {
    videoClipsRef.current.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch {}
    });
    videoClipsRef.current = [];
  }, []);

  // Start Photo / Video Session
  const startPhotoSession = useCallback(async () => {
    sessionCancelledRef.current = false;
    revokeOldVideoClips();
    setPhotos([]);
    setRawPhotos([]);
    setVideoClips([]);
    setIsCapturing(true);

    const needed = activeLayout.count;
    for (let i = 0; i < needed; i++) {
      if (sessionCancelledRef.current) break;

      // User-configurable countdown (3s, 5s, 10s)
      for (let c = timerDuration; c > 0; c--) {
        if (sessionCancelledRef.current) break;
        setCountdown(c);
        await new Promise((r) => setTimeout(r, 1000));
      }

      if (sessionCancelledRef.current) break;
      setCountdown(null);

      if (captureMode === "video") {
        const clipUrl = await recordVideoSlot();
        if (sessionCancelledRef.current) {
          if (clipUrl) URL.revokeObjectURL(clipUrl);
          break;
        }
        if (clipUrl) {
          setVideoClips((prev) => [...prev, clipUrl]);
        }
      } else {
        await capturePhoto();
      }

      if (sessionCancelledRef.current) break;

      // Pause 1 second between takes if not the last
      if (i < needed - 1) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    setCountdown(null);
    setIsCapturing(false);
    setIsRecordingVideo(false);
    lastGestureTriggerTimeRef.current = Date.now();
    // Auto-switch to strip preview on mobile upon session completion
    if (needed > 0) {
      setMobileTab("strip");
    }
  }, [activeLayout.count, captureMode, recordVideoSlot, capturePhoto, revokeOldVideoClips, timerDuration]);

  // Retake a specific pose slot without affecting other photos
  const startRetakePose = useCallback(
    async (targetIndex) => {
      if (isCapturing || targetIndex === null) return;
      sessionCancelledRef.current = false;
      setIsCapturing(true);
      setMobileTab("camera");

      // User-configurable countdown
      for (let c = timerDuration; c > 0; c--) {
        if (sessionCancelledRef.current) break;
        setCountdown(c);
        await new Promise((r) => setTimeout(r, 1000));
      }

      if (sessionCancelledRef.current) {
        setCountdown(null);
        setIsCapturing(false);
        return;
      }

      setCountdown(null);

      if (captureMode === "video") {
        const clipUrl = await recordVideoSlot();
        if (clipUrl) {
          setVideoClips((prev) => {
            const next = [...prev];
            if (next[targetIndex]) {
              try {
                URL.revokeObjectURL(next[targetIndex]);
              } catch {}
            }
            next[targetIndex] = clipUrl;
            return next;
          });
        }
      } else {
        setIsFlashing(true);
        setTimeout(() => setIsFlashing(false), 250);

        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
          const processed = await applyFilter(imageSrc, filter, isMirrored);
          setPhotos((prev) => {
            const next = [...prev];
            next[targetIndex] = processed;
            return next;
          });
          setRawPhotos((prev) => {
            const next = [...prev];
            next[targetIndex] = imageSrc;
            return next;
          });
        }
      }

      setRetakeIndex(null);
      setIsCapturing(false);
      setIsRecordingVideo(false);
      lastGestureTriggerTimeRef.current = Date.now();
      setMobileTab("strip");
    },
    [isCapturing, timerDuration, captureMode, recordVideoSlot, applyFilter, filter, isMirrored]
  );

  // Hands-Free Gesture Recognition Loop (Open Palm / 5 Jari)
  useEffect(() => {
    if (!isGestureEnabled) {
      setIsGestureDetected(false);
      return;
    }

    let isMounted = true;
    let consecutiveCount = 0;

    const gestureInterval = setInterval(async () => {
      // Do not trigger if session is already complete and user is viewing the photo strip
      const isSessionComplete = photos.length >= activeLayout.count && retakeIndex === null;
      if (!isMounted || !isGestureEnabled || isCapturing || isSessionComplete) {
        if (isGestureDetected) setIsGestureDetected(false);
        consecutiveCount = 0;
        return;
      }

      // 4.5-second cooldown between gesture triggers
      if (Date.now() - lastGestureTriggerTimeRef.current < 4500) {
        return;
      }

      try {
        const recognizer = await getGestureRecognizer();
        const video = webcamRef.current?.video;
        if (!recognizer || !video || video.readyState < 2 || video.videoWidth === 0) return;

        const result = checkOpenPalm(recognizer, video, performance.now());
        if (result.isOpenPalm) {
          consecutiveCount++;
          // Show HUD feedback after holding gesture for ~360ms
          if (consecutiveCount >= 3) {
            setIsGestureDetected(true);
          }
          // Trigger after 5 consecutive confirmed frames (~600ms sustained hold)
          if (consecutiveCount >= 5) {
            consecutiveCount = 0;
            setIsGestureDetected(false);
            lastGestureTriggerTimeRef.current = Date.now();
            if (retakeIndex !== null) {
              startRetakePose(retakeIndex);
            } else {
              startPhotoSession();
            }
          }
        } else {
          // Decay count so single-frame jitter doesn't cause false positives
          consecutiveCount = Math.max(0, consecutiveCount - 1);
          if (consecutiveCount === 0) {
            setIsGestureDetected(false);
          }
        }
      } catch (err) {
        console.warn("Gesture check error:", err);
      }
    }, 120);

    return () => {
      isMounted = false;
      clearInterval(gestureInterval);
      setIsGestureDetected(false);
    };
  }, [isGestureEnabled, isCapturing, photos.length, activeLayout.count, retakeIndex, startRetakePose, startPhotoSession]);

  // Kiosk / Fullscreen Mode handler
  const handleToggleKiosk = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn("Fullscreen request error:", err);
      });
      setIsKioskMode(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsKioskMode(false);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsKioskMode(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Reset Session
  const resetSession = useCallback(() => {
    sessionCancelledRef.current = true;
    if (stopVideoRecordingRef.current) {
      stopVideoRecordingRef.current();
    }
    revokeOldVideoClips();
    setPhotos([]);
    setRawPhotos([]);
    setVideoClips([]);
    setCountdown(null);
    setIsCapturing(false);
    setIsFlashing(false);
    setIsRecordingVideo(false);
    setVideoRecordProgress(0);
    setIsDownloading(false);
    setIsDownloadingVideo(false);
    setPlacedStickers([]);
    setMobileTab("camera");
  }, [revokeOldVideoClips]);

  // Helper to draw rounded rectangles on canvas
  const drawRoundRect = (ctx, x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  // Utility: Draw image or video frame with object-fit: cover (never stretch or squish)
  const drawCoverImage = (
    ctx,
    img,
    dx,
    dy,
    dWidth,
    dHeight,
    radius = 0,
    filterStr = "none",
    mirrorVideo = false,
    filterName = "none",
  ) => {
    const imgW = img.naturalWidth || img.videoWidth || img.width;
    const imgH = img.naturalHeight || img.videoHeight || img.height;
    if (!imgW || !imgH) {
      ctx.drawImage(img, dx, dy, dWidth, dHeight);
      return;
    }

    const targetRatio = dWidth / dHeight;
    const imgRatio = imgW / imgH;
    let sx = 0;
    let sy = 0;
    let sWidth = imgW;
    let sHeight = imgH;

    if (imgRatio > targetRatio) {
      // Source is wider than slot: crop left & right, center face
      sWidth = imgH * targetRatio;
      sx = (imgW - sWidth) / 2;
    } else {
      // Source is taller than slot: crop top & bottom, center face
      sHeight = imgW / targetRatio;
      sy = (imgH - sHeight) / 2;
    }

    ctx.save();
    if (radius > 0) {
      drawRoundRect(ctx, dx, dy, dWidth, dHeight, radius);
      ctx.clip();
    }
    ctx.filter = filterStr && filterStr !== "none" ? filterStr : "none";
    if (mirrorVideo) {
      ctx.translate(dx * 2 + dWidth, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);

    // Analog light leak flare overlay (only when explicitly requested via filterName)
    if (filterName === "lightleak") {
      ctx.globalCompositeOperation = "screen";
      const leak = ctx.createRadialGradient(
        dx,
        dy,
        10,
        dx + dWidth * 0.35,
        dy + dHeight * 0.35,
        dWidth * 0.85,
      );
      leak.addColorStop(0, "rgba(255, 120, 40, 0.65)");
      leak.addColorStop(0.3, "rgba(255, 175, 60, 0.4)");
      leak.addColorStop(0.65, "rgba(255, 100, 120, 0.18)");
      leak.addColorStop(1, "rgba(255, 180, 50, 0)");
      ctx.fillStyle = leak;
      ctx.fillRect(dx, dy, dWidth, dHeight);
    }

    ctx.restore();
  };

  // Canvas filter CSS string mapping
  const getCanvasFilter = (f) => {
    switch (f) {
      case "lightleak":
        return "contrast(115%) brightness(108%) saturate(125%) sepia(18%)";
      case "filmgrain":
        return "contrast(116%) brightness(104%) saturate(110%) sepia(15%)";
      case "lores":
      case "pixelated":
        return "contrast(125%) brightness(110%) saturate(125%)";
      case "goldenhour":
        return "contrast(112%) brightness(108%) sepia(35%) saturate(140%) hue-rotate(-5deg)";
      case "anime":
        return "contrast(108%) brightness(108%) saturate(130%) hue-rotate(5deg)";
      case "digicam":
        return "contrast(115%) brightness(106%) saturate(112%)";
      case "cybershot":
        return "contrast(116%) brightness(104%) saturate(120%) hue-rotate(-8deg)";
      case "fujifilm":
        return "contrast(110%) saturate(125%) brightness(102%) sepia(10%)";
      case "flashpop":
        return "contrast(125%) brightness(112%) saturate(115%)";
      case "camedia":
        return "contrast(106%) brightness(103%) sepia(20%) saturate(110%)";
      case "grayscale":
        return "grayscale(100%) contrast(120%)";
      case "vintage":
        return "sepia(45%) contrast(110%) brightness(95%)";
      case "sepia":
        return "sepia(80%) contrast(105%)";
      case "cyber":
        return "contrast(125%) hue-rotate(15deg) saturate(150%)";
      case "softglow":
        return "brightness(110%) contrast(95%) saturate(110%)";
      case "warmfilm":
        return "sepia(25%) contrast(110%) saturate(125%)";
      case "fisheye":
        return "contrast(120%) saturate(125%)";
      default:
        return "none";
    }
  };

  // Reusable helper to render the entire photo strip on any canvas
  const renderStripCanvas = (
    ctx,
    canvasW,
    canvasH,
    loadedImages,
    layout,
    frame,
    stamps,
    isStoryMode = false,
    activeFilter = "none",
    customCaptionText = "",
    customBgColor = null,
    pattern = "none",
    fontId = "mono",
    stickersList = [],
    showOrangeDateStamp = false,
    orangeDateStampText = "",
  ) => {
    // 0. Clean Pure White Background (#FFFFFF)
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Vintage Digicam Orange Quartz Date Stamp renderer
    const drawRetroDateStamp = (targetCtx, px, py, pw, ph) => {
      const stampStr = orangeDateStampText || getDefaultDateStamp();
      targetCtx.save();
      const fontSize = Math.max(12, Math.round(ph * 0.085));
      targetCtx.font = `bold ${fontSize}px "VT323", "IBM Plex Mono", monospace`;
      targetCtx.textAlign = "right";
      targetCtx.textBaseline = "bottom";
      const mx = Math.max(6, Math.round(pw * 0.04));
      const my = Math.max(5, Math.round(ph * 0.045));

      targetCtx.shadowColor = "#FF3700";
      targetCtx.shadowBlur = Math.max(4, Math.round(fontSize * 0.45));
      targetCtx.fillStyle = "#FF7A00";
      targetCtx.fillText(stampStr, px + pw - mx, py + ph - my);

      targetCtx.shadowBlur = 0;
      targetCtx.fillStyle = "#FFA726";
      targetCtx.fillText(stampStr, px + pw - mx, py + ph - my);
      targetCtx.restore();
    };

    let cardW;
    const shadowOffset = isStoryMode
      ? Math.round(canvasW * 0.016)
      : Math.round(canvasW * 0.022);
    const cardRadius = isStoryMode
      ? Math.round(canvasW * 0.028)
      : Math.round(canvasW * 0.035);

    if (isStoryMode) {
      // Instagram Story 9:16 Safe Placement - strictly proportional, never overflowing
      if (layout.id === "9-asym-film") {
        cardW = Math.round(canvasW * 0.74); // ~800px
      } else if (layout.id === "5-asym-film") {
        cardW = Math.round(canvasW * 0.70); // ~756px (compact film magazine 2+3)
      } else if (layout.id === "8-twin") {
        cardW = Math.round(canvasW * 0.72); // ~778px
      } else if (layout.id === "4-vert") {
        cardW = Math.round(canvasW * 0.42); // ~454px (sleek Life Four Cuts strip)
      } else if (layout.id === "6-double") {
        cardW = Math.round(canvasW * 0.72); // ~778px (twin 3-strip)
      } else if (layout.id === "3-cinema") {
        cardW = Math.round(canvasW * 0.58); // ~626px (cinema 16:9 movie strip)
      } else if (layout.id === "3-vert") {
        cardW = Math.round(canvasW * 0.48); // ~518px (3-photo strip)
      } else if (layout.id === "4-grid") {
        cardW = Math.round(canvasW * 0.72); // ~778px (2x2 quad)
      } else {
        // 2-wide
        cardW = Math.round(canvasW * 0.58); // ~626px (duo strip)
      }
    } else {
      const margin = Math.round(canvasW * 0.045);
      cardW = canvasW - margin * 2 - shadowOffset;
    }

    // Inner geometry
    const innerPad = Math.round(cardW * 0.05);
    const contentW = cardW - innerPad * 2;
    const gap = Math.round(cardW * 0.02);
    const cols = layout.cols;
    const rows = layout.rows;

    let photoW, photoH, totalGridH, spineW, colW, leftPhotoH, rightPhotoH, leftMarginW, rightMarginW, leftColW, rightColW, unitH, heroH;

    if (layout.id === "9-asym-film") {
      leftMarginW = Math.round(cardW * 0.04);
      rightMarginW = Math.round(cardW * 0.04);
      spineW = Math.round(cardW * 0.045);
      const availColW = contentW - leftMarginW - rightMarginW - spineW - gap * 2;
      leftColW = Math.round(availColW * 0.58);
      rightColW = availColW - leftColW;
      unitH = Math.round(rightColW * 0.72);
      heroH = 2 * unitH + gap;
      totalGridH = 5 * unitH + 4 * gap;
      colW = leftColW;
      photoW = leftColW;
      photoH = unitH;
    } else if (layout.id === "5-asym-film") {
      leftMarginW = Math.round(cardW * 0.04);
      rightMarginW = Math.round(cardW * 0.04);
      spineW = Math.round(cardW * 0.045);
      colW = Math.floor((contentW - leftMarginW - rightMarginW - spineW - gap * 2) / 2);
      leftColW = colW;
      rightColW = colW;
      rightPhotoH = Math.round(colW * 0.9); // 3 squarish photos on right
      totalGridH = 3 * rightPhotoH + 2 * gap;
      leftPhotoH = Math.floor((totalGridH - gap) / 2); // 2 tall photos on left
      photoW = colW;
      photoH = rightPhotoH;
    } else {
      photoW = Math.floor((contentW - (cols - 1) * gap) / cols);
      photoH =
        layout.aspect === "4/3"
          ? Math.round(photoW * 0.75)
          : layout.aspect === "16/9"
            ? Math.round(photoW * (9 / 16))
            : photoW;
      totalGridH = rows * photoH + (rows - 1) * gap;
    }

    // Component heights
    const headerH = Math.round(cardW * 0.07);
    const divider1H = Math.round(cardW * 0.02);
    const stampSpace = 0;
    const gapAfterGrid = Math.round(cardW * 0.035);
    const footerH = Math.round(cardW * 0.16);

    // Natural card height strictly hugging contents
    const cardH =
      innerPad * 2 +
      headerH +
      divider1H +
      stampSpace +
      totalGridH +
      gapAfterGrid +
      footerH;

    // Card position on canvas
    let cardX, cardY;
    if (isStoryMode) {
      cardX = Math.round((canvasW - cardW - shadowOffset) / 2);
      cardY = Math.max(
        Math.round(canvasW * 0.08),
        Math.round((canvasH - cardH - shadowOffset) / 2),
      );
    } else {
      const margin = Math.round(canvasW * 0.045);
      cardX = margin;
      cardY = margin;
    }

    // 1. Draw Hard Shadow
    ctx.fillStyle = "#0F172A";
    drawRoundRect(
      ctx,
      cardX + shadowOffset,
      cardY + shadowOffset,
      cardW,
      cardH,
      cardRadius,
    );
    ctx.fill();

    // 2. Draw Card Body
    const effectiveBgColor =
      customBgColor ||
      ((layout.id === "9-asym-film" || layout.id === "5-asym-film") && frame.id === "classic-white"
        ? "#09090B"
        : frame.bgColor);
    ctx.fillStyle = effectiveBgColor;
    drawRoundRect(ctx, cardX, cardY, cardW, cardH, cardRadius);
    ctx.fill();

    // 2b. Optional Card Pattern / Texture Overlay
    if (pattern && pattern !== "none") {
      ctx.save();
      drawRoundRect(ctx, cardX, cardY, cardW, cardH, cardRadius);
      ctx.clip();

      if (pattern === "checkerboard") {
        const step = Math.max(14, Math.round(cardW * 0.04));
        ctx.fillStyle = "rgba(15, 23, 42, 0.08)";
        for (let py = cardY; py < cardY + cardH; py += step) {
          for (let px = cardX; px < cardX + cardW; px += step) {
            const row = Math.floor((py - cardY) / step);
            const col = Math.floor((px - cardX) / step);
            if ((row + col) % 2 === 0) {
              ctx.fillRect(px, py, step, step);
            }
          }
        }
      } else if (pattern === "polkadot") {
        const step = Math.max(16, Math.round(cardW * 0.045));
        const r = Math.max(2, Math.round(step * 0.16));
        ctx.fillStyle = "rgba(15, 23, 42, 0.12)";
        for (let py = cardY + step / 2; py < cardY + cardH; py += step) {
          for (let px = cardX + step / 2; px < cardX + cardW; px += step) {
            ctx.beginPath();
            ctx.arc(px, py, r, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else if (pattern === "stripes") {
        const stripeWidth = Math.max(8, Math.round(cardW * 0.02));
        const stripeGap = stripeWidth * 2;
        ctx.strokeStyle = "rgba(15, 23, 42, 0.07)";
        ctx.lineWidth = stripeWidth;
        const diagMax = cardW + cardH;
        for (let offset = -cardH; offset < diagMax; offset += stripeGap) {
          ctx.beginPath();
          ctx.moveTo(cardX + offset, cardY);
          ctx.lineTo(cardX + offset + cardH, cardY + cardH);
          ctx.stroke();
        }
      } else if (pattern === "gridnotebook") {
        const step = Math.max(14, Math.round(cardW * 0.035));
        ctx.strokeStyle = "rgba(15, 23, 42, 0.09)";
        ctx.lineWidth = 1;
        for (let px = cardX; px <= cardX + cardW; px += step) {
          ctx.beginPath();
          ctx.moveTo(px, cardY);
          ctx.lineTo(px, cardY + cardH);
          ctx.stroke();
        }
        for (let py = cardY; py <= cardY + cardH; py += step) {
          ctx.beginPath();
          ctx.moveTo(cardX, py);
          ctx.lineTo(cardX + cardW, py);
          ctx.stroke();
        }
      } else if (pattern === "hearts") {
        const step = Math.max(28, Math.round(cardW * 0.08));
        ctx.fillStyle = "rgba(225, 29, 72, 0.22)";
        ctx.font = `${Math.round(step * 0.5)}px sans-serif, "Apple Color Emoji"`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        for (let py = cardY + step / 2; py < cardY + cardH; py += step) {
          for (let px = cardX + step / 2; px < cardX + cardW; px += step) {
            ctx.fillText("♥", px, py);
          }
        }
      } else if (pattern === "stars") {
        const step = Math.max(28, Math.round(cardW * 0.08));
        ctx.fillStyle = "rgba(15, 23, 42, 0.15)";
        ctx.font = `${Math.round(step * 0.5)}px sans-serif, "Apple Color Emoji"`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        for (let py = cardY + step / 2; py < cardY + cardH; py += step) {
          for (let px = cardX + step / 2; px < cardX + cardW; px += step) {
            ctx.fillText("★", px, py);
          }
        }
      } else if (pattern === "sparkles") {
        const step = Math.max(26, Math.round(cardW * 0.075));
        ctx.fillStyle = "rgba(15, 23, 42, 0.16)";
        ctx.font = `${Math.round(step * 0.5)}px sans-serif, "Apple Color Emoji"`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        for (let py = cardY + step / 2; py < cardY + cardH; py += step) {
          for (let px = cardX + step / 2; px < cardX + cardW; px += step) {
            ctx.fillText("✦", px, py);
          }
        }
      } else if (pattern === "clouds") {
        const step = Math.max(34, Math.round(cardW * 0.09));
        ctx.fillStyle = "rgba(2, 132, 199, 0.18)";
        ctx.font = `${Math.round(step * 0.55)}px sans-serif, "Apple Color Emoji"`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        for (let py = cardY + step / 2; py < cardY + cardH; py += step) {
          for (let px = cardX + step / 2; px < cardX + cardW; px += step) {
            ctx.fillText("☁", px, py);
          }
        }
      } else if (pattern === "halftone") {
        const step = Math.max(10, Math.round(cardW * 0.024));
        const r = Math.max(1.8, Math.round(step * 0.22));
        ctx.fillStyle = "rgba(15, 23, 42, 0.16)";
        for (let py = cardY + step / 2; py < cardY + cardH; py += step) {
          for (let px = cardX + step / 2; px < cardX + cardW; px += step) {
            ctx.beginPath();
            ctx.arc(px, py, r, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else if (pattern === "filmgrain") {
        const grainStep = Math.max(4, Math.round(cardW * 0.012));
        for (let py = cardY; py < cardY + cardH; py += grainStep) {
          for (let px = cardX; px < cardX + cardW; px += grainStep) {
            const rand = Math.random();
            if (rand > 0.65) {
              ctx.fillStyle = rand > 0.85 ? "rgba(255, 255, 255, 0.14)" : "rgba(0, 0, 0, 0.12)";
              ctx.fillRect(px, py, grainStep, grainStep);
            }
          }
        }
      }
      ctx.restore();
    }

    // 3. Draw Card Outer Border
    ctx.strokeStyle = (layout.id === "9-asym-film" || layout.id === "5-asym-film") ? "#27272A" : "#0F172A";
    ctx.lineWidth = Math.max(3, Math.round(cardW * 0.01));
    drawRoundRect(ctx, cardX, cardY, cardW, cardH, cardRadius);
    ctx.stroke();

    // Content X boundary
    const contentX = cardX + innerPad;

    // 4. Header Branding
    const headerY = cardY + innerPad + Math.round(headerH * 0.55);

    if (layout.id === "9-asym-film" || layout.id === "5-asym-film" || frame.type === "film") {
      ctx.fillStyle = "#F59E0B";
      ctx.font = `bold ${Math.round(cardW * 0.022)}px "IBM Plex Mono", monospace`;
      ctx.textAlign = "left";
      ctx.fillText("◄ KODAK PORTRA 400", contentX, headerY);
      ctx.fillStyle = "#A1A1AA";
      ctx.textAlign = "center";
      ctx.fillText(
        layout.id === "9-asym-film"
          ? "35MM CONTACT SHEET"
          : layout.id === "5-asym-film"
            ? "35MM CONTACT SHEET"
            : "35MM EXPOSURE // 6-SHOT",
        contentX + contentW / 2,
        headerY,
      );
      ctx.fillStyle = "#F59E0B";
      ctx.textAlign = "right";
      ctx.fillText("24A ►", contentX + contentW, headerY);
    } else if (frame.type === "win95") {
      const titleH = Math.round(headerH * 0.75);
      const titleY = headerY - Math.round(titleH * 0.5);
      const grad = ctx.createLinearGradient(
        contentX,
        titleY,
        contentX + contentW,
        titleY,
      );
      grad.addColorStop(0, "#000080");
      grad.addColorStop(1, "#1084D0");
      ctx.fillStyle = grad;
      drawRoundRect(ctx, contentX, titleY, contentW, titleH, 3);
      ctx.fill();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = `bold ${Math.round(titleH * 0.52)}px "IBM Plex Mono", monospace`;
      ctx.textAlign = "left";
      ctx.fillText(
        "📁 PHOTOBOOTH.EXE",
        contentX + 10,
        titleY + Math.round(titleH * 0.68),
      );

      const bSize = Math.round(titleH * 0.72);
      const bY = titleY + (titleH - bSize) / 2;
      ["_", "▢", "✕"].forEach((txt, idx) => {
        const bx = contentX + contentW - (3 - idx) * (bSize + 4) - 4;
        ctx.fillStyle = "#C0C0C0";
        ctx.fillRect(bx, bY, bSize, bSize);
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, bY, bSize, bSize);
        ctx.fillStyle = "#000000";
        ctx.font = `bold ${Math.round(bSize * 0.68)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(txt, bx + bSize / 2, bY + Math.round(bSize * 0.76));
      });
    } else {
      // Standard Retro Three Dots
      const dotRadius = Math.max(3.5, Math.round(cardW * 0.011));
      const dotSpacing = Math.round(dotRadius * 2.8);
      const dotY = headerY - Math.round(dotRadius * 0.9);
      const dots = ["#EF4444", "#FACC15", "#10B981"];
      dots.forEach((color, idx) => {
        const dotX = contentX + idx * dotSpacing + dotRadius;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#0F172A";
        ctx.lineWidth = Math.max(1.5, Math.round(dotRadius * 0.3));
        ctx.stroke();
      });

      ctx.fillStyle = frame.textColor;
      ctx.font = `bold ${Math.round(cardW * 0.024)}px "IBM Plex Mono", monospace`;
      ctx.textAlign = "right";
      ctx.fillText(
        layout.id === "4-vert"
          ? "LIFE 4-CUTS"
          : layout.id === "3-cinema"
            ? "CINEMA 3-CUT"
            : layout.id.toUpperCase(),
        contentX + contentW,
        headerY,
      );
    }

    // Header Divider Line
    const divider1Y = headerY + Math.round(headerH * 0.45);
    ctx.strokeStyle = (layout.id === "9-asym-film" || layout.id === "5-asym-film") ? "#3F3F46" : frame.textColor;
    ctx.lineWidth = Math.max(1.5, Math.round(cardW * 0.004));
    ctx.beginPath();
    ctx.moveTo(contentX, divider1Y);
    ctx.lineTo(contentX + contentW, divider1Y);
    ctx.stroke();

    // 6. Photo Grid Calculation
    const gridTop = divider1Y + Math.round(cardW * 0.025);
    const startGridX = contentX;

    if (layout.id === "9-asym-film" || layout.id === "5-asym-film") {
      const is5asym = layout.id === "5-asym-film";
      const is9asym = layout.id === "9-asym-film";
      const leftColX = contentX + leftMarginW;
      const spineX = leftColX + leftColW + gap;
      const rightColX = spineX + spineW + gap;
      const rightMarginX = rightColX + rightColW + gap;
      const photoRadius = Math.max(2, Math.round(colW * 0.01));

      // 1. Left Film Margin text
      ctx.save();
      ctx.fillStyle = "#F59E0B";
      ctx.font = `bold ${Math.max(7, Math.round(leftMarginW * 0.32))}px "IBM Plex Mono", monospace`;
      ctx.textAlign = "center";
      const leftMarks = is5asym
        ? ["← 1 A", "← 2"]
        : ["← COVER", "← 02 A", "← 03 A", "← 04 A"];
      const leftMarkStep = is5asym ? 0.4 : 0.23;
      leftMarks.forEach((txt, idx) => {
        ctx.save();
        ctx.translate(contentX + leftMarginW / 2, gridTop + totalGridH * (0.18 + idx * leftMarkStep));
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(txt, 0, 0);
        ctx.restore();
      });
      ctx.restore();

      // 2. Center Spine with Film Negative text
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(spineX, gridTop, spineW, totalGridH);
      ctx.strokeStyle = "#27272A";
      ctx.lineWidth = 1;
      ctx.strokeRect(spineX, gridTop, spineW, totalGridH);

      ctx.save();
      ctx.fillStyle = "#F59E0B";
      ctx.font = `bold ${Math.max(7, Math.round(spineW * 0.28))}px "IBM Plex Mono", monospace`;
      ctx.textAlign = "center";

      const spineSegments = is5asym
        ? [
          { text: "FILM NEGATIVE", yRatio: 0.15 },
          { text: "→ 1 A", yRatio: 0.42 },
          { text: "FILM NEGATIVE", yRatio: 0.72 },
          { text: "→ 2", yRatio: 0.92 },
        ]
        : [
          { text: "35MM NEGATIVE", yRatio: 0.12 },
          { text: "→ 01 A", yRatio: 0.32 },
          { text: "CONTACT SHEET", yRatio: 0.52 },
          { text: "→ 02", yRatio: 0.72 },
          { text: "FILM NEGATIVE", yRatio: 0.90 },
        ];

      spineSegments.forEach((seg) => {
        ctx.save();
        ctx.translate(spineX + spineW / 2, gridTop + totalGridH * seg.yRatio);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(seg.text, 0, 0);
        ctx.restore();
      });
      ctx.restore();

      // 3. Right Film Margin text (FILM NEGATIVE)
      ctx.save();
      ctx.fillStyle = "#F59E0B";
      ctx.font = `bold ${Math.max(7, Math.round(rightMarginW * 0.32))}px "IBM Plex Mono", monospace`;
      ctx.textAlign = "center";
      const rightMarginLabels = is5asym
        ? ["FILM NEGATIVE"]
        : ["35MM FILM", "KODAK 400"];
      const rightMarginStep = is5asym ? 0 : 0.4;
      rightMarginLabels.forEach((txt, idx) => {
        ctx.save();
        ctx.translate(rightMarginX + rightMarginW / 2, gridTop + totalGridH * (is5asym ? 0.5 : 0.3 + idx * rightMarginStep));
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(txt, 0, 0);
        ctx.restore();
      });
      ctx.restore();

      if (is9asym) {
        // --- 9-ASYM-FILM: Asymmetric Magazine (1 Hero 2x + 3 sub on Left, 5 cuts on Right) ---
        // Slot 0: Big Hero Feature Photo
        const heroImg = loadedImages[0];
        if (heroImg) {
          const px = leftColX;
          const py = gridTop;
          const isVideo = heroImg instanceof HTMLVideoElement;
          const filterStr = isVideo ? getCanvasFilter(activeFilter) : "none";
          drawCoverImage(ctx, heroImg, px, py, leftColW, heroH, photoRadius, filterStr, isVideo && isMirrored);

          ctx.strokeStyle = "#27272A";
          ctx.lineWidth = Math.max(1.5, Math.round(cardW * 0.004));
          drawRoundRect(ctx, px, py, leftColW, heroH, photoRadius);
          ctx.stroke();

          // Top Feature Badge
          const featW = Math.round(leftColW * 0.32);
          const featH = Math.max(14, Math.round(heroH * 0.065));
          ctx.fillStyle = "#F59E0B";
          drawRoundRect(ctx, px + 5, py + 5, featW, featH, 2);
          ctx.fill();
          ctx.fillStyle = "#0F172A";
          ctx.font = `bold ${Math.round(featH * 0.65)}px "IBM Plex Mono", monospace`;
          ctx.textAlign = "center";
          ctx.fillText("★ FEATURE", px + 5 + featW / 2, py + 5 + featH * 0.72);

          // Bottom Frame badge
          const bW = Math.round(leftColW * 0.22);
          const bH = Math.max(12, Math.round(unitH * 0.14));
          ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
          drawRoundRect(ctx, px + leftColW - bW - 4, py + heroH - bH - 4, bW, bH, 2);
          ctx.fill();
          ctx.fillStyle = "#F59E0B";
          ctx.font = `bold ${Math.round(bH * 0.65)}px "IBM Plex Mono", monospace`;
          ctx.textAlign = "center";
          ctx.fillText("→ 01A", px + leftColW - bW / 2 - 4, py + heroH - bH * 0.3);

          if (showOrangeDateStamp) {
            drawRetroDateStamp(ctx, px, py, leftColW, heroH);
          }
        }

        // Slots 1, 2, 3: Supporting Film Cuts on Left
        for (let i = 1; i <= 3; i++) {
          const img = loadedImages[i];
          if (!img) continue;
          const px = leftColX;
          const py = gridTop + heroH + gap + (i - 1) * (unitH + gap);

          const isVideo = img instanceof HTMLVideoElement;
          const filterStr = isVideo ? getCanvasFilter(activeFilter) : "none";
          drawCoverImage(ctx, img, px, py, leftColW, unitH, photoRadius, filterStr, isVideo && isMirrored);

          ctx.strokeStyle = "#27272A";
          ctx.lineWidth = Math.max(1.5, Math.round(cardW * 0.004));
          drawRoundRect(ctx, px, py, leftColW, unitH, photoRadius);
          ctx.stroke();

          const bW = Math.round(leftColW * 0.22);
          const bH = Math.max(12, Math.round(unitH * 0.14));
          ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
          drawRoundRect(ctx, px + leftColW - bW - 4, py + unitH - bH - 4, bW, bH, 2);
          ctx.fill();
          ctx.fillStyle = "#F59E0B";
          ctx.font = `bold ${Math.round(bH * 0.65)}px "IBM Plex Mono", monospace`;
          ctx.textAlign = "center";
          ctx.fillText(`→ 0${1 + i}A`, px + leftColW - bW / 2 - 4, py + unitH - bH * 0.3);

          if (showOrangeDateStamp) {
            drawRetroDateStamp(ctx, px, py, leftColW, unitH);
          }
        }

        // Slots 4, 5, 6, 7, 8: 5 Contact Sheet Cuts on Right
        for (let j = 0; j < 5; j++) {
          const img = loadedImages[4 + j];
          if (!img) continue;
          const px = rightColX;
          const py = gridTop + j * (unitH + gap);

          const isVideo = img instanceof HTMLVideoElement;
          const filterStr = isVideo ? getCanvasFilter(activeFilter) : "none";
          drawCoverImage(ctx, img, px, py, rightColW, unitH, photoRadius, filterStr, isVideo && isMirrored);

          ctx.strokeStyle = "#27272A";
          ctx.lineWidth = Math.max(1.5, Math.round(cardW * 0.004));
          drawRoundRect(ctx, px, py, rightColW, unitH, photoRadius);
          ctx.stroke();

          const bW = Math.round(rightColW * 0.22);
          const bH = Math.max(12, Math.round(unitH * 0.14));
          ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
          drawRoundRect(ctx, px + rightColW - bW - 4, py + unitH - bH - 4, bW, bH, 2);
          ctx.fill();
          ctx.fillStyle = "#F59E0B";
          ctx.font = `bold ${Math.round(bH * 0.65)}px "IBM Plex Mono", monospace`;
          ctx.textAlign = "center";
          ctx.fillText(`→ 0${1 + j}`, px + rightColW - bW / 2 - 4, py + unitH - bH * 0.3);

          if (showOrangeDateStamp) {
            drawRetroDateStamp(ctx, px, py, rightColW, unitH);
          }
        }
      } else {
        // --- 5-ASYM-FILM: Original 2+3 layout ---
        const leftCount = 2;
        const rightCount = 3;

        // Draw Left Column: 2 photos
        for (let i = 0; i < leftCount; i++) {
          const img = loadedImages[i];
          if (!img) continue;
          const px = leftColX;
          const py = gridTop + i * (leftPhotoH + gap);

          const isVideo = img instanceof HTMLVideoElement;
          const filterStr = isVideo ? getCanvasFilter(activeFilter) : "none";
          drawCoverImage(ctx, img, px, py, colW, leftPhotoH, photoRadius, filterStr, isVideo && isMirrored);

          ctx.strokeStyle = "#27272A";
          ctx.lineWidth = Math.max(1.5, Math.round(cardW * 0.004));
          drawRoundRect(ctx, px, py, colW, leftPhotoH, photoRadius);
          ctx.stroke();

          // Badge
          const bW = Math.round(colW * 0.22);
          const bH = Math.round(leftPhotoH * 0.12);
          ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
          drawRoundRect(ctx, px + colW - bW - 3, py + leftPhotoH - bH - 3, bW, bH, 2);
          ctx.fill();
          ctx.fillStyle = "#F59E0B";
          ctx.font = `bold ${Math.round(bH * 0.65)}px "IBM Plex Mono", monospace`;
          ctx.textAlign = "center";
          ctx.fillText(`→ ${1 + i}A`, px + colW - bW / 2 - 3, py + leftPhotoH - bH * 0.3);

          if (showOrangeDateStamp) {
            drawRetroDateStamp(ctx, px, py, colW, leftPhotoH);
          }
        }

        // Draw Right Column: 3 photos
        for (let j = 0; j < rightCount; j++) {
          const img = loadedImages[leftCount + j];
          if (!img) continue;
          const px = rightColX;
          const py = gridTop + j * (rightPhotoH + gap);

          const isVideo = img instanceof HTMLVideoElement;
          const filterStr = isVideo ? getCanvasFilter(activeFilter) : "none";
          drawCoverImage(ctx, img, px, py, colW, rightPhotoH, photoRadius, filterStr, isVideo && isMirrored);

          ctx.strokeStyle = "#27272A";
          ctx.lineWidth = Math.max(1.5, Math.round(cardW * 0.004));
          drawRoundRect(ctx, px, py, colW, rightPhotoH, photoRadius);
          ctx.stroke();

          // Badge
          const bW = Math.round(colW * 0.22);
          const bH = Math.round(rightPhotoH * 0.14);
          ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
          drawRoundRect(ctx, px + colW - bW - 3, py + rightPhotoH - bH - 3, bW, bH, 2);
          ctx.fill();
          ctx.fillStyle = "#F59E0B";
          ctx.font = `bold ${Math.round(bH * 0.65)}px "IBM Plex Mono", monospace`;
          ctx.textAlign = "center";
          ctx.fillText(`→ ${1 + j}`, px + colW - bW / 2 - 3, py + rightPhotoH - bH * 0.3);

          if (showOrangeDateStamp) {
            drawRetroDateStamp(ctx, px, py, colW, rightPhotoH);
          }
        }
      }
    } else {
      // Center Dashed Cut Line for Twin Cut theme and 8-twin
      if (cols === 2 && (frame.type === "twin" || layout.id === "8-twin")) {
        const midX = contentX + contentW / 2;
        ctx.save();
        ctx.setLineDash([8, 8]);
        ctx.strokeStyle = "#94A3B8";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(midX, gridTop - 6);
        ctx.lineTo(midX, gridTop + totalGridH + 6);
        ctx.stroke();
        ctx.restore();
      }

      // Draw Each Photo with subtle curvature matching viewfinder (rounded-md)
      const photoRadius = Math.max(4, Math.round(photoW * 0.022));
      loadedImages.forEach((img, i) => {
        if (!img) return;
        const col = i % cols;
        const row = Math.floor(i / cols);
        const px = startGridX + col * (photoW + gap);
        const py = gridTop + row * (photoH + gap);

        // Photo with cover crop (never squish/stretch face)
        const isVideo = img instanceof HTMLVideoElement;
        const filterStr = isVideo ? getCanvasFilter(activeFilter) : "none";
        drawCoverImage(ctx, img, px, py, photoW, photoH, photoRadius, filterStr, isVideo && isMirrored);

        // Photo Outer Border
        if (frame.type === "win95") {
          ctx.strokeStyle = "#404040";
          ctx.lineWidth = 3;
          drawRoundRect(ctx, px, py, photoW, photoH, photoRadius);
          ctx.stroke();
        } else {
          ctx.strokeStyle = frame.type === "film" ? "#27272A" : "#0F172A";
          ctx.lineWidth = Math.max(2.5, Math.round(cardW * 0.006));
          drawRoundRect(ctx, px, py, photoW, photoH, photoRadius);
          ctx.stroke();
        }

        if (showOrangeDateStamp) {
          drawRetroDateStamp(ctx, px, py, photoW, photoH);
        }
      });
    }

    // 6B. Draw Pure Stickers Overlapping Photo Corners (1 to 4 stickers, No Circular Container)
    const activeStickers = (
      Array.isArray(stamps)
        ? stamps
        : stamps && stamps.id !== "none"
          ? [stamps]
          : []
    ).filter((s) => s && s.id !== "none");

    if (activeStickers.length > 0) {
      const stickerSize = Math.round(cardW * 0.135);
      const gridRight = contentX + contentW;
      const gridLeft = contentX;
      const gridTopPos = gridTop;
      const gridBottomPos = gridTop + totalGridH;

      // Positioning slots according to rules:
      // Index 0: Top-Right primary
      // Index 1: Top-Right secondary
      // Index 2: Bottom-Left primary
      // Index 3: Bottom-Left secondary
      const positions = [
        {
          cx: gridRight - stickerSize * 0.38,
          cy: gridTopPos + stickerSize * 0.38,
          angle: (8 * Math.PI) / 180,
        },
        {
          cx: gridRight - stickerSize * 1.25,
          cy: gridTopPos + stickerSize * 0.22,
          angle: (-12 * Math.PI) / 180,
        },
        {
          cx: gridLeft + stickerSize * 0.38,
          cy: gridBottomPos - stickerSize * 0.38,
          angle: (-8 * Math.PI) / 180,
        },
        {
          cx: gridLeft + stickerSize * 1.25,
          cy: gridBottomPos - stickerSize * 0.22,
          angle: (10 * Math.PI) / 180,
        },
      ];

      activeStickers.slice(0, 4).forEach((st, idx) => {
        const pos = positions[idx];
        const symbol = st.sticker || st.symbol || st.icon || "";
        if (!symbol) return;

        ctx.save();
        ctx.translate(pos.cx, pos.cy);
        ctx.rotate(pos.angle);

        // Crisp sticker drop shadow for photorealistic sticker depth
        ctx.shadowColor = "rgba(15, 23, 42, 0.45)";
        ctx.shadowBlur = Math.max(3, Math.round(cardW * 0.007));
        ctx.shadowOffsetX = Math.max(2, Math.round(cardW * 0.004));
        ctx.shadowOffsetY = Math.max(2, Math.round(cardW * 0.004));

        const fontSize = Math.round(stickerSize * 0.90);
        ctx.font = `${fontSize}px sans-serif, "Apple Color Emoji", "Segoe UI Emoji"`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const textSymbols = ["★", "✦", "✧", "♡", "☺"];
        if (textSymbols.includes(symbol)) {
          // White outline for monochromatic stickers so they pop over photos
          ctx.strokeStyle = "#FFFFFF";
          ctx.lineWidth = Math.max(3.5, Math.round(cardW * 0.009));
          ctx.lineJoin = "round";
          ctx.strokeText(symbol, 0, 0);
          ctx.fillStyle = st.id === "smile" ? "#F59E0B" : (st.textColor || "#0F172A");
          ctx.fillText(symbol, 0, 0);
        } else {
          ctx.fillText(symbol, 0, 0);
        }

        ctx.restore();
      });
    }

    // 7. Footer Divider Line - positioned directly below the photos!
    const footerY = gridTop + totalGridH + gapAfterGrid;
    ctx.strokeStyle = (layout.id === "9-asym-film" || layout.id === "5-asym-film") ? "#3F3F46" : frame.textColor;
    ctx.lineWidth = Math.max(1.5, Math.round(cardW * 0.004));
    ctx.beginPath();
    ctx.moveTo(contentX, footerY);
    ctx.lineTo(contentX + contentW, footerY);
    ctx.stroke();

    // Timestamp & Details
    const todayStr = new Date().toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const timeStr = new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    let effectiveTextColor = (layout.id === "9-asym-film" || layout.id === "5-asym-film") ? "#A1A1AA" : frame.textColor;
    if (customBgColor) {
      const hex = customBgColor.replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16) || 0;
      const g = parseInt(hex.substring(2, 4), 16) || 0;
      const b = parseInt(hex.substring(4, 6), 16) || 0;
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      effectiveTextColor = lum > 0.5 ? "#0F172A" : "#F8FAFC";
    }

    ctx.fillStyle = effectiveTextColor;
    ctx.font = `bold ${Math.round(footerH * 0.2)}px "IBM Plex Mono", monospace`;
    ctx.textAlign = "left";
    ctx.fillText(
      `${todayStr} // ${timeStr} WIB`,
      contentX,
      footerY + Math.round(footerH * 0.28),
    );

    let captionFontFamily = '"IBM Plex Mono", monospace';
    let captionFontSize = Math.round(cardW * 0.024);

    if (fontId === "digital") {
      captionFontFamily = '"VT323", monospace';
      captionFontSize = Math.round(cardW * 0.038);
    } else if (fontId === "typewriter") {
      captionFontFamily = '"Special Elite", cursive';
      captionFontSize = Math.round(cardW * 0.024);
    } else if (fontId === "cursive") {
      captionFontFamily = '"Caveat", cursive';
      captionFontSize = Math.round(cardW * 0.032);
    } else if (fontId === "bubble") {
      captionFontFamily = '"Fredoka", sans-serif';
      captionFontSize = Math.round(cardW * 0.024);
    } else if (fontId === "pixel") {
      captionFontFamily = '"Press Start 2P", cursive';
      captionFontSize = Math.round(cardW * 0.019);
    } else if (fontId === "serif") {
      captionFontFamily = '"Playfair Display", serif';
      captionFontSize = Math.round(cardW * 0.025);
    } else if (fontId === "marker") {
      captionFontFamily = '"Permanent Marker", cursive';
      captionFontSize = Math.round(cardW * 0.024);
    } else if (fontId === "korean") {
      captionFontFamily = '"Gaegu", cursive';
      captionFontSize = Math.round(cardW * 0.030);
    } else if (fontId === "brutal") {
      captionFontFamily = '"Rubik Mono One", sans-serif';
      captionFontSize = Math.round(cardW * 0.020);
    }

    ctx.font = `bold ${captionFontSize}px ${captionFontFamily}`;
    ctx.textAlign = "left";
    const displayCaption =
      customCaptionText && customCaptionText.trim()
        ? customCaptionText.trim().toUpperCase()
        : "MEMORIES TO KEEP";
    ctx.fillText(
      displayCaption,
      contentX,
      footerY + Math.round(footerH * 0.5),
    );
    ctx.font = `bold ${Math.round(cardW * 0.022)}px "IBM Plex Mono", monospace`;
    ctx.textAlign = "right";
    ctx.fillText(
      "#LIMITED-01",
      contentX + contentW,
      footerY + Math.round(footerH * 0.5),
    );

    // Barcode
    const barY = footerY + Math.round(footerH * 0.62);
    const barH = Math.round(footerH * 0.22);
    ctx.fillStyle = effectiveTextColor;
    for (let b = 0; b < 52; b++) {
      const bw =
        b % 3 === 0
          ? Math.max(3, cardW * 0.006)
          : b % 2 === 0
            ? Math.max(2, cardW * 0.004)
            : Math.max(1, cardW * 0.002);
      const bx = contentX + b * ((contentW - 10) / 52);
      ctx.fillRect(bx, barY, bw, barH);
    }

    // 8. Draggable Placed Stickers (Interactive Canvas Overlay)
    if (stickersList && Array.isArray(stickersList) && stickersList.length > 0) {
      stickersList.forEach((stk) => {
        if (!stk || !stk.sticker) return;
        const targetX = cardX + (stk.x / 100) * cardW;
        const targetY = cardY + (stk.y / 100) * cardH;
        const scale = stk.scale || 1;
        const rot = ((stk.rotation || 0) * Math.PI) / 180;
        const baseSize = Math.round(cardW * 0.12 * scale);

        ctx.save();
        ctx.translate(targetX, targetY);
        ctx.rotate(rot);

        ctx.shadowColor = "rgba(15, 23, 42, 0.4)";
        ctx.shadowBlur = Math.max(3, Math.round(cardW * 0.008));
        ctx.shadowOffsetX = Math.max(2, Math.round(cardW * 0.004));
        ctx.shadowOffsetY = Math.max(2, Math.round(cardW * 0.004));

        ctx.font = `${baseSize}px sans-serif, "Apple Color Emoji", "Segoe UI Emoji"`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const textSymbols = ["★", "✦", "✧", "♡", "☺"];
        if (textSymbols.includes(stk.sticker)) {
          ctx.strokeStyle = "#FFFFFF";
          ctx.lineWidth = Math.max(3, Math.round(cardW * 0.008));
          ctx.lineJoin = "round";
          ctx.strokeText(stk.sticker, 0, 0);
          ctx.fillStyle = stk.sticker === "☺" ? "#F59E0B" : "#0F172A";
          ctx.fillText(stk.sticker, 0, 0);
        } else {
          ctx.fillStyle = "#0F172A";
          ctx.fillText(stk.sticker, 0, 0);
        }

        ctx.restore();
      });
    }
  };

  // Download high-resolution PNG with exact neo-brutalist card, rounded corners & hard shadow
  const downloadPhotoStrip = useCallback(async (isShare = false) => {
    if (photos.length === 0) return;

    try {
      setIsDownloading(true);

      if (isSoundEnabled) {
        playPrintSound();
      }

      const loadImage = (src) =>
        new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });

      const loadedImages = await Promise.all(
        photos.map((src) => loadImage(src)),
      );

      // Dynamic Canvas Dimensions based on Story mode or Strip mode
      const isStory = exportFormat === "story";
      let canvasW = 820;
      let canvasH = 1920;

      if (isStory) {
        canvasW = 820;
        canvasH = 1920; // Exact 9:16 Instagram Story Canvas
      } else {
        let cardW;
        if (activeLayout.id === "4-vert") {
          cardW = 440;
        } else if (activeLayout.id === "3-cinema") {
          cardW = 560;
        } else if (activeLayout.id === "3-vert") {
          cardW = 480;
        } else if (activeLayout.id === "2-wide") {
          cardW = 560;
        } else if (activeLayout.id === "9-asym-film") {
          cardW = 800;
        } else if (activeLayout.id === "5-asym-film") {
          cardW = 760;
        } else if (activeLayout.id === "8-twin") {
          cardW = 780;
        } else if (activeLayout.id === "6-double") {
          cardW = 780;
        } else {
          cardW = 740;
        }

        const margin = Math.round(cardW * 0.045);
        const shadowOffset = Math.round(cardW * 0.022);
        const innerPad = Math.round(cardW * 0.05);
        const contentW = cardW - innerPad * 2;
        const gap = Math.round(cardW * 0.02);
        const cols = activeLayout.cols;
        const rows = activeLayout.rows;

        let totalGridH;
        if (activeLayout.id === "9-asym-film") {
          const leftMarginW = Math.round(cardW * 0.04);
          const rightMarginW = Math.round(cardW * 0.04);
          const spineW = Math.round(cardW * 0.045);
          const availColW =
            contentW - leftMarginW - rightMarginW - spineW - gap * 2;
          const rightColW = availColW - Math.round(availColW * 0.58);
          const unitH = Math.round(rightColW * 0.72);
          totalGridH = 5 * unitH + 4 * gap;
        } else if (activeLayout.id === "5-asym-film") {
          const leftMarginW = Math.round(cardW * 0.04);
          const rightMarginW = Math.round(cardW * 0.04);
          const spineW = Math.round(cardW * 0.045);
          const colW = Math.floor(
            (contentW - leftMarginW - rightMarginW - spineW - gap * 2) / 2,
          );
          const rightPhotoH = Math.round(colW * 0.9);
          totalGridH = 3 * rightPhotoH + 2 * gap;
        } else {
          const photoW = Math.floor((contentW - (cols - 1) * gap) / cols);
          const photoH =
            activeLayout.aspect === "4/3"
              ? Math.round(photoW * 0.75)
              : activeLayout.aspect === "16/9"
                ? Math.round(photoW * (9 / 16))
                : photoW;
          totalGridH = rows * photoH + (rows - 1) * gap;
        }

        const headerH = Math.round(cardW * 0.07);
        const divider1H = Math.round(cardW * 0.02);
        const stampSpace = 0;
        const gapAfterGrid = Math.round(cardW * 0.035);
        const footerH = Math.round(cardW * 0.16);
        const cardH =
          innerPad * 2 +
          headerH +
          divider1H +
          stampSpace +
          totalGridH +
          gapAfterGrid +
          footerH;
        canvasW = cardW + margin * 2 + shadowOffset;
        canvasH = cardH + margin * 2 + shadowOffset;
      }

      if (document.fonts) {
        try {
          await document.fonts.ready;
        } catch {}
      }

      const canvas = document.createElement("canvas");
      canvas.width = canvasW;
      canvas.height = canvasH;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      renderStripCanvas(
        ctx,
        canvasW,
        canvasH,
        loadedImages,
        activeLayout,
        frameStyle,
        selectedStamps,
        isStory,
        "none",
        customCaption,
        customFrameColor,
        framePattern,
        captionFont,
        placedStickers,
        showDateStamp,
        dateStampText,
      );

      const modeSuffix = isStory ? "ig-story" : "strip";
      const filename = `photobooth-${activeLayout.id}-${modeSuffix}-${Date.now()}.png`;

      await new Promise((resolve) => {
        canvas.toBlob(async (blob) => {
          if (!blob) {
            resolve();
            return;
          }

          // Add item to active session history
          const historyItem = {
            id: String(Date.now()),
            mode: "photo",
            layoutName: activeLayout.name,
            caption: customCaption || "★ MEMORIES TO KEEP",
            timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
            thumbnailUrl: canvas.toDataURL("image/png", 0.5),
            blob: blob,
            filename: filename,
          };
          setSessionHistory((prev) => [historyItem, ...prev]);

          // Web Share API Support
          if (isShare && navigator.canShare) {
            try {
              const file = new File([blob], filename, { type: "image/png" });
              if (navigator.canShare({ files: [file] })) {
                await navigator.share({
                  files: [file],
                  title: "Photo Strip Memories",
                  text: `Check out my photo strip! ${customCaption ? `"${customCaption}"` : ""}`,
                });
                resolve();
                return;
              }
            } catch (shareErr) {
              if (shareErr.name === "AbortError") {
                resolve();
                return;
              }
              console.warn("Share modal dismissed or unsupported:", shareErr);
            }
          }

          // Direct Download fallback
          const link = document.createElement("a");
          link.download = filename;
          link.href = URL.createObjectURL(blob);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(link.href), 5000);
          resolve();
        }, "image/png", 1.0);
      });
    } catch (err) {
      console.error("Error generating photo strip:", err);
    } finally {
      setIsDownloading(false);
    }
  }, [photos, activeLayout, frameStyle, selectedStamps, exportFormat, customCaption, customFrameColor, isSoundEnabled, framePattern, captionFont, placedStickers]);

  // Download Video Strip as .MP4 with 5-second synchronized video loop
  const downloadVideoStrip = useCallback(async (isShare = false) => {
    if (videoClips.length === 0) return;

    let hiddenContainer = null;
    let videoElements = [];

    try {
      setIsDownloadingVideo(true);

      const isStory = exportFormat === "story";
      let canvasW = 540;
      let canvasH = 960;

      if (isStory) {
        canvasW = 540;
        canvasH = 960;
      } else {
        let cardW;
        if (activeLayout.id === "4-vert") {
          cardW = 320;
        } else if (activeLayout.id === "3-cinema") {
          cardW = 380;
        } else if (activeLayout.id === "3-vert") {
          cardW = 340;
        } else if (activeLayout.id === "2-wide") {
          cardW = 380;
        } else if (activeLayout.id === "9-asym-film") {
          cardW = 520;
        } else if (activeLayout.id === "5-asym-film") {
          cardW = 480;
        } else if (activeLayout.id === "8-twin") {
          cardW = 480;
        } else if (activeLayout.id === "6-double") {
          cardW = 480;
        } else {
          cardW = 480;
        }

        const margin = Math.round(cardW * 0.045);
        const shadowOffset = Math.round(cardW * 0.022);
        const innerPad = Math.round(cardW * 0.05);
        const contentW = cardW - innerPad * 2;
        const gap = Math.round(cardW * 0.02);
        const cols = activeLayout.cols;
        const rows = activeLayout.rows;

        let totalGridH;
        if (activeLayout.id === "9-asym-film") {
          const leftMarginW = Math.round(cardW * 0.04);
          const rightMarginW = Math.round(cardW * 0.04);
          const spineW = Math.round(cardW * 0.045);
          const availColW =
            contentW - leftMarginW - rightMarginW - spineW - gap * 2;
          const rightColW = availColW - Math.round(availColW * 0.58);
          const unitH = Math.round(rightColW * 0.72);
          totalGridH = 5 * unitH + 4 * gap;
        } else if (activeLayout.id === "5-asym-film") {
          const leftMarginW = Math.round(cardW * 0.04);
          const rightMarginW = Math.round(cardW * 0.04);
          const spineW = Math.round(cardW * 0.045);
          const colW = Math.floor(
            (contentW - leftMarginW - rightMarginW - spineW - gap * 2) / 2,
          );
          const rightPhotoH = Math.round(colW * 0.9);
          totalGridH = 3 * rightPhotoH + 2 * gap;
        } else {
          const photoW = Math.floor((contentW - (cols - 1) * gap) / cols);
          const photoH =
            activeLayout.aspect === "4/3"
              ? Math.round(photoW * 0.75)
              : activeLayout.aspect === "16/9"
                ? Math.round(photoW * (9 / 16))
                : photoW;
          totalGridH = rows * photoH + (rows - 1) * gap;
        }

        const headerH = Math.round(cardW * 0.07);
        const divider1H = Math.round(cardW * 0.02);
        const stampSpace = 0;
        const gapAfterGrid = Math.round(cardW * 0.035);
        const footerH = Math.round(cardW * 0.16);
        const cardH =
          innerPad * 2 +
          headerH +
          divider1H +
          stampSpace +
          totalGridH +
          gapAfterGrid +
          footerH;
        canvasW = cardW + margin * 2 + shadowOffset;
        canvasH = cardH + margin * 2 + shadowOffset;
      }

      // H.264 hardware encoders strictly require even dimensions (multiples of 2)
      canvasW = Math.floor(canvasW / 2) * 2;
      canvasH = Math.floor(canvasH / 2) * 2;

      if (document.fonts) {
        try {
          await document.fonts.ready;
        } catch {}
      }

      const canvas = document.createElement("canvas");
      canvas.width = canvasW;
      canvas.height = canvasH;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Create invisible DOM container to ensure browser decodes all video frames actively
      hiddenContainer = document.createElement("div");
      hiddenContainer.setAttribute("aria-hidden", "true");
      hiddenContainer.style.cssText =
        "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;z-index:-100;";
      document.body.appendChild(hiddenContainer);

      videoElements = await Promise.all(
        videoClips.map(
          (url) =>
            new Promise((resolve) => {
              const v = document.createElement("video");
              let settled = false;
              const finish = () => {
                if (!settled) {
                  settled = true;
                  resolve(v);
                }
              };
              const safetyTimer = setTimeout(finish, 3500);
              v.onloadeddata = () => {
                clearTimeout(safetyTimer);
                finish();
              };
              v.onerror = () => {
                clearTimeout(safetyTimer);
                finish();
              };
              v.src = url;
              v.muted = true;
              v.loop = true;
              v.playsInline = true;
              v.setAttribute("playsinline", "");
              v.setAttribute("webkit-playsinline", "");
              hiddenContainer.appendChild(v);
              v.load();
            }),
        ),
      );

      // Determine duration from clips or default to 10 seconds
      let durationSeconds = 10;
      const validDurations = videoElements
        .map((v) => v.duration)
        .filter((d) => typeof d === "number" && isFinite(d) && d > 0);
      if (validDurations.length > 0) {
        durationSeconds = Math.max(...validDurations);
      }
      durationSeconds = Math.min(10, Math.max(3, Math.round(durationSeconds)));

      // Start synchronized playback from time 0
      videoElements.forEach((v) => {
        v.currentTime = 0;
      });
      await Promise.all(
        videoElements.map((v) => v.play().catch((err) => console.warn("Video play error:", err))),
      );

      // Attempt High-Quality MP4 Encoding using WebCodecs (H.264) + mp4-muxer
      const hasWebCodecs = typeof window.VideoEncoder !== "undefined";
      if (hasWebCodecs) {
        try {
          const { Muxer, ArrayBufferTarget } = await import("mp4-muxer");
          const muxer = new Muxer({
            target: new ArrayBufferTarget(),
            video: {
              codec: "avc",
              width: canvasW,
              height: canvasH,
            },
            fastStart: "in-memory",
          });

          let encoderConfig = {
            codec: "avc1.42001f", // H.264 Baseline Profile 3.1 (maximum mobile compatibility)
            width: canvasW,
            height: canvasH,
            bitrate: 3_500_000,
            framerate: 30,
          };

          const isSupported = await VideoEncoder.isConfigSupported(encoderConfig);
          if (!isSupported.supported) {
            encoderConfig.codec = "avc1.4d001f"; // Fallback to Main Profile
          }

          let encoderError = null;
          const videoEncoder = new VideoEncoder({
            output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
            error: (e) => {
              console.error("H.264 VideoEncoder error:", e);
              encoderError = e;
            },
          });

          videoEncoder.configure(encoderConfig);

          const fps = 30;
          const targetIntervalMs = 1000 / fps;
          const durationMs = durationSeconds * 1000;
          const startTime = performance.now();
          let lastTimestampMicros = -1;
          let frameIndex = 0;

          while (true) {
            if (encoderError) break;

            const now = performance.now();
            const elapsedMs = now - startTime;
            if (elapsedMs >= durationMs) break;

            renderStripCanvas(
              ctx,
              canvasW,
              canvasH,
              videoElements,
              activeLayout,
              frameStyle,
              selectedStamps,
              isStory,
              filter,
              customCaption,
              customFrameColor,
              framePattern,
              captionFont,
              placedStickers,
              showDateStamp,
              dateStampText,
            );

            // True real-world timestamp matching video playback time exactly (prevents 2x speedup)
            let timestampMicros = Math.round(elapsedMs * 1000);
            if (timestampMicros <= lastTimestampMicros) {
              timestampMicros = lastTimestampMicros + 1000; // strictly monotonic
            }
            lastTimestampMicros = timestampMicros;

            const isKeyFrame = frameIndex % 30 === 0;
            const videoFrame = new VideoFrame(canvas, {
              timestamp: timestampMicros,
              duration: Math.round(1_000_000 / fps),
            });

            videoEncoder.encode(videoFrame, { keyFrame: isKeyFrame });
            videoFrame.close();
            frameIndex++;

            // Accurately sleep only the remaining delta until the next 33.3ms frame tick
            const nextFrameTarget = startTime + frameIndex * targetIntervalMs;
            const sleepMs = nextFrameTarget - performance.now();
            if (sleepMs > 3) {
              await new Promise((resolve) => setTimeout(resolve, sleepMs));
            } else {
              // Yield briefly to main thread
              await new Promise((resolve) => setTimeout(resolve, 0));
            }
          }

          videoElements.forEach((v) => v.pause());

          if (!encoderError) {
            await videoEncoder.flush();
            try {
              videoEncoder.close();
            } catch {
              // ignore
            }
            muxer.finalize();

            const mp4Buffer = muxer.target.buffer;
            const mp4Blob = new Blob([mp4Buffer], { type: "video/mp4" });
            const modeSuffix = isStory ? "ig-story" : "strip";
            const filename = `photobooth-${activeLayout.id}-${modeSuffix}-${Date.now()}.mp4`;

            // Generate thumbnail for gallery
            let thumbUrl = null;
            try {
              thumbUrl = canvas.toDataURL("image/png", 0.5);
            } catch {
              // ignore
            }

            // Add to session history
            const historyItem = {
              id: String(Date.now()),
              mode: "video",
              layoutName: activeLayout.name,
              caption: customCaption || "★ VIDEO MEMORIES",
              timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
              thumbnailUrl: thumbUrl,
              blob: mp4Blob,
              filename: filename,
            };
            setSessionHistory((prev) => [historyItem, ...prev]);

            if (isShare && navigator.canShare) {
              try {
                const file = new File([mp4Blob], filename, { type: "video/mp4" });
                if (navigator.canShare({ files: [file] })) {
                  await navigator.share({
                    files: [file],
                    title: "Video Strip Memories",
                    text: `Check out my retro video strip! ${customCaption ? `"${customCaption}"` : ""}`,
                  });
                  setIsDownloadingVideo(false);
                  return;
                }
              } catch (shareErr) {
                if (shareErr.name === "AbortError") {
                  setIsDownloadingVideo(false);
                  return;
                }
                console.warn("Share modal dismissed:", shareErr);
              }
            }

            const link = document.createElement("a");
            link.download = filename;
            link.href = URL.createObjectURL(mp4Blob);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(link.href), 5000);
            setIsDownloadingVideo(false);
            return;
          }
        } catch (encErr) {
          console.warn("WebCodecs MP4 encoding failed, falling back to MediaRecorder:", encErr);
        }
      }

      // Fallback to MediaRecorder if VideoEncoder is unavailable
      const stream = canvas.captureStream(30);
      const supportedTypes = [
        "video/mp4;codecs=avc1",
        "video/mp4",
        "video/webm;codecs=h264",
        "video/webm;codecs=vp9",
        "video/webm",
      ];
      const mimeType = supportedTypes.find((t) => MediaRecorder.isTypeSupported(t)) || "";

      let recorder;
      try {
        recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      } catch {
        recorder = new MediaRecorder(stream);
      }

      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      const durationMs = durationSeconds * 1000;
      let safetyTimer = null;

      const recordPromise = new Promise((resolve) => {
        recorder.onstop = async () => {
          if (safetyTimer) clearTimeout(safetyTimer);

          // Always ensure the exported blob is saved as an MP4
          const blob = new Blob(chunks, { type: "video/mp4" });
          const modeSuffix = isStory ? "ig-story" : "strip";
          const filename = `photobooth-${activeLayout.id}-${modeSuffix}-${Date.now()}.mp4`;

          // Generate thumbnail for gallery
          let thumbUrl = null;
          try {
            thumbUrl = canvas.toDataURL("image/png", 0.5);
          } catch {
            // ignore
          }

          // Add to session history
          const historyItem = {
            id: String(Date.now()),
            mode: "video",
            layoutName: activeLayout.name,
            caption: customCaption || "★ VIDEO MEMORIES",
            timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
            thumbnailUrl: thumbUrl,
            blob: blob,
            filename: filename,
          };
          setSessionHistory((prev) => [historyItem, ...prev]);

          if (isShare && navigator.canShare) {
            try {
              const file = new File([blob], filename, { type: "video/mp4" });
              if (navigator.canShare({ files: [file] })) {
                await navigator.share({
                  files: [file],
                  title: "Video Strip Memories",
                  text: `Check out my retro video strip! ${customCaption ? `"${customCaption}"` : ""}`,
                });
                setIsDownloadingVideo(false);
                resolve();
                return;
              }
            } catch (shareErr) {
              if (shareErr.name === "AbortError") {
                setIsDownloadingVideo(false);
                resolve();
                return;
              }
            }
          }

          const link = document.createElement("a");
          link.download = filename;
          link.href = URL.createObjectURL(blob);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(link.href), 5000);
          setIsDownloadingVideo(false);
          resolve();
        };
      });

      recorder.start(100);

      const fallbackStartTime = Date.now();

      safetyTimer = setTimeout(() => {
        if (recorder && recorder.state === "recording") {
          videoElements.forEach((v) => v.pause());
          recorder.stop();
        }
      }, durationMs + 1000);

      const fallbackRenderLoop = () => {
        renderStripCanvas(
          ctx,
          canvasW,
          canvasH,
          videoElements,
          activeLayout,
          frameStyle,
          selectedStamps,
          isStory,
          filter,
          customCaption,
          customFrameColor,
          framePattern,
          captionFont,
          placedStickers,
          showDateStamp,
          dateStampText,
        );

        if (Date.now() - fallbackStartTime < durationMs) {
          requestAnimationFrame(fallbackRenderLoop);
        } else {
          if (safetyTimer) clearTimeout(safetyTimer);
          videoElements.forEach((v) => v.pause());
          if (recorder.state === "recording") {
            recorder.stop();
          }
        }
      };

      requestAnimationFrame(fallbackRenderLoop);
      await recordPromise;
    } catch (err) {
      console.error("Error generating video MP4:", err);
    } finally {
      // Clean up video elements and hidden DOM container safely
      try {
        if (videoElements && videoElements.length > 0) {
          videoElements.forEach((v) => {
            try {
              v.pause();
              v.removeAttribute("src");
              v.load();
            } catch {
              // ignore
            }
          });
        }
        if (hiddenContainer && document.body.contains(hiddenContainer)) {
          document.body.removeChild(hiddenContainer);
        }
      } catch (cleanupErr) {
        console.warn("Cleanup hiddenContainer error:", cleanupErr);
      }
      setIsDownloadingVideo(false);
    }
  }, [videoClips, activeLayout, frameStyle, selectedStamps, exportFormat, filter, customCaption, customFrameColor, framePattern, captionFont, placedStickers]);

  // Reusable helper to render a Stop-Motion Polaroid Card frame on canvas
  const renderStopMotionCardFrame = (
    ctx,
    cardW,
    cardH,
    photoImg,
    poseIndex,
    totalPoses,
  ) => {
    ctx.clearRect(0, 0, cardW, cardH);

    const frameColor = customFrameColor || frameStyle.bgColor;
    const isDark =
      frameStyle.id === "black" ||
      frameStyle.id === "film" ||
      frameStyle.id === "cyber" ||
      frameStyle.id === "arcade";

    // 1. Card Background
    ctx.fillStyle = frameColor;
    ctx.fillRect(0, 0, cardW, cardH);

    // 2. Pattern Overlay
    if (framePattern && framePattern !== "none") {
      ctx.save();
      ctx.fillStyle = isDark
        ? "rgba(255, 255, 255, 0.08)"
        : "rgba(15, 23, 42, 0.08)";
      if (framePattern === "checkerboard") {
        const step = 28;
        for (let py = 0; py < cardH; py += step) {
          for (let px = 0; px < cardW; px += step) {
            if ((Math.floor(py / step) + Math.floor(px / step)) % 2 === 0) {
              ctx.fillRect(px, py, step, step);
            }
          }
        }
      } else if (framePattern === "polkadot") {
        const step = 32;
        for (let py = step / 2; py < cardH; py += step) {
          for (let px = step / 2; px < cardW; px += step) {
            ctx.beginPath();
            ctx.arc(px, py, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else if (framePattern === "stripes") {
        ctx.strokeStyle = isDark
          ? "rgba(255, 255, 255, 0.08)"
          : "rgba(15, 23, 42, 0.08)";
        ctx.lineWidth = 14;
        for (let offset = -cardH; offset < cardW + cardH; offset += 36) {
          ctx.beginPath();
          ctx.moveTo(offset, 0);
          ctx.lineTo(offset + cardH, cardH);
          ctx.stroke();
        }
      } else if (framePattern === "gridnotebook") {
        ctx.strokeStyle = isDark
          ? "rgba(255, 255, 255, 0.1)"
          : "rgba(15, 23, 42, 0.1)";
        ctx.lineWidth = 1;
        for (let px = 0; px <= cardW; px += 24) {
          ctx.beginPath();
          ctx.moveTo(px, 0);
          ctx.lineTo(px, cardH);
          ctx.stroke();
        }
        for (let py = 0; py <= cardH; py += 24) {
          ctx.beginPath();
          ctx.moveTo(0, py);
          ctx.lineTo(cardW, py);
          ctx.stroke();
        }
      } else if (framePattern === "hearts") {
        ctx.font = "20px sans-serif, 'Apple Color Emoji'";
        ctx.fillStyle = "rgba(225, 29, 72, 0.22)";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        for (let py = 24; py < cardH; py += 48) {
          for (let px = 24; px < cardW; px += 48) {
            ctx.fillText("♥", px, py);
          }
        }
      } else if (framePattern === "stars") {
        ctx.font = "20px sans-serif, 'Apple Color Emoji'";
        ctx.fillStyle = "rgba(234, 179, 8, 0.2)";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        for (let py = 24; py < cardH; py += 48) {
          for (let px = 24; px < cardW; px += 48) {
            ctx.fillText("★", px, py);
          }
        }
      }
      ctx.restore();
    }

    // 3. Card Outer Border (Neo-Brutalist 8px solid)
    ctx.lineWidth = 8;
    ctx.strokeStyle = "#0f172a";
    ctx.strokeRect(4, 4, cardW - 8, cardH - 8);

    // 4. Header Details
    const dotY = 32;
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(38, dotY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#eab308";
    ctx.beginPath();
    ctx.arc(58, dotY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#10b981";
    ctx.beginPath();
    ctx.arc(78, dotY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Header Text
    ctx.fillStyle = isDark ? "#ffffff" : "#0f172a";
    ctx.font = "bold 13px 'IBM Plex Mono', monospace";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(
      `● POSE ${poseIndex + 1}/${totalPoses} [STOP-MOTION]`,
      cardW - 38,
      dotY,
    );

    // 5. Photo Slot
    const slotX = 36;
    const slotY = 54;
    const slotW = cardW - 72; // 648
    const slotH = 700; // Tall portrait slot

    // Photo background fill
    ctx.fillStyle = "#000000";
    drawRoundRect(ctx, slotX, slotY, slotW, slotH, 12);
    ctx.fill();

    // Draw the photo (photoImg is an HTMLImageElement from photos array which already has filter baked in, or video element)
    const isVideo = photoImg instanceof HTMLVideoElement;
    const filterStr = isVideo ? getCanvasFilter(filter) : "none";
    const filterName = isVideo ? filter : "none";
    drawCoverImage(
      ctx,
      photoImg,
      slotX,
      slotY,
      slotW,
      slotH,
      12,
      filterStr,
      isVideo && isMirrored,
      filterName,
    );

    // Photo Slot Border
    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = isDark ? "#ffffff33" : "#0f172a";
    drawRoundRect(ctx, slotX, slotY, slotW, slotH, 12);
    ctx.stroke();
    ctx.restore();

    if (showDateStamp) {
      const stampStr = dateStampText || getDefaultDateStamp();
      ctx.save();
      ctx.font = 'bold 24px "VT323", "IBM Plex Mono", monospace';
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.shadowColor = "#FF3700";
      ctx.shadowBlur = 10;
      ctx.fillStyle = "#FF7A00";
      ctx.fillText(stampStr, slotX + slotW - 14, slotY + slotH - 12);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#FFA726";
      ctx.fillText(stampStr, slotX + slotW - 14, slotY + slotH - 12);
      ctx.restore();
    }

    // 6. Placed Stickers & Stamps on Card
    if (placedStickers && placedStickers.length > 0) {
      placedStickers.forEach((stk) => {
        ctx.save();
        const posX = (stk.x / 100) * cardW;
        const posY = (stk.y / 100) * cardH;
        const scale = (stk.scale || 1) * 1.35;
        const rotation = ((stk.rotation || 0) * Math.PI) / 180;

        ctx.translate(posX, posY);
        ctx.rotate(rotation);
        ctx.scale(scale, scale);

        const isSymbol = ["★", "✦", "✧", "♡", "☺"].includes(stk.content);
        ctx.font = "38px 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        if (isSymbol) {
          ctx.lineWidth = 4;
          ctx.strokeStyle = "#ffffff";
          ctx.strokeText(stk.content, 0, 0);
          ctx.fillStyle = "#0f172a";
          ctx.fillText(stk.content, 0, 0);
        } else {
          ctx.fillText(stk.content, 0, 0);
        }
        ctx.restore();
      });
    } else if (selectedStamps && selectedStamps.length > 0) {
      selectedStamps.forEach((st, sIdx) => {
        if (st.sticker) {
          ctx.save();
          ctx.font = "32px 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(st.sticker, cardW - 70 - sIdx * 38, slotY + slotH - 35);
          ctx.restore();
        }
      });
    }

    // 7. Caption & Footer
    const footerCenterY = slotY + slotH + 42;
    ctx.save();
    const activeFont =
      CAPTION_FONTS.find((f) => f.id === captionFont) || CAPTION_FONTS[0];
    ctx.font = `bold 28px ${activeFont.family}`;
    ctx.fillStyle = frameStyle.textColor || "#0f172a";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const displayCaption = customCaption.trim() || "PHOTOBOOTH MEMORIES";
    ctx.fillText(displayCaption, cardW / 2, footerCenterY);

    // Subtitle & Retro Barcode
    const nowStr = new Date().toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    ctx.font = "bold 11px 'IBM Plex Mono', monospace";
    ctx.fillStyle = isDark ? "#ffffff88" : "#0f172a88";
    ctx.textAlign = "left";
    ctx.fillText(`★ STOP-MOTION // ${nowStr.toUpperCase()}`, 38, cardH - 26);

    // Barcode on bottom right
    const bcX = cardW - 130;
    const bcY = cardH - 34;
    ctx.fillStyle = isDark ? "#ffffff" : "#0f172a";
    const barWidths = [3, 1, 4, 2, 1, 5, 2, 1, 3, 2, 4, 1, 3, 2];
    let curBcX = bcX;
    barWidths.forEach((bw, bIdx) => {
      if (bIdx % 2 === 0) {
        ctx.fillRect(curBcX, bcY, bw, 16);
      }
      curBcX += bw + 1.5;
    });
    ctx.restore();
  };

  // Download animated looping Stop-Motion Card (.GIF) 100% in-browser with Netscape infinite loop
  const downloadGifStrip = useCallback(
    async (isShare = false) => {
      if (photos.length === 0) return;

      try {
        setIsDownloadingGif(true);

        if (isSoundEnabled) {
          playPrintSound();
        }

        if (document.fonts) {
          await document.fonts.ready;
        }

        const loadImage = (src) =>
          new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
          });

        const loadedImages = await Promise.all(
          photos.map((src) => loadImage(src)),
        );

        const cardW = 720;
        const cardH = 960;
        const canvas = document.createElement("canvas");
        canvas.width = cardW;
        canvas.height = cardH;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });

        const gif = GIFEncoder();
        const frameDelay = 600; // 0.6 seconds per pose

        for (let i = 0; i < loadedImages.length; i++) {
          renderStopMotionCardFrame(
            ctx,
            cardW,
            cardH,
            loadedImages[i],
            i,
            loadedImages.length,
          );

          // Quantize & Write frame to GIF with Floyd-Steinberg error diffusion dithering (Netscape 2.0 loop forever!)
          const { data } = ctx.getImageData(0, 0, cardW, cardH);
          const palette = quantize(data, 256);
          const index = applyPaletteWithDither(data, palette, cardW, cardH);
          gif.writeFrame(index, cardW, cardH, {
            palette,
            delay: frameDelay,
            repeat: 0,
          });
        }

        gif.finish();
        const bytes = gif.bytes();
        const blob = new Blob([bytes], { type: "image/gif" });
        const url = URL.createObjectURL(blob);
        const filename = `photobooth-stopmotion-${Date.now()}.gif`;

        if (isShare && navigator.canShare) {
          const file = new File([blob], filename, { type: "image/gif" });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: "Photobooth Stop-Motion Card",
              text: customCaption || "Lihat GIF Stop-Motion Photobooth seruku!",
            });
            return;
          }
        }

        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setSessionHistory((prev) => [
          {
            id: "gif-" + Date.now(),
            mode: "gif",
            layoutName: "Stop-Motion Card (GIF)",
            caption: customCaption || "Stop-Motion Card",
            timestamp: new Date().toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            thumbnailUrl: url,
            blob,
            filename,
          },
          ...prev,
        ]);
      } catch (err) {
        console.error("Error generating GIF stop-motion:", err);
      } finally {
        setIsDownloadingGif(false);
      }
    },
    [
      photos,
      isSoundEnabled,
      customFrameColor,
      frameStyle,
      framePattern,
      filter,
      placedStickers,
      selectedStamps,
      captionFont,
      customCaption,
    ],
  );

  // Download looping Stop-Motion Card as MP4 Video (100% native compatibility for Instagram Story & WhatsApp)
  const downloadStopMotionVideo = useCallback(
    async (isShare = false) => {
      if (photos.length === 0) return;

      try {
        setIsDownloadingStopMotion(true);

        if (isSoundEnabled) {
          playPrintSound();
        }

        if (document.fonts) {
          await document.fonts.ready;
        }

        const loadImage = (src) =>
          new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
          });

        const loadedImages = await Promise.all(
          photos.map((src) => loadImage(src)),
        );

        const cardW = 720;
        const cardH = 960;
        const canvas = document.createElement("canvas");
        canvas.width = cardW;
        canvas.height = cardH;
        const ctx = canvas.getContext("2d");

        // Duration: 2-3 full loops of all poses at 0.6s per pose (approx 3.6s - 5.4s, ideal for IG Story & WA)
        const secondsPerPose = 0.6;
        const singleCycle = loadedImages.length * secondsPerPose;
        const totalCycles = Math.max(2, Math.ceil(3.6 / singleCycle));
        const totalDurationSec = singleCycle * totalCycles;
        const totalDurationMs = totalDurationSec * 1000;
        const fps = 30;

        let webCodecsSucceeded = false;
        const hasWebCodecs = typeof VideoEncoder !== "undefined";

        if (hasWebCodecs) {
          try {
            let encoderConfig = {
              codec: "avc1.42001f",
              width: cardW,
              height: cardH,
              bitrate: 3_500_000,
              framerate: fps,
            };

            const isSupported =
              await VideoEncoder.isConfigSupported(encoderConfig);
            if (!isSupported.supported) {
              encoderConfig.codec = "avc1.4d001f";
              const isSupported2 =
                await VideoEncoder.isConfigSupported(encoderConfig);
              if (!isSupported2.supported) {
                throw new Error("WebCodecs H.264 not supported in this browser");
              }
            }

            const { Muxer, ArrayBufferTarget } = await import("mp4-muxer");
            const muxer = new Muxer({
              target: new ArrayBufferTarget(),
              video: {
                codec: "avc",
                width: cardW,
                height: cardH,
              },
              fastStart: "in-memory",
            });

            let encoderError = null;
            const videoEncoder = new VideoEncoder({
              output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
              error: (e) => {
                console.error("StopMotion VideoEncoder error:", e);
                encoderError = e;
              },
            });

            videoEncoder.configure(encoderConfig);

            const totalFrames = Math.round(totalDurationSec * fps);
            for (let f = 0; f < totalFrames; f++) {
              if (encoderError) break;

              const currentTimeSec = f / fps;
              const poseIdx =
                Math.floor(currentTimeSec / secondsPerPose) %
                loadedImages.length;

              renderStopMotionCardFrame(
                ctx,
                cardW,
                cardH,
                loadedImages[poseIdx],
                poseIdx,
                loadedImages.length,
              );

              const timestampMicros = Math.round(currentTimeSec * 1_000_000);
              const videoFrame = new VideoFrame(canvas, {
                timestamp: timestampMicros,
                duration: Math.round((1 / fps) * 1_000_000),
              });

              videoEncoder.encode(videoFrame, {
                keyFrame: f % (fps * 2) === 0,
              });
              videoFrame.close();
            }

            await videoEncoder.flush();
            videoEncoder.close();
            muxer.finalize();

            const buffer = muxer.target.buffer;
            const blob = new Blob([buffer], { type: "video/mp4" });
            const url = URL.createObjectURL(blob);
            const filename = `photobooth-stopmotion-story-${Date.now()}.mp4`;

            if (isShare && navigator.canShare) {
              const file = new File([blob], filename, { type: "video/mp4" });
              if (navigator.canShare({ files: [file] })) {
                await navigator.share({
                  files: [file],
                  title: "Photobooth Stop-Motion Story",
                  text:
                    customCaption ||
                    "Lihat Video Stop-Motion Photobooth seruku!",
                });
                return;
              }
            }

            const link = document.createElement("a");
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setSessionHistory((prev) => [
              {
                id: "sm-video-" + Date.now(),
                mode: "video",
                layoutName: "Stop-Motion Story (MP4)",
                caption: customCaption || "Stop-Motion Story",
                timestamp: new Date().toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                thumbnailUrl: url,
                blob,
                filename,
              },
              ...prev,
            ]);
            webCodecsSucceeded = true;
            return;
          } catch (wcErr) {
            console.warn(
              "WebCodecs Stop-Motion unavailable/failed, using WASM H.264:",
              wcErr,
            );
          }
        }

        // Bulletproof Fallback: Pure WebAssembly H.264 MP4 Encoder (Always generates genuine .mp4 on Firefox, Safari, & Chrome)
        if (!webCodecsSucceeded) {
          try {
            if (!window.HME) {
              await new Promise((resolve, reject) => {
                const script = document.createElement("script");
                script.src = "/h264-mp4-encoder.web.js";
                script.onload = () => resolve();
                script.onerror = () =>
                  reject(new Error("Gagal memuat modul H.264 MP4 encoder"));
                document.head.appendChild(script);
              });
            }

            if (window.HME && window.HME.createH264MP4Encoder) {
              const encoder = await window.HME.createH264MP4Encoder();
              encoder.width = cardW;
              encoder.height = cardH;
              encoder.frameRate = fps;
              encoder.quantizationParameter = 20;
              encoder.speed = 7;
              encoder.groupOfPictures = fps;
              encoder.initialize();

              const totalFrames = Math.round(totalDurationSec * fps);
              for (let f = 0; f < totalFrames; f++) {
                const currentTimeSec = f / fps;
                const poseIdx =
                  Math.floor(currentTimeSec / secondsPerPose) %
                  loadedImages.length;

                renderStopMotionCardFrame(
                  ctx,
                  cardW,
                  cardH,
                  loadedImages[poseIdx],
                  poseIdx,
                  loadedImages.length,
                );

                const imgData = ctx.getImageData(0, 0, cardW, cardH);
                encoder.addFrameRgba(imgData.data);
              }

              encoder.finalize();
              const uint8Array = encoder.FS.readFile(encoder.outputFilename);
              encoder.delete();

              const blob = new Blob([uint8Array], { type: "video/mp4" });
              const url = URL.createObjectURL(blob);
              const filename = `photobooth-stopmotion-story-${Date.now()}.mp4`;

              if (isShare && navigator.canShare) {
                const file = new File([blob], filename, { type: "video/mp4" });
                if (navigator.canShare({ files: [file] })) {
                  await navigator.share({
                    files: [file],
                    title: "Photobooth Stop-Motion Story",
                    text:
                      customCaption ||
                      "Lihat Video Stop-Motion Photobooth seruku!",
                  });
                  return;
                }
              }

              const link = document.createElement("a");
              link.href = url;
              link.download = filename;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);

              setSessionHistory((prev) => [
                {
                  id: "sm-video-" + Date.now(),
                  mode: "video",
                  layoutName: "Stop-Motion Story (MP4)",
                  caption: customCaption || "Stop-Motion Story",
                  timestamp: new Date().toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                  thumbnailUrl: url,
                  blob,
                  filename,
                },
                ...prev,
              ]);
              return;
            }
          } catch (hmeErr) {
            console.warn("WASM H.264 MP4 encoding error:", hmeErr);
          }
        }

        // Final Fallback: MediaRecorder (guaranteed .mp4 container filename)
        const stream = canvas.captureStream(fps);
        let mimeType = "video/mp4";
        if (!MediaRecorder.isTypeSupported("video/mp4")) {
          mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=h264")
            ? "video/webm;codecs=h264"
            : "video/webm";
        }

        const recorder = new MediaRecorder(stream, {
          mimeType,
          videoBitsPerSecond: 3_000_000,
        });

        const chunks = [];
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        const recordPromise = new Promise((resolve) => {
          recorder.onstop = () => {
            const blob = new Blob(chunks, { type: "video/mp4" });
            const filename = `photobooth-stopmotion-story-${Date.now()}.mp4`;
            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setSessionHistory((prev) => [
              {
                id: "sm-video-" + Date.now(),
                mode: "video",
                layoutName: "Stop-Motion Story (MP4)",
                caption: customCaption || "Stop-Motion Story",
                timestamp: new Date().toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                thumbnailUrl: url,
                blob,
                filename,
              },
              ...prev,
            ]);
            resolve();
          };
        });

        recorder.start();
        const startTime = performance.now();

        const renderLoop = () => {
          const elapsed = performance.now() - startTime;
          const currentSec = elapsed / 1000;
          const poseIdx =
            Math.floor(currentSec / secondsPerPose) % loadedImages.length;
          renderStopMotionCardFrame(
            ctx,
            cardW,
            cardH,
            loadedImages[poseIdx],
            poseIdx,
            loadedImages.length,
          );

          if (elapsed < totalDurationMs) {
            requestAnimationFrame(renderLoop);
          } else {
            if (recorder.state === "recording") {
              recorder.stop();
            }
          }
        };

        requestAnimationFrame(renderLoop);
        await recordPromise;
      } catch (err) {
        console.error("Error generating Stop-Motion Video:", err);
      } finally {
        setIsDownloadingStopMotion(false);
      }
    },
    [
      photos,
      isSoundEnabled,
      customFrameColor,
      frameStyle,
      framePattern,
      filter,
      placedStickers,
      selectedStamps,
      captionFont,
      customCaption,
    ],
  );

  return (
    <div className="min-h-screen bg-grid-light text-slate-900">
      {/* Top Navbar Neo-Brutalist */}
      <header className="sticky top-0 z-40 w-full bg-white/95 border-b-2 border-slate-900 backdrop-blur-md px-2 sm:px-6 lg:px-8 py-1.5 sm:py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-2">
          {/* Logo */}
          <div className="flex items-center gap-1 sm:gap-2.5 shrink-0 min-w-0">
            <div className="brutal-badge bg-sky-400 p-1 sm:p-2 rounded-md sm:rounded-lg flex items-center justify-center text-slate-900 shrink-0">
              <Camera className="w-3.5 h-3.5 sm:w-5 sm:h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <h1 className="font-syne font-black text-xs sm:text-base lg:text-xl tracking-tight text-slate-900 whitespace-nowrap">
                PHOTOBOOTH
                <span className="hidden lg:inline font-mono-retro text-xs font-normal text-slate-500 ml-1.5">by pangestudev</span>
              </h1>
            </div>
          </div>

          {/* Right Status Indicator & Actions */}
          <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 shrink-0">
            {/* Guidebook / Panduan Penggunaan */}
            <GuideModal />

            {/* Developer Info Badge */}
            <DeveloperBadge />

            {/* Privacy Badge Popover */}
            <PrivacyBadge />

            {/* Sound SFX Toggle */}
            <button
              type="button"
              onClick={handleToggleSound}
              className={`flex items-center justify-center p-1 sm:px-2.5 sm:py-1 rounded-full font-mono-retro text-[10px] sm:text-xs font-bold border-2 border-slate-900 transition-all cursor-pointer shrink-0 ${
                isSoundEnabled
                  ? "bg-emerald-300 text-slate-900 shadow-[1px_1px_0px_#0f172a] sm:shadow-[1.5px_1.5px_0px_#0f172a]"
                  : "bg-slate-200 text-slate-600 hover:bg-slate-300"
              }`}
              title={isSoundEnabled ? "Matikan Efek Suara SFX" : "Nyalakan Efek Suara SFX"}
            >
              {isSoundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 stroke-[2.5]" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 stroke-[2.5]" />
              )}
              <span className="hidden lg:inline ml-0.5">SFX {isSoundEnabled ? "ON" : "OFF"}</span>
            </button>

            {/* Session History Gallery Button */}
            <button
              type="button"
              onClick={() => setIsGalleryOpen(true)}
              className="flex items-center gap-1 p-1 sm:px-2.5 sm:py-1 rounded-full brutal-badge bg-amber-200 hover:bg-amber-300 text-slate-900 font-mono-retro text-[10px] sm:text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap"
              title="Buka Riwayat Hasil Strip Sesi Ini"
            >
              <History className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">GALERI</span>
              <span className="text-[10px] sm:text-xs font-bold">({sessionHistory.length})</span>
            </button>

            {/* Live Status Badge (Desktop only) */}
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full brutal-badge bg-emerald-100 text-emerald-800 font-mono-retro text-xs font-bold shrink-0 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-dot"></span>
              <span>{isCapturing ? "[● CAPTURING]" : "[● READY]"}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Studio Container */}
      <main className="max-w-7xl mx-auto p-2.5 sm:p-6 lg:p-8">
        {/* Mobile View Switcher (Kamera & Pengaturan vs Preview Strip) */}
        <div className="lg:hidden flex items-center p-1 bg-slate-100 rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] sm:shadow-[3px_3px_0px_#0f172a] mb-3 sm:mb-4 gap-1 select-none">
          <button
            type="button"
            onClick={() => {
              if (mobileTab !== "camera") {
                setMobileTab("camera");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            className={`flex-1 min-w-0 py-2 px-1.5 sm:px-2.5 rounded-md font-syne font-extrabold text-[11px] sm:text-xs flex items-center justify-center gap-1 sm:gap-1.5 transition-all duration-200 cursor-pointer ${
              mobileTab === "camera"
                ? "bg-sky-400 text-slate-900 shadow-[2px_2px_0px_#0f172a] border border-slate-900"
                : "border border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <Camera className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
            <span className="hidden sm:inline">1. KAMERA &amp; KONTROL</span>
            <span className="sm:hidden">1. KAMERA</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (mobileTab !== "strip") {
                setMobileTab("strip");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            className={`flex-1 min-w-0 py-2 px-1.5 sm:px-2.5 rounded-md font-syne font-extrabold text-[11px] sm:text-xs flex items-center justify-center gap-1 sm:gap-1.5 transition-all duration-200 cursor-pointer relative ${
              mobileTab === "strip"
                ? "bg-amber-300 text-slate-900 shadow-[2px_2px_0px_#0f172a] border border-slate-900"
                : "border border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <Layers className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
            <span className="hidden sm:inline">2. HASIL STRIP</span>
            <span className="sm:hidden">2. STRIP</span>
            {(captureMode === "video" ? videoClips.length : photos.length) > 0 && (
              <span className="shrink-0 text-[10px] font-mono-retro font-bold">
                ({captureMode === "video" ? videoClips.length : photos.length}/{activeLayout.count})
              </span>
            )}
            {(captureMode === "video" ? videoClips.length : photos.length) === activeLayout.count && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 border border-slate-900 animate-pulse shrink-0 ml-0.5" />
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start">
          {/* Left Column: Viewfinder & Controls (7 cols) */}
          <div
            className={`lg:col-span-7 flex-col gap-4 sm:gap-6 transition-all duration-200 ${
              mobileTab === "strip" ? "hidden lg:flex" : "flex animate-tab-enter"
            }`}
          >
            <WebcamComponent
              ref={webcamRef}
              filter={filter}
              countdown={countdown}
              isCapturing={isCapturing}
              onStartSession={startPhotoSession}
              onReset={resetSession}
              onDownload={downloadPhotoStrip}
              onDownloadVideo={downloadVideoStrip}
              onDownloadGif={downloadGifStrip}
              onDownloadStopMotionVideo={downloadStopMotionVideo}
              captureMode={captureMode}
              setCaptureMode={setCaptureMode}
              videoClips={videoClips}
              isRecordingVideo={isRecordingVideo}
              videoRecordProgress={videoRecordProgress}
              onStopVideoRecording={handleStopVideoRecording}
              activeLayout={activeLayout}
              setActiveLayout={setActiveLayout}
              setFilter={setFilter}
              photos={photos}
              frameStyle={frameStyle}
              setFrameStyle={setFrameStyle}
              retroStamp={retroStamp}
              setRetroStamp={handleStampToggle}
              selectedStamps={selectedStamps}
              onToggleStamp={handleStampToggle}
              onRemoveStampAt={handleRemoveStampAt}
              onClearStamps={handleClearStamps}
              isFlashing={isFlashing}
              isDownloading={isDownloading}
              isDownloadingVideo={isDownloadingVideo}
              isDownloadingGif={isDownloadingGif}
              isDownloadingStopMotion={isDownloadingStopMotion}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              exportFormat={exportFormat}
              setExportFormat={setExportFormat}
              facingMode={facingMode}
              setFacingMode={setFacingMode}
              isMirrored={isMirrored}
              onToggleMirror={handleToggleMirror}
              onFacingModeChange={handleFacingModeChange}
              timerDuration={timerDuration}
              onTimerDurationChange={setTimerDuration}
              isSoundEnabled={isSoundEnabled}
              onToggleSound={handleToggleSound}
              customCaption={customCaption}
              setCustomCaption={setCustomCaption}
              customFrameColor={customFrameColor}
              setCustomFrameColor={setCustomFrameColor}
              framePattern={framePattern}
              onSelectFramePattern={setFramePattern}
              captionFont={captionFont}
              onSelectCaptionFont={setCaptionFont}
              isRingLightOn={isRingLightOn}
              onToggleRingLight={handleToggleRingLight}
              ringLightColor={ringLightColor}
              onSelectRingLightColor={setRingLightColor}
              onAddPlacedSticker={handleAddPlacedSticker}
              placedStickers={placedStickers}
              onClearPlacedStickers={handleClearPlacedStickers}
              isGestureEnabled={isGestureEnabled}
              onToggleGesture={() => setIsGestureEnabled((p) => !p)}
              isGestureDetected={isGestureDetected}
              retakeIndex={retakeIndex}
              onCancelRetake={() => setRetakeIndex(null)}
              onStartRetake={startRetakePose}
              showDateStamp={showDateStamp}
              onToggleDateStamp={() => setShowDateStamp((p) => !p)}
              dateStampText={dateStampText}
              onChangeDateStampText={setDateStampText}
              isKioskMode={isKioskMode}
              onToggleKiosk={handleToggleKiosk}
            />
          </div>

          {/* Right Column: Photo / Video Strip Print Preview (5 cols, sticky on desktop) */}
          <div
            className={`lg:col-span-5 flex-col items-center lg:sticky lg:top-20 transition-all duration-200 ${
              mobileTab === "camera" ? "hidden lg:flex" : "flex animate-tab-enter"
            }`}
          >
            <PhotoStrip
              ref={stripRef}
              photos={photos}
              videoClips={videoClips}
              captureMode={captureMode}
              filter={filter}
              activeLayout={activeLayout}
              livePreview={livePreview}
              frameStyle={frameStyle}
              retroStamp={retroStamp}
              selectedStamps={selectedStamps}
              onDownload={downloadPhotoStrip}
              onDownloadVideo={downloadVideoStrip}
              onDownloadGif={downloadGifStrip}
              onDownloadStopMotionVideo={downloadStopMotionVideo}
              onReset={resetSession}
              onShare={() =>
                captureMode === "video"
                  ? downloadVideoStrip(true)
                  : downloadPhotoStrip(true)
              }
              isCapturing={isCapturing}
              isDownloading={isDownloading}
              isDownloadingVideo={isDownloadingVideo}
              isDownloadingGif={isDownloadingGif}
              isDownloadingStopMotion={isDownloadingStopMotion}
              exportFormat={exportFormat}
              setExportFormat={setExportFormat}
              isMirrored={isMirrored}
              customCaption={customCaption}
              customFrameColor={customFrameColor}
              framePattern={framePattern}
              captionFont={captionFont}
              placedStickers={placedStickers}
              onUpdatePlacedSticker={handleUpdatePlacedSticker}
              onRemovePlacedSticker={handleRemovePlacedSticker}
              onClearPlacedStickers={handleClearPlacedStickers}
              showDateStamp={showDateStamp}
              dateStampText={dateStampText}
              onRetakePose={(idx) => {
                setRetakeIndex(idx);
                setMobileTab("camera");
              }}
            />
          </div>
        </div>

        {/* Floating Kiosk Mode Exit Button */}
        {isKioskMode && (
          <button
            type="button"
            onClick={handleToggleKiosk}
            className="fixed top-3 right-3 z-50 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-rose-600 text-white font-mono-retro text-xs font-black border-2 border-white shadow-[2px_2px_0px_#000] cursor-pointer transition-colors flex items-center gap-1.5"
            title="Keluar dari layar penuh [ESC]"
          >
            <Minimize className="w-3.5 h-3.5" />
            <span>KELUAR FULL [ESC]</span>
          </button>
        )}
      </main>

      {/* Subtle Retro Footer */}
      <footer className="w-full mt-10 py-5 border-t-2 border-slate-900 bg-white/80 backdrop-blur-sm text-center px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono-retro text-slate-600">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">PHOTOBOOTH</span>
            <span className="text-slate-400">•</span>
            <span>Created by <strong className="text-slate-900">pangestudev</strong></span>
          </div>
          <div className="flex items-center gap-4 text-[10px]">
            <a
              href="https://pangestudev.web.id/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-sky-600 underline font-semibold transition-colors flex items-center gap-1"
            >
              <span>pangestudev.web.id</span>
              <span className="text-[9px]">↗</span>
            </a>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">100% Client-Side &amp; Private</span>
          </div>
        </div>
      </footer>

      {/* Session History Modal / Drawer */}
      <SessionGallery
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        sessionHistory={sessionHistory}
        history={sessionHistory}
        onClearHistory={() => setSessionHistory([])}
      />
    </div>
  );
}

export default App;
