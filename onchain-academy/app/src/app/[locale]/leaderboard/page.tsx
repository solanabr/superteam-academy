"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { leaderboardService } from "@/services/leaderboard-service";
import { localLearningProgressService } from "@/services/local-learning-progress-service";
import { mockCourses } from "@/domain/mock-data";
import { getLevelFromXp } from "@/lib/utils";
import { useWalletStore } from "@/stores/wallet-store";
import { getLearnerId } from "@/lib/learner";
import { LeaderboardWindow } from "@/services/contracts";
import { getTotalXpFromProgress, rankEntries } from "@/lib/scoring";

type LeaderboardRow = {
  rank: number;
  wallet: string;
  name: string;
  xp: number;
  level: number;
  streak: number;
  avatarUrl?: string;
};

export default function LeaderboardPage() {
  const walletAddress = useWalletStore((state) => state.walletAddress);
  const [entries, setEntries] = useState<LeaderboardRow[]>([]);
  const [window, setWindow] = useState<LeaderboardWindow>("all-time");
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const load = async () => {
      const selectedCourseId = courseFilter === "all" ? null : courseFilter;
      const baseEntries = await leaderboardService.getLeaderboard(window, selectedCourseId);
      const learnerId = getLearnerId(walletAddress);
      const scopedCourses = selectedCourseId
        ? mockCourses.filter((course) => course.id === selectedCourseId)
        : mockCourses;
      const progressEntries = await Promise.all(
        scopedCourses.map(async (course) => {
          const progress = await localLearningProgressService.getProgress(learnerId, course.id);
          return { course, progress };
        }),
      );
      const totalCompletedLessons = progressEntries.reduce(
        (sum, { progress }) => sum + (progress?.completedLessonIds.length ?? 0),
        0,
      );
      const currentUserXp = getTotalXpFromProgress(
        scopedCourses,
        Object.fromEntries(progressEntries.map(({ course, progress }) => [course.id, progress ?? null])),
      );
      const streak = await localLearningProgressService.getStreakData(learnerId);
      const currentName =
        learnerId.includes("@") ? learnerId.split("@")[0] : learnerId.slice(0, 4) + "..." + learnerId.slice(-4);

      const computedUserEntry = {
        rank: 0,
        wallet: learnerId,
        name: `You (${currentName})`,
        xp: currentUserXp,
        level: getLevelFromXp(currentUserXp),
        streak: streak.current,
      };

      const all = rankEntries([
        ...baseEntries.map((entry) => ({
          ...entry,
          level: getLevelFromXp(entry.xp),
        })),
        ...(totalCompletedLessons > 0 ? [computedUserEntry] : []),
      ]);

      // Deduplicate if current user wallet already exists in base leaderboard.
      const unique: LeaderboardRow[] = [];
      const seen = new Set<string>();
      for (const entry of all) {
        const key = entry.wallet;
        if (seen.has(key)) continue;
        seen.add(key);
        unique.push(entry);
      }
      setEntries(rankEntries(unique));
    };
    load();
  }, [walletAddress, window, courseFilter]);

  const shownEntries = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? entries.filter(
          (entry) =>
            entry.name.toLowerCase().includes(q) ||
            entry.wallet.toLowerCase().includes(q),
        )
      : entries;
    return filtered.slice(0, 20);
  }, [entries, query]);
  const learnerId = getLearnerId(walletAddress);
  const myEntry = entries.find((entry) => entry.wallet === learnerId);
  const avgXp = entries.length ? Math.round(entries.reduce((sum, item) => sum + item.xp, 0) / entries.length) : 0;
  const percentile =
    myEntry && entries.length > 1
      ? Math.max(1, Math.round(((entries.length - myEntry.rank + 1) / entries.length) * 100))
      : null;

  return (
    <div className="bg-background min-h-screen pb-32 pt-8 md:pt-12 text-foreground">
      <div className="mx-auto max-w-[1000px] px-4 md:px-8">
        
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="text-[48px] md:text-[64px] font-bold tracking-tight text-white mb-4">
            Top Builders.
          </h1>
          <p className="text-[21px] text-white/50 font-medium">The most active developers in the ecosystem.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-surface border border-white/10 rounded-[20px] p-5 apple-shadow">
            <p className="text-[12px] uppercase tracking-[0.12em] text-white/50 font-semibold">Participants</p>
            <p className="text-[30px] font-semibold tracking-[-0.02em] mt-2 text-white">{entries.length}</p>
          </div>
          <div className="bg-surface border border-white/10 rounded-[20px] p-5 apple-shadow">
            <p className="text-[12px] uppercase tracking-[0.12em] text-white/50 font-semibold">Average XP</p>
            <p className="text-[30px] font-semibold tracking-[-0.02em] mt-2">{avgXp.toLocaleString()}</p>
          </div>
          <div className="bg-surface border border-white/10 rounded-[20px] p-5 apple-shadow">
            <p className="text-[12px] uppercase tracking-[0.12em] text-white/50 font-semibold">Your Position</p>
            <p className="text-[30px] font-semibold tracking-[-0.02em] mt-2 text-white">
              {myEntry ? `#${myEntry.rank}` : "Unranked"}
            </p>
            <p className="text-[12px] text-white/50 mt-1">{percentile ? `Top ${percentile}%` : "Complete lessons to rank"}</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-6">
          <div className="inline-flex bg-surface border border-white/10 rounded-full p-1 apple-shadow">
            {(["weekly", "monthly", "all-time"] as LeaderboardWindow[]).map((item) => (
              <button
                key={item}
                onClick={() => setWindow(item)}
                className={`h-9 px-4 rounded-full text-[13px] font-semibold transition-colors ${
                  window === item ? "bg-white text-black" : "text-white/50 hover:text-white"
                }`}
              >
                {item === "all-time" ? "All-time" : item[0].toUpperCase() + item.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex w-full md:w-auto gap-2">
            <select
              value={courseFilter}
              onChange={(event) => setCourseFilter(event.target.value)}
              className="h-10 w-full md:w-[240px] rounded-full bg-surface border border-white/10 px-4 text-[14px] text-white outline-none focus:border-white/30"
            >
              <option value="all" className="bg-background text-white">All courses</option>
              {mockCourses.map((course) => (
                <option key={course.id} value={course.id} className="bg-background text-white">
                  {course.title}
                </option>
              ))}
            </select>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search builder"
              className="h-10 w-full md:w-[260px] rounded-full bg-surface border border-white/10 px-4 text-[14px] text-white placeholder:text-white/30 outline-none focus:border-white/30"
            />
          </div>
        </div>

        {/* List Container */}
        <div className="bg-surface border border-white/10 rounded-[32px] p-4 md:p-8 apple-shadow">
          <div className="flex flex-col">
            {shownEntries.map((entry, index) => (
              <div 
                key={`${entry.wallet}-${entry.rank}`} 
                className={`flex items-center gap-4 md:gap-8 p-4 md:p-6 rounded-[24px] transition-colors ${
                  entry.wallet === learnerId ? "bg-white/10 border border-white/20" : "hover:bg-white/5"
                } ${index !== shownEntries.length - 1 ? 'border-b border-white/10' : ''}`}
              >
                {/* Rank */}
                <div className="w-12 text-center shrink-0">
                  <span className={`text-[24px] font-bold tracking-tight ${entry.rank <= 3 ? 'text-white' : 'text-white/30'}`}>
                    {entry.rank}
                  </span>
                </div>

                {/* Avatar & Name */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="relative w-14 h-14 rounded-full overflow-hidden bg-background shrink-0 border border-white/10">
                    <Image 
                      src={entry.avatarUrl || "/assets/default-avatar.svg"} 
                      alt="avatar" 
                      fill 
                    />
                  </div>
                  <div className="truncate">
                    <p className="text-[17px] font-semibold text-white truncate">
                      {entry.name || `${entry.wallet.slice(0, 4)}...${entry.wallet.slice(-4)}`}
                      {entry.wallet === learnerId && <span className="ml-2 text-[12px] text-white/70 font-semibold border border-white/20 px-2 py-0.5 rounded-full">You</span>}
                    </p>
                    <p className="text-[14px] text-white/50">Level {entry.level}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="hidden md:flex items-center gap-12 shrink-0 text-right">
                  <div>
                    <p className="text-[17px] font-semibold text-white">{entry.xp.toLocaleString()}</p>
                    <p className="text-[13px] text-white/50 font-medium uppercase tracking-wider">XP</p>
                  </div>
                  <div className="w-24">
                    <p className="text-[17px] font-semibold text-[#ff9500]">{entry.streak} Days</p>
                    <p className="text-[13px] text-white/50 font-medium uppercase tracking-wider">Streak</p>
                  </div>
                </div>
              </div>
            ))}
            {shownEntries.length === 0 && (
              <div className="rounded-[20px] bg-background border border-white/10 px-5 py-8 text-center text-[15px] text-white/50">
                No builders found for this filter.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
