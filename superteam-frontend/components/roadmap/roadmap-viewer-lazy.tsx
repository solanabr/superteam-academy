"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import type { RoadmapDef } from "@/lib/roadmaps/types";

const RoadmapViewer = dynamic(
  () =>
    import("@/components/roadmap/roadmap-viewer").then(
      (mod) => mod.RoadmapViewer,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    ),
  },
);

export function RoadmapViewerLazy({ roadmap }: { roadmap: RoadmapDef }) {
  return <RoadmapViewer roadmap={roadmap} />;
}
