import { forwardRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import {
  Camera,
  Sparkles,
  RotateCcw,
  Layers,
  Palette,
  Stamp,
  SlidersHorizontal,
  Video,
  Download,
  Film,
  CheckCircle2,
  Play,
  Pause,
  LayoutGrid,
  RefreshCw,
  FlipHorizontal2,
  Timer,
  Volume2,
  VolumeX,
  Type,
  Lightbulb,
} from "lucide-react";
import { playCountdownBeep, playShutterClick } from "../utils/audio";
import {
  FRAME_STYLES,
  LAYOUT_OPTIONS,
  FILTER_OPTIONS,
  RETRO_STAMPS,
  FRAME_PATTERNS,
  CAPTION_FONTS,
} from "../constants/frames";

const WebcamComponent = forwardRef(
  (
    {
      filter,
      countdown,
      isCapturing,
      onStartSession,
      onReset,
      onDownload,
      onDownloadVideo,
      captureMode = "photo",
      setCaptureMode,
      videoClips = [],
      isRecordingVideo = false,
      videoRecordProgress = 0,
      onStopVideoRecording,
      activeLayout,
      setActiveLayout,
      setFilter,
      photos,
      frameStyle,
      setFrameStyle,
      retroStamp,
      setRetroStamp,
      selectedStamps,
      onToggleStamp,
      onRemoveStampAt,
      onClearStamps,
      isFlashing,
      isDownloading,
      isDownloadingVideo,
      activeTab,
      setActiveTab,
      exportFormat = "story",
      facingMode = "user",
      setFacingMode,
      isMirrored = true,
      onToggleMirror,
      onFacingModeChange,
      timerDuration = 3,
      onTimerDurationChange,
      isSoundEnabled = true,
      onToggleSound,
      customCaption = "",
      setCustomCaption,
      customFrameColor = null,
      setCustomFrameColor,
      framePattern = "none",
      onSelectFramePattern,
      captionFont = "mono",
      onSelectCaptionFont,
      isRingLightOn = false,
      onToggleRingLight,
      ringLightColor = "white",
      onSelectRingLightColor,
      onAddPlacedSticker,
      placedStickers = [],
      onClearPlacedStickers,
    },
    ref,
  ) => {
    const [currentDateTime, setCurrentDateTime] = useState("");
    const [showGrid, setShowGrid] = useState(true);
    const [localFacingMode, setLocalFacingMode] = useState("user");

    const currentFacingMode = facingMode || localFacingMode;

    // Trigger retro countdown beep
    useEffect(() => {
      if (countdown !== null && isSoundEnabled) {
        playCountdownBeep(countdown);
      }
    }, [countdown, isSoundEnabled]);

    // Trigger analog shutter click on camera flash
    useEffect(() => {
      if (isFlashing && isSoundEnabled) {
        playShutterClick();
      }
    }, [isFlashing, isSoundEnabled]);

    const handleToggleFacingMode = () => {
      if (isCapturing) return;
      const nextMode = currentFacingMode === "user" ? "environment" : "user";
      if (onFacingModeChange) {
        onFacingModeChange(nextMode);
      } else if (setFacingMode) {
        setFacingMode(nextMode);
      } else {
        setLocalFacingMode(nextMode);
      }
    };

    const handleUserMediaError = (err) => {
      console.warn("Camera media access error:", err);
      // Fallback to front camera if environment camera is unavailable
      if (currentFacingMode === "environment") {
        if (setFacingMode) {
          setFacingMode("user");
        } else {
          setLocalFacingMode("user");
        }
      }
    };

    // Normalize selected stamps list
    const activeStampsList = Array.isArray(selectedStamps)
      ? selectedStamps
      : retroStamp && retroStamp.id !== "none"
        ? [retroStamp]
        : [];

    // Update live retro monospace timestamp
    useEffect(() => {
      const updateTime = () => {
        const now = new Date();
        setCurrentDateTime(
          now.toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          }) +
            " " +
            now.toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: false,
            }),
        );
      };

      updateTime();
      const timer = setInterval(updateTime, 1000);
      return () => clearInterval(timer);
    }, []);

    // Filter class for webcam preview
    const getFilterStyle = (f) => {
      switch (f) {
        case "lores":
        case "pixelated":
          return "contrast-125 brightness-110 saturate-125";
        case "goldenhour":
          return "contrast-112 brightness-108 sepia-[0.35] saturate-140 hue-rotate-[-5deg]";
        case "anime":
          return "contrast-108 brightness-108 saturate-130 hue-rotate-[5deg]";
        case "digicam":
          return "contrast-115 brightness-105 saturate-110";
        case "cybershot":
          return "contrast-115 brightness-105 saturate-120 hue-rotate-[-8deg]";
        case "fujifilm":
          return "contrast-110 saturate-125 brightness-100 sepia-[0.1]";
        case "flashpop":
          return "contrast-125 brightness-110 saturate-115";
        case "camedia":
          return "contrast-105 brightness-105 sepia-[0.2] saturate-110";
        case "grayscale":
          return "grayscale contrast-125";
        case "vintage":
          return "sepia-[0.4] contrast-110 brightness-95";
        case "sepia":
          return "sepia-[0.8] contrast-105";
        case "cyber":
          return "contrast-125 hue-rotate-15 saturate-150";
        case "fisheye":
          return "contrast-120 saturate-125";
        case "softglow":
          return "brightness-110 contrast-95 saturate-110";
        case "warmfilm":
          return "sepia-[0.25] contrast-110 saturate-125";
        default:
          return "";
      }
    };

    const completedCount =
      captureMode === "video" ? videoClips.length : photos.length;
    const isSessionComplete = completedCount === activeLayout.count;

    return (
      <div className="w-full flex flex-col gap-6">
        {/* Viewfinder Card */}
        <div className="brutal-card-lg bg-white rounded-lg p-3 sm:p-4 transition-all duration-200">
          {/* Upfront Mode Switcher: FOTO vs VIDEO */}
          <div className="flex items-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 bg-slate-100 rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] mb-3">
            <button
              type="button"
              onClick={() => {
                if (!isCapturing) {
                  setCaptureMode?.("photo");
                  onReset?.();
                }
              }}
              disabled={isCapturing}
              className={`flex-1 py-1.5 px-2 sm:px-3 rounded-md font-mono-retro text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                captureMode === "photo"
                  ? "bg-sky-400 text-slate-900 shadow-[2px_2px_0px_#0f172a]"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>MODE FOTO</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (!isCapturing) {
                  setCaptureMode?.("video");
                  onReset?.();
                }
              }}
              disabled={isCapturing}
              className={`flex-1 py-1.5 px-2 sm:px-3 rounded-md font-mono-retro text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                captureMode === "video"
                  ? "bg-rose-400 text-slate-900 shadow-[2px_2px_0px_#0f172a]"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>MODE VIDEO (10S)</span>
            </button>
          </div>

          {/* Viewfinder Top Bar - Clean single row on all screens */}
          <div className="flex items-center justify-between gap-1 pb-2 mb-2 border-b-2 border-slate-900">
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 border border-slate-900"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 border border-slate-900"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-slate-900"></div>
              <span className="text-[10px] sm:text-xs font-mono-retro font-bold text-slate-800">
                VIEWFINDER.{captureMode === "video" ? "VID" : "REC"}
              </span>
            </div>

            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {/* Quick Toggle: Timer Duration (3s, 5s, 10s) */}
              <button
                type="button"
                onClick={() => {
                  if (isCapturing) return;
                  const next = timerDuration === 3 ? 5 : timerDuration === 5 ? 10 : 3;
                  onTimerDurationChange?.(next);
                }}
                disabled={isCapturing}
                className="px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[11px] font-mono-retro font-bold rounded border-2 border-slate-900 bg-amber-300 hover:bg-amber-400 text-slate-900 shadow-[1.5px_1.5px_0px_#0f172a] active:translate-y-0.5 transition-all flex items-center gap-0.5 sm:gap-1 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                title="Ganti Durasi Hitung Mundur: 3 Detik, 5 Detik, atau 10 Detik"
              >
                <Timer className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[2.5]" />
                <span>⏱️ {timerDuration}S</span>
              </button>

              {/* Quick Toggle: SFX Audio */}
              <button
                type="button"
                onClick={onToggleSound}
                className={`px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[11px] font-mono-retro font-bold rounded border-2 border-slate-900 transition-all flex items-center gap-0.5 sm:gap-1 cursor-pointer whitespace-nowrap ${
                  isSoundEnabled
                    ? "bg-emerald-300 text-slate-900 shadow-[1.5px_1.5px_0px_#0f172a]"
                    : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                }`}
                title="Nyalakan / Matikan Efek Suara Kamera (SFX)"
              >
                {isSoundEnabled ? (
                  <Volume2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[2.5]" />
                ) : (
                  <VolumeX className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[2.5]" />
                )}
                <span><span className="hidden xs:inline">SFX </span>{isSoundEnabled ? "ON" : "OFF"}</span>
              </button>

              {/* Quick Toggle: Screen Ring Light / Flash Simulator */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={onToggleRingLight}
                  className={`px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[11px] font-mono-retro font-bold rounded border-2 border-slate-900 transition-all flex items-center gap-0.5 sm:gap-1 cursor-pointer whitespace-nowrap ${
                    isRingLightOn
                      ? "bg-amber-300 text-slate-900 shadow-[1.5px_1.5px_0px_#0f172a]"
                      : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                  }`}
                  title="Nyalakan / Matikan Layar Ring Light untuk menerangi wajah di ruangan redup"
                >
                  <Lightbulb className={`w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[2.5] ${isRingLightOn ? "text-amber-700 fill-amber-400" : ""}`} />
                  <span><span className="hidden xs:inline">LIGHT </span>{isRingLightOn ? "ON" : "OFF"}</span>
                </button>

                {isRingLightOn && (
                  <div className="flex items-center gap-0.5 bg-slate-900/90 p-0.5 rounded border border-slate-900">
                    <button
                      type="button"
                      onClick={() => onSelectRingLightColor?.("white")}
                      className={`w-3.5 h-3.5 rounded-full border border-slate-900 cursor-pointer ${ringLightColor === "white" ? "scale-125 ring-1 ring-amber-400" : "opacity-75"} bg-white`}
                      title="Cool White Light"
                    />
                    <button
                      type="button"
                      onClick={() => onSelectRingLightColor?.("warm")}
                      className={`w-3.5 h-3.5 rounded-full border border-slate-900 cursor-pointer ${ringLightColor === "warm" ? "scale-125 ring-1 ring-amber-400" : "opacity-75"} bg-amber-200`}
                      title="Warm Golden Light"
                    />
                    <button
                      type="button"
                      onClick={() => onSelectRingLightColor?.("rose")}
                      className={`w-3.5 h-3.5 rounded-full border border-slate-900 cursor-pointer ${ringLightColor === "rose" ? "scale-125 ring-1 ring-amber-400" : "opacity-75"} bg-pink-200`}
                      title="Soft Rose Light"
                    />
                  </div>
                )}
              </div>

              {/* Counter Badge */}
              <span className="text-[9px] sm:text-[11px] font-mono-retro px-1 sm:px-2 py-0.5 rounded bg-sky-100 text-sky-700 font-bold border border-slate-900 whitespace-nowrap">
                {completedCount}/{activeLayout.count}
              </span>
            </div>
          </div>

          {/* Camera Container with optional Luminous Ring Light Frame */}
          <div
            className={`relative aspect-[4/3] w-full rounded-md overflow-hidden border-2 border-slate-900 bg-slate-950 shadow-inner transition-all duration-300 ${
              isRingLightOn
                ? ringLightColor === "warm"
                  ? "ring-4 sm:ring-8 ring-amber-300 shadow-[0_0_35px_rgba(253,224,71,0.85)]"
                  : ringLightColor === "rose"
                    ? "ring-4 sm:ring-8 ring-pink-300 shadow-[0_0_35px_rgba(244,114,182,0.85)]"
                    : "ring-4 sm:ring-8 ring-white shadow-[0_0_40px_rgba(255,255,255,0.95)]"
                : ""
            }`}
          >
            {/* Luminous Inner Glow when Ring Light is Active */}
            {isRingLightOn && (
              <div
                className={`absolute inset-0 pointer-events-none z-10 border-4 sm:border-8 transition-all duration-300 ${
                  ringLightColor === "warm"
                    ? "border-amber-200/60 shadow-[inset_0_0_35px_rgba(254,240,138,0.6)]"
                    : ringLightColor === "rose"
                      ? "border-pink-200/60 shadow-[inset_0_0_35px_rgba(251,207,232,0.6)]"
                      : "border-white/70 shadow-[inset_0_0_35px_rgba(255,255,255,0.7)]"
                }`}
              />
            )}
            <Webcam
              ref={ref}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={{
                facingMode: currentFacingMode,
                width: { ideal: 1280 },
                height: { ideal: 960 },
              }}
              onUserMediaError={handleUserMediaError}
              className={`w-full h-full object-cover transition-all duration-300 ${isMirrored ? "-scale-x-100" : ""} ${getFilterStyle(filter)}`}
            />

            {/* Flash Screen Animation */}
            {isFlashing && (
              <div className="absolute inset-0 bg-white z-30 animate-shutter-flash pointer-events-none" />
            )}

            {/* Active Countdown Overlay */}
            {countdown !== null && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs">
                <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl bg-amber-300 border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] flex items-center justify-center animate-countdown-pop">
                  <span className="font-syne font-black text-4xl sm:text-6xl text-slate-900">
                    {countdown}
                  </span>
                </div>
              </div>
            )}

            {/* Live Video Recording 10s HUD */}
            {isRecordingVideo && (
              <div className="absolute inset-x-0 bottom-3 px-3 sm:px-4 z-20 flex flex-col gap-1.5 items-center">
                <div className="flex items-center justify-between w-full max-w-sm bg-slate-950/90 text-white px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg border-2 border-red-500 shadow-xl">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500 animate-ping"></span>
                    <span className="font-mono-retro text-[10px] sm:text-xs font-bold text-red-400">
                      REC ({videoRecordProgress.toFixed(1)}s / 10.0s)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onStopVideoRecording}
                    className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded bg-red-600 hover:bg-red-500 text-white font-mono-retro text-[9px] sm:text-[10px] font-bold cursor-pointer transition-colors shadow-xs"
                  >
                    STOP
                  </button>
                </div>
                {/* Progress Bar 0 to 10s */}
                <div className="w-full max-w-sm h-2 sm:h-2.5 bg-slate-900/90 rounded-full overflow-hidden border border-slate-700">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 via-rose-500 to-red-600 transition-all duration-100"
                    style={{
                      width: `${Math.min(100, (videoRecordProgress / 10) * 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
            )}

            {/* Viewfinder OSD Overlays (Top) */}
            <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex items-center gap-1 sm:gap-1.5 bg-slate-950/80 text-white px-1.5 sm:px-2 py-0.5 rounded font-mono-retro text-[9px] sm:text-[10px] tracking-wider border border-white/20 z-20">
              <span
                className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${isRecordingVideo ? "bg-red-500 animate-ping" : "bg-red-500 animate-pulse"}`}
              ></span>
              <span>
                {isRecordingVideo ? "REC 10S" : "LIVE // 60FPS"}
              </span>
            </div>

            <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex items-center gap-1 z-20">
              <span className="hidden xs:inline-block bg-slate-950/80 text-amber-400 px-1.5 py-0.5 rounded font-mono-retro text-[9px] sm:text-[10px] tracking-wider border border-white/20">
                ISO 400
              </span>
              <span className="bg-slate-950/80 text-sky-300 px-1.5 py-0.5 rounded font-mono-retro text-[9px] sm:text-[10px] tracking-wider border border-white/20">
                <span className="hidden xs:inline">CAM: </span>{currentFacingMode === "user" ? "FRONT" : "BACK"}
              </span>
              <span
                className={`px-1.5 py-0.5 rounded font-mono-retro text-[9px] sm:text-[10px] tracking-wider border ${
                  isMirrored
                    ? "bg-emerald-950/85 text-emerald-400 font-bold border-emerald-500/40"
                    : "bg-slate-950/80 text-slate-400 border-white/20"
                }`}
              >
                <span className="hidden xs:inline">MIRROR: </span>{isMirrored ? "ON" : "OFF"}
              </span>
            </div>

            <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 bg-slate-950/80 text-slate-300 px-1.5 py-0.5 rounded font-mono-retro text-[9px] sm:text-[10px] border border-white/20 z-20">
              <span className="hidden xs:inline">{currentDateTime}</span>
              <span className="xs:hidden">{currentDateTime.split(" ")[1] || currentDateTime}</span>
            </div>

            {/* Viewfinder OSD Interactive Controls (Bottom Right) */}
            <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 flex items-center gap-1 z-20">
              <button
                type="button"
                onClick={() => setShowGrid((prev) => !prev)}
                className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-mono-retro text-[9px] sm:text-[10px] font-bold border transition-all flex items-center gap-0.5 sm:gap-1 cursor-pointer backdrop-blur-xs ${
                  showGrid
                    ? "bg-amber-400/90 text-slate-950 border-amber-300 shadow-sm"
                    : "bg-slate-950/80 text-slate-300 hover:text-white border-white/20"
                }`}
                title="Nyalakan / Matikan Grid Komposisi"
              >
                <LayoutGrid className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[2.5]" />
                <span><span className="hidden xs:inline">GRID </span>{showGrid ? "ON" : "OFF"}</span>
              </button>

              <button
                type="button"
                onClick={handleToggleFacingMode}
                disabled={isCapturing}
                className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-mono-retro text-[9px] sm:text-[10px] font-bold border border-white/20 bg-slate-950/80 hover:bg-slate-900 text-sky-300 hover:text-sky-200 transition-all flex items-center gap-0.5 sm:gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed backdrop-blur-xs shadow-sm"
                title="Ganti Kamera Depan / Belakang"
              >
                <RefreshCw className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[2.5]" />
                <span>{currentFacingMode === "user" ? "DEP" : "BLK"}</span>
              </button>

              <button
                type="button"
                onClick={onToggleMirror}
                className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-mono-retro text-[9px] sm:text-[10px] font-bold border transition-all flex items-center gap-0.5 sm:gap-1 cursor-pointer backdrop-blur-xs ${
                  isMirrored
                    ? "bg-emerald-400/90 text-slate-950 border-emerald-300 shadow-sm"
                    : "bg-slate-950/80 text-slate-300 hover:text-white border-white/20"
                }`}
                title="Nyalakan / Matikan Mode Mirror (Cermin)"
              >
                <FlipHorizontal2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[2.5]" />
                <span><span className="hidden xs:inline">MIRROR </span>{isMirrored ? "ON" : "OFF"}</span>
              </button>
            </div>

            {/* Viewfinder Composition 3x3 Grid Overlay & Center Alignment Guide */}
            {showGrid ? (
              <div className="absolute inset-0 pointer-events-none z-10 select-none">
                {/* Rule of Thirds Vertical Lines */}
                <div className="absolute top-0 bottom-0 left-1/3 w-px bg-white/35 shadow-[0_0_1px_rgba(0,0,0,0.8)]" />
                <div className="absolute top-0 bottom-0 left-2/3 w-px bg-white/35 shadow-[0_0_1px_rgba(0,0,0,0.8)]" />

                {/* Rule of Thirds Horizontal Lines */}
                <div className="absolute left-0 right-0 top-1/3 h-px bg-white/35 shadow-[0_0_1px_rgba(0,0,0,0.8)]" />
                <div className="absolute left-0 right-0 top-2/3 h-px bg-white/35 shadow-[0_0_1px_rgba(0,0,0,0.8)]" />

                {/* 4 Intersection Crosshairs (+) */}
                <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 text-white/60 font-mono text-xs leading-none">
                  +
                </div>
                <div className="absolute top-1/3 left-2/3 -translate-x-1/2 -translate-y-1/2 text-white/60 font-mono text-xs leading-none">
                  +
                </div>
                <div className="absolute top-2/3 left-1/3 -translate-x-1/2 -translate-y-1/2 text-white/60 font-mono text-xs leading-none">
                  +
                </div>
                <div className="absolute top-2/3 left-2/3 -translate-x-1/2 -translate-y-1/2 text-white/60 font-mono text-xs leading-none">
                  +
                </div>

                {/* Outer Edge Alignment Ticks */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-amber-400/80 shadow-sm" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-amber-400/80 shadow-sm" />
                <div className="absolute top-1/2 left-0 -translate-y-1/2 h-0.5 w-3 bg-amber-400/80 shadow-sm" />
                <div className="absolute top-1/2 right-0 -translate-y-1/2 h-0.5 w-3 bg-amber-400/80 shadow-sm" />

                {/* Center Target Box & Head / Face Center Alignment Guide */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="relative w-20 h-20 sm:w-28 sm:h-28 border border-white/40 rounded-sm flex items-center justify-center">
                    {/* Corner L-Brackets in Amber */}
                    <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-amber-400" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-amber-400" />
                    <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-amber-400" />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-amber-400" />

                    {/* Center Crosshair + Glowing Center Dot */}
                    <div className="w-8 h-8 flex items-center justify-center relative">
                      <div className="absolute w-full h-px bg-amber-400/70" />
                      <div className="absolute h-full w-px bg-amber-400/70" />
                      <div className="w-2.5 h-2.5 bg-amber-400 rounded-full shadow-[0_0_6px_rgba(251,191,36,0.9)] z-10" />
                    </div>
                  </div>
                  {/* Center Label Badge */}
                  <span className="mt-1 font-mono-retro text-[9px] font-bold tracking-widest text-amber-300 bg-slate-950/70 px-1.5 py-0.5 rounded border border-amber-400/30">
                    [ CENTER ]
                  </span>
                </div>
              </div>
            ) : (
              /* Minimal Center Focus Crosshair when Grid is toggled OFF */
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
                <div className="w-10 h-10 border border-white/60 rounded-xs flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
              </div>
            )}
          </div>

          {/* Viewfinder Main Action Buttons */}
          <div className="mt-2.5 sm:mt-4 flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={onStartSession}
              disabled={isCapturing}
              className={`flex-1 min-w-0 brutal-btn py-2.5 sm:py-3.5 px-3 sm:px-6 rounded-md font-syne font-extrabold text-xs sm:text-base tracking-wide flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
                isCapturing
                  ? "bg-amber-400 text-slate-900 cursor-wait"
                  : isSessionComplete
                    ? "bg-emerald-400 text-slate-900 hover:bg-emerald-300"
                    : captureMode === "video"
                      ? "bg-rose-500 hover:bg-rose-400 text-white"
                      : "bg-sky-500 hover:bg-sky-400 text-slate-900"
              }`}
            >
              {captureMode === "video" ? (
                <Video className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5] shrink-0" />
              ) : (
                <Camera className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5] shrink-0" />
              )}
              <span className="truncate">
                {isRecordingVideo
                  ? "SEDANG MEREKAM..."
                  : isCapturing
                    ? "BERSIAP..."
                    : isSessionComplete
                      ? captureMode === "video"
                        ? "REKAM ULANG VIDEO"
                        : "AMBIL FOTO LAGI"
                      : captureMode === "video"
                        ? `MULAI REKAM VIDEO (${activeLayout.count}x10s)`
                        : `MULAI FOTO (${activeLayout.count} POSE)`}
              </span>
            </button>

            {completedCount > 0 && (
              <button
                onClick={onReset}
                disabled={isCapturing}
                className="brutal-btn bg-slate-200 hover:bg-slate-300 text-slate-900 py-2.5 sm:py-3.5 px-2.5 sm:px-4 rounded-md font-mono-retro text-[11px] sm:text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                title="Reset foto"
              >
                <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span>RETAKE</span>
              </button>
            )}

            {isSessionComplete && (
              <>
                {captureMode === "video" ? (
                  <button
                    onClick={onDownloadVideo}
                    disabled={isDownloadingVideo}
                    className="brutal-btn bg-rose-500 hover:bg-rose-400 text-white py-2.5 sm:py-3.5 px-3 sm:px-5 rounded-md font-syne font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer shadow-[3px_3px_0px_#0f172a] shrink-0"
                    title="Unduh video strip MP4"
                  >
                    <Film
                      className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isDownloadingVideo ? "animate-spin" : ""}`}
                    />
                    <span>
                      {isDownloadingVideo
                        ? "MEMBUAT..."
                        : exportFormat === "story"
                          ? "IG STORY (MP4)"
                          : "UNDUH MP4"}
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={onDownload}
                    disabled={isDownloading}
                    className="brutal-btn bg-emerald-400 hover:bg-emerald-300 text-slate-900 py-2.5 sm:py-3.5 px-3 sm:px-5 rounded-md font-syne font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer shadow-[3px_3px_0px_#0f172a] shrink-0"
                    title={
                      exportFormat === "story"
                        ? "Unduh format Instagram Story 9:16"
                        : "Unduh foto PNG"
                    }
                  >
                    <Download
                      className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isDownloading ? "animate-bounce" : ""}`}
                    />
                    <span>
                      {isDownloading
                        ? "MENYIAPKAN..."
                        : exportFormat === "story"
                          ? "IG STORY (PNG)"
                          : "UNDUH PNG"}
                    </span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Side / Bottom Control Drawer - Tactile Tabbed System */}
        <div className="brutal-card bg-white rounded-lg p-2.5 sm:p-5">
          {/* Navigation Tabs (5 Tabs) */}
          <div className="grid grid-cols-5 gap-1 sm:gap-2 mb-3 sm:mb-4 pb-2 sm:pb-3 border-b-2 border-slate-900">
            <button
              onClick={() => setActiveTab("layout")}
              className={`brutal-btn py-1.5 sm:py-2 px-0.5 sm:px-2 rounded font-mono-retro text-[8.5px] sm:text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 cursor-pointer transition-all ${
                activeTab === "layout"
                  ? "bg-sky-400 text-slate-900 shadow-[2px_2px_0px_#0f172a]"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="tracking-tight">LAYOUT</span>
            </button>

            <button
              onClick={() => setActiveTab("frames")}
              className={`brutal-btn py-1.5 sm:py-2 px-0.5 sm:px-2 rounded font-mono-retro text-[8.5px] sm:text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 cursor-pointer transition-all ${
                activeTab === "frames"
                  ? "bg-yellow-300 text-slate-900 shadow-[2px_2px_0px_#0f172a]"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              <Palette className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="tracking-tight">FRAME</span>
            </button>

            <button
              onClick={() => setActiveTab("filter")}
              className={`brutal-btn py-1.5 sm:py-2 px-0.5 sm:px-2 rounded font-mono-retro text-[8.5px] sm:text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 cursor-pointer transition-all ${
                activeTab === "filter"
                  ? "bg-pink-400 text-slate-900 shadow-[2px_2px_0px_#0f172a]"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="tracking-tight">FILTER</span>
            </button>

            <button
              onClick={() => setActiveTab("stamp")}
              className={`brutal-btn py-1.5 sm:py-2 px-0.5 sm:px-2 rounded font-mono-retro text-[8.5px] sm:text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 cursor-pointer transition-all ${
                activeTab === "stamp"
                  ? "bg-emerald-400 text-slate-900 shadow-[2px_2px_0px_#0f172a]"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              <Stamp className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="tracking-tight">STIKER</span>
            </button>

            <button
              onClick={() => setActiveTab("caption")}
              className={`brutal-btn py-1.5 sm:py-2 px-0.5 sm:px-2 rounded font-mono-retro text-[8.5px] sm:text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 cursor-pointer transition-all ${
                activeTab === "caption"
                  ? "bg-violet-400 text-slate-900 shadow-[2px_2px_0px_#0f172a]"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              <Type className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="tracking-tight">TEKS</span>
            </button>
          </div>

          {/* Tab 1: Layout Selection */}
          {activeTab === "layout" && (
            <div className="flex flex-col gap-2 sm:gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-mono-retro font-bold text-slate-800">
                  PILIH FORMAT CETAK PHOTO STRIP:
                </span>
                <span className="text-[10px] sm:text-[11px] font-mono-retro text-slate-500">
                  {activeLayout.subtitle}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
                {LAYOUT_OPTIONS.map((layout) => (
                  <button
                    key={layout.id}
                    onClick={() => {
                      if (!isCapturing) {
                        setActiveLayout(layout);
                        onReset();
                      }
                    }}
                    disabled={isCapturing}
                    className={`brutal-btn p-2 sm:p-3 rounded-lg text-left flex flex-col justify-between cursor-pointer ${
                      activeLayout.id === layout.id
                        ? "bg-sky-200 border-sky-600 shadow-[3px_3px_0px_#0f172a]"
                        : "bg-slate-50 text-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1.5 sm:mb-2">
                      <span className="font-syne font-bold text-xs sm:text-sm text-slate-900 truncate">
                        {layout.name}
                      </span>
                      {activeLayout.id === layout.id && (
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-600 shrink-0 ml-1" />
                      )}
                    </div>
                    <span className="font-mono-retro text-[10px] sm:text-[11px] text-slate-600 truncate">
                      {layout.subtitle} • {layout.count} Foto
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Frame Colors & Styles */}
          {activeTab === "frames" && (
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] sm:text-xs font-mono-retro font-bold text-slate-800">
                    PILIH TEMA FRAME PRESET:
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-mono-retro text-slate-500">
                    {frameStyle.name}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                  {FRAME_STYLES.map((frame) => (
                    <button
                      key={frame.id}
                      onClick={() => {
                        setFrameStyle(frame);
                        setCustomFrameColor?.(null);
                      }}
                      className={`brutal-btn p-2 sm:p-2.5 rounded-lg flex items-center gap-2 sm:gap-2.5 cursor-pointer text-left transition-all ${
                        frameStyle.id === frame.id && !customFrameColor
                          ? "bg-amber-100 border-amber-600 shadow-[3px_3px_0px_#0f172a]"
                          : "bg-slate-50"
                      }`}
                    >
                      <div
                        className="w-6 h-6 sm:w-7 sm:h-7 rounded-md border-2 border-slate-900 shrink-0 shadow-[1.5px_1.5px_0px_#0f172a]"
                        style={{ backgroundColor: frame.swatchColor }}
                      />
                      <div className="overflow-hidden min-w-0">
                        <p className="font-syne font-bold text-[11px] sm:text-xs text-slate-900 truncate">
                          {frame.name}
                        </p>
                        <p className="font-mono-retro text-[9px] sm:text-[10px] text-slate-500 truncate">
                          {frame.subtitle}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Color Palette & Picker */}
              <div className="pt-2.5 sm:pt-3 border-t-2 border-dashed border-slate-300 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] sm:text-xs font-mono-retro font-bold text-slate-800 flex items-center gap-1.5">
                    <span>🎨</span> WARNA CUSTOM STRIP:
                  </span>
                  {customFrameColor && (
                    <button
                      type="button"
                      onClick={() => setCustomFrameColor?.(null)}
                      className="text-[9px] sm:text-[10px] font-mono-retro font-bold text-red-600 hover:underline cursor-pointer"
                    >
                      [ RESET DEFAULT ]
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  {[
                    { hex: "#FFFFFF", label: "Putih" },
                    { hex: "#09090B", label: "Hitam" },
                    { hex: "#FDE047", label: "Kuning" },
                    { hex: "#F472B6", label: "Pink" },
                    { hex: "#38BDF8", label: "Biru" },
                    { hex: "#4ADE80", label: "Hijau" },
                    { hex: "#A78BFA", label: "Ungu" },
                    { hex: "#FB923C", label: "Oranye" },
                  ].map((color) => (
                    <button
                      key={color.hex}
                      type="button"
                      onClick={() => setCustomFrameColor?.(color.hex)}
                      title={color.label}
                      className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md border-2 border-slate-900 transition-all cursor-pointer shadow-[1.5px_1.5px_0px_#0f172a] ${
                        customFrameColor?.toUpperCase() === color.hex.toUpperCase()
                          ? "ring-2 ring-amber-400 scale-110"
                          : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: color.hex }}
                    />
                  ))}

                  {/* Native Color Picker */}
                  <label
                    title="Pilih warna bebas"
                    className="relative flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-md border-2 border-slate-900 bg-gradient-to-tr from-rose-400 via-amber-300 to-sky-400 shadow-[1.5px_1.5px_0px_#0f172a] cursor-pointer hover:scale-105 transition-all overflow-hidden"
                  >
                    <input
                      type="color"
                      value={customFrameColor || "#FFFFFF"}
                      onChange={(e) => setCustomFrameColor?.(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <span className="text-[10px] font-bold text-slate-900 select-none">+</span>
                  </label>

                  {customFrameColor && (
                    <span className="font-mono-retro text-[10px] sm:text-[11px] font-bold uppercase ml-1 text-slate-600">
                      WARNA: {customFrameColor}
                    </span>
                  )}
                </div>
              </div>

              {/* Pola & Tekstur Latar Frame */}
              <div className="pt-2.5 sm:pt-3 border-t-2 border-dashed border-slate-300 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] sm:text-xs font-mono-retro font-bold text-slate-800 flex items-center gap-1.5">
                    <span>🏁</span> POLA & TEKSTUR FRAME:
                  </span>
                  {framePattern !== "none" && (
                    <button
                      type="button"
                      onClick={() => onSelectFramePattern?.("none")}
                      className="text-[9px] sm:text-[10px] font-mono-retro font-bold text-red-600 hover:underline cursor-pointer"
                    >
                      [ POLOS ]
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
                  {FRAME_PATTERNS.map((pat) => (
                    <button
                      key={pat.id}
                      type="button"
                      onClick={() => onSelectFramePattern?.(pat.id)}
                      className={`p-2 rounded-lg border-2 border-slate-900 font-mono-retro text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-[1.5px_1.5px_0px_#0f172a] ${
                        framePattern === pat.id
                          ? "bg-amber-300 text-slate-900 ring-2 ring-slate-900 font-black"
                          : "bg-white hover:bg-slate-100 text-slate-700"
                      }`}
                      title={pat.desc}
                    >
                      <span className="truncate">{pat.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Real-Time Filters */}
          {activeTab === "filter" && (
            <div className="flex flex-col gap-2.5 sm:gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-mono-retro font-bold text-slate-800">
                  REAL-TIME COLOR LOOKUP (LUT):
                </span>
                <span className="text-[10px] sm:text-[11px] font-mono-retro text-slate-500 uppercase">
                  Filter: {filter}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 sm:gap-2 max-h-[360px] overflow-y-auto pr-1">
                {FILTER_OPTIONS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={`brutal-btn p-2 sm:p-2.5 rounded-lg text-left cursor-pointer transition-all ${
                      filter === f.id
                        ? "bg-pink-200 border-pink-500 text-slate-900 shadow-[3px_3px_0px_#0f172a]"
                        : "bg-slate-50 text-slate-800"
                    }`}
                  >
                    <p className="font-syne font-bold text-[11px] sm:text-xs truncate">
                      {f.label}
                    </p>
                    <p className="font-mono-retro text-[9px] sm:text-[10px] text-slate-500 truncate mt-0.5">
                      {f.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: Retro Stamps */}
          {activeTab === "stamp" && (
            <div className="flex flex-col gap-2.5 sm:gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-mono-retro font-bold text-slate-800">
                  PILIH STIKER (MAKS. 4 STIKER):
                </span>
                <span className="text-[10px] sm:text-[11px] font-mono-retro font-bold px-1.5 sm:px-2 py-0.5 rounded bg-amber-200 text-slate-900 border border-slate-900/40">
                  {activeStampsList.length} / 4 TERPILIH
                </span>
              </div>

              <p className="text-[10px] sm:text-[11px] font-mono-retro text-slate-500 -mt-1">
                Klik untuk menambah stiker (bisa stiker yang sama berulang kali, maks 4)
              </p>

              {/* Stiker Bebas Geser (Drag & Drop) Banner */}
              <div className="p-2 sm:p-2.5 rounded-lg bg-amber-50 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-base shrink-0">🖐️</span>
                  <div className="min-w-0">
                    <p className="font-syne font-extrabold text-[11px] sm:text-xs text-slate-900 leading-tight">
                      STIKER BEBAS GESER:
                    </p>
                    <p className="font-mono-retro text-[9px] sm:text-[10px] text-slate-600 truncate">
                      {placedStickers && placedStickers.length > 0
                        ? `${placedStickers.length} stiker tertempel (seret & putar langsung di preview)`
                        : "Tekan tombol '+' pada stiker di bawah untuk menempelkannya"}
                    </p>
                  </div>
                </div>
                {placedStickers && placedStickers.length > 0 && (
                  <button
                    type="button"
                    onClick={onClearPlacedStickers}
                    className="shrink-0 text-[10px] font-mono-retro font-bold text-red-600 hover:underline px-1.5 py-0.5"
                  >
                    Hapus ({placedStickers.length})
                  </button>
                )}
              </div>

              {/* Active Stickers Tray with Remove (X) Chips */}
              {activeStampsList.length > 0 && (
                <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap p-1.5 sm:p-2 rounded-lg bg-slate-100 border border-slate-300">
                  <span className="text-[9px] sm:text-[10px] font-mono-retro font-bold text-slate-500 uppercase mr-0.5">
                    Aktif:
                  </span>
                  {activeStampsList.map((st, idx) => (
                    <button
                      key={`chip-${st.id}-${idx}`}
                      onClick={() => onRemoveStampAt && onRemoveStampAt(idx)}
                      className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md bg-amber-300 text-slate-900 border border-slate-900 text-[11px] font-mono-retro font-bold shadow-xs hover:bg-rose-300 transition-all cursor-pointer"
                      title={`Klik untuk hapus stiker #${idx + 1}`}
                    >
                      <span>{st.sticker || st.symbol || st.icon}</span>
                      <span className="text-[9px] font-mono-retro">
                        #{idx + 1}
                      </span>
                      <span className="text-[9px] ml-0.5 opacity-60 hover:opacity-100 font-black">
                        ✕
                      </span>
                    </button>
                  ))}
                  <button
                    onClick={() => onClearStamps && onClearStamps()}
                    className="ml-auto text-[9px] sm:text-[10px] font-mono-retro text-rose-500 hover:underline font-bold cursor-pointer"
                  >
                    Hapus Semua
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 sm:gap-2 max-h-[360px] overflow-y-auto pr-1">
                {RETRO_STAMPS.map((stamp) => {
                  const count = activeStampsList.filter(
                    (s) => s.id === stamp.id,
                  ).length;
                  const isSelected = count > 0;
                  const isNone = stamp.id === "none";

                  const handleClick = () => {
                    if (onToggleStamp) {
                      onToggleStamp(stamp);
                    } else if (setRetroStamp) {
                      setRetroStamp(stamp);
                    }
                  };

                  return (
                    <div
                      key={stamp.id}
                      className={`brutal-btn p-1.5 sm:p-2 rounded-lg flex items-center justify-between gap-1 transition-all relative ${
                        isNone && activeStampsList.length === 0
                          ? "bg-slate-300 border-slate-900 font-bold"
                          : isSelected
                            ? "bg-amber-300 border-slate-900 text-slate-900 shadow-[3px_3px_0px_#0f172a] font-bold"
                            : "bg-slate-50 text-slate-800"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={handleClick}
                        className="flex-1 text-left min-w-0 flex items-center gap-1 cursor-pointer"
                        title="Klik untuk pasang di sudut frame"
                      >
                        <span className="font-mono-retro text-[11px] sm:text-xs truncate">
                          {stamp.label}
                        </span>
                        {isSelected && !isNone && (
                          <span className="px-1.5 py-0.5 rounded-full bg-slate-900 text-amber-300 font-mono-retro text-[9px] font-black shrink-0">
                            x{count}
                          </span>
                        )}
                      </button>
                      {!isNone && onAddPlacedSticker && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddPlacedSticker(stamp.sticker);
                          }}
                          className="px-1.5 py-0.5 rounded bg-white hover:bg-amber-200 text-slate-900 border border-slate-900 font-mono-retro font-black text-[10px] shadow-xs cursor-pointer shrink-0 transition-transform active:scale-90"
                          title="Tempel stiker bebas geser ke atas strip"
                        >
                          +
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 5: Custom Caption / Teks Pribadi */}
          {activeTab === "caption" && (
            <div className="flex flex-col gap-2.5 sm:gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-mono-retro font-bold text-slate-800">
                  TEKS / CAPTION PRIBADI PADA STRIP:
                </span>
                <span className="text-[10px] sm:text-[11px] font-mono-retro font-bold px-1.5 sm:px-2 py-0.5 rounded bg-violet-200 text-slate-900 border border-slate-900/40">
                  {customCaption?.length || 0} / 32 KARAKTER
                </span>
              </div>

              <p className="text-[10px] sm:text-[11px] font-mono-retro text-slate-500 -mt-1">
                Teks ini akan tercetak langsung di bagian bawah photo strip Anda secara permanen.
              </p>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  maxLength={32}
                  value={customCaption || ""}
                  onChange={(e) => setCustomCaption?.(e.target.value)}
                  placeholder="Ketik teks khusus (misal: DATE NIGHT ♡)..."
                  className="flex-1 px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-mono-retro font-bold uppercase rounded-md border-2 border-slate-900 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 shadow-[2px_2px_0px_#0f172a]"
                />
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date();
                    const d = String(today.getDate()).padStart(2, "0");
                    const m = String(today.getMonth() + 1).padStart(2, "0");
                    const y = today.getFullYear();
                    setCustomCaption?.(`${d}.${m}.${y}`);
                  }}
                  className="brutal-btn px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-md bg-amber-300 hover:bg-amber-400 text-slate-900 text-[11px] sm:text-xs font-mono-retro font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_#0f172a]"
                  title="Gunakan tanggal hari ini sebagai caption"
                >
                  <span>📅 TANGGAL HARI INI</span>
                </button>
                {customCaption && (
                  <button
                    type="button"
                    onClick={() => setCustomCaption?.("")}
                    className="brutal-btn px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-900 text-[11px] sm:text-xs font-mono-retro font-bold flex items-center justify-center cursor-pointer"
                    title="Hapus caption"
                  >
                    HAPUS
                  </button>
                )}
              </div>

              {/* Quick Preset Tags */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[9px] sm:text-[10px] font-mono-retro font-bold text-slate-500">
                  IDE CEPAT:
                </span>
                {[
                  "JAKARTA 2026",
                  "DATE NIGHT ♡",
                  "BESTIES FOREVER",
                  "PHOTO DUMP ★",
                  "MEMORIES TO KEEP",
                  "WEEKEND VIBES",
                ].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setCustomCaption?.(tag)}
                    className="text-[9px] sm:text-[10px] font-mono-retro font-bold px-1.5 sm:px-2 py-0.5 rounded border border-slate-900/40 bg-slate-100 hover:bg-violet-200 text-slate-800 cursor-pointer transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {/* Pilihan Gaya Font Caption */}
              <div className="pt-2.5 sm:pt-3 border-t-2 border-dashed border-slate-300 flex flex-col gap-2">
                <span className="text-[11px] sm:text-xs font-mono-retro font-bold text-slate-800 flex items-center gap-1.5">
                  <span>🔤</span> PILIH GAYA FONT CAPTION:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 sm:gap-2">
                  {CAPTION_FONTS.map((cf) => (
                    <button
                      key={cf.id}
                      type="button"
                      onClick={() => onSelectCaptionFont?.(cf.id)}
                      className={`p-2 rounded-lg border-2 border-slate-900 flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all shadow-[1.5px_1.5px_0px_#0f172a] ${
                        captionFont === cf.id
                          ? "bg-violet-300 text-slate-900 ring-2 ring-slate-900 font-bold"
                          : "bg-white hover:bg-slate-100 text-slate-700"
                      }`}
                      title={cf.desc}
                    >
                      <span className="text-sm" style={{ fontFamily: cf.family }}>
                        Aa
                      </span>
                      <span className="font-mono-retro text-[10px] truncate">
                        {cf.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  },
);

WebcamComponent.displayName = "WebcamComponent";

export default WebcamComponent;
