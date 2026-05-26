"use client";
import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import dynamic from "next/dynamic";
import { TransportIcon } from "./TransportIcon";

const Globe3D = dynamic(() => import("./Globe3D"), { ssr: false });

export default function Hero({ onPlan }: { onPlan: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const scrollY = useRef(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const yTitle = useTransform(scrollYProgress, [0, 1], [0, -180]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);

  useEffect(() => {
    const onScroll = () => { scrollY.current = window.scrollY; };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section ref={ref} className="relative h-[180vh]">
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Sky gradient */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#dfeefc] via-[#fbf6ec] to-[#fff3d8]" />
        {/* Soft sun + sky orbs */}
        <div className="absolute top-[12%] right-[12%] w-72 h-72 rounded-full bg-sun/40 blur-3xl" />
        <div className="absolute bottom-[18%] left-[8%] w-80 h-80 rounded-full bg-sky/30 blur-3xl" />

        {/* Globe — small, lower-right, peeking from behind so headline reads cleanly */}
        <div className="absolute inset-0 z-0">
          <div className="absolute right-[-8%] bottom-[-12%] w-[55vmin] h-[55vmin] max-w-[520px] max-h-[520px] sm:right-[-5%] sm:bottom-[-8%]">
            <Globe3D scrollY={scrollY} />
          </div>
        </div>

        {/* Cream vignette around globe edges so it blends into the page */}
        <div className="absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(ellipse_at_85%_85%,transparent_0%,transparent_35%,rgba(251,246,236,0.85)_75%)]" />

        {/* Floating transport stickers (smaller, edge-anchored) */}
        <FloatingDecorations />

        <motion.div
          style={{ y: yTitle, opacity, scale }}
          className="relative z-20 flex h-full flex-col items-center justify-center px-6 text-center"
        >
          <span className="mb-4 inline-flex items-center gap-2 sticker text-xs tracking-widest uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-coral animate-pulse" />
            A travel diary that plans itself
          </span>
          <div className="h-hand text-3xl text-coral -rotate-2 mb-2">~ dear journal ~</div>
          <h1
            className="h-display font-bold leading-[0.9] tracking-tight text-balance text-ink"
            style={{
              fontSize: "clamp(2.5rem, 8vw, 7rem)",
              textShadow: "0 1px 0 #fff9ee, 0 2px 16px rgba(251,246,236,0.95), 0 0 40px rgba(251,246,236,0.7)",
            }}
          >
            <span className="block">Plan trips</span>
            <span className="block italic txt-gradient">like a wanderer.</span>
          </h1>
          <p className="mt-6 max-w-xl mx-auto h-hand text-2xl sm:text-3xl text-inkmist text-balance">
            Every flight, hotel, attraction, forecast & visa —
            scrapbooked into a single page you can scroll through.
          </p>
          <div className="mt-10 flex items-center justify-center gap-3 pointer-events-auto flex-wrap">
            <button
              onClick={onPlan}
              className="group relative overflow-hidden rounded-full bg-ink text-cream px-7 py-3.5 font-medium hover:scale-[1.03] active:scale-[0.98] transition shadow-[3px_3px_0_rgba(29,24,20,0.9)] hover:shadow-[5px_5px_0_rgba(29,24,20,0.9)]"
            >
              <span className="relative z-10">Start planning</span>
            </button>
            <a href="#features" className="rounded-full border-2 border-ink/80 bg-cream/70 backdrop-blur px-6 py-3 hover:bg-ink hover:text-cream transition font-medium">
              How it works ↓
            </a>
          </div>
        </motion.div>

        <div className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 text-xs uppercase tracking-[0.4em] text-ink/40">
          scroll
        </div>
      </div>
    </section>
  );
}

function FloatingDecorations() {
  return (
    <div className="absolute inset-0 z-10 pointer-events-none">
      <motion.div
        className="absolute top-[8%] left-[4%] opacity-90"
        animate={{ y: [0, -10, 0], rotate: [-4, -1, -4] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <TransportIcon mode="flight" size={56} />
      </motion.div>
      <motion.div
        className="absolute top-[12%] right-[5%] opacity-90"
        animate={{ y: [0, 8, 0], rotate: [3, 6, 3] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      >
        <TransportIcon mode="train" size={56} />
      </motion.div>
      <motion.div
        className="absolute bottom-[10%] left-[5%] opacity-90"
        animate={{ y: [0, -8, 0], rotate: [-6, -3, -6] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <TransportIcon mode="taxi" size={56} />
      </motion.div>
      <motion.div
        className="absolute bottom-[8%] right-[5%] opacity-90"
        animate={{ y: [0, 9, 0], rotate: [2, 6, 2] }}
        transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <TransportIcon mode="walk" size={56} />
      </motion.div>
    </div>
  );
}
