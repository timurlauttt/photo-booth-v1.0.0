import { useState, useRef, useEffect } from "react";
import {
  User,
  X,
  ExternalLink,
  Layers,
  Database,
  Sparkles,
  Server,
  Terminal,
  Heart,
} from "lucide-react";

export default function DeveloperBadge({
  isOpen: controlledIsOpen,
  onToggle: controlledOnToggle,
}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = typeof controlledIsOpen === "boolean";
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;
  const toggleOpen = isControlled
    ? controlledOnToggle || (() => {})
    : () => setInternalIsOpen((prev) => !prev);
  const closePopover = isControlled
    ? () => controlledOnToggle && controlledOnToggle(false)
    : () => setInternalIsOpen(false);

  const popoverRef = useRef(null);

  // Close on outside click or touch
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        closePopover();
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
      {/* Trigger Button - Subtle tactile neo-brutalist pill matching PrivacyBadge */}
      <button
        type="button"
        onClick={toggleOpen}
        className={`flex items-center gap-1 sm:gap-1.5 p-1 sm:px-2.5 sm:py-1 rounded-full font-mono-retro text-[10px] sm:text-xs font-bold border-2 border-slate-900 cursor-pointer transition-all shrink-0 whitespace-nowrap ${
          isOpen
            ? "bg-sky-400 text-slate-900 shadow-none translate-x-0.5 translate-y-0.5 ring-2 ring-slate-900"
            : "bg-white hover:bg-sky-100 text-slate-800 shadow-[1px_1px_0px_#0f172a] sm:shadow-[2px_2px_0px_#0f172a] hover:shadow-[2px_2px_0px_#0f172a]"
        }`}
        aria-label="Tentang Developer pangestudev"
        title="Tentang Developer - Fullstack Web Developer pangestudev"
      >
        <User className="w-3.5 h-3.5 text-slate-900 stroke-[2.5] shrink-0" />
        <span className="hidden sm:inline tracking-tight font-extrabold">
          DEV
        </span>
        <span className="hidden xl:inline font-mono text-[9px] text-slate-500 font-semibold">
          pangestudev
        </span>
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div className="fixed sm:absolute inset-x-3 sm:inset-x-auto right-auto sm:right-0 top-14 sm:top-full mt-2 w-auto sm:w-96 max-h-[85vh] overflow-y-auto p-4 bg-white rounded-xl border-2 border-slate-900 shadow-[6px_6px_0px_#0f172a] z-50 text-slate-900 animate-fade-in text-left">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 mb-3 border-b-2 border-slate-900">
            <div className="flex items-center gap-2 text-slate-900 font-syne font-extrabold text-xs sm:text-sm tracking-tight">
              <span>TENTANG DEVELOPER</span>
            </div>
            <button
              type="button"
              onClick={closePopover}
              className="p-1 rounded border border-slate-900 bg-slate-100 hover:bg-rose-200 text-slate-700 hover:text-rose-900 cursor-pointer transition-colors"
              title="Tutup"
            >
              <X className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>

          {/* Developer Card Body */}
          <div className="p-3 rounded-lg bg-sky-50/70 border-2 border-sky-300 mb-3 shadow-[2px_2px_0px_#0284c7]">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5 text-sky-950 font-syne font-black text-xs sm:text-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-600"></span>
                </span>
                <span>pangestudev</span>
              </div>
              <span className="font-mono-retro text-[9px] font-bold text-sky-700 bg-sky-200/80 px-1.5 py-0.5 rounded border border-sky-400">
                Fullstack &amp; Server / VPS
              </span>
            </div>

            <p className="text-[11px] leading-relaxed text-slate-700 font-sans">
              <strong>Fullstack Web Developer</strong> di balik{" "}
              <strong>PHOTOBOOTH</strong>. Terbiasa menangani siklus
              pengembangan web hulu ke hilir (<em>end-to-end</em>) — mulai dari
              konfigurasi &amp; optimasi <strong>Server Linux / VPS</strong>,
              arsitektur database &amp; backend yang tangguh, hingga antarmuka
              frontend interaktif berkinerja tinggi.
            </p>

            {/* Quick Skills / Highlights */}
            <div className="mt-2.5 pt-2 border-t border-sky-200/80 flex flex-wrap gap-1.5 font-mono-retro text-[9px]">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white border border-slate-300 text-slate-700 font-semibold">
                <Server className="w-2.5 h-2.5 text-cyan-600" /> Server / VPS
                &amp; Linux
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white border border-slate-300 text-slate-700 font-semibold">
                <Database className="w-2.5 h-2.5 text-indigo-600" /> Backend
                &amp; Database
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white border border-slate-300 text-slate-700 font-semibold">
                <Sparkles className="w-2.5 h-2.5 text-amber-500" /> Frontend
                &amp; UI/UX
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white border border-slate-300 text-slate-700 font-semibold">
                <Terminal className="w-2.5 h-2.5 text-emerald-600" /> DevOps
                &amp; Deploy
              </span>
            </div>
          </div>

          {/* Action Button to Developer Portfolio */}
          <div className="mb-2">
            <a
              href="https://pangestudev.web.id/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-lg bg-sky-300 hover:bg-sky-400 border-2 border-slate-900 text-slate-900 font-mono-retro font-black text-xs shadow-[2px_2px_0px_#0f172a] hover:shadow-[3px_3px_0px_#0f172a] active:translate-x-0.5 active:translate-y-0.5 transition-all text-center"
            >
              <span>
                Ketahui profil developer selengkapnya di pangestudev.web.id
              </span>
              <ExternalLink className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
            </a>
          </div>

          {/* Footer Subtext */}
          <div className="pt-2 border-t border-dashed border-slate-200 flex items-center justify-between text-[9px] font-mono-retro text-slate-500">
            <span className="flex items-center gap-1">
              <Heart className="w-2.5 h-2.5 text-rose-500 fill-rose-500" />{" "}
              Built with passion & coffee
            </span>
            <span className="text-slate-400 font-bold">pangestudev.web.id</span>
          </div>
        </div>
      )}
    </div>
  );
}
