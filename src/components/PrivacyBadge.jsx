import { useState, useRef, useEffect } from "react";
import {
  ShieldAlert,
  X,
  Lock,
  Check,
  AlertTriangle,
  Copyright,
} from "lucide-react";

export default function PrivacyBadge() {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);

  // Close on outside click or touch
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Trigger Button - Compact Beacon + Shield on mobile, full label on tablet/desktop */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-1 sm:gap-1.5 p-1 sm:px-2.5 sm:py-1 rounded-full font-mono-retro text-[10px] sm:text-xs font-black border-2 border-slate-900 cursor-pointer transition-all shrink-0 whitespace-nowrap ${
          isOpen
            ? "bg-amber-400 text-slate-900 shadow-none translate-x-0.5 translate-y-0.5 ring-2 ring-slate-900"
            : "bg-amber-300 hover:bg-amber-400 text-slate-900 shadow-[1px_1px_0px_#0f172a] sm:shadow-[2px_2px_0px_#0f172a] hover:shadow-[2px_2px_0px_#0f172a]"
        }`}
        aria-label="Privacy & Policy (Non-Komersial)"
        title="Privacy & Policy - Jaminan Privasi 100% & Ketentuan Non-Komersial"
      >
        {/* Pulsing Beacon Dot - Tablet & Desktop only */}
        <span className="relative hidden sm:flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-80"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
        </span>

        {/* Shield Icon */}
        <ShieldAlert className="w-3.5 h-3.5 text-slate-900 stroke-[2.5] shrink-0" />

        {/* Label: Hidden on mobile (<sm), visible on sm+ */}
        <span className="hidden sm:inline tracking-tight">
          PRIVACY & POLICY
        </span>
        <span className="hidden xl:inline bg-rose-500 text-white text-[9px] px-1.5 py-0.2 rounded border border-slate-900 font-extrabold uppercase">
          NON-KOMERSIAL
        </span>
      </button>

      {/* Reassuring Tooltip / Popover Modal */}
      {isOpen && (
        <div className="fixed sm:absolute inset-x-3 sm:inset-x-auto right-auto sm:right-0 top-14 sm:top-full mt-2 w-auto sm:w-96 max-h-[85vh] overflow-y-auto p-4 bg-white rounded-xl border-2 border-slate-900 shadow-[6px_6px_0px_#0f172a] z-50 text-slate-900 animate-fade-in text-left">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 mb-3 border-b-2 border-slate-900">
            <div className="flex items-center gap-2 text-slate-900 font-syne font-extrabold text-xs sm:text-sm tracking-tight">
              <span>PRIVACY & POLICY</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded border border-slate-900 bg-slate-100 hover:bg-rose-200 text-slate-700 hover:text-rose-900 cursor-pointer transition-colors"
              title="Tutup"
            >
              <X className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>

          {/* Alert: Non-Commercial Term */}
          <div className="p-2.5 rounded-lg bg-rose-50 border-2 border-rose-600 mb-3 shadow-[2px_2px_0px_#e11d48]">
            <div className="flex items-center gap-1.5 text-rose-700 font-mono-retro font-black text-[11px] mb-1">
              <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
              <span>DILARANG DIKOMERSILKAN!</span>
            </div>
            <p className="text-[10px] leading-relaxed text-slate-800 font-sans">
              Website, seluruh kode, desain, filter, dan aset{" "}
              <strong>PHOTOBOOTH</strong> ini{" "}
              <strong className="text-rose-700">DILARANG KERAS</strong>{" "}
              diperjualbelikan, dimonetisasi, atau dijadikan layanan komersial
              berbayar oleh siapapun tanpa izin resmi dari{" "}
              <strong>pangestudev</strong>.
            </p>
            <div className="mt-1 text-[9px] font-mono-retro font-bold text-rose-800 uppercase">
              • Strictly for personal & free fun use only.
            </div>
          </div>

          {/* Privacy Guarantees */}
          <div className="mb-3">
            <div className="flex items-center gap-1.5 text-emerald-800 font-mono-retro font-bold text-[11px] mb-1.5">
              <Lock className="w-3 h-3 stroke-[2.5] shrink-0" />
              <span>JAMINAN PRIVASI 100% LOKAL (CLIENT-SIDE)</span>
            </div>
            <ul className="space-y-1.5 font-mono-retro text-[10px] text-slate-700">
              <li className="flex items-start gap-1.5">
                <Check className="w-3 h-3 text-emerald-600 shrink-0 stroke-[3] mt-0.5" />
                <span>
                  <strong>Zero Server Upload:</strong> Foto dan video Anda
                  diproses murni di perangkat Anda tanpa pernah diunggah ke
                  server mana pun.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <Check className="w-3 h-3 text-emerald-600 shrink-0 stroke-[3] mt-0.5" />
                <span>
                  <strong>Bebas Pelacak:</strong> Tanpa cookie analitik pihak
                  ketiga, tanpa database pengguna, dan tanpa registrasi akun.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <Check className="w-3 h-3 text-emerald-600 shrink-0 stroke-[3] mt-0.5" />
                <span>
                  <strong>Hak Cipta Anda:</strong> Semua karya foto strip dan
                  video strip yang Anda hasilkan adalah hak milik Anda
                  sepenuhnya.
                </span>
              </li>
            </ul>
          </div>

          {/* Footer Copyright */}
          <div className="pt-2 border-t-2 border-dashed border-slate-200 flex items-center justify-between text-[9px] font-mono-retro text-slate-500">
            <span className="flex items-center gap-1">
              <Copyright className="w-2.5 h-2.5" /> 2026 pangestudev
            </span>
            <span className="text-slate-400 font-bold">
              ALL RIGHTS RESERVED
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
