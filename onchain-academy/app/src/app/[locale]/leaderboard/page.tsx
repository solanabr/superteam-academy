"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useWallet } from "@/lib/wallet/context";
import { Avatar } from "@/components/ui/avatar";
import { getLeaderboard } from "@/lib/services/leaderboard";
import { getDemoEntries } from "@/lib/services/leaderboard-demo";
import type { LeaderboardEntry } from "@/lib/services/types";

const TRACK_FILTERS = [
  { key: "all", label: "allTracks" },
  { key: "rust", label: "Rust" },
  { key: "anchor", label: "Anchor" },
  { key: "frontend", label: "Frontend" },
  { key: "security", label: "Security" },
  { key: "defi", label: "DeFi" },
  { key: "mobile", label: "Mobile" },
] as const;

const TRACK_NAME_PATTERNS: Record<string, RegExp> = {
  rust: /rust/i,
  anchor: /anchor/i,
  frontend: /web3|frontend|builder/i,
  security: /security|chain.?link/i,
  defi: /defi|token|degen/i,
  mobile: /mobile/i,
};

function filterByTrack(
  entries: LeaderboardEntry[],
  track: string,
): LeaderboardEntry[] {
  if (track === "all") return entries;
  const pattern = TRACK_NAME_PATTERNS[track];
  if (!pattern) return entries;
  return entries
    .filter((e) => pattern.test(e.displayName ?? "") || pattern.test(e.wallet))
    .map((e, i) => ({ ...e, rank: i + 1 }));
}

function formatRank(rank: number): string {
  return rank.toString().padStart(2, "0");
}

function formatXp(xp: number): { value: string; unit: string } {
  if (xp >= 1000) {
    return { value: (xp / 1000).toFixed(1).replace(/\.0$/, ""), unit: "k XP" };
  }
  return { value: xp.toString(), unit: " XP" };
}

function estimateCoursesCompleted(xp: number): number {
  return Math.floor(xp / 400) + 1;
}

