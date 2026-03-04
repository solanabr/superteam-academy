"use client";

import { useEffect, useState } from "react";
import { getLearningProgressService } from "@/lib/services/learning-progress";
import { getOnChainReadService } from "@/lib/services/onchain-read";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import type { LeaderboardEntry } from "@/lib/types/learning";

type Timeframe = "weekly" | "monthly" | "alltime";
type DataSource = "local" | "onchain";

export default function LeaderboardPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [timeframe, setTimeframe] = useState<Timeframe>("alltime");
  const [dataSource, setDataSource] = useState<DataSource>("local");
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [onChainEnabled, setOnChainEnabled] = useState(false);

  useEffect(() => {
    setLoading(true);
    const learningService = getLearningProgressService();
    const onChainService = getOnChainReadService();

    async function fetchLeaderboard() {
      try {
        // For all-time, try to fetch on-chain data if available
        if (timeframe === "alltime" && dataSource === "onchain") {
          const onChainHolders = await onChainService.getLeaderboardFromTokenAccounts(100);
          
          if (onChainHolders.length > 0) {
            // Get user profiles for the wallet addresses
            const supabase = createClient();
            const { data: linkedWallets } = await supabase
              .from("linked_wallets")
              .select("wallet_address, user_id, profiles(display_name)")
              .in("wallet_address", onChainHolders.map(h => h.wallet));

            const walletToProfile = new Map(
              (linkedWallets || []).map((w: Record<string, unknown>) => [
                w.wallet_address,
                {
                  userId: w.user_id,
                  displayName: (w.profiles as Record<string, unknown>)?.display_name || "Anonymous",
                }
              ])
            );

            const onChainEntries: LeaderboardEntry[] = onChainHolders.map((holder) => {
              const profile = walletToProfile.get(holder.wallet);
              return {
                userId: String(profile?.userId || holder.wallet),
                displayName: String(profile?.displayName || `Wallet ${holder.wallet.slice(0, 6)}...`),
                avatarUrl: null,
                totalXp: holder.xp,
                level: Math.floor(Math.sqrt(holder.xp / 100)),
                currentStreak: 0,
                rank: holder.rank,
              };
            });

            setEntries(onChainEntries);
            setOnChainEnabled(true);
            return;
          }
        }

        // Fall back to local Supabase data
        const localEntries = await learningService.getLeaderboard(timeframe);
        setEntries(localEntries);
        setOnChainEnabled(false);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
        // Fall back to local data on error
        const localEntries = await learningService.getLeaderboard(timeframe);
        setEntries(localEntries);
        setOnChainEnabled(false);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, [timeframe, dataSource, courseFilter]);

  const tabs: { label: string; value: Timeframe }[] = [
    { label: t("leaderboard.allTime"), value: "alltime" },
    { label: t("leaderboard.monthly"), value: "monthly" },
    { label: t("leaderboard.weekly"), value: "weekly" },
  ];

  return (
    <div className="mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-2">
          {t("leaderboard.title")}
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400">
          {t("leaderboard.subtitle")}
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Timeframe Tabs */}
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setTimeframe(tab.value)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                timeframe === tab.value
                  ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                  : "border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400 dark:hover:border-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Course Filter */}
        <select
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-medium text-neutral-600 dark:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-600"
        >
          <option value="all">All Courses</option>
          <option value="solana-fundamentals">Solana Fundamentals</option>
          <option value="rust-for-solana">Rust for Solana</option>
          <option value="anchor-development">Anchor Development</option>
          <option value="defi-on-solana">DeFi on Solana</option>
        </select>

        {/* Data Source Toggle (only for all-time) */}
        {timeframe === "alltime" && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400">Data source:</span>
            <button
              onClick={() => setDataSource(dataSource === "local" ? "onchain" : "local")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                dataSource === "onchain"
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700"
              }`}
            >
              {dataSource === "onchain" ? "On-Chain" : "Local"}
            </button>
          </div>
        )}
      </div>

      {/* On-chain indicator */}
      {timeframe === "alltime" && dataSource === "onchain" && (
        <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-green-800 dark:text-green-200">
            Showing on-chain XP token balances from Devnet
          </span>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-2 border-neutral-300 dark:border-neutral-600 border-t-neutral-900 dark:border-t-white rounded-full animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <div className="py-20 text-center rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700">
          <p className="text-neutral-400 text-lg mb-1">{t("leaderboard.noEntries")}</p>
          <p className="text-neutral-400 text-sm">
            {t("leaderboard.noEntriesDesc")}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[3rem_1fr_5rem_4rem_4rem] md:grid-cols-[3rem_1fr_6rem_5rem_5rem] gap-3 px-5 py-3 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-100 dark:border-neutral-800 text-xs font-medium text-neutral-400 uppercase tracking-wide">
            <span>#</span>
            <span>{t("leaderboard.learner")}</span>
            <span className="text-right">{t("leaderboard.xp")}</span>
            <span className="text-right">{t("dashboard.level")}</span>
            <span className="text-right hidden md:block">{t("leaderboard.streak")}</span>
          </div>

          {/* Rows */}
          {entries.map((entry) => {
            const isCurrentUser = user?.id === entry.userId;
            return (
              <div
                key={entry.userId}
                className={`grid grid-cols-[3rem_1fr_5rem_4rem_4rem] md:grid-cols-[3rem_1fr_6rem_5rem_5rem] gap-3 px-5 py-3.5 border-b border-neutral-50 dark:border-neutral-800/50 items-center transition-colors ${
                  isCurrentUser ? "bg-neutral-50 dark:bg-neutral-800/30" : "hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20"
                }`}
              >
                <span className={`text-sm font-semibold ${entry.rank <= 3 ? "text-neutral-900 dark:text-white" : "text-neutral-400"}`}>
                  {entry.rank <= 3 ? getRankLabel(entry.rank) : entry.rank}
                </span>

                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-xs font-bold text-neutral-600 dark:text-neutral-300 flex-shrink-0">
                    {entry.displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className={`text-sm truncate ${isCurrentUser ? "font-semibold" : "font-medium"}`}>
                    {entry.displayName}
                    {isCurrentUser && (
                      <span className="ml-2 text-[10px] text-neutral-400">{t("leaderboard.you")}</span>
                    )}
                  </span>
                </div>

                <span className={`text-sm font-mono font-semibold text-right ${dataSource === "onchain" && timeframe === "alltime" ? "text-green-600 dark:text-green-400" : ""}`}>
                  {entry.totalXp.toLocaleString()}
                </span>

                <span className="text-sm text-neutral-500 dark:text-neutral-400 text-right">
                  {entry.level}
                </span>

                <span className="text-sm text-neutral-400 text-right hidden md:block">
                  {entry.currentStreak}d
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-neutral-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-yellow-500" />
          <span>1st Place</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-neutral-400" />
          <span>2nd Place</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-600" />
          <span>3rd Place</span>
        </div>
        {onChainEnabled && (
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span>On-chain verified</span>
          </div>
        )}
      </div>
    </div>
  );
}

function getRankLabel(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return String(rank);
}
