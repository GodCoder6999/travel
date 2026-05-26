"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Globe2 } from "lucide-react";
import { REGIONS, useRegion } from "@/lib/region";
import { cn } from "@/lib/cn";

export default function RegionSwitcher({ compact = false }: { compact?: boolean }) {
  const { region, setRegion } = useRegion();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex items-center gap-2 rounded-full bg-cream border border-ink/15 px-3 py-2 text-sm hover:bg-paper transition shadow-sm",
          compact && "px-2.5 py-1.5 text-xs"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Globe2 className="h-3.5 w-3.5 text-inkmist" />
        <span className="text-base leading-none">{region.flag}</span>
        <span className="hidden sm:inline text-ink">{region.code}</span>
        <span className="text-ink/40">·</span>
        <span className="font-mono text-inkmist">{region.currency}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 transition text-inkmist", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 mt-2 w-72 rounded-2xl bg-cream border border-ink/15 shadow-xl overflow-hidden z-[100]"
            role="listbox"
          >
            <div className="max-h-80 overflow-y-auto py-1">
              {REGIONS.map((r) => (
                <button
                  key={r.code}
                  onClick={() => { setRegion(r); setOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-paper transition",
                    r.code === region.code && "bg-sun/15"
                  )}
                  role="option"
                  aria-selected={r.code === region.code}
                >
                  <span className="text-xl leading-none">{r.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-ink">{r.label}</div>
                    <div className="text-xs text-inkmist">{r.code} · {r.currency}</div>
                  </div>
                  {r.code === region.code && <span className="text-coral text-xs">●</span>}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
