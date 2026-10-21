"use client";

import dynamic from "next/dynamic";
import type { ProgramExplorerBlockData } from "@superteam-lms/types";
import { isLearnerDeployEnabled } from "@/lib/deploy/learner-deploy";
import { DeployPausedNotice } from "@/components/deploy/deploy-paused-notice";
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
  // It sends learner-signed transactions through the app's RPC, so it follows
  // the same rule as the deploy panel: off on mainnet and unless the flag is on.
  if (!isLearnerDeployEnabled()) {
    return <DeployPausedNotice variant="explorer" />;
  }
  return (
    <GenericProgramExplorer
      idlJson={b.idl}
      courseSlug={ctx.courseSlug}
      courseId={ctx.courseId}
    />
  );
}
