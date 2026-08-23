"use client";

import { useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { Trophy, UsersThree, Info, Gift } from "@phosphor-icons/react";
import * as Tooltip from "@radix-ui/react-tooltip";
import type {
  LeaderboardEntry,
  CohortLeague,
  CohortLeaderboardEntry,
} from "@superteam-lms/types";
import { GlyphChip } from "@/components/gamification/glyph-chip";
import { LevelBadge } from "@/components/gamification/level-badge";
import { CohortRow } from "@/components/leaderboard/cohort-row";
import { RankMarker, topRankAttr } from "@/components/leaderboard/rank-marker";
import { PodiumCard, splitPodium } from "@/components/leaderboard/podium-card";
import { ReferralBoard } from "@/components/leaderboard/referral-board";
import { cn } from "@/lib/utils";

type Timeframe = "weekly" | "monthly" | "alltime";
type Board = "league" | "global" | "referrals";

interface LeaderboardClientProps {
  initialGlobalEntries: LeaderboardEntry[];
  initialCohort: CohortLeague | null;
  currentUserId: string;
}

/** Localized league tier name (1-based), clamped to the four seeded tiers. */
function tierName(t: (k: string) => string, tier: number): string {
  const clamped = Math.min(Math.max(tier, 1), 4);
  return t(`leagueTier${clamped}`);
}

/* ── Podium card for ranks 1-3 (global board) — a thin adapter over the
      shared card, which the League board uses too. ── */
function GlobalPodiumCard({
  entry,
  isCurrentUser,
  locale,
}: {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
  locale: string;
}) {
  return (
    <PodiumCard
      rank={entry.rank}
      name={entry.username}
      initials={entry.username.slice(0, 2).toUpperCase()}
      avatarUrl={entry.avatarUrl}
      value={`${entry.totalXp.toLocaleString()} XP`}
      isYou={isCurrentUser}
      href={`/${locale}/profile/${encodeURIComponent(entry.username)}`}
      level={entry.level}
    />
  );
}

/* ── Ranked row for positions 4+ (global board) ── */
function RankedRow({
  entry,
  isCurrentUser,
  locale,
  style,
}: {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
  locale: string;
  style?: React.CSSProperties;
}) {
  const t = useTranslations("gamification");
  const initials = entry.username.slice(0, 2).toUpperCase();

  return (
    <Link
      href={`/${locale}/profile/${encodeURIComponent(entry.username)}`}
      className="block no-underline"
    >
      {/* data-top marks the three ranks that carry a tab; they keep the solid
          card while everything below drops to a dashed outline. Shared with the
          cohort row so the two lists can never disagree about the treatment. */}
      <div
        className={cn("lb-row", isCurrentUser && "me")}
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
            <div className="lb-wallet">{entry.walletAddress}</div>
          )}
        </div>

        <div className="lb-right">
          {entry.level >= 1 && <LevelBadge level={entry.level} size={30} />}
          <span className="lb-xp">{entry.totalXp.toLocaleString()} XP</span>
        </div>
      </div>
    </Link>
  );
}

/* ── Podium card for a cohort's top 3 — the second adapter over the shared
      card. A cohort shows the WEEKLY score and can carry anonymized members,
      so it maps those rather than reusing the global adapter. ── */
function CohortPodiumCard({
  entry,
  locale,
}: {
  entry: CohortLeaderboardEntry;
  locale: string;
}) {
  const t = useTranslations("gamification");

  const anonymized = !entry.username;

  return (
    <PodiumCard
      rank={entry.rank}
      name={entry.username ?? t("anonymousLearner")}
      initials={
        entry.username ? entry.username.slice(0, 2).toUpperCase() : null
      }
      avatarUrl={entry.avatarUrl}
      // The '+' frames it as points earned this period, matching the rows
      // below (#789); the aria-label carries "this week".
      value={`+${entry.score.toLocaleString()} XP`}
      valueAriaLabel={t("leagueScoreAria", {
        score: entry.score.toLocaleString(),
      })}
      isYou={entry.isYou}
      href={
        anonymized
          ? null
          : `/${locale}/profile/${encodeURIComponent(entry.username!)}`
      }
      anonymized={anonymized}
    />
  );
}

