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
          scrolled && "glass rounded-full py-2.5 px-3 sm:px-4"
        )}
      >
        <a href="#" className="h-display text-xl sm:text-2xl flex items-center gap-2 shrink-0">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-coral animate-pulse" />
          <span>Voyage</span>
        </a>
        <div className="hidden md:flex gap-7 text-sm text-mist/70">
          <a href="#features" className="hover:text-mist transition">Features</a>
          <a href="#plan" className="hover:text-mist transition">Plan</a>
          <a href="#cities" className="hover:text-mist transition">Cities</a>
        </div>
        <div className="flex items-center gap-2">
          <RegionSwitcher compact={scrolled} />
          <button
            onClick={onPlan}
            className="rounded-full bg-mist text-ink px-4 py-2 text-sm font-medium hover:scale-105 transition shrink-0"
          >
            Start
          </button>
        </div>
      </div>
    </nav>
  );
}
