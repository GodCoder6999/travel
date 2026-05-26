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
        {/* Soft sun */}
        <div className="absolute top-[12%] right-[12%] w-72 h-72 rounded-full bg-sun/40 blur-3xl" />
        <div className="absolute bottom-[18%] left-[8%] w-80 h-80 rounded-full bg-sky/30 blur-3xl" />

        {/* Globe */}
        <div className="absolute inset-0 z-0 opacity-90">
          <Globe3D scrollY={scrollY} />
        </div>

        {/* Floating transport stickers */}
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
          <h1 className="h-display font-bold leading-[0.9] tracking-tight text-balance text-ink"
              style={{ fontSize: "clamp(2.75rem, 11vw, 10rem)" }}>
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
            <a href="#features" className="rounded-full border-2 border-ink/80 px-6 py-3 hover:bg-ink hover:text-cream transition font-medium">
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
        className="absolute top-[14%] left-[6%]"
        animate={{ y: [0, -12, 0], rotate: [-6, -3, -6] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <TransportIcon mode="flight" size={84} />
      </motion.div>
      <motion.div
        className="absolute top-[20%] right-[8%]"
        animate={{ y: [0, 8, 0], rotate: [4, 7, 4] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      >
        <TransportIcon mode="train" size={72} />
      </motion.div>
      <motion.div
        className="absolute bottom-[22%] left-[10%]"
        animate={{ y: [0, -10, 0], rotate: [-8, -5, -8] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <TransportIcon mode="taxi" size={68} />
      </motion.div>
      <motion.div
        className="absolute bottom-[18%] right-[12%]"
        animate={{ y: [0, 9, 0], rotate: [3, 8, 3] }}
        transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <TransportIcon mode="walk" size={64} />
      </motion.div>
    </div>
  );
}
