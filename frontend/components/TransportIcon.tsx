"use client";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";

type Mode = "walk" | "metro" | "taxi" | "drive" | "train" | "flight";

const Icon3D = dynamic(() => import("./TransportIcon3D").then((m) => m.TransportIcon3D), {
  ssr: false,
  loading: () => null,
});

const MODEL_URLS: Record<Mode, string> = {
  flight: "/models/plane.glb",
  train:  "/models/train.glb",
  metro:  "/models/metro.glb",
  taxi:   "/models/taxi.glb",
  drive:  "/models/car.glb",
  walk:   "/models/walker.glb",
};

function useHas(url: string): boolean | null {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch(url, { method: "HEAD" })
      .then((r) => { if (!cancelled) setOk(r.ok); })
      .catch(() => { if (!cancelled) setOk(false); });
    return () => { cancelled = true; };
  }, [url]);
  return ok;
}

export function TransportIcon({ mode, size = 48 }: { mode: Mode; size?: number }) {
  const has3D = useHas(MODEL_URLS[mode]);
  if (has3D) return <Icon3D mode={mode} size={size} />;
  // probing or 404 → animated SVG fallback
  const Map: Record<Mode, ReactNode> = {
    walk: <WalkIcon size={size} />,
    metro: <MetroIcon size={size} />,
    taxi: <TaxiIcon size={size} />,
    drive: <DriveIcon size={size} />,
    train: <TrainIcon size={size} />,
    flight: <FlightIcon size={size} />,
  };
  return Map[mode] || <FlightIcon size={size} />;
}

const COLORS = {
  body: "#1d1814",
  coral: "#ff6a5b",
  sky: "#5b9fcd",
  sun: "#f5b94e",
  sage: "#7fa57a",
  plum: "#8b6ad3",
  cream: "#fff9ee",
};

function Plate({ size, children, tilt = 0 }: { size: number; children: React.ReactNode; tilt?: number }) {
  return (
    <div
      style={{ width: size, height: size, transform: `rotate(${tilt}deg)` }}
      className="relative inline-block"
    >
      <svg viewBox="0 0 64 64" width={size} height={size} className="absolute inset-0">
        {children}
      </svg>
    </div>
  );
}

function FlightIcon({ size }: { size: number }) {
  return (
    <Plate size={size}>
      {/* sky disk */}
      <circle cx="32" cy="32" r="30" fill={COLORS.sky} opacity="0.18" />
      {/* clouds */}
      <motion.g
        animate={{ x: [-6, 6, -6] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <ellipse cx="14" cy="22" rx="6" ry="3" fill={COLORS.cream} />
        <ellipse cx="48" cy="44" rx="7" ry="3.2" fill={COLORS.cream} />
      </motion.g>
      {/* plane */}
      <motion.g
        animate={{ x: [-22, 22], y: [3, -3, 3] }}
        transition={{
          x: { duration: 2.8, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
          y: { duration: 1.6, repeat: Infinity, ease: "easeInOut" },
        }}
      >
        <g transform="translate(32 32)">
          <path d="M-10 0 L10 -2 L14 0 L10 2 L-10 0 Z" fill={COLORS.coral} />
          <path d="M-2 -1 L2 -8 L4 -8 L1 -1 Z" fill={COLORS.coral} />
          <path d="M-2 1 L2 8 L4 8 L1 1 Z" fill={COLORS.coral} />
          <circle cx="-7" cy="0" r="1.2" fill={COLORS.cream} />
        </g>
      </motion.g>
    </Plate>
  );
}

function TrainIcon({ size }: { size: number }) {
  return (
    <Plate size={size}>
      <circle cx="32" cy="32" r="30" fill={COLORS.sage} opacity="0.18" />
      {/* tracks */}
      <motion.g
        animate={{ x: [0, -8] }}
        transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
      >
        {[...Array(8)].map((_, i) => (
          <rect key={i} x={i * 8 + 2} y="44" width="4" height="2" fill={COLORS.body} opacity="0.5" />
        ))}
      </motion.g>
      <rect x="2" y="48" width="60" height="1.5" fill={COLORS.body} opacity="0.4" />
      {/* train body */}
      <motion.g
        animate={{ x: [-1, 1, -1] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <rect x="14" y="20" width="36" height="22" rx="3" fill={COLORS.coral} />
        <rect x="14" y="20" width="36" height="8" rx="3" fill={COLORS.cream} opacity="0.85" />
        <rect x="18" y="24" width="6" height="6" fill={COLORS.sky} />
        <rect x="28" y="24" width="6" height="6" fill={COLORS.sky} />
        <rect x="38" y="24" width="6" height="6" fill={COLORS.sky} />
        <circle cx="22" cy="44" r="3" fill={COLORS.body} />
        <circle cx="42" cy="44" r="3" fill={COLORS.body} />
        <circle cx="22" cy="44" r="1.2" fill={COLORS.sun} />
        <circle cx="42" cy="44" r="1.2" fill={COLORS.sun} />
      </motion.g>
    </Plate>
  );
}

function TaxiIcon({ size }: { size: number }) {
  return (
    <Plate size={size}>
      <circle cx="32" cy="32" r="30" fill={COLORS.sun} opacity="0.22" />
      <motion.g
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut" }}
      >
        <rect x="10" y="28" width="44" height="14" rx="4" fill={COLORS.sun} />
        <path d="M16 28 L22 18 L42 18 L48 28 Z" fill={COLORS.sun} />
        <rect x="24" y="20" width="16" height="6" fill={COLORS.cream} opacity="0.85" />
        <rect x="22" y="10" width="20" height="6" rx="1" fill={COLORS.body} />
        <text x="32" y="14.8" textAnchor="middle" fontSize="5" fill={COLORS.sun} fontWeight="700">TAXI</text>
      </motion.g>
      <motion.circle
        cx="18" cy="44" r="4" fill={COLORS.body}
        animate={{ rotate: 360 }} transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "18px 44px" }}
      />
      <motion.circle
        cx="46" cy="44" r="4" fill={COLORS.body}
        animate={{ rotate: 360 }} transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "46px 44px" }}
      />
    </Plate>
  );
}

function DriveIcon({ size }: { size: number }) {
  return (
    <Plate size={size}>
      <circle cx="32" cy="32" r="30" fill={COLORS.coral} opacity="0.18" />
      <motion.g animate={{ y: [0, -1.5, 0] }} transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}>
        <rect x="8" y="30" width="48" height="12" rx="6" fill={COLORS.coral} />
        <path d="M16 30 L22 20 L42 20 L48 30 Z" fill={COLORS.coral} />
        <rect x="24" y="22" width="16" height="6" fill={COLORS.cream} opacity="0.85" />
      </motion.g>
      <motion.circle cx="18" cy="44" r="4" fill={COLORS.body}
        animate={{ rotate: 360 }} transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "18px 44px" }} />
      <motion.circle cx="46" cy="44" r="4" fill={COLORS.body}
        animate={{ rotate: 360 }} transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "46px 44px" }} />
    </Plate>
  );
}

