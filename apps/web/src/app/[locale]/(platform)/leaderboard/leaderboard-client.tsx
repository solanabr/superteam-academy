"use client";

import { useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { Trophy, Crown, Lightning, Medal } from "@phosphor-icons/react";
import type { LeaderboardEntry } from "@superteam-lms/types";
import { LevelBadge } from "@/components/gamification/level-badge";
import { cn } from "@/lib/utils";

type Timeframe = "weekly" | "monthly" | "alltime";

interface LeaderboardClientProps {
  initialEntries: LeaderboardEntry[];
  initialTimeframe: Timeframe;
  currentUserId: string;
}

function truncateWallet(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

/* ── Podium card for ranks 1-3 ── */
function PodiumCard({
  entry,
  isCurrentUser,
  locale,
}: {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
  locale: string;
}) {
  const t = useTranslations("gamification");
  const initials = entry.username.slice(0, 2).toUpperCase();
  const rank = entry.rank;

  return (
    <Link
      href={`/${locale}/profile/${encodeURIComponent(entry.username)}`}
      className="block no-underline"
    >
      <div
        className={cn(
          "podium-card",
          rank === 1 && "gold",
          rank === 2 && "silver",
          rank === 3 && "bronze",
          isCurrentUser && "me"
        )}
      >
        {/* Rank icon */}
        <div className="podium-rank-icon">
          {rank === 1 ? (
            <Crown size={20} weight="fill" />
          ) : rank === 2 ? (
            <Medal size={20} weight="fill" />
          ) : (
            <Lightning size={20} weight="fill" />
          )}
        </div>

        {/* Avatar */}
        <div className={cn("podium-avatar", rank === 1 && "gold")}>
          {entry.avatarUrl ? (
            <img
              src={entry.avatarUrl}
              alt=""
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <span>{initials}</span>
          )}
        </div>

        {/* Name */}
        <div className="podium-name">
          <span className="truncate">{entry.username}</span>
          {isCurrentUser && <span className="lb-me-tag">{t("you")}</span>}
        </div>

        {/* XP */}
        <div className="podium-xp">{entry.totalXp.toLocaleString()} XP</div>

        {/* Level badge */}
        <LevelBadge level={entry.level} size="sm" />
      </div>
    </Link>
  );
}

/* ── Ranked row for positions 4+ ── */
function RankedRow({
  entry,
  isCurrentUser,
  locale,
}: {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
  locale: string;
}) {
  const t = useTranslations("gamification");
  const initials = entry.username.slice(0, 2).toUpperCase();

  return (
    <Link
      href={`/${locale}/profile/${encodeURIComponent(entry.username)}`}
      className="block no-underline"
    >
      <div className={cn("lb-row", isCurrentUser && "me")}>
        <span className="lb-rank" aria-label={`Rank ${entry.rank}`}>
          {entry.rank}
        </span>

        <div className="lb-av" aria-hidden="true">
          {entry.avatarUrl ? (
            <img
              src={entry.avatarUrl}
              alt=""
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <span>{initials}</span>
          )}
        </div>

        <div className="lb-info">
          <div className="lb-name">
            <span className="truncate">{entry.username}</span>
            {isCurrentUser && <span className="lb-me-tag">{t("you")}</span>}
          </div>
          {entry.walletAddress && (
            <div className="lb-wallet">
              {truncateWallet(entry.walletAddress)}
            </div>
          )}
        </div>

        <div className="lb-right">
          <LevelBadge level={entry.level} size="sm" />
          <span className="lb-xp">{entry.totalXp.toLocaleString()} XP</span>
        </div>
      </div>
    </Link>
  );
}

export function LeaderboardClient({
  initialEntries,
  initialTimeframe,
  currentUserId,
}: LeaderboardClientProps) {
  const t = useTranslations("gamification");
  const locale = useLocale();
  const [timeframe, setTimeframe] = useState<Timeframe>(initialTimeframe);
  const [entries, setEntries] = useState<LeaderboardEntry[]>(initialEntries);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLeaderboard = useCallback(async (tf: Timeframe) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/leaderboard?timeframe=${tf}`);
      if (!res.ok) {
        setEntries([]);
        return;
      }
      const { entries: leaderboard } = (await res.json()) as {
        entries: LeaderboardEntry[];
      };
      setEntries(leaderboard);
    } catch {
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleTimeframeChange = useCallback(
    (tf: Timeframe) => {
      setTimeframe(tf);
      fetchLeaderboard(tf);
    },
    [fetchLeaderboard]
  );

  // Split entries into podium (top 3) and rest
  const podiumEntries = entries.slice(0, 3);
  const restEntries = entries.slice(3);

  // Reorder podium: [2nd, 1st, 3rd] for visual layout
  const podiumOrdered: LeaderboardEntry[] =
    podiumEntries.length >= 3
      ? [podiumEntries[1]!, podiumEntries[0]!, podiumEntries[2]!]
      : podiumEntries;

  const TIMEFRAMES: Timeframe[] = ["weekly", "monthly", "alltime"];

  return (
    <div className="lb-page">
      {/* Header */}
      <div className="lb-header">
        <h1 className="font-display text-3xl font-black tracking-[-0.5px]">
          {t("leaderboard")}
        </h1>
        <p className="mt-1 text-text-3">
          {t("rank")} — {t(timeframe === "alltime" ? "allTime" : timeframe)}
        </p>
      </div>

      {/* Timeframe tabs — underline style matching catalog-tabs */}
      <div className="lb-timeframe-tabs">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf}
            onClick={() => handleTimeframeChange(tf)}
            className={cn("lb-tf-tab", timeframe === tf && "active")}
          >
            {t(tf === "alltime" ? "allTime" : tf)}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="sr-only">Loading...</span>
        </div>
      ) : entries.length === 0 ? (
        <div className="lb-empty">
          <Trophy size={48} weight="duotone" aria-hidden="true" />
          <p>{t("noEntries")}</p>
        </div>
      ) : (
        <>
          {/* ═══ Podium ═══ */}
          <div
            className={cn(
              "podium-grid",
              podiumEntries.length < 3 && "podium-compact"
            )}
          >
            {podiumOrdered.map((entry) => (
              <PodiumCard
                key={entry.userId}
                entry={entry}
                isCurrentUser={entry.userId === currentUserId}
                locale={locale}
              />
            ))}
          </div>

          {/* ═══ Ranked List ═══ */}
          {restEntries.length > 0 && (
            <div className="lb-list">
              {restEntries.map((entry) => (
                <RankedRow
                  key={entry.userId}
                  entry={entry}
                  isCurrentUser={entry.userId === currentUserId}
                  locale={locale}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
