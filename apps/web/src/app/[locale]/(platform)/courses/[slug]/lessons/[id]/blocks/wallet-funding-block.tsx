"use client";

import dynamic from "next/dynamic";
import type { BlockRenderProps } from "./types";

const WalletFundingCard = dynamic(
  () =>
    import("@/components/deploy/wallet-funding-card").then((mod) => ({
      default: mod.WalletFundingCard,
    })),
  { ssr: false }
);

export function WalletFundingBlock(_props: BlockRenderProps) {
  return <WalletFundingCard />;
}
