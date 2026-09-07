import { forwardRef, useState, useRef } from "react";
import {
  Camera,
  Download,
  RotateCcw,
  Video,
  Smartphone,
  Share2,
  Trash2,
  Sparkles,
} from "lucide-react";

// Interactive Draggable Sticker Component
function DraggableSticker({
  sticker,
  isSelected,
  onSelect,
  onUpdate,
  onRemove,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({
    pointerX: 0,
    pointerY: 0,
    initialX: sticker.x,
    initialY: sticker.y,
  });

  const handlePointerDown = (e) => {
    e.stopPropagation();
    onSelect?.();
    setIsDragging(true);

    const parent = e.currentTarget.closest("#printable-photo-strip");
    if (!parent) return;
    const rect = parent.getBoundingClientRect();

    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      initialX: sticker.x,
      initialY: sticker.y,
      parentWidth: rect.width,
      parentHeight: rect.height,
    };

    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const {
      pointerX,
      pointerY,
      initialX,
      initialY,
      parentWidth,
      parentHeight,
    } = dragStartRef.current;
    if (!parentWidth || !parentHeight) return;

    const deltaX = ((e.clientX - pointerX) / parentWidth) * 100;
    const deltaY = ((e.clientY - pointerY) / parentHeight) * 100;

    const newX = Math.max(
      5,
      Math.min(95, Math.round((initialX + deltaX) * 10) / 10),
    );
    const newY = Math.max(
      5,
      Math.min(95, Math.round((initialY + deltaY) * 10) / 10),
    );

    onUpdate({ x: newX, y: newY });
  };

  const handlePointerUp = (e) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  const scale = sticker.scale || 1;
  const rotation = sticker.rotation || 0;

  return (
    <div
      className="draggable-sticker-item absolute pointer-events-auto touch-none select-none group"
      style={{
        left: `${sticker.x}%`,
        top: `${sticker.y}%`,
        transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`,
        zIndex: isSelected ? 45 : 35,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.();
      }}
    >
      <div className="relative flex items-center justify-center p-1 cursor-grab active:cursor-grabbing">
        <span className="text-3xl sm:text-4xl leading-none inline-block filter drop-shadow-[2px_2px_4px_rgba(0,0,0,0.4)]">
          {sticker.sticker}
        </span>

        {isSelected && (
          <div className="absolute -inset-1 border-2 border-dashed border-amber-400 rounded-lg pointer-events-none animate-pulse" />
        )}

        {isSelected && (
          <div
            className="absolute -top-9 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-900 text-white px-1.5 py-0.5 rounded-md border border-white/20 shadow-lg text-[10px] font-mono font-bold z-50 whitespace-nowrap"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUpdate({
                  scale: Math.max(0.5, Math.round((scale - 0.2) * 10) / 10),
                });
              }}
              className="px-1 py-0.5 hover:bg-slate-700 rounded text-amber-300"
              title="Perkecil"
            >
              -
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUpdate({
                  scale: Math.min(2.5, Math.round((scale + 0.2) * 10) / 10),
                });
              }}
              className="px-1 py-0.5 hover:bg-slate-700 rounded text-amber-300"
              title="Perbesar"
            >
              +
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUpdate({ rotation: (rotation + 25) % 360 });
              }}
              className="px-1 py-0.5 hover:bg-slate-700 rounded text-sky-300"
              title="Putar"
            >
              ⟳
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="px-1 py-0.5 hover:bg-red-700 rounded text-rose-400"
              title="Hapus"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const getPatternStyle = (pat) => {
  if (pat === "checkerboard") {
    return {
      backgroundImage:
        "linear-gradient(45deg, rgba(15,23,42,0.08) 25%, transparent 25%), linear-gradient(-45deg, rgba(15,23,42,0.08) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(15,23,42,0.08) 75%), linear-gradient(-45deg, transparent 75%, rgba(15,23,42,0.08) 75%)",
      backgroundSize: "20px 20px",
      backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
    };
  }
  if (pat === "polkadot") {
    return {
      backgroundImage:
        "radial-gradient(rgba(15,23,42,0.12) 18%, transparent 19%)",
      backgroundSize: "18px 18px",
    };
  }
  if (pat === "stripes") {
    return {
      backgroundImage:
        "repeating-linear-gradient(45deg, rgba(15,23,42,0.07), rgba(15,23,42,0.07) 10px, transparent 10px, transparent 20px)",
    };
  }
  if (pat === "gridnotebook") {
    return {
      backgroundImage:
        "linear-gradient(rgba(15,23,42,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.1) 1px, transparent 1px)",
      backgroundSize: "16px 16px",
    };
  }
  if (pat === "hearts") {
    return {
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='rgba(225,29,72,0.18)'%3E%3Cpath d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'/%3E%3C/svg%3E")`,
      backgroundSize: "32px 32px",
    };
  }
  if (pat === "stars") {
    return {
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 24 24' fill='rgba(15,23,42,0.14)'%3E%3Cpath d='M12 0L14 9L23 12L14 15L12 24L10 15L1 12L10 9Z'/%3E%3C/svg%3E")`,
      backgroundSize: "36px 36px",
    };
  }
  if (pat === "sparkles") {
    return {
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='rgba(15,23,42,0.16)'%3E%3Cpath d='M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z'/%3E%3C/svg%3E")`,
      backgroundSize: "32px 32px",
    };
  }
  if (pat === "clouds") {
    return {
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='42' height='42' viewBox='0 0 24 24' fill='rgba(2,132,199,0.15)'%3E%3Cpath d='M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z'/%3E%3C/svg%3E")`,
      backgroundSize: "42px 42px",
    };
  }
  if (pat === "halftone") {
    return {
      backgroundImage:
        "radial-gradient(circle, rgba(15,23,42,0.16) 2.5px, transparent 3px)",
      backgroundSize: "12px 12px",
    };
  }
  if (pat === "filmgrain") {
    return {
      backgroundImage: `radial-gradient(rgba(0,0,0,0.15) 1px, transparent 1px), radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)`,
      backgroundSize: "4px 4px",
      backgroundPosition: "0 0, 2px 2px",
    };
  }
  return {};
};

const getCaptionFontFamily = (fId) => {
  if (fId === "digital") return "'VT323', monospace";
  if (fId === "typewriter") return "'Special Elite', cursive";
  if (fId === "cursive") return "'Caveat', cursive";
  if (fId === "bubble") return "'Fredoka', sans-serif";
  if (fId === "pixel") return "'Press Start 2P', cursive";
  if (fId === "serif") return "'Playfair Display', serif";
  if (fId === "marker") return "'Permanent Marker', cursive";
  if (fId === "korean") return "'Gaegu', cursive";
  if (fId === "brutal") return "'Rubik Mono One', sans-serif";
  return "'IBM Plex Mono', monospace";
};

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
      onDownloadGif,
      onDownloadStopMotionVideo,
      onReset,
      onShare,
      isCapturing,
      isDownloading,
      isDownloadingVideo,
      isDownloadingGif = false,
      isDownloadingStopMotion = false,
      exportFormat = "story",
      setExportFormat,
      isMirrored = true,
      customCaption = "",
      customFrameColor = null,
      framePattern = "none",
      captionFont = "mono",
      placedStickers = [],
      onUpdatePlacedSticker,
      onRemovePlacedSticker,
      onClearPlacedStickers,
      showDateStamp = false,
      dateStampText = "",
      onRetakePose = null,
    },
    ref,
  ) => {
    const photoCount = activeLayout.count;
    const isCompleted =
      captureMode === "video"
        ? (videoClips?.length || 0) === photoCount
        : photos.length === photoCount;

    const [selectedStickerId, setSelectedStickerId] = useState(null);

    // Filter class for video preview
    const getFilterStyle = (f) => {
      switch (f) {
        case "lightleak":
          return "contrast-115 brightness-110 saturate-135 sepia-[0.2]";
        case "filmgrain":
          return "contrast-115 brightness-105 saturate-110 sepia-[0.15]";
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
          <div className="relative w-full h-full overflow-hidden">
            <video
              src={videoClips[idx]}
              autoPlay
              loop
              muted
              playsInline
              className={`w-full h-full object-cover select-none pointer-events-none transition-all duration-300 ${isMirrored ? "-scale-x-100" : ""} ${getFilterStyle(filter)}`}
            />
            {filter === "lightleak" && (
              <div
                className="absolute inset-0 pointer-events-none z-10"
                style={{
                  background:
                    "radial-gradient(circle at 0% 0%, rgba(255, 125, 40, 0.45) 0%, rgba(255, 175, 60, 0.28) 35%, rgba(255, 90, 120, 0.12) 65%, transparent 85%)",
                  mixBlendMode: "screen",
                }}
              />
            )}
            {filter === "filmgrain" && (
              <div
                className="absolute inset-0 pointer-events-none z-10 opacity-30 mix-blend-overlay"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
              />
            )}
            {/* Vintage Digicam Orange Quartz Date Stamp */}
            {showDateStamp && (
              <div className="absolute bottom-1 right-1.5 z-20 pointer-events-none select-none font-mono text-[9px] sm:text-[11px] font-bold tracking-widest text-[#FF7A00] drop-shadow-[0_0_2px_#ff3300] [text-shadow:0_0_4px_#ff4500]">
                {dateStampText || "'26 09 07"}
              </div>
            )}
          </div>
        );
      }

      if (hasPhoto) {
        return (
          <div className="group relative w-full h-full overflow-hidden">
            <img
              src={photos[idx]}
              alt={`Foto ${idx + 1}`}
              className="w-full h-full object-cover select-none pointer-events-none"
            />
            {filter === "lightleak" && (
              <div
                className="absolute inset-0 pointer-events-none z-10"
                style={{
                  background:
                    "radial-gradient(circle at 0% 0%, rgba(255, 125, 40, 0.45) 0%, rgba(255, 175, 60, 0.28) 35%, rgba(255, 90, 120, 0.12) 65%, transparent 85%)",
                  mixBlendMode: "screen",
                }}
              />
            )}
            {filter === "filmgrain" && (
              <div
                className="absolute inset-0 pointer-events-none z-10 opacity-30 mix-blend-overlay"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
              />
            )}
            {/* Vintage Digicam Orange Quartz Date Stamp */}
            {showDateStamp && (
              <div className="absolute bottom-1 right-1.5 z-20 pointer-events-none select-none font-mono text-[9px] sm:text-[11px] font-bold tracking-widest text-[#FF7A00] drop-shadow-[0_0_2px_#ff3300] [text-shadow:0_0_4px_#ff4500]">
                {dateStampText || "'26 09 07"}
              </div>
            )}
            {/* Interactive Retake Pose Button */}
            {onRetakePose && !isCapturing && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRetakePose(idx);
                }}
                className="absolute top-1 right-1 z-30 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity bg-slate-900/90 hover:bg-amber-400 text-white hover:text-slate-950 px-1.5 py-0.5 rounded border border-slate-600 hover:border-slate-900 font-mono-retro text-[8px] sm:text-[9px] font-bold flex items-center gap-1 shadow cursor-pointer"
                title={`Ambil ulang pose #${idx + 1}`}
              >
                <RotateCcw className="w-2.5 h-2.5 stroke-[2.5]" />
                <span>ULANG</span>
              </button>
            )}
          </div>
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
            <span className="font-syne font-extrabold text-sm text-slate-800">
              {captureMode === "video"
                ? "VIDEO STRIP PREVIEW"
                : "PRINT PREVIEW"}
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
            } bg-white transition-all duration-300 relative border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-xl p-4 sm:p-5 flex flex-col select-none overflow-hidden`}
            style={{
              backgroundColor: customFrameColor || frameStyle.bgColor,
              color: frameStyle.textColor,
              ...getPatternStyle(framePattern),
            }}
            onPointerDown={(e) => {
              if (!e.target.closest(".draggable-sticker-item")) {
                setSelectedStickerId(null);
              }
            }}
          >
            {/* Interactive Draggable Stamped Stickers */}
            {placedStickers && placedStickers.length > 0 && (
              <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
                {placedStickers.map((stk) => (
                  <DraggableSticker
                    key={stk.id}
                    sticker={stk}
                    isSelected={selectedStickerId === stk.id}
                    onSelect={() => setSelectedStickerId(stk.id)}
                    onUpdate={(updates) =>
                      onUpdatePlacedSticker?.(stk.id, updates)
                    }
                    onRemove={() => onRemovePlacedSticker?.(stk.id)}
                  />
                ))}
              </div>
            )}
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
                <div className="w-3.5 flex flex-col items-center justify-around text-[7px] font-mono-retro font-bold text-amber-500/80 select-none py-2 shrink-0">
                  <span className="transform -rotate-90 whitespace-nowrap">
                    ← COVER
                  </span>
                  <span className="transform -rotate-90 whitespace-nowrap">
                    ← 02 A
                  </span>
                  <span className="transform -rotate-90 whitespace-nowrap">
                    ← 03 A
                  </span>
                  <span className="transform -rotate-90 whitespace-nowrap">
                    ← 04 A
                  </span>
                </div>

                {/* Left Column: Asymmetric Editorial Feature (1 Hero 2x height + 3 standard film cuts) */}
                <div className="flex-[1.2] flex flex-col gap-1.5 ml-1 min-w-0">
                  {/* Slot 0: Big Hero Feature Photo */}
                  <div className="relative aspect-[4/5] w-full rounded-xs overflow-hidden border border-amber-500/40 bg-zinc-950 shadow-xs flex items-center justify-center">
                    {renderSlotMedia(0)}
                    <div className="absolute top-1 left-1 pointer-events-none">
                      <span className="font-mono-retro text-[7px] font-black px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 shadow-xs uppercase tracking-wider">
                        ★ FEATURE
                      </span>
                    </div>
                    <div className="absolute bottom-0.5 right-0.5 pointer-events-none">
                      <span className="font-mono-retro text-[8px] font-bold px-1 rounded bg-black/80 text-amber-400">
                        → 01A
                      </span>
                    </div>
                  </div>

                  {/* Slots 1, 2, 3: Supporting Film Cuts */}
                  {[1, 2, 3].map((idx) => (
                    <div
                      key={idx}
                      className="relative aspect-[3/2] w-full rounded-xs overflow-hidden border border-zinc-800 bg-black shadow-xs flex items-center justify-center"
                    >
                      {renderSlotMedia(idx)}
                      <div className="absolute bottom-0.5 right-0.5 pointer-events-none">
                        <span className="font-mono-retro text-[8px] font-bold px-1 rounded bg-black/80 text-amber-400">
                          → 0{1 + idx}A
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Central Film Negative Spine */}
                <div className="w-5 flex flex-col items-center justify-around py-2 border-x border-zinc-800 bg-black text-[7px] font-mono-retro font-bold text-zinc-400 select-none mx-1.5 shrink-0">
                  <span className="transform -rotate-90 tracking-widest text-amber-500 whitespace-nowrap">
                    35MM NEGATIVE
                  </span>
                  <span className="transform -rotate-90 text-[6px] text-zinc-600 whitespace-nowrap">
                    • • •
                  </span>
                  <span className="transform -rotate-90 tracking-widest text-amber-500 whitespace-nowrap">
                    CONTACT SHEET
                  </span>
                </div>

                {/* Right Column: 5 Sequential Film Cuts */}
                <div className="flex-[0.8] flex flex-col gap-1 mr-1 min-w-0">
                  {[4, 5, 6, 7, 8].map((idx) => (
                    <div
                      key={idx}
                      className="relative aspect-[4/3] w-full rounded-xs overflow-hidden border border-zinc-800 bg-black shadow-xs flex items-center justify-center"
                    >
                      {renderSlotMedia(idx)}
                      <div className="absolute bottom-0.5 right-0.5 pointer-events-none">
                        <span className="font-mono-retro text-[8px] font-bold px-1 rounded bg-black/80 text-amber-400">
                          → 0{idx - 3}
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
                  <span className="transform -rotate-90 whitespace-nowrap">
                    ← 1 A
                  </span>
                  <span className="transform -rotate-90 whitespace-nowrap">
                    ← 2
                  </span>
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
                  <span className="transform -rotate-90 tracking-widest text-amber-500 whitespace-nowrap">
                    FILM NEGATIVE
                  </span>
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

              {/* Custom Caption or Default Memory Tag */}
              {customCaption && customCaption.trim() ? (
                <div
                  className="text-xs font-bold tracking-wider py-1 truncate text-center bg-black/10 rounded px-2 border border-current/20"
                  style={{ fontFamily: getCaptionFontFamily(captionFont) }}
                >
                  ✍ {customCaption.trim().toUpperCase()}
                </div>
              ) : (
                <div
                  className="text-[10px] tracking-wider opacity-75"
                  style={{ fontFamily: getCaptionFontFamily(captionFont) }}
                >
                  ★ MEMORIES TO KEEP
                </div>
              )}

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

        {/* Placed Stickers Management Bar */}
        {placedStickers && placedStickers.length > 0 && (
          <div className="w-full max-w-[340px] flex items-center justify-between px-3 py-1.5 rounded-lg bg-amber-100 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] text-xs font-mono-retro font-bold text-slate-900">
            <span className="flex items-center gap-1.5 truncate">
              <span className="truncate">
                {placedStickers.length} Stiker Tertempel (Seret / Putar)
              </span>
            </span>
            <button
              type="button"
              onClick={onClearPlacedStickers}
              className="text-red-600 hover:underline cursor-pointer shrink-0 ml-2 text-[11px]"
            >
              Hapus Semua
            </button>
          </div>
        )}

        {/* Action Controls when Completed */}
        {isCompleted && (
          <div className="w-full max-w-[340px] flex flex-col gap-3">
            {/* Format Export Selector */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono-retro font-bold text-slate-600">
                <span>FORMAT UNDUHAN:</span>
                <span className="text-amber-500 font-extrabold">
                  {exportFormat === "story"
                    ? "IG STORY (1080x1920)"
                    : "STRIP PAS"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-slate-200 border border-slate-900">
                <button
                  type="button"
                  onClick={() => setExportFormat?.("story")}
                  className={`py-1.5 px-2 rounded-md font-mono-retro text-[11px] font-extrabold flex items-center justify-center gap-1 cursor-pointer transition-all ${
                    exportFormat === "story"
                      ? "bg-amber-300 text-slate-900 shadow-[2px_2px_0px_#0f172a] border border-slate-900"
                      : "border border-transparent text-slate-600 hover:text-slate-900"
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
                      : "border border-transparent text-slate-600 hover:text-slate-900"
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
                  className="flex-1 brutal-btn bg-rose-400 hover:bg-rose-300 text-slate-900 py-2.5 sm:py-3.5 px-3 rounded-lg font-syne font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer shadow-[3px_3px_0px_#0f172a]"
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
                  disabled={isDownloading || isDownloadingGif}
                  className="flex-1 brutal-btn bg-emerald-400 hover:bg-emerald-300 text-slate-900 py-2.5 sm:py-3.5 px-3 rounded-lg font-syne font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer shadow-[3px_3px_0px_#0f172a]"
                >
                  <Download
                    className={`w-4 h-4 stroke-[2.5] ${isDownloading ? "animate-bounce" : ""}`}
                  />
                  {isDownloading ? "MENYIAPKAN..." : "UNDUH PNG"}
                </button>
              )}

              {/* Share Button (Web Share API for Mobile & Desktop) */}
              {onShare && (
                <button
                  type="button"
                  onClick={onShare}
                  disabled={
                    isDownloading || isDownloadingVideo || isDownloadingGif
                  }
                  className="brutal-btn bg-sky-300 hover:bg-sky-200 text-slate-900 py-2.5 sm:py-3.5 px-2.5 sm:px-3 rounded-lg font-syne font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer shadow-[3px_3px_0px_#0f172a]"
                  title="Bagikan ke WhatsApp, Instagram, dll"
                >
                  <Share2 className="w-4 h-4 stroke-[2.5]" />
                  <span className="hidden sm:inline">BAGIKAN</span>
                </button>
              )}

              {/* Retake Button */}
              <button
                onClick={onReset}
                disabled={
                  isDownloading || isDownloadingVideo || isDownloadingGif
                }
                className="brutal-btn bg-slate-200 hover:bg-slate-300 text-slate-900 py-2.5 sm:py-3 px-3 sm:px-3.5 rounded-lg font-mono-retro text-xs font-bold flex items-center justify-center cursor-pointer shadow-[2px_2px_0px_#0f172a]"
                title={
                  captureMode === "video" ? "Rekam Ulang Video" : "Foto Ulang"
                }
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Special Feature: Stop-Motion Card Downloads (MP4 Video & GIF) */}
            {captureMode !== "video" && (
              <div className="flex gap-2 w-full">
                {onDownloadStopMotionVideo && (
                  <button
                    type="button"
                    onClick={onDownloadStopMotionVideo}
                    disabled={
                      isDownloading ||
                      isDownloadingGif ||
                      isDownloadingStopMotion
                    }
                    className="flex-1 brutal-btn bg-amber-400 hover:bg-amber-300 text-slate-900 py-2.5 sm:py-3 px-3 rounded-lg font-syne font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer shadow-[3px_3px_0px_#0f172a]"
                    title="Unduh Video MP4 Stop-Motion Card (Paling pas untuk Instagram Story & WhatsApp)"
                  >
                    <Sparkles
                      className={`w-4 h-4 text-slate-900 ${isDownloadingStopMotion ? "animate-spin" : ""}`}
                    />
                    <span className="truncate">
                      {isDownloadingStopMotion
                        ? "MEMBUAT MP4..."
                        : "MP4 STORY (IG / WA)"}
                    </span>
                  </button>
                )}

                {onDownloadGif && (
                  <button
                    type="button"
                    onClick={onDownloadGif}
                    disabled={
                      isDownloading ||
                      isDownloadingGif ||
                      isDownloadingStopMotion
                    }
                    className="brutal-btn bg-amber-200 hover:bg-amber-300 text-slate-900 py-2.5 sm:py-3 px-3 rounded-lg font-syne font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1 cursor-pointer shadow-[2px_2px_0px_#0f172a] shrink-0"
                    title="Unduh file .GIF asli (Looping)"
                  >
                    <span>{isDownloadingGif ? "..." : "GIF LOOP"}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  },
);

PhotoStrip.displayName = "PhotoStrip";

export default PhotoStrip;
