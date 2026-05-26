"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Plane, Hotel, Map, CloudSun, FileCheck, Sparkles } from "lucide-react";

const items = [
  { icon: Plane, title: "Live flight prices", desc: "Real airlines, real times, real fares — updated the moment you search.", tint: "bg-coral/15", line: "border-coral/40" },
  { icon: Hotel, title: "Hotels worth staying in", desc: "Photos, ratings, amenities, address — ranked to match your style.", tint: "bg-sky/15", line: "border-sky/40" },
  { icon: Map, title: "Curated attractions", desc: "Hand-picked landmarks within walking distance of your hotel, mapped and reviewed.", tint: "bg-sage/15", line: "border-sage/40" },
  { icon: CloudSun, title: "7-day forecast", desc: "Hour-accurate weather for any destination. Pack the right jacket.", tint: "bg-sun/20", line: "border-sun/50" },
  { icon: FileCheck, title: "Visa rules", desc: "Passport-aware entry requirements with type, duration, and notes.", tint: "bg-plum/15", line: "border-plum/40" },
  { icon: Sparkles, title: "Full trip in one search", desc: "Flights, hotels, attractions, weather, visa, and a day-by-day itinerary.", tint: "bg-rose/25", line: "border-rose/50" },
];

function Card({ i, item }: { i: number; item: typeof items[number] }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [22, 0, -18]);
  const y = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.3, 1, 1, 0.3]);
  const Icon = item.icon;
  return (
    <motion.div
      ref={ref}
      style={{ rotateX, y, opacity, transformStyle: "preserve-3d" }}
      className="perspective"
    >
      <div className={`relative group rounded-3xl card-ink p-8 md:p-10 overflow-hidden h-full border-l-4 ${item.line}`}>
        <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full ${item.tint} blur-2xl opacity-80`} />
        <div className="relative z-10">
          <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-paper border border-ink/15">
            <Icon className="h-6 w-6 text-ink" />
          </div>
          <div className="text-xs uppercase tracking-[0.3em] text-inkmist mb-3">No. 0{i + 1}</div>
          <h3 className="h-display text-3xl md:text-4xl mb-3 text-ink">{item.title}</h3>
          <p className="text-inkmist leading-relaxed">{item.desc}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function Features() {
  return (
    <section id="features" className="section-pad relative">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 md:mb-20 flex items-end justify-between gap-6 md:gap-8 flex-wrap">
          <div className="flex-1 min-w-[280px]">
            <div className="text-xs uppercase tracking-[0.4em] text-inkmist mb-4">What you get</div>
            <h2 className="h-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl leading-[0.95] text-balance text-ink">
              Every piece of <span className="italic txt-gradient">a trip,</span> in one calm place.
            </h2>
          </div>
          <p className="max-w-md text-sm md:text-base text-inkmist">
            No more 17 tabs. One search builds the whole trip — flights to forecast.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 perspective">
          {items.map((it, i) => <Card key={i} i={i} item={it} />)}
        </div>
      </div>
    </section>
  );
}
