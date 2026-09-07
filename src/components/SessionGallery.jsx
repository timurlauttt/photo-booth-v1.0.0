import { X, Download, Share2, Trash2, Camera, Sparkles } from "lucide-react";

export default function SessionGallery({
  isOpen,
  onClose,
  history,
  sessionHistory,
  onClearHistory,
  onDownloadItem,
  onShareItem,
}) {
  const items = history || sessionHistory || [];

  if (!isOpen) return null;

  const handleDownload = (item) => {
    if (onDownloadItem) {
      onDownloadItem(item);
      return;
    }
    if (item.blob) {
      const url = URL.createObjectURL(item.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        item.filename ||
        `photobooth-${item.mode || "photo"}-${Date.now()}.${item.mode === "video" ? "mp4" : "png"}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } else if (item.thumbnailUrl) {
      const a = document.createElement("a");
      a.href = item.thumbnailUrl;
      a.download = item.filename || `photobooth-strip-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleShare = async (item) => {
    if (onShareItem) {
      onShareItem(item);
      return;
    }
    if (item.blob && navigator.canShare) {
      try {
        const file = new File([item.blob], item.filename || "photobooth.png", {
          type:
            item.mode === "video"
              ? "video/mp4"
              : item.mode === "gif"
                ? "image/gif"
                : "image/png",
        });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "Photo Strip Memories",
            text: item.caption
              ? `Check out my photo strip: "${item.caption}"`
              : "Check out my photo strip!",
          });
          return;
        }
      } catch (err) {
        if (err.name === "AbortError") return;
      }
    }
    handleDownload(item);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-white border-3 border-slate-900 rounded-xl shadow-[8px_8px_0px_#0f172a] max-h-[88vh] flex flex-col overflow-hidden animate-modal-pop">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3 border-b-2 border-slate-900 bg-amber-300 text-slate-900 shrink-0 select-none">
          <div className="flex items-center gap-2 min-w-0 mr-2">
            <div className="flex items-center gap-1 shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 border border-slate-900"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 border border-slate-900"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-slate-900"></div>
            </div>
            <h2 className="font-syne font-extrabold text-xs sm:text-sm tracking-tight flex items-center gap-1.5 min-w-0 truncate">
              <span className="truncate">GALERI SESI</span>
            </h2>
            <span className="shrink-0 text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-slate-900 text-amber-300 font-mono-retro font-bold">
              {items.length} STRIP
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-1 sm:p-1.5 rounded-lg border-2 border-slate-900 bg-white hover:bg-slate-100 text-slate-900 cursor-pointer transition-all shadow-[2px_2px_0px_#0f172a] active:translate-x-0.5 active:translate-y-0.5"
            aria-label="Tutup Galeri"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50">
          {items.length === 0 ? (
            <div className="py-12 sm:py-16 px-4 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 border-2 border-slate-900 flex items-center justify-center text-slate-900 mb-3.5 shadow-[3px_3px_0px_#0f172a]">
                <Camera className="w-8 h-8 stroke-[1.75]" />
              </div>
              <h3 className="font-syne font-extrabold text-sm sm:text-base text-slate-900 mb-1">
                Belum Ada Hasil Sesi
              </h3>
              <p className="font-mono-retro text-xs text-slate-600 max-w-xs sm:max-w-sm leading-relaxed">
                Selesaikan satu sesi pemotretan foto atau rekaman video, maka hasil strip akan otomatis tersimpan di sini!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {items.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="bg-white border-2 border-slate-900 rounded-lg p-3 shadow-[3px_3px_0px_#0f172a] flex flex-col justify-between"
                >
                  <div>
                    {/* Thumbnail */}
                    <div className="relative aspect-[3/4] w-full rounded overflow-hidden border border-slate-900/40 bg-slate-100 mb-2.5 flex items-center justify-center">
                      {item.thumbnailUrl ? (
                        <img
                          src={item.thumbnailUrl}
                          alt={`Strip #${idx + 1}`}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-xs font-mono-retro text-slate-400 flex flex-col items-center gap-1">
                          <Sparkles className="w-5 h-5 text-amber-500" />
                          <span>Strip #{idx + 1}</span>
                        </div>
                      )}
                      <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded font-mono-retro text-[9px] font-bold bg-slate-950/80 text-white border border-white/20">
                        {item.mode === "video"
                          ? "VIDEO"
                          : item.mode === "gif"
                            ? "GIF"
                            : "FOTO"}
                      </span>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center justify-between font-mono-retro text-[10px] text-slate-500 mb-1">
                      <span>{item.timestamp || "Tersimpan"}</span>
                      <span className="font-bold text-slate-700">
                        {item.layoutName || "Duo Strip"}
                      </span>
                    </div>
                    {item.caption && (
                      <p className="font-mono-retro text-xs font-bold text-slate-800 truncate mb-2">
                        &quot;{item.caption}&quot;
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleDownload(item)}
                      className="flex-1 py-1.5 px-2.5 rounded bg-sky-400 hover:bg-sky-300 text-slate-900 border-2 border-slate-900 font-mono-retro text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all shadow-[1.5px_1.5px_0px_#0f172a]"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>UNDUH</span>
                    </button>

                    {navigator.share && (
                      <button
                        type="button"
                        onClick={() => handleShare(item)}
                        className="py-1.5 px-2.5 rounded bg-emerald-300 hover:bg-emerald-200 text-slate-900 border-2 border-slate-900 font-mono-retro text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all shadow-[1.5px_1.5px_0px_#0f172a]"
                        title="Bagikan ke WhatsApp / IG"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="flex items-center justify-between p-3.5 border-t-2 border-slate-900 bg-slate-100">
            <span className="font-mono-retro text-[11px] text-slate-500">
              Disimpan sementara di sesi browser Anda.
            </span>
            <button
              type="button"
              onClick={onClearHistory}
              className="px-2.5 py-1 text-red-600 hover:text-red-700 font-mono-retro text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>HAPUS SEMUA</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
