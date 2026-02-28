"use client";

import { useState, useMemo } from "react";
import {
  Star,
  TrendingUp,
  Trophy,
  Flame,
  BookOpen,
  MapPin,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useWalletCompat as useWallet } from "@/lib/hooks/use-wallet-compat";
import { formatXP, xpProgress, getLevel } from "@/lib/utils";
import { useCourses } from "@/lib/hooks/use-courses";
import { TRACKS } from "@/lib/constants";
import { useLearningProgress } from "@/lib/hooks/use-learning-progress";
import {
  ProfileHeader,
  SkillChart,
  AchievementGrid,
  CredentialDisplay,
  CourseHistory,
} from "@/components/profile";
import type { SkillDataPoint, CredentialItem, CompletedCourseItem } from "@/components/profile";

const PROFILE_STORAGE_KEY = "sta-profile";
const PRIVACY_STORAGE_KEY = "sta-privacy";

function loadProfile(): Record<string, string> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function ProfilePage() {
  const t = useTranslations("profile");
  const tg = useTranslations("gamification");
  const { publicKey, connected } = useWallet();
  const { xp, streak, achievements, enrolledCourseIds, progressMap } = useLearningProgress();
  const { courses } = useCourses();

  const [isPublic, setIsPublic] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      const raw = localStorage.getItem(PRIVACY_STORAGE_KEY);
      if (raw) {
        const priv = JSON.parse(raw);
        if (typeof priv.profilePublic === "boolean") return priv.profilePublic;
      }
    } catch { /* ignore */ }
    return true;
  });

  const [profileData] = useState(() => {
    const p = loadProfile();
    return {
      displayName: p?.displayName || "Learner",
      bio: p?.bio || "",
      twitter: p?.twitter || "",
      github: p?.github || "",
      discord: p?.discord || "",
      avatar: p?.avatar || null,
    };
  });

  const handleToggleVisibility = () => {
    const next = !isPublic;
    setIsPublic(next);
    localStorage.setItem(PRIVACY_STORAGE_KEY, JSON.stringify({ profilePublic: next }));
  };

  const level = getLevel(xp);
  const progress = xpProgress(xp);

  const completedCourses: CompletedCourseItem[] = useMemo(() => {
    return Object.entries(progressMap)
      .filter(([, p]) => p.percentage === 100)
      .map(([courseId]) => {
        const course = courses.find((c) => c.slug === courseId || c.id === courseId);
        return {
          slug: courseId,
          title: course?.title || courseId,
          xpTotal: course?.xpTotal ?? 0,
        };
      });
  }, [progressMap, courses]);

  const skillData: SkillDataPoint[] = useMemo(() => {
    const trackXP: Record<string, number> = {};
    for (const courseId of enrolledCourseIds) {
      const course = courses.find((c) => c.slug === courseId || c.id === courseId);
      if (!course) continue;
      const trackName = TRACKS[course.trackId]?.display || "Other";
      const courseProgress = progressMap[courseId];
      const pct = courseProgress?.percentage ?? 0;
      trackXP[trackName] = (trackXP[trackName] || 0) + Math.round((pct / 100) * course.xpTotal);
    }
    const entries = Object.entries(trackXP);
    if (entries.length === 0) {
      return [
        { skill: "Anchor", value: 0 },
        { skill: "Rust", value: 0 },
        { skill: "Frontend", value: 0 },
        { skill: "Security", value: 0 },
        { skill: "DeFi", value: 0 },
        { skill: "Tokens", value: 0 },
      ];
    }
    const maxXP = Math.max(...entries.map(([, v]) => v), 1);
    return entries.map(([skill, value]) => ({
      skill,
      value: Math.round((value / maxXP) * 100),
    }));
  }, [enrolledCourseIds, progressMap, courses]);

  const credentials: CredentialItem[] = useMemo(() => {
    const trackMap: Record<number, { count: number; xp: number }> = {};
    for (const c of completedCourses) {
      const course = courses.find((mc) => mc.slug === c.slug || mc.id === c.slug);
      const trackId = course?.trackId ?? 0;
      if (!trackMap[trackId]) trackMap[trackId] = { count: 0, xp: 0 };
      trackMap[trackId].count++;
      trackMap[trackId].xp += c.xpTotal;
    }
    return Object.entries(trackMap).map(([trackIdStr, data]) => {
      const trackId = Number(trackIdStr);
      const track = TRACKS[trackId];
      return {
        trackId,
        trackName: track?.display || "Unknown",
        currentLevel: Math.min(data.count, 3),
        label: data.count >= 3 ? "Advanced" : data.count >= 2 ? "Intermediate" : "Beginner",
        coursesCompleted: data.count,
        totalXp: data.xp,
      };
    });
  }, [completedCourses, courses]);

  const claimedCount = useMemo(
    () => achievements.filter((a) => a.claimed).length,
    [achievements]
  );

  const initials = profileData.displayName
    .split(/[\s.]/)
    .filter(Boolean)
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "??";

  const walletAddress = connected && publicKey ? publicKey.toBase58() : null;
  const joinDate = new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <ProfileHeader
        initials={initials}
        displayName={profileData.displayName}
        bio={profileData.bio || undefined}
        avatarUrl={profileData.avatar}
        socialLinks={{
          twitter: profileData.twitter || undefined,
          github: profileData.github || undefined,
          discord: profileData.discord || undefined,
        }}
        joinDate={joinDate}
        isPublic={isPublic}
        onToggleVisibility={handleToggleVisibility}
        labels={{
          viewPublicProfile: t("viewPublicProfile"),
          editProfile: t("editProfile"),
          memberSince: t("memberSince", { date: joinDate }),
        }}
      />

      {/* Stats Row */}
      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard icon={<Star className="h-5 w-5 text-xp" />} bgClass="bg-xp/10" label={tg("xp")} value={formatXP(xp)} valueClass="text-xp" />
        <StatCard icon={<TrendingUp className="h-5 w-5 text-level" />} bgClass="bg-level/10" label={tg("level")} value={level} valueClass="text-level" />
        <StatCard icon={<Trophy className="h-5 w-5 text-st-green" />} bgClass="bg-st-green/10" label={tg("achievement")} value={claimedCount} valueClass="text-st-green-light" />
        <StatCard icon={<BookOpen className="h-5 w-5 text-brazil-green" />} bgClass="bg-brazil-green/10" label={t("completedCourses")} value={completedCourses.length} valueClass="text-brazil-green" />
        <div className="glass col-span-2 flex items-center gap-3 rounded-xl p-4 sm:col-span-1 lg:col-span-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-streak/10">
            <Flame className="h-5 w-5 animate-flame text-streak" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">{tg("streak")}</p>
            <p className="text-lg font-bold text-streak">{streak.currentStreak}d</p>
          </div>
        </div>
      </section>

      {/* Main Two-Column Layout */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <SkillChart skillData={skillData} title={t("skills")} emptyMessage={t("noSkills")} />
          <AchievementGrid achievements={achievements} claimedCount={claimedCount} title={tg("achievement")} emptyMessage={t("noBadges")} />
          <CourseHistory completedCourses={completedCourses} title={t("completedCourses")} emptyMessage={t("noCompletedCourses")} />
        </div>

        <div className="space-y-8">
          {/* XP Progress Card */}
          <div className="glass rounded-2xl p-6">
            <h2 className="mb-3 text-lg font-bold">{tg("level")}</h2>
            <div className="text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-st-green to-brazil-teal">
                <span className="text-2xl font-bold text-white">{level}</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {formatXP(xp - progress.currentLevelXp)} / {formatXP(progress.nextLevelXp - progress.currentLevelXp)} XP to Level {progress.level + 1}
              </p>
              <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-st-green to-brazil-teal transition-all duration-500"
                  style={{ width: `${Math.min(progress.progress, 100)}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{Math.round(progress.progress)}% complete</p>
            </div>
          </div>

          <CredentialDisplay credentials={credentials} title={t("credentials")} emptyMessage={t("noCredentials")} />

          {/* Wallet Card */}
          <div className="glass rounded-2xl p-6">
            <h2 className="mb-3 text-lg font-bold">{t("walletAddress")}</h2>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-muted">
                <MapPin className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                {walletAddress ? (
                  <>
                    <p className="truncate font-mono text-xs text-muted-foreground">{walletAddress}</p>
                    <p className="mt-0.5 text-xs text-brazil-green">Connected</p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">No wallet connected</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  bgClass,
  label,
  value,
  valueClass,
}: {
  icon: React.ReactNode;
  bgClass: string;
  label: string;
  value: string | number;
  valueClass: string;
}) {
  return (
    <div className="glass flex items-center gap-3 rounded-xl p-4">
      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${bgClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className={`text-lg font-bold ${valueClass}`}>{value}</p>
      </div>
    </div>
  );
}
