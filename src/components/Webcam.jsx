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
} from "lucide-react";
import {
  FRAME_STYLES,
  LAYOUT_OPTIONS,
  FILTER_OPTIONS,
  RETRO_STAMPS,
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
    },
    ref,
  ) => {
    const [currentDateTime, setCurrentDateTime] = useState("");

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
        <div className="brutal-card-lg bg-white dark:bg-slate-900 rounded-lg p-3 sm:p-4 transition-all duration-200">
          {/* Upfront Mode Switcher: FOTO vs VIDEO */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] mb-3">
            <button
              type="button"
              onClick={() => {
                if (!isCapturing) {
                  setCaptureMode?.("photo");
                  onReset?.();
                }
              }}
              disabled={isCapturing}
              className={`flex-1 py-1.5 px-3 rounded-md font-mono-retro text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                captureMode === "photo"
                  ? "bg-sky-400 text-slate-900 shadow-[2px_2px_0px_#0f172a]"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>📷 MODE FOTO</span>
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
              className={`flex-1 py-1.5 px-3 rounded-md font-mono-retro text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                captureMode === "video"
                  ? "bg-rose-400 text-slate-900 shadow-[2px_2px_0px_#0f172a]"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Video className="w-4 h-4" />
              <span>🎥 MODE VIDEO (10S)</span>
            </button>
          </div>

          {/* Viewfinder Top Bar */}
          <div className="flex items-center justify-between pb-3 mb-2 border-b-2 border-slate-900 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 border border-slate-900"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400 border border-slate-900"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500 border border-slate-900"></div>
              <span className="text-xs font-mono-retro font-bold ml-1 text-slate-800 dark:text-slate-200">
                VIEWFINDER.{captureMode === "video" ? "VIDEO" : "REC"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono-retro px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-900 dark:border-slate-600">
                {captureMode === "video" ? "VIDEO 10S" : "PHOTO"}
              </span>
              <span className="text-[11px] font-mono-retro px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold border border-slate-900 dark:border-slate-600">
                {completedCount}/{activeLayout.count}
              </span>
            </div>
          </div>

          {/* Camera Container */}
          <div className="relative aspect-[4/3] w-full rounded-md overflow-hidden border-2 border-slate-900 dark:border-slate-700 bg-slate-950 shadow-inner">
            <Webcam
              ref={ref}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={{
                facingMode: "user",
                width: { ideal: 1280 },
                height: { ideal: 960 },
              }}
              className={`w-full h-full object-cover -scale-x-100 transition-all duration-300 ${getFilterStyle(filter)}`}
            />

            {/* Flash Screen Animation */}
            {isFlashing && (
              <div className="absolute inset-0 bg-white z-30 animate-shutter-flash pointer-events-none" />
            )}

            {/* Active Countdown Overlay */}
            {countdown !== null && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-amber-300 border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] flex items-center justify-center animate-countdown-pop">
                  <span className="font-syne font-black text-5xl sm:text-6xl text-slate-900">
                    {countdown}
                  </span>
                </div>
              </div>
            )}

            {/* Live Video Recording 10s HUD */}
            {isRecordingVideo && (
              <div className="absolute inset-x-0 bottom-3 px-4 z-20 flex flex-col gap-1.5 items-center">
                <div className="flex items-center justify-between w-full max-w-sm bg-slate-950/90 text-white px-3 py-2 rounded-lg border-2 border-red-500 shadow-xl">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500 animate-ping"></span>
                    <span className="font-mono-retro text-xs font-bold text-red-400">
                      MEREKAM ({videoRecordProgress.toFixed(1)}s / 10.0s)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onStopVideoRecording}
                    className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-mono-retro text-[10px] font-bold cursor-pointer transition-colors shadow-xs"
                  >
                    SELESAI (STOP)
                  </button>
                </div>
                {/* Progress Bar 0 to 10s */}
                <div className="w-full max-w-sm h-2.5 bg-slate-900/90 rounded-full overflow-hidden border border-slate-700">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 via-rose-500 to-red-600 transition-all duration-100"
                    style={{
                      width: `${Math.min(100, (videoRecordProgress / 10) * 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
            )}

            {/* Viewfinder OSD Overlays */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-slate-950/80 text-white px-2 py-0.5 rounded font-mono-retro text-[10px] tracking-wider border border-white/20">
              <span
                className={`w-2 h-2 rounded-full ${isRecordingVideo ? "bg-red-500 animate-ping" : "bg-red-500 animate-pulse"}`}
              ></span>
              <span>
                {isRecordingVideo ? "RECORDING 10S" : "LIVE // 60FPS"}
              </span>
            </div>

            <div className="absolute top-3 right-3 bg-slate-950/80 text-amber-400 px-2 py-0.5 rounded font-mono-retro text-[10px] tracking-wider border border-white/20">
              <span>ISO 400</span>
            </div>

            <div className="absolute bottom-3 left-3 bg-slate-950/80 text-slate-300 px-2 py-0.5 rounded font-mono-retro text-[10px] border border-white/20">
              <span>{currentDateTime}</span>
            </div>

            {/* Viewfinder Focus Crosshair Target */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
              <div className="w-12 h-12 border-2 border-white rounded-md flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Viewfinder Main Action Buttons */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={onStartSession}
              disabled={isCapturing}
              className={`flex-1 min-w-[200px] brutal-btn py-3.5 px-6 rounded-md font-syne font-extrabold text-base tracking-wide flex items-center justify-center gap-2 cursor-pointer ${
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
                <Video className="w-5 h-5 stroke-[2.5]" />
              ) : (
                <Camera className="w-5 h-5 stroke-[2.5]" />
              )}
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
            </button>

            {completedCount > 0 && (
              <button
                onClick={onReset}
                disabled={isCapturing}
                className="brutal-btn bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 py-3.5 px-4 rounded-md font-mono-retro text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                title="Reset foto"
              >
                <RotateCcw className="w-4 h-4" />
                RETAKE
              </button>
            )}

            {isSessionComplete && (
              <>
                {captureMode === "video" ? (
                  <button
                    onClick={onDownloadVideo}
                    disabled={isDownloadingVideo}
                    className="brutal-btn bg-rose-400 hover:bg-rose-300 text-slate-900 py-3.5 px-4 rounded-md font-mono-retro text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-[3px_3px_0px_#0f172a]"
                    title="Unduh video MP4"
                  >
                    <Video
                      className={`w-4 h-4 ${isDownloadingVideo ? "animate-spin" : ""}`}
                    />
                    {isDownloadingVideo ? "MEMBUAT MP4..." : "UNDUH .MP4"}
                  </button>
                ) : (
                  <button
                    onClick={onDownload}
                    disabled={isDownloading}
                    className="brutal-btn bg-emerald-400 hover:bg-emerald-300 text-slate-900 py-3.5 px-4 rounded-md font-mono-retro text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-[3px_3px_0px_#0f172a]"
                    title={
                      exportFormat === "story"
                        ? "Unduh frame Instagram Story 1080x1920 (PNG)"
                        : "Unduh foto PNG"
                    }
                  >
                    <Download
                      className={`w-4 h-4 ${isDownloading ? "animate-bounce" : ""}`}
                    />
                    {isDownloading
                      ? "MENYIAPKAN..."
                      : exportFormat === "story"
                        ? "IG STORY (PNG)"
                        : "UNDUH PNG"}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Side / Bottom Control Drawer - Tactile Tabbed System */}
        <div className="brutal-card bg-white dark:bg-slate-900 rounded-lg p-4 sm:p-5">
          {/* Navigation Tabs */}
          <div className="grid grid-cols-4 gap-2 mb-4 pb-3 border-b-2 border-slate-900 dark:border-slate-700">
            <button
              onClick={() => setActiveTab("layout")}
              className={`brutal-btn py-2 px-2 rounded font-mono-retro text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "layout"
                  ? "bg-sky-400 text-slate-900 shadow-[2px_2px_0px_#0f172a]"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">LAYOUT</span>
            </button>

            <button
              onClick={() => setActiveTab("frames")}
              className={`brutal-btn py-2 px-2 rounded font-mono-retro text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "frames"
                  ? "bg-yellow-300 text-slate-900 shadow-[2px_2px_0px_#0f172a]"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">FRAME</span>
            </button>

            <button
              onClick={() => setActiveTab("filter")}
              className={`brutal-btn py-2 px-2 rounded font-mono-retro text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "filter"
                  ? "bg-pink-400 text-slate-900 shadow-[2px_2px_0px_#0f172a]"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">FILTER</span>
            </button>

            <button
              onClick={() => setActiveTab("stamp")}
              className={`brutal-btn py-2 px-2 rounded font-mono-retro text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "stamp"
                  ? "bg-emerald-400 text-slate-900 shadow-[2px_2px_0px_#0f172a]"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              }`}
            >
              <Stamp className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">STIKER</span>
            </button>
          </div>

          {/* Tab 1: Layout Selection */}
          {activeTab === "layout" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono-retro font-bold text-slate-800 dark:text-slate-200">
                  PILIH FORMAT CETAK PHOTO STRIP:
                </span>
                <span className="text-[11px] font-mono-retro text-slate-500 dark:text-slate-400">
                  {activeLayout.subtitle}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
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
                    className={`brutal-btn p-3 rounded-lg text-left flex flex-col justify-between cursor-pointer ${
                      activeLayout.id === layout.id
                        ? "bg-sky-200 dark:bg-sky-900/60 border-sky-600 dark:border-sky-400 shadow-[4px_4px_0px_#0f172a] dark:shadow-[4px_4px_0px_#38bdf8]"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <span className="font-syne font-bold text-sm text-slate-900 dark:text-slate-100">
                        {layout.name}
                      </span>
                      {activeLayout.id === layout.id && (
                        <CheckCircle2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                      )}
                    </div>
                    <span className="font-mono-retro text-[11px] text-slate-600 dark:text-slate-400">
                      {layout.subtitle} • {layout.count} Foto
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Frame Colors & Styles */}
          {activeTab === "frames" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono-retro font-bold text-slate-800 dark:text-slate-200">
                  PILIH WARNA BORDER & TEMA FRAME:
                </span>
                <span className="text-[11px] font-mono-retro text-slate-500 dark:text-slate-400">
                  {frameStyle.name}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {FRAME_STYLES.map((frame) => (
                  <button
                    key={frame.id}
                    onClick={() => setFrameStyle(frame)}
                    className={`brutal-btn p-2.5 rounded-lg flex items-center gap-2.5 cursor-pointer text-left transition-all ${
                      frameStyle.id === frame.id
                        ? "bg-amber-100 dark:bg-amber-950/60 border-amber-600 shadow-[4px_4px_0px_#0f172a] dark:shadow-[4px_4px_0px_#fde047]"
                        : "bg-slate-50 dark:bg-slate-800"
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-md border-2 border-slate-900 flex-shrink-0 shadow-[2px_2px_0px_#0f172a]"
                      style={{ backgroundColor: frame.swatchColor }}
                    />
                    <div className="overflow-hidden">
                      <p className="font-syne font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {frame.name}
                      </p>
                      <p className="font-mono-retro text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {frame.subtitle}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Real-Time Filters */}
          {activeTab === "filter" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono-retro font-bold text-slate-800 dark:text-slate-200">
                  REAL-TIME COLOR LOOKUP (LUT):
                </span>
                <span className="text-[11px] font-mono-retro text-slate-500 dark:text-slate-400 uppercase">
                  Filter: {filter}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[360px] overflow-y-auto pr-1">
                {FILTER_OPTIONS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={`brutal-btn p-2.5 rounded-lg text-left cursor-pointer transition-all ${
                      filter === f.id
                        ? "bg-pink-200 dark:bg-pink-950/60 border-pink-500 text-slate-900 dark:text-slate-100 shadow-[3px_3px_0px_#0f172a] dark:shadow-[3px_3px_0px_#f472b6]"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-300"
                    }`}
                  >
                    <p className="font-syne font-bold text-xs truncate">
                      {f.label}
                    </p>
                    <p className="font-mono-retro text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {f.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: Retro Stamps */}
          {activeTab === "stamp" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono-retro font-bold text-slate-800 dark:text-slate-200">
                  PILIH STIKER (MAKS. 4 STIKER):
                </span>
                <span className="text-[11px] font-mono-retro font-bold px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-950 text-slate-900 dark:text-amber-300 border border-slate-900/40">
                  {activeStampsList.length} / 4 TERPILIH
                </span>
              </div>

              <p className="text-[11px] font-mono-retro text-slate-500 dark:text-slate-400 -mt-1.5">
                Klik untuk menambah stiker (bisa stiker yang sama berulang kali,
                maks 4)
              </p>

              {/* Active Stickers Tray with Remove (X) Chips */}
              {activeStampsList.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap p-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700">
                  <span className="text-[10px] font-mono-retro font-bold text-slate-500 uppercase mr-1">
                    Aktif:
                  </span>
                  {activeStampsList.map((st, idx) => (
                    <button
                      key={`chip-${st.id}-${idx}`}
                      onClick={() => onRemoveStampAt && onRemoveStampAt(idx)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-300 dark:bg-amber-400 text-slate-900 border border-slate-900 text-xs font-mono-retro font-bold shadow-xs hover:bg-rose-300 dark:hover:bg-rose-400 transition-all cursor-pointer"
                      title={`Klik untuk hapus stiker #${idx + 1}`}
                    >
                      <span>{st.sticker || st.symbol || st.icon}</span>
                      <span className="text-[10px] font-mono-retro">
                        #{idx + 1}
                      </span>
                      <span className="text-[10px] ml-0.5 opacity-60 hover:opacity-100 font-black">
                        ✕
                      </span>
                    </button>
                  ))}
                  <button
                    onClick={() => onClearStamps && onClearStamps()}
                    className="ml-auto text-[10px] font-mono-retro text-rose-500 dark:text-rose-400 hover:underline font-bold cursor-pointer"
                  >
                    Hapus Semua
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[360px] overflow-y-auto pr-1">
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
                    <button
                      key={stamp.id}
                      onClick={handleClick}
                      className={`brutal-btn p-2.5 rounded-lg flex items-center justify-between gap-1.5 text-left cursor-pointer transition-all relative ${
                        isNone && activeStampsList.length === 0
                          ? "bg-slate-300 dark:bg-slate-700 border-slate-900 font-bold"
                          : isSelected
                            ? "bg-amber-300 dark:bg-amber-400 border-slate-900 text-slate-900 shadow-[3px_3px_0px_#0f172a] font-bold"
                            : "bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-300"
                      }`}
                    >
                      <span className="font-mono-retro text-xs truncate flex items-center gap-1.5">
                        {stamp.label}
                      </span>
                      {isSelected && !isNone && (
                        <span className="px-1.5 py-0.5 rounded-full bg-slate-900 text-amber-300 font-mono-retro text-[10px] font-black flex items-center justify-center flex-shrink-0 shadow-xs">
                          x{count}
                        </span>
                      )}
                    </button>
                  );
                })}
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
