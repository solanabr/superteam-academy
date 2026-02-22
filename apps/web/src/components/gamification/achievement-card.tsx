"use client";

import { useTranslations } from "next-intl";
import { GLYPH_MAP, SOL_TIER_IDS } from "@/lib/gamification/achievement-meta";
import { cn } from "@/lib/utils";

interface AchievementCardProps {
  id: string;
  name: string;
  description: string;
  unlockedAt?: Date;
  explorerUrl?: string;
  className?: string;
}

export function AchievementCard({
  id,
  name,
  // description is intentionally omitted from the medal grid view
  // (shown in tooltips or detail panels, not in the compact octagon layout)
  description: _description,
  unlockedAt,
  explorerUrl,
  className,
}: AchievementCardProps) {
  const t = useTranslations("gamification");
  const isUnlocked = !!unlockedAt;
  const isSol = isUnlocked && SOL_TIER_IDS.has(id);
  const glyph = GLYPH_MAP[id] ?? id.slice(-2).toUpperCase();

  const medalState = isUnlocked ? (isSol ? "sol" : "earned") : "locked";

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

        {isUnlocked && (
          <div className="ach-proof">
            {explorerUrl ? (
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="proof-pill"
                aria-label={`${name} — ${t("viewOnExplorer")}`}
                tabIndex={-1}
              >
                <span className="proof-dot" aria-hidden="true" />
                {t("onChain")}
              </a>
            ) : (
              <span className="proof-pill">
                <span className="proof-dot" aria-hidden="true" />
                {t("onChain")}
              </span>
            )}
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
