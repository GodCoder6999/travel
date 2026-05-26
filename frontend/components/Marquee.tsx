"use client";
const cities = ["Tokyo", "Paris", "Reykjavík", "Marrakech", "Cusco", "Kyoto", "Lisbon", "Hanoi", "Cape Town", "Istanbul", "Oaxaca", "Queenstown", "Bali", "Buenos Aires"];

export default function Marquee() {
  const row = [...cities, ...cities];
  return (
    <div className="relative overflow-hidden py-10 border-y border-white/5">
      <div className="flex gap-8 sm:gap-12 whitespace-nowrap animate-marquee will-change-transform">
        {row.map((c, i) => (
          <span key={i} className="h-display text-5xl sm:text-6xl md:text-8xl text-mist/30 hover:text-mist transition shrink-0">
            {c} <span className="text-coral">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
