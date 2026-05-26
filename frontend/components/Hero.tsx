"use client";
import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import dynamic from "next/dynamic";

const Globe3D = dynamic(() => import("./Globe3D"), { ssr: false });

export default function Hero({ onPlan }: { onPlan: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const scrollY = useRef(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const yTitle = useTransform(scrollYProgress, [0, 1], [0, -180]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.18]);

  useEffect(() => {
    const onScroll = () => { scrollY.current = window.scrollY; };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section ref={ref} className="relative h-[180vh]">
      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Globe3D scrollY={scrollY} />
        </div>
        <div className="absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_30%,#0a0a0f_75%)]" />

        <motion.div
          style={{ y: yTitle, opacity, scale }}
          className="relative z-20 flex h-full flex-col items-center justify-center px-6 text-center"
        >
          <span className="mb-6 inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs tracking-widest uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-aurora animate-pulse" />
            Real-time · Flights · Hotels · Visas
          </span>
          <h1 className="h-display font-bold leading-[0.9] tracking-tight text-balance"
              style={{ fontSize: "clamp(2.75rem, 11vw, 10rem)" }}>
            <span className="block txt-gradient">Plan trips</span>
            <span className="block italic text-mist">in three dimensions.</span>
          </h1>
          <p className="mt-6 max-w-xl mx-auto text-sm sm:text-base md:text-lg text-mist/70 text-balance">
            Every flight, hotel, attraction, forecast, and visa rule —
            live and curated. Wrapped in a 3D experience that feels like flying.
          </p>
          <div className="mt-10 flex items-center justify-center gap-3 pointer-events-auto flex-wrap">
            <button
              onClick={onPlan}
              className="group relative overflow-hidden rounded-full bg-mist px-7 py-3.5 text-ink font-medium hover:scale-[1.03] active:scale-[0.98] transition"
            >
              <span className="relative z-10">Start planning</span>
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-coral via-plum to-ocean opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition duration-500" />
            </button>
            <a href="#features" className="rounded-full glass px-6 py-3.5 hover:bg-white/10 transition">
              How it works ↓
            </a>
          </div>
        </motion.div>

        <div className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 text-xs uppercase tracking-[0.4em] text-mist/40">
          scroll
        </div>
      </div>
    </section>
  );
}
