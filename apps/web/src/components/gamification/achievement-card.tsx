"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { ProofPill } from "@/components/ui/proof-pill";
import { AchievementPatch } from "@/components/gamification/achievement-patch";

interface AchievementCardProps {
  /** Content _id — drives the patch's tier + category (achievement-patches v1). */
  id: string;
  name: string;
  description: string;
  glyph: string;
  solTier?: boolean;
  category?: string;
  unlockedAt?: Date;
  explorerUrl?: string;
  assetAddress?: string;
  className?: string;
}

export function AchievementCard({
  id,
  name,
  // description is intentionally omitted from the patch grid view
  // (shown in tooltips or detail panels, not in the compact layout)
  description: _description,
  glyph,
  solTier,
  category,
  unlockedAt,
  explorerUrl,
  assetAddress,
  className,
}: AchievementCardProps) {
  const t = useTranslations("gamification");
  const isUnlocked = !!unlockedAt;
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "devnet";
  const cluster = network === "mainnet" ? "mainnet-beta" : network;

  const patch = (
    <AchievementPatch
      id={id}
      glyph={glyph}
      solTier={solTier}
      category={category}
      state={isUnlocked ? "earned" : "locked"}
    />
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
          {patch}
        </a>
      ) : (
        patch
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
