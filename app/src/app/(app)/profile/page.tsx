"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Star,
  TrendingUp,
  Trophy,
  Flame,
  BookOpen,
  MapPin,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useWalletCompat as useWallet } from "@/lib/hooks/use-wallet-compat";
import { formatXP, xpProgress, getLevel } from "@/lib/utils";
import { useCourses } from "@/lib/hooks/use-courses";
import { TRACKS } from "@/lib/constants";
import { useLearningProgress } from "@/lib/hooks/use-learning-progress";
import {
  ProfileHeader,
  SkillChart,
  StreakSection,
  AchievementGrid,
  CredentialDisplay,
  CourseHistory,
} from "@/components/profile";
import type { SkillDataPoint, CredentialItem, CompletedCourseItem } from "@/components/profile";

const PRIVACY_STORAGE_KEY = "sta-privacy";

type Tab = "overview" | "achievements" | "credentials" | "courses";

const TABS: { id: Tab; labelKey: string }[] = [
  { id: "overview", labelKey: "tabOverview" },
  { id: "achievements", labelKey: "tabAchievements" },
  { id: "credentials", labelKey: "tabCredentials" },
  { id: "courses", labelKey: "tabCourses" },
];

interface UserProfile {
  displayName: string;
  bio: string;
  twitter: string;
  github: string;
  discord: string;
  avatar: string | null;
  joinedAt: string | null;
  isPublic: boolean;
}

function loadLocalProfile(): Partial<UserProfile> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem("sta-profile");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export default function ProfilePage() {
  const t = useTranslations("profile");
  const tg = useTranslations("gamification");
  const { publicKey, connected } = useWallet();
  const { xp, streak, achievements, enrolledCourseIds, progressMap } = useLearningProgress();
  const { courses } = useCourses();

  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const [profileData, setProfileData] = useState<UserProfile>(() => {
    const local = loadLocalProfile();
    return {
      displayName: local.displayName || "Learner",
      bio: local.bio || "",
      twitter: local.twitter || "",
      github: local.github || "",
      discord: local.discord || "",
      avatar: local.avatar ?? null,
      joinedAt: null,
      isPublic: true,
    };
  });

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

  // Load profile from API
  useEffect(() => {
    let cancelled = false;
    fetch("/api/user")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setProfileData({
          displayName: data.displayName || "Learner",
          bio: data.bio || "",
          twitter: data.socialLinks?.twitter || "",
          github: data.socialLinks?.github || "",
          discord: data.socialLinks?.discord || "",
          avatar: data.avatar || null,
          joinedAt: data.joinedAt || null,
          isPublic: data.isPublic ?? true,
        });
        setIsPublic(data.isPublic ?? true);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const handleToggleVisibility = () => {
    const next = !isPublic;
    setIsPublic(next);
    localStorage.setItem(PRIVACY_STORAGE_KEY, JSON.stringify({ profilePublic: next }));
    fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic: next }),
    }).catch(() => {});
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

  const joinDate = profileData.joinedAt
    ? new Date(profileData.joinedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "";

  const tabLabels: Record<Tab, string> = {
    overview: t("tabOverview"),
    achievements: tg("achievement"),
    credentials: t("credentials"),
    courses: t("completedCourses"),
  };

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
          memberSince: joinDate ? t("memberSince", { date: joinDate }) : "",
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

      {/* Tab Bar */}
      <div className="mt-8 border-b border-white/10">
        <nav className="-mb-px flex gap-6 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tabLabels[tab.id]}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-8">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-8 lg:col-span-2">
              <SkillChart skillData={skillData} title={t("skills")} emptyMessage={t("noSkills")} />
              <StreakSection streak={streak} />
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
        )}

        {activeTab === "achievements" && (
          <AchievementGrid
            achievements={achievements}
            claimedCount={claimedCount}
            title={tg("achievement")}
            emptyMessage={t("noBadges")}
          />
        )}

        {activeTab === "credentials" && (
          <CredentialDisplay
            credentials={credentials}
            title={t("credentials")}
            emptyMessage={t("noCredentials")}
          />
        )}

        {activeTab === "courses" && (
          <CourseHistory
            completedCourses={completedCourses}
            title={t("completedCourses")}
            emptyMessage={t("noCompletedCourses")}
          />
        )}
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
