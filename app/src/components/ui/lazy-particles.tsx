"use client";

import dynamic from "next/dynamic";

const ParticleNetwork = dynamic(
  () => import("@/components/ui/animated-grid").then((m) => m.ParticleNetwork),
  { ssr: false },
);

export function LazyParticles() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
      <ParticleNetwork className="opacity-30" />
    </div>
  );
}
