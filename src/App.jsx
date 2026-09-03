import { useState, useRef, useCallback, useEffect } from "react";
import WebcamComponent from "./components/Webcam";
import PhotoStrip from "./components/PhotoStrip";
import {
  FRAME_STYLES,
  LAYOUT_OPTIONS,
  FILTER_OPTIONS,
  RETRO_STAMPS,
} from "./constants/frames";
import {
  Camera,
  Sparkles,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import "./App.css";

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

  const [photos, setPhotos] = useState([]);
  const [rawPhotos, setRawPhotos] = useState([]);
  const [countdown, setCountdown] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingVideo, setIsDownloadingVideo] = useState(false);
  const [exportFormat, setExportFormat] = useState("story"); // 'story' (Instagram Story 9:16) or 'strip' (Strip Pas)
  const [livePreview, setLivePreview] = useState(null);
  const [activeTab, setActiveTab] = useState("layout");

  // Ensure light mode on html / root
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  // Apply filters on canvas
  const applyFilter = useCallback((imageSrc, filterType) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = Math.min(img.width, img.height);
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          // Mirror / flip horizontal
          ctx.translate(size, 0);
          ctx.scale(-1, 1);

          // Crop center square
          const startX = (img.width - size) / 2;
          const startY = (img.height - size) / 2;
          ctx.drawImage(img, startX, startY, size, size, 0, 0, size, size);

          // Reset transform
          ctx.setTransform(1, 0, 0, 1, 0, 0);

          // Apply selected filter
          if (filterType === "grayscale") {
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
          }

          resolve(canvas.toDataURL("image/jpeg", 0.95));
        }
      };
      img.src = imageSrc;
    });
  }, []);

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
          const processedPreview = await applyFilter(imageSrc, filter);
          setLivePreview(processedPreview);
        }
      }
    }, 150);

    return () => clearInterval(interval);
  }, [photos.length, activeLayout.count, filter, applyFilter, isCapturing, captureMode]);

  // Capture single high-quality photo with flash
  const capturePhoto = useCallback(async () => {
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 250);

    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      const processed = await applyFilter(imageSrc, filter);
      setPhotos((prev) => [...prev, processed]);
      setRawPhotos((prev) => [...prev, imageSrc]);
    }
  }, [filter, applyFilter]);

  // Re-apply filter when user changes filter after photos are taken
  const prevFilterRef = useRef(filter);
  useEffect(() => {
    if (rawPhotos.length === 0) {
      prevFilterRef.current = filter;
      return;
    }

    if (prevFilterRef.current === filter) return;
    prevFilterRef.current = filter;

    let isCancelled = false;

    const reapplyFilters = async () => {
      try {
        const newPhotos = await Promise.all(
          rawPhotos.map((raw) => applyFilter(raw, filter))
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
  }, [filter, rawPhotos, applyFilter]);

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

      // 3-second countdown
      for (let c = 3; c > 0; c--) {
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
  }, [activeLayout.count, captureMode, recordVideoSlot, capturePhoto, revokeOldVideoClips]);

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
  const drawCoverImage = (ctx, img, dx, dy, dWidth, dHeight, radius = 0, filterStr = "none") => {
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
    if (filterStr && filterStr !== "none") {
      ctx.filter = filterStr;
    }
    ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
    ctx.restore();
  };

  // Canvas filter CSS string mapping
  const getCanvasFilter = (f) => {
    switch (f) {
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
  ) => {
    // 0. Clean Pure White Background (#FFFFFF)
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvasW, canvasH);

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

    let photoW, photoH, totalGridH, spineW, colW, leftPhotoH, rightPhotoH, leftMarginW, rightMarginW;

    if (layout.id === "9-asym-film") {
      leftMarginW = Math.round(cardW * 0.04);
      rightMarginW = Math.round(cardW * 0.04);
      spineW = Math.round(cardW * 0.045);
      colW = Math.floor((contentW - leftMarginW - rightMarginW - spineW - gap * 2) / 2);
      rightPhotoH = Math.round(colW * 0.68);
      totalGridH = 5 * rightPhotoH + 4 * gap;
      leftPhotoH = Math.floor((totalGridH - 3 * gap) / 4);
      photoW = colW;
      photoH = rightPhotoH;
    } else if (layout.id === "5-asym-film") {
      leftMarginW = Math.round(cardW * 0.04);
      rightMarginW = Math.round(cardW * 0.04);
      spineW = Math.round(cardW * 0.045);
      colW = Math.floor((contentW - leftMarginW - rightMarginW - spineW - gap * 2) / 2);
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
      (layout.id === "9-asym-film" || layout.id === "5-asym-film") && frame.id === "classic-white"
        ? "#09090B"
        : frame.bgColor;
    ctx.fillStyle = effectiveBgColor;
    drawRoundRect(ctx, cardX, cardY, cardW, cardH, cardRadius);
    ctx.fill();

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
      const leftCount = is5asym ? 2 : 4;
      const rightCount = is5asym ? 3 : 5;
      const leftColX = contentX + leftMarginW;
      const spineX = leftColX + colW + gap;
      const rightColX = spineX + spineW + gap;
      const rightMarginX = rightColX + colW + gap;
      const photoRadius = Math.max(2, Math.round(colW * 0.01));

      // 1. Left Film Margin text
      ctx.save();
      ctx.fillStyle = "#F59E0B";
      ctx.font = `bold ${Math.max(7, Math.round(leftMarginW * 0.32))}px "IBM Plex Mono", monospace`;
      ctx.textAlign = "center";
      const leftMarks = is5asym
        ? ["← 1 A", "← 2"]
        : ["← 1 A", "← 2", "← 2 A", "← 3"];
      const leftMarkStep = is5asym ? 0.4 : 0.25;
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
          { text: "FILM NEGATIVE", yRatio: 0.12 },
          { text: "→ 1 A", yRatio: 0.28 },
          { text: "FILM NEGATIVE", yRatio: 0.48 },
          { text: "→ 2", yRatio: 0.68 },
          { text: "FILM NEGATIVE", yRatio: 0.88 },
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
        : ["FILM NEGATIVE", "FILM NEGATIVE"];
      const rightMarginStep = is5asym ? 0 : 0.4;
      rightMarginLabels.forEach((txt, idx) => {
        ctx.save();
        ctx.translate(rightMarginX + rightMarginW / 2, gridTop + totalGridH * (is5asym ? 0.5 : 0.3 + idx * rightMarginStep));
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(txt, 0, 0);
        ctx.restore();
      });
      ctx.restore();

      // Draw Left Column: 2 or 4 photos
      for (let i = 0; i < leftCount; i++) {
        const img = loadedImages[i];
        if (!img) continue;
        const px = leftColX;
        const py = gridTop + i * (leftPhotoH + gap);

        const isVideo = img instanceof HTMLVideoElement;
        const filterStr = isVideo ? getCanvasFilter(activeFilter) : "none";
        drawCoverImage(ctx, img, px, py, colW, leftPhotoH, photoRadius, filterStr);

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
      }

      // Draw Right Column: 3 or 5 photos
      for (let j = 0; j < rightCount; j++) {
        const img = loadedImages[leftCount + j];
        if (!img) continue;
        const px = rightColX;
        const py = gridTop + j * (rightPhotoH + gap);

        const isVideo = img instanceof HTMLVideoElement;
        const filterStr = isVideo ? getCanvasFilter(activeFilter) : "none";
        drawCoverImage(ctx, img, px, py, colW, rightPhotoH, photoRadius, filterStr);

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
        drawCoverImage(ctx, img, px, py, photoW, photoH, photoRadius, filterStr);

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

        // Index Badge (Bottom Right)
        const bW = Math.round(photoW * 0.16);
        const bH = Math.round(photoH * 0.15);
        const bx = px + photoW - bW - 6;
        const by = py + photoH - bH - 6;

        ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
        drawRoundRect(ctx, bx, by, bW, bH, 4);
        ctx.fill();

        ctx.fillStyle = "#FFFFFF";
        ctx.font = `bold ${Math.round(bH * 0.52)}px "IBM Plex Mono", monospace`;
        ctx.textAlign = "center";
        ctx.fillText(
          frame.type === "film" ? `0${i + 1}A` : `0${i + 1}`,
          bx + bW / 2,
          by + Math.round(bH * 0.7),
        );
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

    ctx.fillStyle = (layout.id === "9-asym-film" || layout.id === "5-asym-film") ? "#A1A1AA" : frame.textColor;
    ctx.font = `bold ${Math.round(footerH * 0.2)}px "IBM Plex Mono", monospace`;
    ctx.textAlign = "left";
    ctx.fillText(
      `${todayStr} // ${timeStr} WIB`,
      contentX,
      footerY + Math.round(footerH * 0.28),
    );

    ctx.font = `bold ${Math.round(cardW * 0.022)}px "IBM Plex Mono", monospace`;
    ctx.textAlign = "left";
    ctx.fillText(
      "★ MEMORIES TO KEEP",
      contentX,
      footerY + Math.round(footerH * 0.5),
    );
    ctx.textAlign = "right";
    ctx.fillText(
      "#LIMITED-01",
      contentX + contentW,
      footerY + Math.round(footerH * 0.5),
    );

    // Barcode
    const barY = footerY + Math.round(footerH * 0.62);
    const barH = Math.round(footerH * 0.22);
    ctx.fillStyle = frame.textColor;
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
  };

  // Download high-resolution PNG with exact neo-brutalist card, rounded corners & hard shadow
  const downloadPhotoStrip = useCallback(async () => {
    if (photos.length === 0) return;

    try {
      setIsDownloading(true);

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
        canvasW = 1080;
        canvasH = 1920; // Exact 9:16 Instagram Story Canvas
      } else {
        let cardW;
        if (activeLayout.id === "4-vert") {
          cardW = 440;
        } else if (activeLayout.id === "3-cinema") {
          cardW = 540;
        } else if (activeLayout.id === "3-vert") {
          cardW = 460;
        } else if (activeLayout.id === "2-wide") {
          cardW = 500;
        } else if (activeLayout.id === "9-asym-film") {
          cardW = 780;
        } else if (activeLayout.id === "5-asym-film") {
          cardW = 740;
        } else if (activeLayout.id === "8-twin") {
          cardW = 740;
        } else if (activeLayout.id === "6-double") {
          cardW = 740;
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
          const colW = Math.floor((contentW - leftMarginW - rightMarginW - spineW - gap * 2) / 2);
          const rightPhotoH = Math.round(colW * 0.68);
          totalGridH = 5 * rightPhotoH + 4 * gap;
        } else if (activeLayout.id === "5-asym-film") {
          const leftMarginW = Math.round(cardW * 0.04);
          const rightMarginW = Math.round(cardW * 0.04);
          const spineW = Math.round(cardW * 0.045);
          const colW = Math.floor((contentW - leftMarginW - rightMarginW - spineW - gap * 2) / 2);
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
      );

      const link = document.createElement("a");
      const modeSuffix = isStory ? "ig-story" : "strip";
      link.download = `photobooth-${activeLayout.id}-${modeSuffix}-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png", 1.0);
      link.click();
    } catch (err) {
      console.error("Error generating photo strip:", err);
    } finally {
      setIsDownloading(false);
    }
  }, [photos, activeLayout, frameStyle, selectedStamps, exportFormat]);

  // Download Video Strip as .MP4 with 5-second synchronized video loop
  const downloadVideoStrip = useCallback(async () => {
    if (videoClips.length === 0) return;

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
          const colW = Math.floor((contentW - leftMarginW - rightMarginW - spineW - gap * 2) / 2);
          const rightPhotoH = Math.round(colW * 0.68);
          totalGridH = 5 * rightPhotoH + 4 * gap;
        } else if (activeLayout.id === "5-asym-film") {
          const leftMarginW = Math.round(cardW * 0.04);
          const rightMarginW = Math.round(cardW * 0.04);
          const spineW = Math.round(cardW * 0.045);
          const colW = Math.floor((contentW - leftMarginW - rightMarginW - spineW - gap * 2) / 2);
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
        const gapAfterGrid = Math.round(cardW * 0.035);
        const footerH = Math.round(cardW * 0.16);
        const cardH =
          innerPad * 2 +
          headerH +
          divider1H +
          totalGridH +
          gapAfterGrid +
          footerH;
        canvasW = cardW + margin * 2 + shadowOffset;
        canvasH = cardH + margin * 2 + shadowOffset;
      }

      // H.264 hardware encoders strictly require even dimensions (multiples of 2)
      canvasW = Math.floor(canvasW / 2) * 2;
      canvasH = Math.floor(canvasH / 2) * 2;

      const canvas = document.createElement("canvas");
      canvas.width = canvasW;
      canvas.height = canvasH;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Load all video clips into HTMLVideoElements with timeout protection
      const videoElements = await Promise.all(
        videoClips.map((url) => {
          return new Promise((resolve) => {
            const v = document.createElement("video");
            let isDone = false;
            const finish = () => {
              if (!isDone) {
                isDone = true;
                v.currentTime = 0;
                resolve(v);
              }
            };
            v.src = url;
            v.crossOrigin = "anonymous";
            v.muted = true;
            v.loop = true;
            v.playsInline = true;
            v.onloadeddata = finish;
            v.onerror = finish;
            // 3-second safety timeout so export never hangs indefinitely
            setTimeout(finish, 3000);
            v.load();
          });
        })
      );

      await Promise.all(videoElements.map((v) => v.play().catch(() => {})));

      // Check if WebCodecs VideoEncoder is available for 100% genuine H.264 MP4 encoding
      const canUseWebCodecs =
        typeof window !== "undefined" &&
        typeof window.VideoEncoder === "function" &&
        typeof window.VideoFrame === "function";

      if (canUseWebCodecs) {
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
          const durationSeconds = 10;
          const totalFrames = fps * durationSeconds; // 300 frames
          const frameIntervalMs = 1000 / fps;
          const startTime = Date.now();
          const durationMs = durationSeconds * 1000;

          let frameCount = 0;
          let lastEncodedTime = -frameIntervalMs;

          await new Promise((resolve) => {
            const renderLoop = async () => {
              if (encoderError) {
                resolve();
                return;
              }

              const elapsed = Date.now() - startTime;

              if (elapsed - lastEncodedTime >= frameIntervalMs || frameCount === 0) {
                renderStripCanvas(
                  ctx,
                  canvasW,
                  canvasH,
                  videoElements,
                  activeLayout,
                  frameStyle,
                  selectedStamps,
                  isStory,
                  filter
                );

                const timestampMicros = Math.round((frameCount * 1_000_000) / fps);
                const videoFrame = new VideoFrame(canvas, {
                  timestamp: timestampMicros,
                  duration: Math.round(1_000_000 / fps),
                });

                const isKeyFrame = frameCount % 30 === 0;
                videoEncoder.encode(videoFrame, { keyFrame: isKeyFrame });
                videoFrame.close();
                frameCount++;
                lastEncodedTime = elapsed;
              }

              if (elapsed < durationMs && frameCount < totalFrames) {
                requestAnimationFrame(renderLoop);
              } else {
                resolve();
              }
            };

            requestAnimationFrame(renderLoop);
          });

          videoElements.forEach((v) => v.pause());

          if (!encoderError) {
            await videoEncoder.flush();
            muxer.finalize();

            const mp4Buffer = muxer.target.buffer;
            const mp4Blob = new Blob([mp4Buffer], { type: "video/mp4" });
            const link = document.createElement("a");
            const modeSuffix = isStory ? "ig-story" : "strip";
            link.download = `photobooth-${activeLayout.id}-${modeSuffix}-${Date.now()}.mp4`;
            link.href = URL.createObjectURL(mp4Blob);
            link.click();
            return;
          }
        } catch (encErr) {
          console.warn("WebCodecs MP4 encoding failed, falling back to MediaRecorder:", encErr);
        }
      }

      // Fallback to MediaRecorder if VideoEncoder is unavailable
      await Promise.all(videoElements.map((v) => v.play().catch(() => {})));
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

      const recordPromise = new Promise((resolve) => {
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: recorder.mimeType || "video/mp4" });
          const link = document.createElement("a");
          const modeSuffix = isStory ? "ig-story" : "strip";
          link.download = `photobooth-${activeLayout.id}-${modeSuffix}-${Date.now()}.mp4`;
          link.href = URL.createObjectURL(blob);
          link.click();
          resolve();
        };
      });

      recorder.start(100);

      const durationMs = 10000;
      const startTime = Date.now();

      const renderLoop = () => {
        renderStripCanvas(
          ctx,
          canvasW,
          canvasH,
          videoElements,
          activeLayout,
          frameStyle,
          selectedStamps,
          isStory,
          filter
        );

        if (Date.now() - startTime < durationMs) {
          requestAnimationFrame(renderLoop);
        } else {
          videoElements.forEach((v) => v.pause());
          if (recorder.state === "recording") {
            recorder.stop();
          }
        }
      };

      requestAnimationFrame(renderLoop);
      await recordPromise;
    } catch (err) {
      console.error("Error generating video MP4:", err);
    } finally {
      setIsDownloadingVideo(false);
    }
  }, [videoClips, activeLayout, frameStyle, selectedStamps, exportFormat, filter]);

  return (
    <div className="min-h-screen bg-grid-light text-slate-900">
      {/* Top Navbar Neo-Brutalist */}
      <header className="sticky top-0 z-40 w-full bg-white/95 border-b-2 border-slate-900 backdrop-blur-md px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="brutal-badge bg-sky-400 p-2 rounded-lg flex items-center justify-center text-slate-900">
              <Camera className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="font-syne font-extrabold text-lg sm:text-xl tracking-tight text-slate-900">
                PHOTOBOOTH by timurlauttt
              </h1>
              <p className="font-mono-retro text-[10px] text-slate-500 tracking-wider">
                RETRO-TECH // TACTILE STUDIO v1.0
              </p>
            </div>
          </div>

          {/* Right Status Indicator */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full brutal-badge bg-emerald-100 text-emerald-800 font-mono-retro text-xs font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse-dot"></span>
              <span>{isCapturing ? "[● CAPTURING]" : "[● READY]"}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Studio Container */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column: Viewfinder & Controls (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <WebcamComponent
              ref={webcamRef}
              filter={filter}
              countdown={countdown}
              isCapturing={isCapturing}
              onStartSession={startPhotoSession}
              onReset={resetSession}
              onDownload={downloadPhotoStrip}
              onDownloadVideo={downloadVideoStrip}
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
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              exportFormat={exportFormat}
              setExportFormat={setExportFormat}
            />
          </div>

          {/* Right Column: Photo / Video Strip Print Preview (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center">
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
              onReset={resetSession}
              isCapturing={isCapturing}
              isDownloading={isDownloading}
              isDownloadingVideo={isDownloadingVideo}
              exportFormat={exportFormat}
              setExportFormat={setExportFormat}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
