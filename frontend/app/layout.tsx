import "./globals.css";
import type { Metadata } from "next";
import { Inter, Fraunces, Caveat } from "next/font/google";
import { RegionProvider } from "@/lib/region";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const display = Fraunces({
  subsets: ["latin"], variable: "--font-display",
  display: "swap", axes: ["SOFT", "WONK"], style: ["normal", "italic"],
});
const hand = Caveat({ subsets: ["latin"], variable: "--font-hand", display: "swap", weight: ["400", "600"] });

export const metadata: Metadata = {
  title: "Voyage — Plan trips in 3D",
  description: "A travel diary that plans itself. Real-time flights, hotels, attractions, weather, and visa info.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable} ${hand.variable}`}>
      <body className="paper-bg noise antialiased overflow-x-hidden font-sans text-ink">
        <RegionProvider>{children}</RegionProvider>
      </body>
    </html>
  );
}