export default function LeaderboardPage() {
  const t = useTranslations("leaderboard");
  const { publicKey, connected } = useWallet();
  const walletAddress = publicKey?.toBase58() ?? null;
  const shortWallet = walletAddress
    ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
    : null;
  const [timeframe, setTimeframe] = useState<"weekly" | "monthly" | "alltime">(
    "alltime",
  );
  const params = useParams();
  const locale = params.locale as string;
  const [selectedTrack, setSelectedTrack] = useState<string>("all");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [snapshotUnavailable, setSnapshotUnavailable] = useState(false);
  const [expandedLeader, setExpandedLeader] = useState<number | null>(null);
  const [hoveredEntry, setHoveredEntry] = useState<number | null>(null);
  const filteredEntries = useMemo(
    () => filterByTrack(entries, selectedTrack),
    [entries, selectedTrack],
  );

  const userEntry = walletAddress
    ? filteredEntries.find((e) => e.wallet === walletAddress)
    : null;
  const userRank = userEntry?.rank ?? null;

  useEffect(() => {
    setLoading(true);
    getLeaderboard(timeframe).then(({ entries: data, snapshotDataAvailable }) => {
      if (data.length > 0) {
        setEntries(data);
        setIsDemo(false);
        setSnapshotUnavailable(false);
      } else if (!snapshotDataAvailable && timeframe !== "alltime") {
        // No snapshot data yet — show all-time as fallback with notice
        setSnapshotUnavailable(true);
        setIsDemo(false);
        // Re-fetch all-time data as fallback
        getLeaderboard("alltime").then(({ entries: fallback }) => {
          setEntries(fallback.length > 0 ? fallback : getDemoEntries(timeframe));
          setIsDemo(fallback.length === 0);
          setLoading(false);
        });
        return;
      } else {
        setEntries(getDemoEntries(timeframe));
        setIsDemo(true);
        setSnapshotUnavailable(false);
      }
      setLoading(false);
    });
  }, [timeframe]);

  const timeFilters: {
    key: "weekly" | "monthly" | "alltime";
    label: string;
  }[] = [
    { key: "weekly", label: t("thisWeek") },
    { key: "monthly", label: t("thisMonth") },
    { key: "alltime", label: t("allTimeFilter") },
  ];

  return (
    <div style={{ background: "var(--background)", color: "var(--foreground)", contain: "layout style" }}>
      {/* Demo banner — collapses to zero height when inactive to avoid CLS */}
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          letterSpacing: "2px",
          color: "var(--c-text-muted)",
          textAlign: "center",
          textTransform: "uppercase",
          visibility: isDemo && !loading ? "visible" : "hidden",
          height: isDemo && !loading ? "auto" : 0,
          padding: isDemo && !loading ? undefined : 0,
          overflow: "hidden",
        }}
      >
        {t("demoBanner")}
      </div>

      {/* Snapshot data unavailable notice — uses visibility to avoid CLS */}
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          letterSpacing: "2px",
          color: "var(--xp)",
          textAlign: "center",
          textTransform: "uppercase",
          borderBottom: snapshotUnavailable && !loading ? "1px solid var(--c-border-subtle)" : "none",
          visibility: snapshotUnavailable && !loading ? "visible" : "hidden",
          height: snapshotUnavailable && !loading ? "auto" : 0,
          padding: snapshotUnavailable && !loading ? undefined : 0,
          overflow: "hidden",
        }}
      >
        {t("snapshotUnavailable")}
      </div>

      {/* Header */}
      <header className="lb-header">
        <h1
          className="sa-fade-up sa-fade-d1"
          style={{
            fontFamily: "var(--font-brand)",
            fontSize: "clamp(48px, 8vw, 120px)",
            fontWeight: 900,
            letterSpacing: "-3px",
            lineHeight: 0.9,
            color: "var(--foreground)",
            margin: 0,
            opacity: 0,
          }}
        >
          {t("title")}
        </h1>
        <p
          className="sa-fade-up sa-fade-d2"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            letterSpacing: "4px",
            textTransform: "uppercase",
            color: "var(--c-text-muted)",
            marginTop: "24px",
            opacity: 0,
          }}
        >
          {t("buildersCount", { count: entries.length })}
        </p>
      </header>

      {/* Time filter */}
      <div className="lb-filters">
        {timeFilters.map((filter) => (
          <button
            key={filter.key}
            onClick={() => setTimeframe(filter.key)}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              letterSpacing: "2px",
              textTransform: "uppercase",
              background: "none",
              border: "none",
              borderBottom:
                timeframe === filter.key
                  ? "1px solid var(--foreground)"
                  : "1px solid transparent",
              color:
                timeframe === filter.key
                  ? "var(--foreground)"
                  : "var(--c-text-muted)",
              cursor: "pointer",
              padding: "8px 0",
              transition: "color 0.3s, border-color 0.3s",
            }}
            onMouseEnter={(e) => {
              if (timeframe !== filter.key) {
                (e.target as HTMLButtonElement).style.color =
                  "var(--foreground)";
              }
            }}
            onMouseLeave={(e) => {
              if (timeframe !== filter.key) {
                (e.target as HTMLButtonElement).style.color =
                  "var(--c-text-muted)";
              }
            }}
          >
            {filter.label}
          </button>
        ))}

        {/* Track filter */}
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <label
            htmlFor="track-filter"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: "var(--c-text-muted)",
            }}
          >
            {t("filterByTrack")}
          </label>
          <select
            id="track-filter"
            value={selectedTrack}
            onChange={(e) => setSelectedTrack(e.target.value)}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              letterSpacing: "2px",
              textTransform: "uppercase",
              background: "var(--c-bg-card)",
              color: "var(--foreground)",
              border: "1px solid var(--c-border-subtle)",
              padding: "8px 12px",
              cursor: "pointer",
              appearance: "none",
              WebkitAppearance: "none",
              backgroundImage:
                "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e\")",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 8px center",
              backgroundSize: "12px",
              paddingRight: "28px",
              outline: "none",
              transition: "border-color 0.3s",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--foreground)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--c-border-subtle)";
            }}
          >
            {TRACK_FILTERS.map((track) => (
              <option key={track.key} value={track.key}>
                {track.key === "all"
                  ? t("allTracks")
                  : track.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading state — skeleton entries match loaded layout to prevent CLS */}
      {loading ? (
        <div style={{ minHeight: "60vh" }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="lb-entry"
              style={{
                borderTop: "1px solid var(--c-border-subtle)",
                display: "flex",
                alignItems: "baseline",
                gap: "24px",
              }}
            >
              <div
                className="animate-pulse"
                style={{
                  width: 20,
                  height: 16,
                  background: "var(--c-bg-elevated)",
                  borderRadius: 2,
                  flexShrink: 0,
                }}
              />
              <div
                className="animate-pulse"
                style={{
                  width: `${140 + (i % 4) * 30}px`,
                  height: 32,
                  background: "var(--c-bg-elevated)",
                  borderRadius: 2,
                }}
              />
              <div
                className="animate-pulse"
                style={{
                  width: 64,
                  height: 24,
                  background: "var(--c-bg-elevated)",
                  borderRadius: 2,
                  marginLeft: "auto",
                  flexShrink: 0,
                }}
              />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Leader entries */}
          <div aria-live="polite" aria-atomic="false" style={{ minHeight: "60vh" }}>
            {filteredEntries.map((entry, i) => {
              const isExpanded = expandedLeader === entry.rank;
              const isHovered = hoveredEntry === entry.rank;
              const xpFormatted = formatXp(entry.xp);
              const isUserRow = userRank != null && entry.rank === userRank;

              return (
                <div
                  key={entry.rank}
                  className={`sa-fade-up ${isExpanded ? "lb-entry-expanded" : "lb-entry"}`}
                  style={{
                    position: "relative",
                    borderTop: "1px solid var(--c-border-subtle)",
                    cursor: "pointer",
                    transition: "background 0.5s cubic-bezier(0.16, 1, 0.3, 1), padding 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                    overflow: "hidden",
                    contain: "layout style",
                    background: isExpanded
                      ? "var(--c-bg-card)"
                      : isHovered
                        ? "var(--c-bg-elevated)"
                        : "transparent",
                    color: "var(--foreground)",
                    animationDelay: `${0.15 + i * 0.06}s`,
                  }}
                  onClick={() =>
                    setExpandedLeader(isExpanded ? null : entry.rank)
                  }
                  onMouseEnter={() => setHoveredEntry(entry.rank)}
                  onMouseLeave={() => setHoveredEntry(null)}
                >
                  {/* "YOU" badge for user's own row */}
                  {isUserRow && (
                    <span
                      style={{
                        position: "absolute",
                        top: "12px",
                        right: "12px",
                        fontFamily: "var(--font-mono)",
                        fontSize: "8px",
                        letterSpacing: "2px",
                        background: "var(--xp)",
                        color: "var(--background)",
                        padding: "3px 8px",
                        zIndex: 3,
                      }}
                    >
                      YOU
                    </span>
                  )}

                  {/* Background rank number */}
                  <span
                    className="lb-rank-bg"
                    style={{
                      position: "absolute",
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontFamily: "var(--font-brand)",
                      fontWeight: 900,
                      fontStyle: "italic",
                      opacity: isExpanded
                        ? 0.06
                        : isHovered
                          ? 0.08
                          : 0.04,
                      pointerEvents: "none",
                      letterSpacing: "-8px",
                      lineHeight: 0.8,
                      transition: "opacity 0.5s",
                      color: "var(--foreground)",
                      userSelect: "none",
                    }}
                  >
                    {formatRank(entry.rank)}
                  </span>

                  {/* Top row */}
                  <div
                    className="lb-entry-row"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      position: "relative",
                      zIndex: 2,
                    }}
                  >
                    {/* Rank */}
                    <span
                      style={{
                        fontFamily: "var(--font-brand)",
                        fontSize: "14px",
                        fontStyle: "italic",
                        opacity: 0.6,
                        flexShrink: 0,
                      }}
                    >
                      {formatRank(entry.rank)}
                    </span>

                    <Avatar
                      size="sm"
                      fallback={(entry.displayName ?? "?").charAt(0).toUpperCase()}
                    />

                    {/* Name */}
                    <span
                      className="lb-entry-name"
                      style={{
                        fontFamily: "var(--font-brand)",
                        fontWeight: 900,
                        letterSpacing: isHovered && !isExpanded ? "1px" : "-1.5px",
                        lineHeight: 1,
                        transition: "letter-spacing 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap" as const,
                      }}
                    >
                      {entry.displayName ?? t("anonymous")}
                    </span>

                    {/* Handle (desktop only) */}
                    <span
                      className="hidden sm:inline"
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "11px",
                        letterSpacing: "1px",
                        opacity: 0.6,
                        flexShrink: 0,
                      }}
                    >
                      @{(entry.displayName ?? "anon").toLowerCase()}.sol
                    </span>

                    {/* XP (right-aligned) */}
                    <span
                      className="lb-entry-xp"
                      style={{
                        fontFamily: "var(--font-brand)",
                        fontWeight: 200,
                        letterSpacing: "-1px",
                        marginLeft: "auto",
                        flexShrink: 0,
                        position: "relative",
                        zIndex: 2,
                      }}
                    >
                      {xpFormatted.value}
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 400,
                          opacity: 0.6,
                          marginLeft: "2px",
                        }}
                      >
                        {xpFormatted.unit}
                      </span>
                    </span>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div style={{ position: "relative", zIndex: 2 }}>
                      <div
                        className="lb-expanded-stats"
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                        }}
                      >
                        {/* Courses completed */}
                        <div>
                          <div
                            style={{
                              fontFamily: "var(--font-brand)",
                              fontSize: "32px",
                              fontWeight: 200,
                              letterSpacing: "-1px",
                              color:
                                entry.rank <= 3
                                  ? "var(--xp)"
                                  : "inherit",
                            }}
                          >
                            {entry.coursesCompleted ?? estimateCoursesCompleted(entry.xp)}
                          </div>
                          <div
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: "9px",
                              letterSpacing: "3px",
                              textTransform: "uppercase",
                              opacity: 0.6,
                              marginTop: "4px",
                            }}
                          >
                            {t("coursesCompleted")}
                          </div>
                        </div>

                        {/* Day streak */}
                        <div>
                          <div
                            style={{
                              fontFamily: "var(--font-brand)",
                              fontSize: "32px",
                              fontWeight: 200,
                              letterSpacing: "-1px",
                              color:
                                entry.rank <= 3
                                  ? "var(--xp)"
                                  : "inherit",
                            }}
                          >
                            {entry.streak}
                          </div>
                          <div
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: "9px",
                              letterSpacing: "3px",
                              textTransform: "uppercase",
                              opacity: 0.6,
                              marginTop: "4px",
                            }}
                          >
                            {t("dayStreakLabel")}
                          </div>
                        </div>

                        {/* Level */}
                        <div>
                          <div
                            style={{
                              fontFamily: "var(--font-brand)",
                              fontSize: "32px",
                              fontWeight: 200,
                              letterSpacing: "-1px",
                              color:
                                entry.rank <= 3
                                  ? "var(--xp)"
                                  : "inherit",
                            }}
                          >
                            {entry.level}
                          </div>
                          <div
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: "9px",
                              letterSpacing: "3px",
                              textTransform: "uppercase",
                              opacity: 0.6,
                              marginTop: "4px",
                            }}
                          >
                            {t("level")}
                          </div>
                        </div>
                      </div>

                      {/* View on-chain profile link */}
                      <Link
                        href={`/${locale}/profile/${entry.displayName || entry.wallet}`}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "10px",
                          letterSpacing: "3px",
                          textTransform: "uppercase",
                          textDecoration: "none",
                          color: "inherit",
                          border: "1px solid var(--overlay-border)",
                          padding: "8px 16px",
                          marginTop: "32px",
                          display: "inline-block",
                          cursor: "pointer",
                          transition: "background 0.3s, color 0.3s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background =
                            "var(--overlay-divider)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                        }}
                      >
                        {t("viewProfile")} &rarr;
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Your position summary */}
          <div
            className="lb-position"
            style={{
              textAlign: "center",
              borderTop: "1px solid var(--c-border-subtle)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                letterSpacing: "4px",
                textTransform: "uppercase",
                color: "var(--c-text-muted)",
              }}
            >
              {t("yourPosition")}
            </div>
            <div
              style={{
                fontFamily: "var(--font-brand)",
                fontSize: "clamp(48px, 8vw, 96px)",
                fontWeight: 900,
                fontStyle: "italic",
                letterSpacing: "-3px",
                color: "var(--foreground)",
                marginTop: "16px",
              }}
            >
              {connected && userRank ? `#${userRank}` : connected ? "--" : "#4"}
            </div>
            <div
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "16px",
                color: "var(--c-text-muted)",
                marginTop: "8px",
              }}
            >
              {connected
                ? userRank
                  ? t("keepBuilding")
                  : t("completeToAppear")
                : t("connectForRank")}
            </div>
            <Link href="/courses" style={{ textDecoration: "none" }}>
              <button
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  padding: "16px 40px",
                  background: "var(--foreground)",
                  color: "var(--background)",
                  border: "none",
                  cursor: "pointer",
                  marginTop: "32px",
                  transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--nd-highlight-orange)";
                  e.currentTarget.style.color = "var(--foreground)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--foreground)";
                  e.currentTarget.style.color = "var(--background)";
                }}
              >
                {t("continueLearning")} &rarr;
              </button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
