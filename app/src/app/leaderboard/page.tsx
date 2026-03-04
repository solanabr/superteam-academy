"use client";

import { useState, useMemo, useEffect } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { courseFilters } from "@/data/leaderboard";
import type { TimeFilter, LeaderboardEntry } from "@/types";
import { leaderboardService, xpService, streakService } from "@/services";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAuth } from "@/providers/auth-provider";
import { useLocale } from "@/providers/locale-provider";
import { deriveLevel } from "@/types";

const medalEmoji = ["🥇", "🥈", "🥉"];
const medalColors = ["#ca8a04", "#94a3b8", "#b45309"];

export default function LeaderboardPage() {
  const { publicKey } = useWallet();
  const { user } = useAuth();
  const { t } = useLocale();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all-time");
  const [courseFilter, setCourseFilter] = useState("all");
  const [courseOpen, setCourseOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const wallet = publicKey?.toBase58();
    leaderboardService
      .getEntries(timeFilter, undefined, 1, 1000)
      .then(async ({ entries: data }) => {
        if (wallet && !data.find((e) => e.walletAddress === wallet)) {
          const xp = await xpService.getBalance(wallet);
          if (xp > 0) {
            const streak = await streakService.getStreak(wallet);
            const name = user?.name || `Learner ${wallet.slice(0, 6)}`;
            const short = wallet.slice(0, 6);
            data.push({
              rank: 0,
              name,
              username: user?.username || `learner_${short.toLowerCase()}`,
              initials: user?.initials || short.slice(0, 2).toUpperCase(),
              level: deriveLevel(xp),
              xp,
              streak: streak.currentStreak,
              accent: "#34d399",
              walletAddress: wallet,
              isCurrentUser: true,
            });
            data.sort((a, b) => b.xp - a.xp);
            data.forEach((e, i) => (e.rank = i + 1));
          }
        } else if (wallet) {
          const entry = data.find((e) => e.walletAddress === wallet);
          if (entry) entry.isCurrentUser = true;
        }
        setEntries(data);
      })
      .catch(() => setEntries([]));
  }, [timeFilter, publicKey, user]);

  const wallet = publicKey?.toBase58();
  const me = useMemo(() => {
    if (!wallet) return entries.find((e) => e.isCurrentUser) ?? null;
    return (
      entries.find((e) => e.walletAddress === wallet) ??
      entries.find((e) => e.isCurrentUser) ??
      null
    );
  }, [entries, wallet]);

  const filtered = useMemo(() => {
    if (!query.trim()) return entries;
    const q = query.toLowerCase();
    return entries.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.username.toLowerCase().includes(q),
    );
  }, [entries, query]);

  const searching = query.trim().length > 0;
  const top3 = searching ? [] : entries.slice(0, 3);

  const pool = searching ? filtered : filtered.slice(3);
  const totalPages = Math.max(1, Math.ceil(pool.length / perPage));
  const activePage = Math.min(page, totalPages);
  const rows = pool.slice((activePage - 1) * perPage, activePage * perPage);

  const reset = () => setPage(1);

  const times: { value: TimeFilter; label: string }[] = [
    { value: "weekly", label: t("leaderboard.weekly") },
    { value: "monthly", label: t("leaderboard.monthly") },
    { value: "all-time", label: t("leaderboard.allTime") },
  ];

  // top 3 reordered: 2nd | 1st | 3rd
  const podium =
    top3.length === 3
      ? [
          { entry: top3[1]!, place: 2 },
          { entry: top3[0]!, place: 1 },
          { entry: top3[2]!, place: 3 },
        ]
      : [];

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 bg-mesh animate-drift-2" />

      <div className="relative z-10 mx-auto max-w-3xl px-6 pt-28 pb-20">
        {/* ── Header ── */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {t("leaderboard.title")}
            </h1>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {entries.length} {t("leaderboard.learners")}
            </p>
          </div>
          <div className="flex gap-0.5 rounded-lg bg-muted/30 p-1">
            {times.map((tf) => (
              <button
                key={tf.value}
                onClick={() => {
                  setTimeFilter(tf.value);
                  reset();
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  timeFilter === tf.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Your rank ── */}
        {me && (
          <div className="mt-6 flex items-center gap-3 rounded-lg border border-primary/15 bg-primary/[0.03] px-4 py-3">
            <span className="text-base font-semibold tabular-nums text-primary shrink-0">
              #{me.rank}
            </span>
            <div
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={{ background: `${me.accent}12`, color: me.accent }}
            >
              {me.initials}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium">{me.name}</span>
              <span className="text-xs text-muted-foreground/70 ml-2 hidden sm:inline">
                @{me.username}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
              <span className="hidden sm:inline">
                {t("leaderboard.lvl")} {me.level}
              </span>
              <span className="hidden sm:inline">
                {me.streak}d {t("common.streak").toLowerCase()}
              </span>
              <span className="font-semibold text-foreground tabular-nums">
                {me.xp.toLocaleString()} XP
              </span>
            </div>
          </div>
        )}

        {/* ── Top 3 ── */}
        {podium.length > 0 && (
          <div className="mt-10 grid grid-cols-3 gap-3 items-end">
            {podium.map(({ entry, place }) => {
              const idx = place - 1;
              const isFirst = place === 1;
              return (
                <div key={entry.username} className="text-center">
                  <div
                    className={`rounded-xl border border-border/40 bg-card/30 ${
                      isFirst ? "px-4 pt-6 pb-5" : "px-3 pt-4 pb-4"
                    }`}
                    style={{
                      borderTopColor: `${medalColors[idx]}40`,
                      borderTopWidth: 2,
                    }}
                  >
                    <span className={isFirst ? "text-2xl" : "text-lg"}>
                      {medalEmoji[idx]}
                    </span>
                    <div
                      className={`mx-auto mt-3 flex items-center justify-center rounded-full font-bold ${
                        isFirst ? "size-14 text-base" : "size-10 text-sm"
                      }`}
                      style={{
                        background: `${entry.accent}10`,
                        color: entry.accent,
                      }}
                    >
                      {entry.initials}
                    </div>
                    <p
                      className={`mt-2 font-medium truncate ${
                        isFirst ? "text-sm" : "text-xs"
                      }`}
                    >
                      {entry.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70 truncate">
                      @{entry.username}
                    </p>
                    <p
                      className={`mt-1.5 font-semibold tabular-nums ${
                        isFirst ? "text-base" : "text-sm"
                      }`}
                    >
                      {entry.xp.toLocaleString()}
                      <span className="text-[10px] font-normal text-muted-foreground/70 ml-0.5">
                        XP
                      </span>
                    </p>
                    <div className="mt-1 flex items-center justify-center gap-2 text-[10px] text-muted-foreground/60">
                      <span>
                        {t("leaderboard.lvl")} {entry.level}
                      </span>
                      <span>·</span>
                      <span>{entry.streak}d</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Filters + search ── */}
        <div className="mt-10 flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setCourseOpen(!courseOpen)}
              className="flex items-center gap-2 rounded-lg border border-border/40 px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {courseFilters.find((c) => c.value === courseFilter)?.label}
              <ChevronDown
                className={`size-3.5 transition-transform ${courseOpen ? "rotate-180" : ""}`}
              />
            </button>
            {courseOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setCourseOpen(false)}
                />
                <div className="absolute top-full left-0 mt-1 z-20 rounded-lg border border-border/50 bg-card shadow-lg py-1 min-w-48">
                  {courseFilters.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => {
                        setCourseFilter(c.value);
                        setCourseOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                        courseFilter === c.value
                          ? "text-foreground font-medium bg-muted/30"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="flex-1" />

          <div className="relative w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/60" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                reset();
              }}
              placeholder={t("leaderboard.searchPlaceholder")}
              className="w-full rounded-lg border border-border/40 bg-transparent pl-8 pr-3 py-2 text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:border-muted-foreground/40 transition-colors"
            />
          </div>
        </div>

        {/* ── Table ── */}
        <div className="mt-3 rounded-xl border border-border/30 overflow-hidden">
          {/* Column header */}
          <div className="flex items-center gap-3 px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium border-b border-border/20">
            <span className="w-10 text-right">#</span>
            <span className="flex-1 pl-11">
              {t("leaderboard.learnerColumn")}
            </span>
            <span className="w-10 text-right hidden sm:block">
              {t("leaderboard.lvl")}
            </span>
            <span className="w-14 text-right hidden sm:block">
              {t("leaderboard.streakColumn")}
            </span>
            <span className="w-16 text-right">XP</span>
          </div>

          {rows.length > 0 ? (
            rows.map((entry, i) => (
              <div
                key={entry.username}
                className={`group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/[0.06] ${
                  entry.isCurrentUser ? "bg-primary/[0.04]" : ""
                } ${i < rows.length - 1 ? "border-b border-border/10" : ""}`}
              >
                {/* Rank */}
                <span
                  className="w-10 text-right text-sm tabular-nums shrink-0"
                  style={
                    entry.rank <= 3
                      ? { color: medalColors[entry.rank - 1], fontWeight: 700 }
                      : undefined
                  }
                >
                  <span
                    className={entry.rank > 3 ? "text-muted-foreground/60" : ""}
                  >
                    {entry.rank}
                  </span>
                </span>

                {/* Avatar + name */}
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div
                    className="flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                    style={{
                      background: `${entry.accent}10`,
                      color: entry.accent,
                    }}
                  >
                    {entry.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm truncate leading-tight">
                      <span className="font-medium">{entry.name}</span>
                      {entry.isCurrentUser && (
                        <span className="ml-1.5 text-[9px] text-primary font-semibold uppercase">
                          {t("common.you")}
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 truncate">
                      @{entry.username}
                    </p>
                  </div>
                </div>

                {/* Level */}
                <span className="w-10 text-right text-xs tabular-nums text-muted-foreground/70 hidden sm:block">
                  {entry.level}
                </span>

                {/* Streak */}
                <span className="w-14 text-right text-xs tabular-nums text-muted-foreground/70 hidden sm:block">
                  {entry.streak}d
                </span>

                {/* XP */}
                <span className="w-16 text-right text-sm font-medium tabular-nums">
                  {entry.xp.toLocaleString()}
                </span>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground/70">
              {t("common.noResults")} &ldquo;{query}&rdquo;
            </div>
          )}
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-0.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={activePage <= 1}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
            >
              <ChevronLeft className="size-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 || p === totalPages || Math.abs(p - activePage) <= 1,
              )
              .map((p, i, arr) => (
                <span key={p} className="flex items-center">
                  {i > 0 && arr[i - 1]! < p - 1 && (
                    <span className="text-xs text-muted-foreground/70 px-1">
                      ...
                    </span>
                  )}
                  <button
                    onClick={() => setPage(p)}
                    className={`size-8 rounded-md text-xs font-medium transition-colors ${
                      p === activePage
                        ? "bg-foreground text-background"
                        : "text-muted-foreground/70 hover:text-foreground"
                    }`}
                  >
                    {p}
                  </button>
                </span>
              ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={activePage >= totalPages}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        )}

        <p className="mt-8 text-center text-[11px] text-muted-foreground/60">
          {timeFilter === "weekly"
            ? t("leaderboard.resetsWeekly")
            : timeFilter === "monthly"
              ? t("leaderboard.resetsMonthly")
              : t("leaderboard.allTimeRankings")}
        </p>
      </div>
    </div>
  );
}
