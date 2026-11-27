"use client";

import dynamic from "next/dynamic";
import { isLearnerDeployEnabled } from "@/lib/deploy/learner-deploy";
import { DeployPausedNotice } from "@/components/deploy/deploy-paused-notice";
import { LabEnrollNotice } from "@/components/deploy/lab-key-note";
import { BlockSkeleton } from "./block-skeleton";
import type { BlockRenderProps } from "./types";

const WalletFundingCard = dynamic(
  () =>
    import("@/components/deploy/wallet-funding-card").then((mod) => ({
      default: mod.WalletFundingCard,
    })),
  { ssr: false, loading: () => <BlockSkeleton height="14rem" /> }
);

export function WalletFundingBlock({ ctx }: BlockRenderProps) {
  // Funding only exists to pay for the in-lesson deploy.
  if (!isLearnerDeployEnabled())
    return <DeployPausedNotice variant="funding" />;
  // The lab is for learners enrolled in the course. The card is not mounted
  // for anyone else, so no lab key is made for them.
  if (!ctx.isEnrolled) return <LabEnrollNotice />;
  return <WalletFundingCard />;
}
