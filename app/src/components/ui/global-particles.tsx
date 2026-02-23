"use client";

import { ParticleNetwork } from "@/components/ui/animated-grid";

export function GlobalParticles() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
      <ParticleNetwork className="opacity-30" />
    </div>
  );
}