function MetroIcon({ size }: { size: number }) {
  return (
    <Plate size={size}>
      <circle cx="32" cy="32" r="30" fill={COLORS.plum} opacity="0.18" />
      <rect x="8" y="42" width="48" height="2" fill={COLORS.body} opacity="0.3" />
      <motion.g
        animate={{ x: [-4, 4, -4] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <rect x="14" y="18" width="36" height="24" rx="10" fill={COLORS.plum} />
        <rect x="18" y="22" width="6" height="8" rx="1" fill={COLORS.cream} />
        <rect x="28" y="22" width="6" height="8" rx="1" fill={COLORS.cream} />
        <rect x="38" y="22" width="6" height="8" rx="1" fill={COLORS.cream} />
        <circle cx="20" cy="36" r="1.6" fill={COLORS.sun} />
        <circle cx="44" cy="36" r="1.6" fill={COLORS.sun} />
      </motion.g>
    </Plate>
  );
}

function WalkIcon({ size }: { size: number }) {
  return (
    <Plate size={size}>
      <circle cx="32" cy="32" r="30" fill={COLORS.sage} opacity="0.18" />
      {/* head */}
      <circle cx="32" cy="16" r="5" fill={COLORS.body} />
      {/* body */}
      <motion.g
        animate={{ rotate: [-3, 3, -3] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "32px 28px" }}
      >
        <rect x="29" y="22" width="6" height="18" rx="2" fill={COLORS.coral} />
      </motion.g>
      {/* arms */}
      <motion.line x1="29" y1="26" x2="22" y2="34" stroke={COLORS.body} strokeWidth="2.5" strokeLinecap="round"
        animate={{ rotate: [-15, 15, -15] }}
        transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "29px 26px" }} />
      <motion.line x1="35" y1="26" x2="42" y2="34" stroke={COLORS.body} strokeWidth="2.5" strokeLinecap="round"
        animate={{ rotate: [15, -15, 15] }}
        transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "35px 26px" }} />
      {/* legs */}
      <motion.line x1="31" y1="40" x2="26" y2="52" stroke={COLORS.body} strokeWidth="2.8" strokeLinecap="round"
        animate={{ rotate: [-20, 20, -20] }}
        transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "31px 40px" }} />
      <motion.line x1="33" y1="40" x2="38" y2="52" stroke={COLORS.body} strokeWidth="2.8" strokeLinecap="round"
        animate={{ rotate: [20, -20, 20] }}
        transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "33px 40px" }} />
    </Plate>
  );
}

export default TransportIcon;
