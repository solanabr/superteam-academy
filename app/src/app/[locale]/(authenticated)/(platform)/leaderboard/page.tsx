"use client";

import { useEffect, useState } from "react";
import { useAppUser } from "@/hooks/useAppUser";
import { Loader2, Trophy, ExternalLink } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import { useLeaderboardStore } from "@/store/leaderboard-store";
import type { LeaderboardEntry } from "@/lib/learning-progress/types";
import { LeaderboardPodium } from "@/components/leaderboard/LeaderboardPodium";

export default function LeaderboardPage() {
  const t = useTranslations("leaderboard");
  const { user } = useAppUser();
  const { entries: allEntries, pages, hasMore, isLoading, fetchLeaderboard } = useLeaderboardStore();

  const [timeframe, setTimeframe] = useState<"daily" | "weekly" | "all-time">("all-time");
  const [courseId, setCourseId] = useState<string>("");
  const [courses, setCourses] = useState<{ _id: string, title: string }[]>([]);

  useEffect(() => {
    fetch("/api/courses/list")
      .then(res => res.json())
      .then(data => setCourses(data.courses || []))
      .catch(() => { });
  }, []);

  useEffect(() => {
    fetchLeaderboard(timeframe, courseId || undefined);
  }, [timeframe, courseId, fetchLeaderboard]);

  const cacheKey = `${timeframe}${courseId ? `:${courseId}` : ""}`;
  const entries = allEntries[cacheKey] || [];
  const loading = isLoading && entries.length === 0;

  // Removed full-page loading to keep header visible

  return (
    <div className="mx-auto max-w-4xl px-4 pt-20 pb-8">
      {!loading && entries.length >= 3 && (
        <LeaderboardPodium topThree={entries.slice(0, 3)} />
      )}

      {/* Filters Section - Moved below podium */}
      <div className="mb-8 flex flex-col sm:flex-row items-center justify-center gap-4">
        <div className="flex items-center gap-1.5 bg-white/[0.03] p-1 rounded-full border border-white/5 backdrop-blur-sm">
          {(["daily", "weekly", "all-time"] as const).map((tf) => (
            <Button
              key={tf}
              variant={timeframe === tf ? "default" : "ghost"}
              size="sm"
              onClick={() => setTimeframe(tf)}
              className={clsx(
                "rounded-full px-5 py-1.5 text-xs font-semibold transition-all duration-300",
                timeframe === tf ? "bg-solana text-[#0A0A0B] shadow-[0_0_20px_rgba(20,241,149,0.3)]" : "text-text-secondary hover:text-text-primary hover:bg-white/5"
              )}
            >
              {tf === "all-time" ? "All Time" : tf.charAt(0).toUpperCase() + tf.slice(1)}
            </Button>
          ))}
        </div>

        <div className="h-4 w-[1px] bg-white/10 hidden sm:block mx-2" />

        <div className="relative min-w-[180px]">
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="w-full appearance-none bg-white/[0.03] border border-white/10 rounded-full pl-5 pr-10 py-2 text-xs font-medium text-text-primary focus:outline-none focus:border-solana/50 transition-all cursor-pointer hover:bg-white/[0.05] hover:border-white/20 backdrop-blur-sm"
          >
            <option value="">{t("all_courses")}</option>
            {courses.map(c => (
              <option key={c._id} value={c._id}>{c.title}</option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>

      <div className="glass-panel overflow-hidden rounded-2xl border border-white/10 bg-[#0A0A0B]/40 backdrop-blur-xl shadow-2xl">
        <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 border-b border-white/5 bg-white/5 px-6 py-3 text-xs font-medium uppercase tracking-wider text-text-secondary">
          <div className="w-8 text-center">#</div>
          <div>{t("col_user")}</div>
          <div className="text-right">{t("col_level")}</div>
          <div className="w-24 text-right">XP</div>
        </div>

        <div className="divide-y divide-white/5 min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="text-solana h-8 w-8 animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center text-text-secondary h-48">
              <Trophy className="h-8 w-8 text-white/10 mb-3" />
              <p>No records found for this timeframe.</p>
              <p className="text-xs mt-1 text-white/30">Enroll in a course to get started on the leaderboard!</p>
            </div>
          ) : (
            entries.slice(entries.length >= 3 ? 3 : 0).map((entry) => {
              const isMe = user?.walletAddress === entry.walletAddress;
              return (
                <div
                  key={entry.userId}
                  className={clsx(
                    "grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 px-6 py-4 transition-colors duration-200",
                    isMe ? "bg-solana/10" : "hover:bg-white/8 hover:text-white"
                  )}
                >
                  <div className="w-8 text-center font-mono text-sm text-text-secondary">
                    {entry.rank === 1 ? (
                      <Trophy className="mx-auto h-4 w-4 text-yellow-500" />
                    ) : entry.rank === 2 ? (
                      <Trophy className="mx-auto h-4 w-4 text-gray-400" />
                    ) : entry.rank === 3 ? (
                      <Trophy className="mx-auto h-4 w-4 text-amber-700" />
                    ) : (
                      entry.rank
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Link href={`/profile/${entry.walletAddress}`} prefetch={true} className="h-8 w-8 overflow-hidden rounded-full bg-white/10 hover:opacity-80 transition-opacity">
                      <img
                        src={`https://api.dicebear.com/9.x/bottts/svg?seed=${entry.walletAddress}&backgroundColor=0a0a0b&baseColor=14f195&radius=50&sidesProbability=0&topProbability=0`}
                        alt="avatar"
                        className="h-full w-full"
                      />
                    </Link>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 group">
                        <Link href={`/profile/${entry.walletAddress}`} prefetch={true} className={clsx("text-sm font-medium hover:underline flex items-center gap-2", isMe ? "text-solana" : "text-text-primary")}>
                          {entry.walletAddress.slice(0, 4)}...{entry.walletAddress.slice(-4)}
                          {isMe && " (You)"}
                          <ExternalLink className="h-3.5 w-3.5 text-text-muted group-hover:text-solana transition-colors" />
                        </Link>
                      </div>
                    </div>
                  </div>
                  <div className="text-right font-mono text-sm text-text-secondary">
                    Lv{entry.level}
                  </div>
                  <div className="w-24 text-right font-mono text-sm font-bold text-solana">
                    {entry.xp.toLocaleString()}
                  </div>
                </div>
              );
            })
          )}
        </div>
        {hasMore[cacheKey] && !loading && entries.length > 0 && (
          <div className="p-4 flex justify-center border-t border-white/5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchLeaderboard(timeframe, courseId || undefined, (pages[cacheKey] || 1) + 1)}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("load_more", { fallback: "Load More" })}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
