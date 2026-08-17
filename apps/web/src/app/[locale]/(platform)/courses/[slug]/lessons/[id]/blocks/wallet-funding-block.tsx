"use client";

import dynamic from "next/dynamic";
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
  return <WalletFundingCard />;
}
