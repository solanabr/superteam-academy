"use client";

import { useTranslations } from "next-intl";
import { LAB_CLUSTER } from "@/lib/solana/lab";
import { cn } from "@/lib/utils";

/**
 * Shown on every lab card: the network the lab is on, and that its SOL is
 * test SOL with no value. The badge comes from the lab's cluster, not from the
 * app's network, which can be mainnet.
 */
export function LabNetworkNote({ className }: { className?: string }) {
  const t = useTranslations("deploy.lab");
  return (
    <p
      data-testid="lab-network-note"
      className={cn(
        "flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-3",
        className
      )}
    >
      <span className="rounded bg-[var(--success-bg)] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-success">
        {LAB_CLUSTER}
      </span>
      <span>{t("testSolNote")}</span>
    </p>
  );
}
