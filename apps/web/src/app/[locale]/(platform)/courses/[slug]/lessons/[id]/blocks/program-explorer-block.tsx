"use client";

import dynamic from "next/dynamic";
import type { ProgramExplorerBlockData } from "@superteam-lms/types";
import { isLearnerDeployEnabled } from "@/lib/deploy/learner-deploy";
import { DeployPausedNotice } from "@/components/deploy/deploy-paused-notice";
import { LabEnrollNotice } from "@/components/deploy/lab-key-note";
import { BlockSkeleton } from "./block-skeleton";
import type { BlockRenderProps } from "./types";

const GenericProgramExplorer = dynamic(
  () =>
    import("@/components/deploy/generic-program-explorer").then((mod) => ({
      default: mod.GenericProgramExplorer,
    })),
  { ssr: false, loading: () => <BlockSkeleton height="24rem" /> }
);

export function ProgramExplorerBlock({ block, ctx }: BlockRenderProps) {
  const b = block as ProgramExplorerBlockData;
  if (!b.idl) return null;
  // It sends transactions signed by the lab key through the lab RPC, so it
  // follows the same rules as the deploy panel: off unless the lab is on, and
  // for enrolled learners only.
  if (!isLearnerDeployEnabled()) {
    return <DeployPausedNotice variant="explorer" />;
  }
  if (!ctx.isEnrolled) return <LabEnrollNotice />;
  return (
    <GenericProgramExplorer
      idlJson={b.idl}
      courseSlug={ctx.courseSlug}
      courseId={ctx.courseId}
    />
  );
}
