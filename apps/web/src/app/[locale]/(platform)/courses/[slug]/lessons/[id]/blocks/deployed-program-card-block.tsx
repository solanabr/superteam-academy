"use client";

import dynamic from "next/dynamic";
import type { BlockRenderProps } from "./types";

const DeployPanel = dynamic(
  () =>
    import("@/components/deploy/deploy-panel").then((mod) => ({
      default: mod.DeployPanel,
    })),
  { ssr: false }
);

export function DeployedProgramCardBlock({ ctx }: BlockRenderProps) {
  return (
    <DeployPanel
      buildUuid={ctx.buildUuid ?? ""}
      lessonId={ctx.lesson._id}
      courseSlug={ctx.courseSlug}
      courseId={ctx.courseId}
      programKeypairSecret={ctx.programKeypairSecret ?? undefined}
      onBuildExpired={ctx.resetBuild}
    />
  );
}
