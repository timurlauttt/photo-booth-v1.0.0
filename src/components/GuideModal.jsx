import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  BookOpen,
  X,
  Hand,
  Sparkles,
  Move,
  RotateCcw,
  Film,
  ShieldCheck,
  Camera,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";

export default function GuideModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("start");
  const modalRef = useRef(null);

  // Close on Escape or click outside
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  const tabs = [
    { id: "start", label: "Langkah Cepat", icon: Camera },
    { id: "gesture", label: "Isyarat Tangan", icon: Hand },
    { id: "filters", label: "Filter & Efek", icon: Sparkles },
    { id: "stickers", label: "Stiker & Frame", icon: Move },
    { id: "export", label: "Unduh & Format", icon: Film },
    { id: "tips", label: "Tips & Retake", icon: RotateCcw },
  ];

  return (
    <>
      {/* Trigger Button di Header */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1 sm:gap-1.5 p-1 sm:px-2.5 sm:py-1 rounded-full font-mono-retro text-[10px] sm:text-xs font-black border-2 border-slate-900 cursor-pointer transition-all shrink-0 whitespace-nowrap bg-emerald-300 hover:bg-emerald-400 text-slate-900 shadow-[1px_1px_0px_#0f172a] sm:shadow-[2px_2px_0px_#0f172a] hover:shadow-[2px_2px_0px_#0f172a]"
        aria-label="Panduan Penggunaan Photobooth"
        title="Buku Panduan & Petunjuk Lengkap Fitur Photobooth"
      >
        <BookOpen className="w-3.5 h-3.5 text-slate-900 stroke-[2.5] shrink-0" />
        <span className="hidden sm:inline tracking-tight">PANDUAN</span>
      </button>

      {/* Backdrop & Modal - Rendered to document.body via Portal to escape header containing block */}
      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-fade-in text-left overflow-y-auto">
            <div
              ref={modalRef}
              className="w-full max-w-2xl bg-white rounded-xl border-3 border-slate-900 shadow-[6px_6px_0px_#0f172a] sm:shadow-[8px_8px_0px_#0f172a] overflow-hidden flex flex-col max-h-[85vh] my-auto"
            >
            {/* Header Modal */}
            <div className="px-4 py-3 bg-amber-300 border-b-2 border-slate-900 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 text-slate-900">
                <div className="p-1 rounded bg-slate-900 text-amber-300">
                  <HelpCircle className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h2 className="font-syne font-black text-sm sm:text-base leading-tight tracking-tight">
                    PANDUAN LENGKAP PHOTOBOOTH
                  </h2>
                  <p className="font-mono-retro text-[10px] sm:text-[11px] text-slate-800 font-bold">
                    Petunjuk praktis untuk semua fitur retro studio
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg border-2 border-slate-900 bg-white hover:bg-rose-200 text-slate-900 cursor-pointer transition-colors shadow-[1.5px_1.5px_0px_#0f172a]"
                title="Tutup Panduan"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex overflow-x-auto border-b-2 border-slate-900 bg-slate-100 p-1.5 gap-1 shrink-0 scrollbar-none">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-mono-retro text-[11px] font-bold whitespace-nowrap transition-all border cursor-pointer shrink-0 ${
                      isActive
                        ? "bg-slate-900 text-amber-300 border-slate-900 shadow-[1.5px_1.5px_0px_#0f172a]"
                        : "bg-white text-slate-700 border-slate-300 hover:border-slate-900"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Contents */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 min-h-0 font-sans text-slate-800 space-y-4">
              {/* TAB 1: Quick Start */}
              {activeTab === "start" && (
                <div className="space-y-3">
                  <div className="p-3 bg-sky-50 border-2 border-slate-900 rounded-lg shadow-[2px_2px_0px_#0f172a]">
                    <h3 className="font-syne font-bold text-xs sm:text-sm text-slate-900 mb-1 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-sky-600" />
                      4 Langkah Mudah Memulai Sesi
                    </h3>
                    <ol className="space-y-2 text-xs text-slate-700 font-sans mt-2">
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-900 text-amber-300 font-mono-retro font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          1
                        </span>
                        <span>
                          <strong>Pilih Layout:</strong> Tentukan jumlah pose
                          foto strip (misalnya 4 Pose Klasik atau 3 Pose Kotak)
                          pada panel kontrol.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-900 text-amber-300 font-mono-retro font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          2
                        </span>
                        <span>
                          <strong>Pilih Filter & Frame:</strong> Pilih filter
                          vintage favorit (seperti Light Leak, Lo-Res, atau B&W)
                          serta warna atau motif bingkai foto.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-900 text-amber-300 font-mono-retro font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          3
                        </span>
                        <span>
                          <strong>Mulai Memotret:</strong> Klik tombol kuning{" "}
                          <strong>MULAI FOTO</strong> atau gunakan{" "}
                          <strong>Isyarat 5 Jari</strong> tangan tanpa menyentuh
                          layar.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-900 text-amber-300 font-mono-retro font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          4
                        </span>
                        <span>
                          <strong>Hias & Unduh:</strong> Geser stiker lucu ke
                          foto, tambahkan caption/tanggal, lalu unduh dalam
                          format PNG, MP4 Story, atau GIF!
                        </span>
                      </li>
                    </ol>
                  </div>

                  <div className="p-3 bg-emerald-50 border border-emerald-500 rounded-lg flex items-center gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 stroke-[2.5]" />
                    <p className="text-[11px] text-emerald-950 font-medium">
                      <strong>Privasi Terjamin:</strong> Seluruh proses
                      berlangsung 100% lokal di browser Anda. Foto tidak pernah
                      diunggah ke server internet manapun.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: Hands-Free Gesture */}
              {activeTab === "gesture" && (
                <div className="space-y-3">
                  <div className="p-3 bg-amber-50 border-2 border-slate-900 rounded-lg shadow-[2px_2px_0px_#0f172a]">
                    <div className="flex items-center gap-2 text-slate-900 font-syne font-bold text-xs sm:text-sm mb-1.5">
                      <Hand className="w-4 h-4 text-amber-600" />
                      Fitur Hands-Free (Isyarat Bentangkan 5 Jari)
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed mb-3">
                      Anda bisa memotret dari kejauhan tanpa perlu lari-lari
                      menekan tombol mouse atau layar!
                    </p>

                    <div className="space-y-2 font-mono-retro text-[11px]">
                      <div className="p-2 bg-white rounded border border-slate-300 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>1. Aktifkan Tombol GESTURE:</strong> Tekan
                          tombol isyarat tangan di pojok kontrol kamera hingga
                          berstatus ON.
                        </div>
                      </div>
                      <div className="p-2 bg-white rounded border border-slate-300 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>2. Hadapkan Telapak Tangan:</strong> Angkat
                          tangan dan bentangkan kelima jari lurus ke arah kamera
                          (seperti memberi isyarat &apos;High Five&apos; atau angka 5).
                        </div>
                      </div>
                      <div className="p-2 bg-white rounded border border-slate-300 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>3. Tahan Selama 0,5 Detik:</strong> Lampu hijau
                          akan menyala &quot;ISYARAT 5 JARI TERDETEKSI&quot; dan kamera
                          otomatis memulai hitungan mundur!
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-100 rounded-lg border border-slate-300 text-[11px] text-slate-600">
                    <strong>Catatan:</strong> Fitur ini dilengkapi sistem
                    anti-spam cerdas dengan jeda pendinginan (*cooldown*) agar
                    tidak terjadi pemotretan berulang secara tidak sengaja.
                  </div>
                </div>
              )}

              {/* TAB 3: Filters & Effects */}
              {activeTab === "filters" && (
                <div className="space-y-3">
                  <div className="p-3 bg-purple-50 border-2 border-slate-900 rounded-lg shadow-[2px_2px_0px_#0f172a]">
                    <h3 className="font-syne font-bold text-xs sm:text-sm text-slate-900 mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      Filter Vintage & Retro Digicam
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 bg-white rounded border border-slate-300">
                        <strong className="text-slate-900">Normal (Crisp):</strong>{" "}
                        Warna asli tajam dan jernih tanpa manipulasi warna.
                      </div>
                      <div className="p-2 bg-white rounded border border-slate-300">
                        <strong className="text-amber-700">Light Leak 35mm:</strong>{" "}
                        Efek bocoran cahaya analog hangat khas kamera film lawas.
                      </div>
                      <div className="p-2 bg-white rounded border border-slate-300">
                        <strong className="text-slate-800">Film Grain 800:</strong>{" "}
                        Tekstur bintik butiran film analog 35mm yang estetis.
                      </div>
                      <div className="p-2 bg-white rounded border border-slate-300">
                        <strong className="text-sky-700">Lo-Res Story:</strong>{" "}
                        Gaya video & foto digicam 2000-an (resolusi rendah retro).
                      </div>
                      <div className="p-2 bg-white rounded border border-slate-300">
                        <strong className="text-rose-700">Golden Hour:</strong>{" "}
                        Nuansa senja temaram dengan kilau keemasan lembut.
                      </div>
                      <div className="p-2 bg-white rounded border border-slate-300">
                        <strong className="text-indigo-700">Anime Pastel:</strong>{" "}
                        Warna cerah lembut khas tone film Jepang.
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-100/70 border border-amber-400 rounded-lg text-xs text-amber-950">
                    <strong>Cap Tanggal Oranye (Orange Quartz):</strong> Aktifkan
                    opsi ini pada tab Kustomisasi untuk mencetak stempel tanggal
                    digital khas kamera saku 90s di sudut foto Anda!
                  </div>
                </div>
              )}

              {/* TAB 4: Stickers & Customization */}
              {activeTab === "stickers" && (
                <div className="space-y-3">
                  <div className="p-3 bg-pink-50 border-2 border-slate-900 rounded-lg shadow-[2px_2px_0px_#0f172a]">
                    <h3 className="font-syne font-bold text-xs sm:text-sm text-slate-900 mb-2 flex items-center gap-1.5">
                      <Move className="w-4 h-4 text-pink-600" />
                      Stiker Bebas Geser (Drag & Drop)
                    </h3>
                    <p className="text-xs text-slate-700 mb-3">
                      Anda bebas meletakkan stiker di posisi manapun pada photo
                      strip:
                    </p>
                    <ol className="space-y-1.5 text-xs text-slate-700">
                      <li>
                        1. Buka tab <strong>Kustomisasi</strong> di sebelah
                        kamera.
                      </li>
                      <li>
                        2. Klik stiker pilihan Anda untuk memunculkannya di atas
                        strip.
                      </li>
                      <li>
                        3. Klik dan <strong>tahan lalu geser</strong> stiker ke
                        area wajah, pinggir bingkai, atau sudut manapun sesuka
                        hati!
                      </li>
                      <li>
                        4. Untuk menghapus, cukup klik tombol silang (x) kecil di
                        dekat stiker.
                      </li>
                    </ol>
                  </div>

                  <div className="p-3 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 space-y-1.5">
                    <strong>Pola Bingkai & Warna:</strong>
                    <p>
                      Pilih dari berbagai pola latar retro seperti Papan Catur
                      (Checkerboard), Polkadot, Garis Strip, Bintang, atau Kertas
                      Kotak dengan warna favorit Anda.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 5: Export & Formats */}
              {activeTab === "export" && (
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 border-2 border-slate-900 rounded-lg shadow-[2px_2px_0px_#0f172a]">
                    <h3 className="font-syne font-bold text-xs sm:text-sm text-slate-900 mb-2 flex items-center gap-1.5">
                      <Film className="w-4 h-4 text-emerald-700" />
                      3 Pilihan Format Unduhan Hasil
                    </h3>
                    <div className="space-y-2 text-xs">
                      <div className="p-2.5 bg-white rounded border border-slate-300">
                        <span className="font-bold text-slate-900 block">
                          1. UNDUH FOTO (PNG Resolusi Tinggi)
                        </span>
                        Format gambar tajam dan jernih, sangat ideal untuk
                        dicetak fisik atau disimpan ke album foto.
                      </div>
                      <div className="p-2.5 bg-white rounded border border-slate-300">
                        <span className="font-bold text-amber-700 block">
                          2. MP4 STORY (Video Animasi Kartu)
                        </span>
                        Video stop-motion rasio 9:16 vertikal yang langsung siap
                        diunggah ke <strong>Instagram Story</strong>,{" "}
                        <strong>TikTok</strong>, maupun{" "}
                        <strong>WhatsApp Status</strong>.
                      </div>
                      <div className="p-2.5 bg-white rounded border border-slate-300">
                        <span className="font-bold text-sky-700 block">
                          3. GIF LOOP (Gambar Bergerak Berulang)
                        </span>
                        File animasi GIF retro tanpa jeda yang ringan dan mudah
                        dibagikan di ruang obrolan.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: Tips & Retake */}
              {activeTab === "tips" && (
                <div className="space-y-3">
                  <div className="p-3 bg-amber-50 border-2 border-slate-900 rounded-lg shadow-[2px_2px_0px_#0f172a]">
                    <h3 className="font-syne font-bold text-xs sm:text-sm text-slate-900 mb-2 flex items-center gap-1.5">
                      <RotateCcw className="w-4 h-4 text-amber-700" />
                      Fitur Retake Pose (Ulangi Foto Tertentu)
                    </h3>
                    <p className="text-xs text-slate-700 leading-relaxed mb-2">
                      Pose ke-2 Anda merem atau kurang pas? Tidak perlu mengulang
                      semua foto dari awal!
                    </p>
                    <div className="p-2.5 bg-white rounded border border-slate-300 text-xs text-slate-700 space-y-1">
                      <p>
                        • Cukup <strong>klik pada foto yang ingin diganti</strong>{" "}
                        di dalam strip pratinjau.
                      </p>
                      <p>
                        • Tekan tombol <strong>Retake Pose</strong> yang muncul.
                      </p>
                      <p>
                        • Kamera akan menghitung mundur dan hanya memperbarui
                        pose tersebut tanpa mengganggu foto lainnya!
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900 text-white rounded-lg text-xs space-y-1.5">
                    <span className="font-bold text-amber-300 block">
                      Tips Hasil Foto Maksimal:
                    </span>
                    <p className="text-slate-300">
                      • Gunakan fitur <strong>Ring Light</strong> (tombol lampu)
                      jika ruangan Anda agak redup.
                    </p>
                    <p className="text-slate-300">
                      • Gunakan mode <strong>FULL (Fullscreen)</strong> untuk
                      pengalaman serasa berada di bilik foto mesin arcade nyata.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="px-4 py-2.5 bg-slate-100 border-t-2 border-slate-900 flex items-center justify-between shrink-0">
              <span className="font-mono-retro text-[10px] text-slate-600">
                PHOTOBOOTH • 100% Client-Side Privacy
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="brutal-btn px-4 py-1 rounded-md bg-slate-900 text-white font-mono-retro text-xs font-bold hover:bg-slate-800 cursor-pointer shadow-[1.5px_1.5px_0px_#0f172a]"
              >
                MENGERTI
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