/* ── League (cohort) board — the primary view ── */
function LeagueBoard({
  cohort,
  locale,
}: {
  cohort: CohortLeague | null;
  locale: string;
}) {
  const t = useTranslations("gamification");

  if (!cohort) {
    return (
      <div className="lb-empty">
        <GlyphChip glyph="◍" size={48} empty />
        <p>{t("leagueSignIn")}</p>
      </div>
    );
  }

  if (cohort.entries.length === 0) {
    return (
      <div className="lb-empty">
        <GlyphChip glyph="◍" size={48} empty />
        <p>{t("noEntries")}</p>
      </div>
    );
  }

  const { podium, rest, compact } = splitPodium(cohort.entries);

  return (
    <>
      <div className="lb-league-head">
        {/* The league identity mark, matching the dashboard's league strip —
            a league is a cohort of people, so it takes the community mark.
            40px keeps the header's presence; the strip's solo state uses 24.
            `.lb-league-icon` stays in the stylesheet: the Referrals tab still
            uses that disc for its own (gift) icon. */}
        <GlyphChip glyph="◍" cat="community" size={40} />
        <div className="min-w-0 flex-1">
          {/* The ⓘ sits beside the tier name it explains — parked at the far
              end of a full-width line it read as unrelated (05-08). */}
          <p className="lb-league-tier">
            {tierName(t, cohort.tier)}
            <LeagueScoringInfo />
          </p>
          {/* "This week" leads the subtitle so the league values read as weekly,
              not lifetime (#789). */}
          <p className="lb-league-sub">
            {t("leagueThisWeek")} ·{" "}
            {t("cohortMembers", { count: cohort.memberCount })} ·{" "}
            {t("leagueResets")}
          </p>
        </div>
      </div>

      {/* The League tab gets the same podium as the Global board (owner,
          22-08). Without it the whole cohort rendered as dashed rank-4+ rows,
          including its rank 1 — the dashed treatment only reads correctly
          against a solid podium. */}
      <div className={cn("podium-grid", compact && "podium-compact")}>
        {podium.map((entry) => (
          <CohortPodiumCard key={entry.rank} entry={entry} locale={locale} />
        ))}
      </div>

      <div className="lb-list">
        {rest.map((entry, i) => (
          <CohortRow
            key={entry.rank}
            entry={entry}
            style={{ "--i": i } as React.CSSProperties}
          />
        ))}
      </div>
    </>
  );
}

