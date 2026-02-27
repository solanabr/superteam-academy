"use client";

import dynamic from "next/dynamic";

const ConstellationCanvas = dynamic(
  () =>
    import("@/components/ui/landing-animations").then(
      (m) => m.ConstellationCanvas,
    ),
  { ssr: false },
);

export function LazyConstellationCanvas() {
  return <ConstellationCanvas />;
}
