"use client";

import { Hero } from "@/components/Hero";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen text-white">
      <Hero />
      <Footer />
    </main>
  );
}
