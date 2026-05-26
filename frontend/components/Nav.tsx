"use client";
import { useEffect, useState } from "react";
import RegionSwitcher from "./RegionSwitcher";
import { cn } from "@/lib/cn";

export default function Nav({ onPlan }: { onPlan: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", f, { passive: true }); f();
    return () => window.removeEventListener("scroll", f);
  }, []);
  return (
    <nav className={cn("fixed top-0 inset-x-0 z-50 transition-all", scrolled ? "py-2" : "py-5")}>
      <div
        className={cn(
          "mx-auto max-w-7xl px-4 sm:px-5 flex items-center justify-between gap-3 transition-all",
          scrolled && "bg-cream/90 backdrop-blur-md border border-ink/10 rounded-full py-2.5 px-3 sm:px-4 shadow-sm"
        )}
      >
        <a href="#" className="h-display text-xl sm:text-2xl flex items-center gap-2 shrink-0 text-ink">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-coral animate-pulse" />
          <span>Voyage</span>
        </a>
        <div className="hidden md:flex gap-7 text-sm text-inkmist">
          <a href="#features" className="hover:text-ink transition">Features</a>
          <a href="#plan" className="hover:text-ink transition">Plan</a>
          <a href="#cities" className="hover:text-ink transition">Cities</a>
        </div>
        <div className="flex items-center gap-2">
          <RegionSwitcher compact={scrolled} />
          <button
            onClick={onPlan}
            className="rounded-full bg-ink text-cream px-4 py-2 text-sm font-medium hover:scale-105 transition shrink-0 shadow-[3px_3px_0_rgba(29,24,20,0.9)]"
          >
            Start
          </button>
        </div>
      </div>
    </nav>
  );
}
