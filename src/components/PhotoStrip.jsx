import { forwardRef } from "react";
import {
  Camera,
  Download,
  RotateCcw,
  Video,
  Smartphone,
} from "lucide-react";

const PhotoStrip = forwardRef(
  (
    {
      photos = [],
      videoClips = [],
      captureMode = "photo",
      filter = "none",
      activeLayout,
      livePreview,
      frameStyle,
      retroStamp,
      selectedStamps,
      onDownload,
      onDownloadVideo,
      onReset,
      isCapturing,
      isDownloading,
      isDownloadingVideo,
      exportFormat = "story",
      setExportFormat,
    },
    ref,
  ) => {
    const photoCount = activeLayout.count;
    const isCompleted =
      captureMode === "video"
        ? (videoClips?.length || 0) === photoCount
        : photos.length === photoCount;

    // Filter class for video preview
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

    // Active stickers array (1 to 4 stickers)
    const activeStampsList = Array.isArray(selectedStamps)
      ? selectedStamps
      : retroStamp && retroStamp.id !== "none"
        ? [retroStamp]
        : [];

    const renderStickerOverlays = () => {
      const validStickers = activeStampsList
        .filter((s) => s && s.id !== "none")
        .slice(0, 4);
      if (validStickers.length === 0) return null;

      // Position configs for 1 to 4 stickers:
      // Index 0: Top-Right primary
      // Index 1: Top-Right secondary
      // Index 2: Bottom-Left primary
      // Index 3: Bottom-Left secondary
      const posStyles = [
        { top: "-10px", right: "-6px", transform: "rotate(10deg)" },
        { top: "-16px", right: "38px", transform: "rotate(-12deg)" },
        { bottom: "-10px", left: "-6px", transform: "rotate(-8deg)" },
        { bottom: "-16px", left: "38px", transform: "rotate(12deg)" },
      ];

      return (
        <div className="absolute inset-0 z-30 pointer-events-none overflow-visible">
          {validStickers.map((st, idx) => {
            const symbol = st.sticker || st.symbol || st.icon || "";
            if (!symbol) return null;
            const textSymbols = ["★", "✦", "✧", "♡", "☺"];
            const isTextSymbol = textSymbols.includes(symbol);

            return (
              <div
                key={`${st.id}-${idx}`}
                className="absolute transition-all duration-300 pointer-events-none select-none"
                style={posStyles[idx]}
              >
                <span
                  className="text-3xl sm:text-4xl lg:text-[42px] leading-none inline-block filter drop-shadow-[2px_2px_3px_rgba(0,0,0,0.5)] transform hover:scale-110 transition-transform"
                  style={{
                    color: isTextSymbol
                      ? st.id === "smile"
                        ? "#F59E0B"
                        : st.textColor || "#0F172A"
                      : undefined,
                    WebkitTextStroke: isTextSymbol ? "2.5px white" : undefined,
                    paintOrder: "stroke fill",
                  }}
                >
                  {symbol}
                </span>
              </div>
            );
          })}
        </div>
      );
    };

    const renderSlotMedia = (idx, fallbackSlotNumber) => {
      const hasVideo = captureMode === "video" && !!videoClips?.[idx];
      const hasPhoto = captureMode !== "video" && !!photos?.[idx];
      const isCurrentSlot =
        captureMode === "video"
          ? idx === (videoClips?.length || 0) && isCapturing
          : idx === photos.length && isCapturing;

      if (hasVideo) {
        return (
          <video
            src={videoClips[idx]}
            autoPlay
            loop
            muted
            playsInline
            className={`w-full h-full object-cover select-none pointer-events-none transition-all duration-300 ${getFilterStyle(filter)}`}
          />
        );
      }

      if (hasPhoto) {
        return (
          <img
            src={photos[idx]}
            alt={`Foto ${idx + 1}`}
            className="w-full h-full object-cover select-none pointer-events-none"
          />
        );
      }

      if (livePreview && isCurrentSlot) {
        return (
          <div className="relative w-full h-full">
            <img
              src={livePreview}
              alt="Live viewfinder"
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-sky-500/20 flex items-center justify-center">
              <span className="font-mono-retro text-[9px] font-bold bg-slate-950/85 text-white px-1.5 py-0.5 rounded border border-white/40 animate-pulse">
                {captureMode === "video" ? "● MEREKAM..." : "● MEMOTRET..."}
              </span>
            </div>
          </div>
        );
      }

      return (
        <div className="flex flex-col items-center justify-center text-zinc-500 gap-0.5 select-none">
          {captureMode === "video" ? (
            <Video className="w-4 h-4 stroke-1 text-zinc-600" />
          ) : (
            <Camera className="w-4 h-4 stroke-1 text-zinc-600" />
          )}
          <span className="font-mono-retro text-[8px] font-bold">
            #{fallbackSlotNumber ?? idx + 1}
          </span>
        </div>
      );
    };

    // Format today's date for strip stamp
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

    return (
      <div className="w-full flex flex-col items-center gap-4">
        {/* Photo Strip Title & Badge */}
        <div className="w-full flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse-dot"></span>
            <span className="font-syne font-extrabold text-sm text-slate-800 dark:text-slate-200">
              {captureMode === "video" ? "VIDEO STRIP PREVIEW" : "PRINT PREVIEW"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono-retro text-xs font-bold px-2 py-0.5 rounded bg-amber-200 text-slate-900 border border-slate-900 shadow-[2px_2px_0px_#0f172a]">
              {activeLayout.subtitle.toUpperCase()}
            </span>
          </div>
        </div>

        {/* The Printable Strip Container */}
        <div
          ref={ref}
          id="printable-strip-wrapper"
          className="p-3 sm:p-4 bg-transparent inline-block"
        >
          <div
            id="printable-photo-strip"
            className={`w-full ${
              exportFormat === "story" ? "max-w-[340px]" : "max-w-[280px]"
            } bg-white transition-all duration-300 relative border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-xl p-4 sm:p-5 flex flex-col select-none`}
            style={{
              backgroundColor: frameStyle.bgColor,
              color: frameStyle.textColor,
            }}
          >
            {/* Header / Brand Details */}
            {frameStyle.type === "film" ? (
              /* Film Strip Minimal Header */
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-800 font-mono-retro text-[9px] tracking-wider text-zinc-400 select-none">
                <span className="flex items-center gap-1 text-amber-400">
                  ◄ KODAK 400
                </span>
                <span>35MM EXPOSURE // 6-SHOT</span>
                <span>24A ►</span>
              </div>
            ) : frameStyle.type === "win95" ? (
              <div className="flex items-center justify-between px-2.5 py-1.5 bg-gradient-to-r from-[#000080] to-[#1084D0] text-white rounded-t-sm mb-3 font-mono-retro font-bold text-[11px] shadow-sm">
                <div className="flex items-center gap-1.5">
                  <span>📁 PHOTOBOOTH.EXE - [TWIN]</span>
                </div>
              </div>
            ) : (
              /* Standard Retro Header */
              <div
                className="flex items-center justify-between pb-3 mb-3 border-b-2"
                style={{ borderColor: "currentColor", opacity: 0.85 }}
              >
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 border border-slate-900"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 border border-slate-900"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-slate-900"></div>
                </div>
                <span className="font-mono-retro text-[10px] tracking-widest uppercase font-bold">
                  {activeLayout.subtitle}
                </span>
              </div>
            )}

            {/* Photo Grid based on Layout */}
            {activeLayout.id === "9-asym-film" ? (
              <div className="flex w-full items-stretch relative bg-black p-2 rounded-md border-2 border-zinc-800">
                {renderStickerOverlays()}
                <div className="w-3.5 flex flex-col items-center justify-around text-[7px] font-mono-retro font-bold text-amber-500/80 select-none py-2">
                  <span className="transform -rotate-90 whitespace-nowrap">← 1 A</span>
                  <span className="transform -rotate-90 whitespace-nowrap">← 2</span>
                  <span className="transform -rotate-90 whitespace-nowrap">← 2 A</span>
                  <span className="transform -rotate-90 whitespace-nowrap">← 3</span>
                </div>
                <div className="flex-1 flex flex-col gap-1.5 ml-1">
                  {[0, 1, 2, 3].map((idx) => (
                    <div
                      key={idx}
                      className="relative aspect-[4/3] w-full rounded-xs overflow-hidden border border-zinc-800 bg-black shadow-xs flex items-center justify-center"
                    >
                      {renderSlotMedia(idx)}
                      <div className="absolute bottom-0.5 right-0.5 pointer-events-none">
                        <span className="font-mono-retro text-[8px] font-bold px-1 rounded bg-black/80 text-amber-400">
                          → {1 + idx}A
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="w-5 flex flex-col items-center justify-around py-2 border-x border-zinc-800 bg-black text-[7px] font-mono-retro font-bold text-zinc-400 select-none mx-1.5">
                  <span className="transform -rotate-90 tracking-widest text-amber-500 whitespace-nowrap">FILM NEGATIVE</span>
                </div>
                <div className="flex-1 flex flex-col gap-1 mr-1">
                  {[4, 5, 6, 7, 8].map((idx) => (
                    <div
                      key={idx}
                      className="relative aspect-[4/3] w-full rounded-xs overflow-hidden border border-zinc-800 bg-black shadow-xs flex items-center justify-center"
                    >
                      {renderSlotMedia(idx)}
                      <div className="absolute bottom-0.5 right-0.5 pointer-events-none">
                        <span className="font-mono-retro text-[8px] font-bold px-1 rounded bg-black/80 text-amber-400">
                          → {idx - 3}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : activeLayout.id === "5-asym-film" ? (
              <div className="flex w-full items-stretch relative bg-black p-2 rounded-md border-2 border-zinc-800">
                {renderStickerOverlays()}
                <div className="w-3.5 flex flex-col items-center justify-around text-[7px] font-mono-retro font-bold text-amber-500/80 select-none py-2">
                  <span className="transform -rotate-90 whitespace-nowrap">← 1 A</span>
                  <span className="transform -rotate-90 whitespace-nowrap">← 2</span>
                </div>
                <div className="flex-1 flex flex-col gap-1.5 ml-1">
                  {[0, 1].map((idx) => (
                    <div
                      key={idx}
                      className="relative aspect-[2/3] w-full rounded-xs overflow-hidden border border-zinc-800 bg-black shadow-xs flex items-center justify-center"
                    >
                      {renderSlotMedia(idx)}
                      <div className="absolute bottom-0.5 right-0.5 pointer-events-none">
                        <span className="font-mono-retro text-[8px] font-bold px-1 rounded bg-black/80 text-amber-400">
                          → {1 + idx}A
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="w-5 flex flex-col items-center justify-around py-2 border-x border-zinc-800 bg-black text-[7px] font-mono-retro font-bold text-zinc-400 select-none mx-1.5">
                  <span className="transform -rotate-90 tracking-widest text-amber-500 whitespace-nowrap">FILM NEGATIVE</span>
                </div>
                <div className="flex-1 flex flex-col gap-1 mr-1">
                  {[2, 3, 4].map((idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square w-full rounded-xs overflow-hidden border border-zinc-800 bg-black shadow-xs flex items-center justify-center"
                    >
                      {renderSlotMedia(idx)}
                      <div className="absolute bottom-0.5 right-0.5 pointer-events-none">
                        <span className="font-mono-retro text-[8px] font-bold px-1 rounded bg-black/80 text-amber-400">
                          → {idx - 1}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div
                className={`grid gap-3 relative ${
                  activeLayout.cols === 2 ? "grid-cols-2" : "grid-cols-1"
                }`}
              >
                {renderStickerOverlays()}
                {Array.from({ length: photoCount }).map((_, index) => {
                  const aspectClass =
                    activeLayout.aspect === "4/3"
                      ? "aspect-[4/3]"
                      : activeLayout.aspect === "16/9"
                        ? "aspect-[16/9]"
                        : "aspect-square";

                  return (
                    <div
                      key={index}
                      className={`relative ${aspectClass} w-full rounded-md overflow-hidden border-2 border-slate-900 shadow-xs flex items-center justify-center`}
                    >
                      {renderSlotMedia(index)}

                      <div className="absolute bottom-1 right-1 pointer-events-none">
                        <span className="font-mono-retro text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-900/70 text-white backdrop-blur-xs">
                          {frameStyle.type === "film" ? `0${index + 1}A` : `0${index + 1}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Strip Footer Branding & Timestamp */}
            <div
              className="mt-4 pt-3 border-t-2 flex flex-col gap-2"
              style={{ borderColor: "currentColor", opacity: 0.9 }}
            >
              <div className="flex items-center justify-between text-[11px] font-mono-retro font-bold">
                <span>{todayStr}</span>
                <span>{timeStr} WIB</span>
              </div>

              {/* Barcode Deco */}
              <div className="flex items-center justify-between gap-1 pt-1 opacity-80">
                <div className="flex gap-[2px] items-end h-5">
                  <span className="w-[3px] h-full bg-current"></span>
                  <span className="w-[1px] h-3/4 bg-current"></span>
                  <span className="w-[4px] h-full bg-current"></span>
                  <span className="w-[1px] h-1/2 bg-current"></span>
                  <span className="w-[2px] h-full bg-current"></span>
                  <span className="w-[5px] h-full bg-current"></span>
                  <span className="w-[2px] h-2/3 bg-current"></span>
                  <span className="w-[3px] h-full bg-current"></span>
                  <span className="w-[1px] h-3/4 bg-current"></span>
                  <span className="w-[4px] h-full bg-current"></span>
                </div>
                <span className="font-mono-retro text-[8px] tracking-widest font-black uppercase">
                  #PHOTOBOOTH-{activeLayout.id.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls when Completed */}
        {isCompleted && (
          <div className="w-full max-w-[340px] flex flex-col gap-3">
            {/* Format Export Selector */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono-retro font-bold text-slate-600 dark:text-slate-400">
                <span>FORMAT UNDUHAN:</span>
                <span className="text-amber-500 dark:text-amber-400 font-extrabold">
                  {exportFormat === "story" ? "IG STORY (1080x1920)" : "STRIP PAS"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-slate-200 dark:bg-slate-900 border border-slate-900">
                <button
                  type="button"
                  onClick={() => setExportFormat?.("story")}
                  className={`py-1.5 px-2 rounded-md font-mono-retro text-[11px] font-extrabold flex items-center justify-center gap-1 cursor-pointer transition-all ${
                    exportFormat === "story"
                      ? "bg-amber-300 text-slate-900 shadow-[2px_2px_0px_#0f172a] border border-slate-900"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>📱 STORY (9:16)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setExportFormat?.("strip")}
                  className={`py-1.5 px-2 rounded-md font-mono-retro text-[11px] font-extrabold flex items-center justify-center gap-1 cursor-pointer transition-all ${
                    exportFormat === "strip"
                      ? "bg-amber-300 text-slate-900 shadow-[2px_2px_0px_#0f172a] border border-slate-900"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>■ STRIP</span>
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              {captureMode === "video" ? (
                /* Download MP4 Video Button */
                <button
                  onClick={onDownloadVideo}
                  disabled={isDownloadingVideo}
                  className="flex-1 brutal-btn bg-rose-400 hover:bg-rose-300 text-slate-900 py-3.5 px-3 rounded-lg font-syne font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-[3px_3px_0px_#0f172a]"
                >
                  <Video
                    className={`w-4 h-4 stroke-[2.5] ${isDownloadingVideo ? "animate-spin" : ""}`}
                  />
                  {isDownloadingVideo ? "MEMBUAT..." : "UNDUH MP4"}
                </button>
              ) : (
                /* Download PNG Button */
                <button
                  onClick={onDownload}
                  disabled={isDownloading}
                  className="flex-1 brutal-btn bg-emerald-400 hover:bg-emerald-300 text-slate-900 py-3.5 px-3 rounded-lg font-syne font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-[3px_3px_0px_#0f172a]"
                >
                  <Download
                    className={`w-4 h-4 stroke-[2.5] ${isDownloading ? "animate-bounce" : ""}`}
                  />
                  {isDownloading ? "MENYIAPKAN..." : "UNDUH PNG"}
                </button>
              )}

              {/* Retake Button */}
              <button
                onClick={onReset}
                disabled={isDownloading || isDownloadingVideo}
                className="brutal-btn bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 py-3 px-3.5 rounded-lg font-mono-retro text-xs font-bold flex items-center justify-center cursor-pointer shadow-[2px_2px_0px_#0f172a]"
                title={captureMode === "video" ? "Rekam Ulang Video" : "Foto Ulang"}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  },
);

PhotoStrip.displayName = "PhotoStrip";

export default PhotoStrip;
