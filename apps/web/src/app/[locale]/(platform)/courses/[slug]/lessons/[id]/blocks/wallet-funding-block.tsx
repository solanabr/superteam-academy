"use client";

import dynamic from "next/dynamic";
import { isLearnerDeployEnabled } from "@/lib/deploy/learner-deploy";
import { DeployPausedNotice } from "@/components/deploy/deploy-paused-notice";
import { BlockSkeleton } from "./block-skeleton";
import type { BlockRenderProps } from "./types";

const WalletFundingCard = dynamic(
  () =>
    import("@/components/deploy/wallet-funding-card").then((mod) => ({
      default: mod.WalletFundingCard,
    })),
  { ssr: false, loading: () => <BlockSkeleton height="14rem" /> }
);

export function WalletFundingBlock(_props: BlockRenderProps) {
  // Funding only exists to pay for the in-lesson deploy.
  if (!isLearnerDeployEnabled())
    return <DeployPausedNotice variant="funding" />;
  return <WalletFundingCard />;
}