/* ── Info affordance explaining league scoring (weekly, eligible sources) ── */
function LeagueScoringInfo() {
  const t = useTranslations("gamification");
  return (
    <Tooltip.Provider delayDuration={0} skipDelayDuration={150}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            className="lb-league-info"
            aria-label={t("leagueScoringInfoLabel")}
          >
            <Info size={18} weight="bold" aria-hidden="true" />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="lb-tooltip"
            sideOffset={6}
            side="bottom"
            align="end"
            collisionPadding={12}
          >
            {t("leagueScoringInfo")}
            <Tooltip.Arrow className="fill-[var(--card)]" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

/* ── Global board — demoted secondary view ── */
function GlobalBoard({
  entries,
  isLoading,
  timeframe,
  onTimeframeChange,
  currentUserId,
  locale,
}: {
  entries: LeaderboardEntry[];
  isLoading: boolean;
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
  currentUserId: string;
  locale: string;
}) {
  const t = useTranslations("gamification");
  const tCommon = useTranslations("common");

  const { podium, rest: restEntries, compact } = splitPodium(entries);

  const TIMEFRAMES: Timeframe[] = ["weekly", "monthly", "alltime"];

  return (
    <>
      <div className="lb-timeframe-tabs">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf}
            onClick={() => onTimeframeChange(tf)}
            className={cn("lb-tf-tab", timeframe === tf && "active")}
          >
            {t(tf === "alltime" ? "allTime" : tf)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="sol-spinner" />
          <span className="sr-only">{tCommon("loading")}</span>
        </div>
      ) : entries.length === 0 ? (
        <div className="lb-empty">
          <GlyphChip glyph="★" size={48} empty />
          <p>{t("noEntries")}</p>
        </div>
      ) : (
        <>
          <div className={cn("podium-grid", compact && "podium-compact")}>
            {podium.map((entry) => (
              <GlobalPodiumCard
                key={entry.userId}
                entry={entry}
                isCurrentUser={entry.userId === currentUserId}
                locale={locale}
              />
            ))}
          </div>

          {restEntries.length > 0 && (
            <div className="lb-list">
              {restEntries.map((entry, i) => (
                <RankedRow
                  key={entry.userId}
                  entry={entry}
                  isCurrentUser={entry.userId === currentUserId}
                  locale={locale}
                  style={{ "--i": i } as React.CSSProperties}
                />
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}

export function LeaderboardClient({
  initialGlobalEntries,
  initialCohort,
  currentUserId,
}: LeaderboardClientProps) {
  const t = useTranslations("gamification");
  const locale = useLocale();

  // League is primary; fall back to global for anon visitors with no cohort.
  const [board, setBoard] = useState<Board>(
    initialCohort ? "league" : "global"
  );
  const [timeframe, setTimeframe] = useState<Timeframe>("alltime");
  const [globalEntries, setGlobalEntries] =
    useState<LeaderboardEntry[]>(initialGlobalEntries);
  const [isLoading, setIsLoading] = useState(false);

  const fetchGlobal = useCallback(async (tf: Timeframe) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/leaderboard?timeframe=${tf}`);
      if (!res.ok) {
        setGlobalEntries([]);
        return;
      }
      const { entries } = (await res.json()) as { entries: LeaderboardEntry[] };
      setGlobalEntries(entries);
    } catch {
      setGlobalEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleTimeframeChange = useCallback(
    (tf: Timeframe) => {
      setTimeframe(tf);
      fetchGlobal(tf);
    },
    [fetchGlobal]
  );

  const BOARDS: { id: Board; label: string }[] = [
    { id: "league", label: t("league") },
    { id: "global", label: t("global") },
    { id: "referrals", label: t("referrals") },
  ];

  return (
    <div className="lb-page">
      <div className="lb-header">
        <h1 className="font-display text-2xl font-black tracking-[-0.5px] sm:text-3xl">
          {t("leaderboard")}
        </h1>
        <p className="mt-1 text-text-3">
          {board === "league"
            ? t("leagueSubtitle")
            : board === "global"
              ? t("globalSubtitle")
              : t("referralSubtitle")}
        </p>
      </div>

      {/* Primary board switch — League (cohort) is the default; Global demoted. */}
      <div
        className="lb-board-tabs"
        role="tablist"
        aria-label={t("leaderboard")}
      >
        {BOARDS.map((b) => (
          <button
            key={b.id}
            role="tab"
            aria-selected={board === b.id}
            onClick={() => setBoard(b.id)}
            className={cn("lb-board-tab", board === b.id && "active")}
          >
            {b.id === "league" ? (
              <UsersThree size={16} weight="bold" aria-hidden="true" />
            ) : b.id === "global" ? (
              <Trophy size={16} weight="bold" aria-hidden="true" />
            ) : (
              <Gift size={16} weight="bold" aria-hidden="true" />
            )}
            {b.label}
          </button>
        ))}
      </div>

      {board === "league" ? (
        <LeagueBoard cohort={initialCohort} locale={locale} />
      ) : board === "global" ? (
        <GlobalBoard
          entries={globalEntries}
          isLoading={isLoading}
          timeframe={timeframe}
          onTimeframeChange={handleTimeframeChange}
          currentUserId={currentUserId}
          locale={locale}
        />
      ) : (
        <ReferralBoard currentUserId={currentUserId} />
      )}
    </div>
  );
}
