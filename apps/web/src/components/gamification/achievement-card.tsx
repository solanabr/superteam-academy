"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { ProofPill } from "@/components/ui/proof-pill";

interface AchievementCardProps {
  name: string;
  description: string;
  glyph: string;
  solTier?: boolean;
  unlockedAt?: Date;
  explorerUrl?: string;
  assetAddress?: string;
  className?: string;
}

export function AchievementCard({
  name,
  // description is intentionally omitted from the medal grid view
  // (shown in tooltips or detail panels, not in the compact octagon layout)
  description: _description,
  glyph,
  solTier,
  unlockedAt,
  explorerUrl,
  assetAddress,
  className,
}: AchievementCardProps) {
  const t = useTranslations("gamification");
  const isUnlocked = !!unlockedAt;
  const isSol = isUnlocked && !!solTier;

  const medalState = isUnlocked ? (isSol ? "sol" : "earned") : "locked";
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "devnet";
  const cluster = network === "mainnet" ? "mainnet-beta" : network;

  const medal = (
    <div className={cn("ach-medal", medalState)} aria-hidden="true">
      <div className="ach-face" />
      <span className="ach-glyph">{glyph}</span>
    </div>
  );

  return (
    <div className={cn("ach-item group", className)}>
      {isUnlocked && explorerUrl ? (
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${name} — ${t("viewOnExplorer")}`}
          className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
        >
          {medal}
        </a>
      ) : (
        medal
      )}

      <div className="ach-info">
        <p className="ach-name">{name}</p>

        {isUnlocked && assetAddress && (
          <div className="ach-proof">
            <ProofPill
              address={assetAddress}
              type="account"
              network={cluster}
              className="text-[10px]"
            />
          </div>
        )}

        {!isUnlocked && (
          <p
            className="mt-0.5 font-mono text-[10px] font-semibold leading-tight"
            style={{ color: "var(--text-3)" }}
          >
            {t("locked")}
          </p>
        )}
      </div>
    </div>
  );
}
