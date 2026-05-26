"use client";
import { useRef } from "react";
import SmoothScroll from "@/components/SmoothScroll";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Parallax from "@/components/Parallax";
import Marquee from "@/components/Marquee";
import TripWizard from "@/components/TripWizard";
import Footer from "@/components/Footer";

export default function Page() {
  const planRef = useRef<HTMLDivElement>(null);
  const scrollToPlan = () => planRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <>
      <SmoothScroll />
      <Nav onPlan={scrollToPlan} />
      <main>
        <Hero onPlan={scrollToPlan} />
        <Features />
        <Parallax />
        <div id="cities"><Marquee /></div>
        <TripWizard ref={planRef} />
        <Footer />
      </main>
    </>
  );
}
