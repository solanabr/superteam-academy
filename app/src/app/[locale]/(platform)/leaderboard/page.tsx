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

export default function LeaderboardPage() {
  const t = useTranslations("leaderboard");
  const { user } = useAppUser();
  const { entries: allEntries, isLoading, fetchLeaderboard } = useLeaderboardStore();

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
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="font-display text-text-primary text-3xl font-semibold">{t("title")}</h1>
        <p className="text-text-secondary mt-2">{t("subtitle")}</p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            {(["daily", "weekly", "all-time"] as const).map((tf) => (
              <Button
                key={tf}
                variant={timeframe === tf ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeframe(tf)}
                className={clsx(
                  "rounded-full px-5 transition-all duration-200",
                  timeframe === tf && "shadow-[0_0_15px_rgba(20,241,149,0.15)]"
                )}
              >
                {tf.charAt(0).toUpperCase() + tf.slice(1).replace("-", " ")}
              </Button>
            ))}
          </div>

          <div className="h-4 w-[1px] bg-white/10 hidden sm:block" />

          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-full px-4 py-1.5 text-xs text-text-primary focus:outline-none focus:border-solana/50 transition-colors"
          >
            <option value="">{t("all_courses")}</option>
            {courses.map(c => (
              <option key={c._id} value={c._id}>{c.title}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="glass-panel overflow-hidden rounded-lg border border-white/5">
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
            entries.map((entry) => {
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
                    <div className="h-8 w-8 overflow-hidden rounded-full bg-white/10">
                      <img
                        src={`https://api.dicebear.com/9.x/bottts/svg?seed=${entry.walletAddress}&backgroundColor=0a0a0b&baseColor=14f195&radius=50&sidesProbability=0&topProbability=0`}
                        alt="avatar"
                        className="h-full w-full"
                      />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 group">
                        <Link href={`/profile/${entry.walletAddress}`} className={clsx("text-sm font-medium hover:underline flex items-center gap-2", isMe ? "text-solana" : "text-text-primary")}>
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
      </div>
    </div>
  );
}
