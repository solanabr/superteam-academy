"use client";

import dynamic from "next/dynamic";
import { BlockSkeleton } from "./block-skeleton";
import type { BlockRenderProps } from "./types";

const DeployPanel = dynamic(
  () =>
    import("@/components/deploy/deploy-panel").then((mod) => ({
      default: mod.DeployPanel,
    })),
  { ssr: false, loading: () => <BlockSkeleton height="20rem" /> }
);

export function DeployedProgramCardBlock({ ctx }: BlockRenderProps) {
  return (
    <DeployPanel
      buildUuid={ctx.buildUuid ?? ""}
      lessonId={ctx.lesson._id}
      courseSlug={ctx.courseSlug}
      courseId={ctx.courseId}
      programKeypairSecret={ctx.programKeypairSecret ?? undefined}
      xpReward={ctx.xpReward}
      earnedXp={ctx.earnedXp}
      isCompleted={ctx.isCompleted}
      canSubmit={ctx.canSubmit}
      nextLessonHref={ctx.nextLessonHref}
      onBuildExpired={ctx.resetBuild}
    />
  );
}
