"use client";

import dynamic from "next/dynamic";
import { isLearnerDeployEnabled } from "@/lib/deploy/learner-deploy";
import { DeployPausedNotice } from "@/components/deploy/deploy-paused-notice";
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
  // Off on mainnet and unless the flag is on. The block is never required, so
  // the lesson still completes through its other blocks.
  if (!isLearnerDeployEnabled()) return <DeployPausedNotice variant="deploy" />;
  return (
    <DeployPanel
      buildUuid={ctx.buildUuid ?? ""}
      lessonId={ctx.lesson._id}
      courseSlug={ctx.courseSlug}
      courseId={ctx.courseId}
      programKeypairSecret={ctx.programKeypairSecret ?? undefined}
      xpReward={ctx.xpReward}
      isCompleted={ctx.isCompleted}
      canSubmit={ctx.canSubmit}
      onBuildExpired={ctx.resetBuild}
    />
  );
}
