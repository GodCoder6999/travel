import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0a0a0f",
        mist: "#f5f3ee",
        coral: "#ff5a5f",
        ocean: "#0c4b8e",
        sand: "#e8d9b5",
        aurora: "#6ee7b7",
        plum: "#7c3aed",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "system-ui"],
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "shimmer": "shimmer 3s linear infinite",
        "spin-slow": "spin 18s linear infinite",
        "marquee": "marquee 40s linear infinite",
      },
      keyframes: {
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-14px)" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
        marquee: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
      },
    },
  },
  plugins: [],
} satisfies Config;
