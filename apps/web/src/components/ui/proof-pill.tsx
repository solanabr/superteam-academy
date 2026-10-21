"use client";

import { useTranslations } from "next-intl";
import { explorerUrl, type SolanaCluster } from "@/lib/solana/network";
import { cn, truncateAddress } from "@/lib/utils";

interface ProofPillProps {
  address: string;
  type: "tx" | "account";
  /** Explorer cluster; defaults to the app's own. */
  cluster?: SolanaCluster;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}

export function ProofPill({
  address,
  type,
  cluster,
  className,
  onClick,
}: ProofPillProps) {
  const t = useTranslations("common");
  const url = explorerUrl(type === "tx" ? "tx" : "address", address, cluster);
  const label = truncateAddress(address, 4, 4);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "proof-pill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2",
        className
      )}
      aria-label={t("viewOnSolanaExplorer", { address })}
      onClick={onClick}
    >
      <span className="proof-dot" aria-hidden="true" />
      {label}
    </a>
  );
}
