"use client";

import { useTranslations } from "next-intl";
import { cn, truncateAddress } from "@/lib/utils";

interface ProofPillProps {
  address: string;
  type: "tx" | "account";
  network: string;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}

function getExplorerUrl(
  address: string,
  type: "tx" | "account",
  network: string
): string {
  const base = "https://explorer.solana.com";
  const path = type === "tx" ? `/tx/${address}` : `/address/${address}`;
  const cluster = network === "mainnet-beta" ? "" : `?cluster=${network}`;
  return `${base}${path}${cluster}`;
}

export function ProofPill({
  address,
  type,
  network,
  className,
  onClick,
}: ProofPillProps) {
  const t = useTranslations("common");
  const url = getExplorerUrl(address, type, network);
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
