"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { User } from "@phosphor-icons/react";
import { LevelBadge } from "@/components/gamification/level-badge";
import { RankMarker } from "@/components/leaderboard/rank-marker";
import { cn } from "@/lib/utils";

/**
 * The podium card for ranks 1-3, shared by the Global board and the League
 * (cohort) board.
 *
 * Shared rather than duplicated for the same reason `RankMarker` is: the
 * 40cd9caf spec gives ranks 1-3 a solid gold/silver/bronze card and everything
 * below a dashed row, and the dashed rows only read as "below the podium"
 * while the podium is actually there to contrast against. The League tab had
 * no podium at all, so its rank 1 was just another dashed row.
 *
 * The props are deliberately neutral — a display name, a value string, an
 * optional profile href — because the two boards carry different data: the
 * global board shows lifetime XP plus a level badge, while a cohort shows the
 * WEEKLY league score and can carry anonymized members (a private or deleted
 * account, which the RPC anonymizes rather than dropping so ranks stay
 * contiguous).
 */
export interface PodiumCardProps {
  /** 1, 2 or 3 — drives the gold/silver/bronze treatment and the rank tab. */
  rank: number;
  /** Display name, already resolved (may be the "Anonymous learner" string). */
  name: string;
  /** Two-letter monogram, or null to show the neutral icon instead. */
  initials: string | null;
  avatarUrl: string | null;
  /** The headline value, pre-formatted (e.g. "1,275 XP" or "+1,275 XP"). */
  value: string;
  /** Accessible label for the value where the visible text needs framing. */
  valueAriaLabel?: string;
  isYou: boolean;
  /** Profile link, or null when the member is not linkable. */
  href: string | null;
  /** Global board only; omitted on a cohort, which has no lifetime level. */
  level?: number;
  /** Mutes the name — an anonymized member is not a real display name. */
  anonymized?: boolean;
}

export function PodiumCard({
  rank,
  name,
  initials,
  avatarUrl,
  value,
  valueAriaLabel,
  isYou,
  href,
  level,
  anonymized = false,
}: PodiumCardProps) {
  const t = useTranslations("gamification");

  const card = (
    <div
      className={cn(
        "podium-card",
        rank === 1 && "gold",
        rank === 2 && "silver",
        rank === 3 && "bronze",
        isYou && "me"
      )}
    >
      {/* Notched rank ribbon, locked to the card's top-left corner. Gold,
          silver and bronze mean rank and nothing else. */}
      <RankMarker rank={rank} />

      <div className={cn("podium-avatar", rank === 1 && "gold")}>
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt=""
            width={64}
            height={64}
            unoptimized
            className="h-full w-full rounded-full object-cover"
          />
        ) : initials ? (
          <span>{initials}</span>
        ) : (
          <User size={22} weight="bold" aria-hidden="true" />
        )}
      </div>

      <div className="podium-name">
        <span className={cn("truncate", anonymized && "text-text-3")}>
          {name}
        </span>
        {isYou && <span className="lb-me-tag">{t("you")}</span>}
      </div>

      <div className="podium-xp" aria-label={valueAriaLabel}>
        {value}
      </div>

      {/* Level = floor(sqrt(XP/100)) legitimately yields 0 early on — a
          "0" coin reads as broken, so the badge waits for level 1. */}
      {level !== undefined && level >= 1 && (
        <LevelBadge level={level} size={30} />
      )}
    </div>
  );

  // Anonymized members (and the viewer's own private row) are not linkable.
  if (!href) return card;

  return (
    <Link href={href} className="block no-underline">
      {card}
    </Link>
  );
}

/**
 * Splits a ranked list into the podium (top 3) and the rows below it, with the
 * podium reordered 2-1-3 so the winner stands in the middle.
 *
 * A short board keeps whatever it has — one or two entries render as a
 * compact podium rather than leaving gaps (`podium-compact`).
 */
export function splitPodium<T>(entries: T[]): {
  podium: T[];
  podiumOrdered: T[];
  rest: T[];
  compact: boolean;
} {
  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);
  const podiumOrdered =
    podium.length >= 3 ? [podium[1]!, podium[0]!, podium[2]!] : podium;

  return { podium, podiumOrdered, rest, compact: podium.length < 3 };
}
