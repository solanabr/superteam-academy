"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { mockCourses } from "@/domain/mock-data";
import { ProgressBar } from "@/components/ui/progress";
import { localLearningProgressService } from "@/services/local-learning-progress-service";
import { leaderboardService } from "@/services/leaderboard-service";
import { getLevelFromXp } from "@/lib/utils";
import { useWalletStore } from "@/stores/wallet-store";
import { LearningProgress } from "@/domain/models";
import { getLearnerId } from "@/lib/learner";
import { getTotalXpFromProgress, rankEntries } from "@/lib/scoring";
import { backendClient } from "@/lib/backend/client";
import { onchainIdentityService } from "@/services/onchain-identity-service";

export default function DashboardPage() {
  const walletAddress = useWalletStore((state) => state.walletAddress);
  const [totalXp, setTotalXp] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [rank, setRank] = useState<number | null>(null);
  const [progressByCourse, setProgressByCourse] = useState<Record<string, number>>({});
  const [progressDetails, setProgressDetails] = useState<Record<string, LearningProgress | null>>({});
  const [remoteActivity, setRemoteActivity] = useState<Array<{ id: string; text: string; updatedAt: string }>>([]);

  useEffect(() => {
    const loadDashboard = async () => {
      const learnerId = getLearnerId(walletAddress);
      const progressEntries = await Promise.all(
        mockCourses.map(async (course) => {
          const progress = await localLearningProgressService.getProgress(learnerId, course.id);
          return { course, progress };
        }),
      );

      const progressMap = Object.fromEntries(
        progressEntries.map(({ course, progress }) => [course.id, progress?.percentComplete ?? 0]),
      );
      setProgressByCourse(progressMap);

      const progressDetailMap = Object.fromEntries(progressEntries.map(({ course, progress }) => [course.id, progress ?? null]));
      setProgressDetails(progressDetailMap);

      const totalCompletedLessons = progressEntries.reduce(
        (sum, { progress }) => sum + (progress?.completedLessonIds.length ?? 0),
        0,
      );
      const derivedXp = getTotalXpFromProgress(mockCourses, progressDetailMap);
      let effectiveXp = derivedXp;
      if (walletAddress) {
        try {
          const onchainXp = await onchainIdentityService.getXPBalance(walletAddress);
          if (Number.isFinite(onchainXp) && onchainXp > 0) {
            effectiveXp = onchainXp;
          }
        } catch {
          // Keep derived XP fallback when chain lookup fails.
        }
      }
      setTotalXp(effectiveXp);

      const streak = await localLearningProgressService.getStreakData(learnerId);
      setStreakDays(streak.current);

      if (totalCompletedLessons === 0) {
        setRank(null);
        return;
      }
      const entries = await leaderboardService.getLeaderboard("all-time");
      const unique = new Map(entries.map((entry) => [entry.wallet, entry]));
      unique.set(learnerId, {
        rank: 0,
        wallet: learnerId,
        name: "You",
        xp: effectiveXp,
        level: getLevelFromXp(effectiveXp),
        streak: streak.current,
      });
      const ranking = rankEntries([...unique.values()]);
      setRank(ranking.find((entry) => entry.wallet === learnerId)?.rank ?? null);

      try {
        const activity = await backendClient.getActivity(learnerId);
        if (activity && activity.length > 0) {
          const mapped = activity.map((item) => {
            if (item.eventType === "lesson_completed") {
              return {
                id: item.id,
                text: `Completed lesson ${item.lessonId ?? ""} in ${item.courseId ?? "a course"}`.trim(),
                updatedAt: item.createdAt,
              };
            }
            if (item.eventType === "course_enrolled") {
              return {
                id: item.id,
                text: `Enrolled in ${item.courseId ?? "a course"}`,
                updatedAt: item.createdAt,
              };
            }
            return {
              id: item.id,
              text: "Recent learning activity",
              updatedAt: item.createdAt,
            };
          });
          setRemoteActivity(mapped);
        }
      } catch {
        setRemoteActivity([]);
      }
    };
    loadDashboard();
  }, [walletAddress]);

  const continueCourses = useMemo(() => {
    const withProgress = mockCourses
      .map((course) => ({ course, progress: progressByCourse[course.id] ?? 0 }))
      .sort((a, b) => b.progress - a.progress);
    const inProgress = withProgress.filter((item) => item.progress > 0 && item.progress < 100);
    return (inProgress.length > 0 ? inProgress : withProgress).slice(0, 2);
  }, [progressByCourse]);

  const snapshot = useMemo(() => {
    const values = Object.values(progressByCourse);
    const completedCourses = values.filter((value) => value >= 100).length;
    const inProgressCourses = values.filter((value) => value > 0 && value < 100).length;
    const notStartedCourses = mockCourses.length - completedCourses - inProgressCourses;
    const completionRate = mockCourses.length
      ? Math.round((completedCourses / mockCourses.length) * 100)
      : 0;
    return { completedCourses, inProgressCourses, notStartedCourses, completionRate };
  }, [progressByCourse]);

  const activityFeed = useMemo(() => {
    if (remoteActivity.length > 0) {
      return remoteActivity.slice(0, 4);
    }

    const items = Object.entries(progressDetails)
      .map(([courseId, progress]) => {
        if (!progress || progress.completedLessonIds.length === 0) return null;
        const course = mockCourses.find((item) => item.id === courseId);
        if (!course) return null;
        const completedLessons = progress.completedLessonIds.length;
        return {
          id: courseId,
          text: `Completed ${completedLessons} lesson${completedLessons > 1 ? "s" : ""} in ${course.title}`,
          updatedAt: progress.updatedAt,
        };
      })
      .filter(Boolean) as Array<{ id: string; text: string; updatedAt: string }>;
    return items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 4);
  }, [progressDetails, remoteActivity]);

  const recommendedCourses = useMemo(() => {
    return mockCourses
      .map((course) => ({ course, progress: progressByCourse[course.id] ?? 0 }))
      .filter((item) => item.progress === 0)
      .slice(0, 2);
  }, [progressByCourse]);

  const level = getLevelFromXp(totalXp);

  return (
    <div className="bg-background min-h-screen pb-32 pt-8 md:pt-12 text-foreground">
      <div className="mx-auto max-w-[1200px] px-4 md:px-8">
        
        {/* Header */}
        <div className="mb-16">
          <h1 className="text-[48px] md:text-[64px] font-bold tracking-tight text-white mb-4">
            Welcome back.
          </h1>
          <p className="text-[21px] text-white/50 font-medium">Pick up right where you left off.</p>
        </div>

        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-surface border border-white/10 rounded-[32px] p-8 apple-shadow flex flex-col justify-between h-[200px]">
             <div>
               <p className="text-[15px] font-medium text-white/50 uppercase tracking-wide">Total XP</p>
               <p className="text-[48px] font-bold tracking-tight mt-2 text-white">{totalXp.toLocaleString()}</p>
             </div>
             <p className="text-[15px] font-medium text-white/70">Level {level} Builder</p>
          </div>
          <div className="bg-surface border border-white/10 rounded-[32px] p-8 apple-shadow flex flex-col justify-between h-[200px]">
             <div>
               <p className="text-[15px] font-medium text-white/50 uppercase tracking-wide">Current Streak</p>
               <p className="text-[48px] font-bold tracking-tight mt-2 text-[#ff9500]">{streakDays} <span className="text-[24px]">days</span></p>
             </div>
             <p className="text-[15px] font-medium text-white/70">Keep it going!</p>
          </div>
          <div className="bg-gradient-to-br from-surface to-[#111111] border border-white/10 rounded-[32px] p-8 apple-shadow flex flex-col justify-between h-[200px] text-white">
             <div>
               <p className="text-[15px] font-medium text-white/50 uppercase tracking-wide">Global Rank</p>
               <p className="text-[40px] font-bold tracking-tight mt-2">{rank ? `#${rank}` : "Unranked"}</p>
             </div>
             <Link href="/leaderboard" className="text-[15px] font-medium text-white hover:underline">View Leaderboard &rarr;</Link>
          </div>
        </div>

        {/* Snapshot */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-16">
          <div className="bg-surface border border-white/10 rounded-[24px] p-5 apple-shadow">
            <p className="text-[12px] uppercase tracking-[0.12em] text-white/50 font-semibold">Course completion</p>
            <p className="text-[30px] font-semibold tracking-[-0.02em] mt-2 text-white">{snapshot.completionRate}%</p>
          </div>
          <div className="bg-surface border border-white/10 rounded-[24px] p-5 apple-shadow">
            <p className="text-[12px] uppercase tracking-[0.12em] text-white/50 font-semibold">Completed</p>
            <p className="text-[30px] font-semibold tracking-[-0.02em] mt-2 text-white">{snapshot.completedCourses}</p>
          </div>
          <div className="bg-surface border border-white/10 rounded-[24px] p-5 apple-shadow">
            <p className="text-[12px] uppercase tracking-[0.12em] text-white/50 font-semibold">In Progress</p>
            <p className="text-[30px] font-semibold tracking-[-0.02em] mt-2 text-white">{snapshot.inProgressCourses}</p>
          </div>
          <div className="bg-surface border border-white/10 rounded-[24px] p-5 apple-shadow">
            <p className="text-[12px] uppercase tracking-[0.12em] text-white/50 font-semibold">Not Started</p>
            <p className="text-[30px] font-semibold tracking-[-0.02em] mt-2 text-white">{snapshot.notStartedCourses}</p>
          </div>
        </div>

        {/* Continue Learning */}
        <h2 className="text-[32px] font-bold tracking-tight mb-8 text-white">Continue Learning</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {continueCourses.map(({ course, progress }) => (
            <Link key={course.id} href={`/courses/${course.slug}`} className="group bg-surface border border-white/10 rounded-[32px] p-6 apple-shadow apple-shadow-hover flex flex-col sm:flex-row gap-8 items-center">
              <div className="relative w-full sm:w-[200px] aspect-[4/3] rounded-[20px] overflow-hidden bg-black shrink-0">
                <Image
                  src={course.thumbnailUrl || "https://images.unsplash.com/photo-1639762681485-074b7f4ec651"}
                  alt={course.title}
                  fill
                  className="object-cover opacity-90 group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="flex-1 w-full">
                <p className="text-[13px] font-semibold text-white/50 mb-2 uppercase tracking-wide">
                  Module {Math.max(1, Math.ceil((progress / 100) * course.lessons.length))} / {course.lessons.length}
                </p>
                <h3 className="font-bold text-[24px] tracking-tight leading-tight mb-6 text-white">{course.title}</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-[14px] font-medium text-white">
                    <span>{progress}% complete</span>
                    <span className="text-white/50">{Math.max(0, Math.round(course.durationHours * (1 - progress / 100)))}h left</span>
                  </div>
                  <ProgressBar value={progress} className="h-2 rounded-full" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-16">
          <div className="bg-surface border border-white/10 rounded-[28px] p-6 apple-shadow">
            <h3 className="text-[24px] font-semibold tracking-[-0.02em] mb-4 text-white">Recent activity</h3>
            {activityFeed.length === 0 ? (
              <p className="text-[15px] text-white/50">No activity yet. Complete your first lesson to populate this feed.</p>
            ) : (
              <div className="space-y-3">
                {activityFeed.map((item) => (
                  <div key={item.id} className="rounded-[16px] bg-background border border-white/5 px-4 py-3">
                    <p className="text-[14px] text-white/90">{item.text}</p>
                    <p className="text-[12px] text-white/50 mt-1">{new Date(item.updatedAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-surface border border-white/10 rounded-[28px] p-6 apple-shadow">
            <h3 className="text-[24px] font-semibold tracking-[-0.02em] mb-4 text-white">Recommended next</h3>
            {recommendedCourses.length === 0 ? (
              <p className="text-[15px] text-white/50">You started every available course. Great momentum.</p>
            ) : (
              <div className="space-y-3">
                {recommendedCourses.map(({ course }) => (
                  <Link
                    key={course.id}
                    href={`/courses/${course.slug}`}
                    className="block rounded-[16px] bg-background border border-white/5 px-4 py-3 hover:bg-white/5 transition-colors"
                  >
                    <p className="text-[15px] font-semibold text-white">{course.title}</p>
                    <p className="text-[13px] text-white/50 mt-1">
                      {course.difficulty} · {course.durationHours}h · +{course.xpReward} XP
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
