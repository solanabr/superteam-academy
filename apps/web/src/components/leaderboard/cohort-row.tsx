"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { User } from "@phosphor-icons/react";
import type { CohortLeaderboardEntry } from "@superteam-lms/types";
import { cn } from "@/lib/utils";
import { RankMarker, topRankAttr } from "@/components/leaderboard/rank-marker";

interface CohortRowProps {
  entry: CohortLeaderboardEntry;
  style?: React.CSSProperties;
}

/**
 * One cohort-league row (LX-B9b). Private/deleted members arrive with a null
 * username (anonymized by the RPC, never dropped) and render as "Anonymous
 * learner" with a neutral avatar and no profile link. The viewer's own row is
 * highlighted and labeled "You" even when anonymized.
 */
export function CohortRow({ entry, style }: CohortRowProps) {
  const t = useTranslations("gamification");
  const locale = useLocale();

  const anonymized = !entry.username;
  const displayName = entry.username ?? t("anonymousLearner");
  const initials = entry.username
    ? entry.username.slice(0, 2).toUpperCase()
    : null;

  const inner = (
    // data-top marks the three ranks that carry a tab; they keep the solid card
    // while everything below drops to a dashed outline. The League tab has no
    // separate podium, so rank 1 appears here as a row — without this the whole
    // board went dashed (owner, 21-08).
    <div
      className={cn("lb-row", entry.isYou && "me")}
      data-top={topRankAttr(entry.rank)}
      style={style}
    >
      <RankMarker rank={entry.rank} />

      <div className="lb-av" aria-hidden="true">
        {entry.avatarUrl ? (
          <Image
            src={entry.avatarUrl}
            alt=""
            width={64}
            height={64}
            unoptimized
            className="h-full w-full rounded-full object-cover"
          />
        ) : initials ? (
          <span>{initials}</span>
        ) : (
          <User size={18} weight="bold" />
        )}
      </div>

      <div className="lb-info">
        <div className="lb-name">
          <span className={cn("truncate", anonymized && "text-text-3")}>
            {displayName}
          </span>
          {entry.isYou && <span className="lb-me-tag">{t("you")}</span>}
        </div>
      </div>

      <div className="lb-right">
        {/* League score is WEEKLY league-eligible XP (#789) — the '+' frames it
            as points earned this period, distinct from the lifetime header
            total; the surface subtitle + this aria-label carry "this week". */}
        <span
          // Zero is not a reward: amber only once there are points this week.
          className={entry.score > 0 ? "lb-xp" : "lb-xp lb-xp--zero"}
          aria-label={t("leagueScoreAria", {
            score: entry.score.toLocaleString(),
          })}
        >
          +{entry.score.toLocaleString()} XP
        </span>
      </div>
    </div>
  );

  // Named public profiles link out; anonymized members (and the viewer's own
  // private row) are not linkable.
  if (anonymized) return inner;

  return (
    <Link
      href={`/${locale}/profile/${encodeURIComponent(entry.username!)}`}
      className="block no-underline"
    >
      {inner}
    </Link>
  );
}
