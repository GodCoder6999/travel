import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Travel-diary palette
        paper: "#fbf6ec",        // warm cream page
        cream: "#fff9ee",        // lighter cream for cards
        ink: "#1d1814",          // deep ink for text
        inkmist: "#5b5246",      // muted body text
        coral: "#ff6a5b",
        terracotta: "#c97b5f",
        sky: "#5b9fcd",
        skydeep: "#2e6e9e",
        sage: "#7fa57a",
        sun: "#f5b94e",
        plum: "#8b6ad3",
        rose: "#e8a39f",
        mist: "#f5f3ee",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "system-ui"],
        hand: ["var(--font-hand)", "cursive"],
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "shimmer": "shimmer 3s linear infinite",
        "spin-slow": "spin 18s linear infinite",
        "marquee": "marquee 40s linear infinite",
        "fly": "fly 4s linear infinite",
        "chug": "chug 1.6s ease-in-out infinite",
        "wheel": "wheel 0.8s linear infinite",
        "step": "step 0.8s ease-in-out infinite",
        "wave": "wave 4s ease-in-out infinite",
      },
      keyframes: {
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-14px)" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
        marquee: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
        fly: { "0%": { transform: "translateX(-30%) translateY(0)" }, "100%": { transform: "translateX(130%) translateY(-6px)" } },
        chug: { "0%,100%": { transform: "translateX(0)" }, "50%": { transform: "translateX(2px)" } },
        wheel: { "0%": { transform: "rotate(0)" }, "100%": { transform: "rotate(360deg)" } },
        step: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-3px)" } },
        wave: { "0%,100%": { transform: "translateX(0)" }, "50%": { transform: "translateX(8px)" } },
      },
      boxShadow: {
        polaroid: "0 10px 30px -10px rgba(29,24,20,0.18), 0 2px 8px rgba(29,24,20,0.08)",
        stamp: "0 0 0 2px #1d1814, 0 4px 10px rgba(29,24,20,0.15)",
      },
    },
  },
  plugins: [],
} satisfies Config;
