import "./globals.css";
import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import { RegionProvider } from "@/lib/region";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const display = Fraunces({
  subsets: ["latin"], variable: "--font-display",
  display: "swap", axes: ["SOFT", "WONK"], style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Voyage — Plan trips in 3D",
  description: "The smoothest travel planner. Real-time flights, hotels, attractions, weather, and visa info — all in one place.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable} bg-ink text-mist`}>
      <body className="noise antialiased overflow-x-hidden font-sans">
        <RegionProvider>{children}</RegionProvider>
      </body>
    </html>
  );
}
