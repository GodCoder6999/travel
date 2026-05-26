"use client";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";
import { useRef } from "react";

type Layer = { src: string; speed: number; top: string; left?: string; right?: string; w: string };

const layers: Layer[] = [
  { src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=2000&q=80", speed: -120, top: "10%", left: "-5%", w: "55%" },
  { src: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=2000&q=80", speed: -260, top: "30%", right: "-5%", w: "45%" },
  { src: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=2000&q=80", speed: -380, top: "60%", left: "8%", w: "38%" },
  { src: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=2000&q=80", speed: -520, top: "75%", right: "3%", w: "42%" },
];

function ParallaxImg({ layer, progress, i }: { layer: Layer; progress: MotionValue<number>; i: number }) {
  const y = useTransform(progress, [0, 1], [0, layer.speed]);
  const rotate = useTransform(progress, [0, 1], [i % 2 ? -8 : 8, 0]);
  return (
    <motion.div
      style={{
        y, rotate,
        top: layer.top, left: layer.left, right: layer.right, width: layer.w,
      }}
      className="absolute aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10"
    >
      <img src={layer.src} alt="" className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-paper/30 via-transparent to-transparent" />
    </motion.div>
  );
}

export default function Parallax() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  return (
    <section ref={ref} className="relative h-[140vh] overflow-hidden">
      {layers.map((l, i) => (
        <ParallaxImg key={i} layer={l} progress={scrollYProgress} i={i} />
      ))}
      <div className="sticky top-1/3 mx-auto w-full max-w-3xl text-center px-6 z-10">
        <div className="text-xs uppercase tracking-[0.4em] text-inkmist mb-4">The world, parallaxed</div>
        <h2 className="h-display text-5xl sm:text-6xl md:text-8xl text-balance text-ink">
          Wander <span className="italic txt-gradient">slower.</span>
        </h2>
        <p className="mt-4 max-w-md mx-auto text-sm md:text-base text-inkmist text-balance">
          Cards drift at their own speed as you scroll — same way Voyage lets every part of your trip
          breathe before you commit.
        </p>
      </div>
    </section>
  );
}
