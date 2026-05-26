"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Plane, Hotel, Map, CloudSun, FileCheck, Sparkles } from "lucide-react";

const items = [
  { icon: Plane, title: "Live flight prices", desc: "Real airlines, real times, real fares — updated the moment you search.", color: "from-coral to-plum" },
  { icon: Hotel, title: "Hotels worth staying in", desc: "Photos, ratings, amenities, address — ranked to match your style.", color: "from-plum to-ocean" },
  { icon: Map, title: "Curated attractions", desc: "Hand-picked landmarks within walking distance of your hotel, mapped and reviewed.", color: "from-ocean to-aurora" },
  { icon: CloudSun, title: "7-day forecast", desc: "Hour-accurate weather for any destination. Pack the right jacket.", color: "from-aurora to-sand" },
  { icon: FileCheck, title: "Visa rules", desc: "Passport-aware entry requirements with type, duration, and notes.", color: "from-sand to-coral" },
  { icon: Sparkles, title: "Full trip in one search", desc: "Flights, hotels, attractions, weather, visa, and a day-by-day itinerary.", color: "from-coral to-aurora" },
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
      <div className={`relative group rounded-3xl glass p-8 md:p-10 overflow-hidden h-full`}>
        <div className={`absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition duration-700 bg-gradient-to-br ${item.color} blur-2xl`} />
        <div className="relative z-10">
          <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
            <Icon className="h-6 w-6 text-mist" />
          </div>
          <div className="text-xs uppercase tracking-[0.3em] text-mist/40 mb-3">0{i + 1}</div>
          <h3 className="h-display text-3xl md:text-4xl mb-3">{item.title}</h3>
          <p className="text-mist/65 leading-relaxed">{item.desc}</p>
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
            <div className="text-xs uppercase tracking-[0.4em] text-mist/40 mb-4">What you get</div>
            <h2 className="h-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl leading-[0.95] text-balance">
              Every piece of <span className="italic txt-gradient">a trip,</span> in one calm place.
            </h2>
          </div>
          <p className="max-w-md text-sm md:text-base text-mist/60">
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
