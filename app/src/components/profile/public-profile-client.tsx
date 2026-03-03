"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Trophy,
  Flame,
  Star,
  TrendingUp,
  BookOpen,
  Share2,
  Link2,
  Check,
  Loader2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { formatXP, xpProgress, getLevel } from "@/lib/utils";
import { TRACKS } from "@/lib/constants";
import { useCourses } from "@/lib/hooks/use-courses";
import type { Course, Achievement } from "@/types";
import {
  ProfileHeader,
  SkillChart,
  AchievementGrid,
  CredentialDisplay,
  CourseHistory,
} from "@/components/profile";
import type {
  SkillDataPoint,
  CredentialItem,
  CompletedCourseItem,
} from "@/components/profile";
import { MOCK_PUBLIC_PROFILES } from "../../../prisma/seed-data/profiles";
export type { MockProfile } from "../../../prisma/seed-data/profiles";
export { MOCK_PUBLIC_PROFILES };

// ──────────────────────────────────────────────
// API profile type
// ──────────────────────────────────────────────
interface ApiProfile {
  displayName: string;
  bio: string;
  joinedAt: string;
  socialLinks: { twitter?: string; github?: string; discord?: string };
  xp: number;
  level: number;
  streak: { currentStreak: number };
  achievements: Achievement[];
  credentials: Array<{
    trackId: number;
    trackName: string;
    currentLevel: number;
    coursesCompleted: number;
    totalXpEarned: number;
  }>;
  coursesCompleted: string[];
  enrolledCourses: string[];
  skillData?: SkillDataPoint[];
}

/** Derive credentials from completed courses */
function deriveCredentials(
  completedSlugs: string[],
  courseList: Course[],
): CredentialItem[] {
  const trackMap: Record<number, { count: number; xp: number }> = {};
  for (const slug of completedSlugs) {
    const course = courseList.find((c) => c.slug === slug || c.id === slug);
    if (!course) continue;
    const tid = course.trackId;
    if (!trackMap[tid]) trackMap[tid] = { count: 0, xp: 0 };
    trackMap[tid].count++;
    trackMap[tid].xp += course.xpTotal;
  }
  return Object.entries(trackMap).map(([idStr, data]) => {
    const trackId = Number(idStr);
    const track = TRACKS[trackId];
    return {
      trackId,
      trackName: track?.display || "Unknown",
      currentLevel: Math.min(data.count, 3),
      label:
        data.count >= 3
          ? "Advanced"
          : data.count >= 2
            ? "Intermediate"
            : "Beginner",
      coursesCompleted: data.count,
      totalXp: data.xp,
    };
  });
}

/** Derive completed course items from slugs */
function deriveCompletedCourses(
  slugs: string[],
  courseList: Course[],
): CompletedCourseItem[] {
  return slugs
    .map((slug) => {
      const course = courseList.find((c) => c.slug === slug || c.id === slug);
      return course
        ? { slug, title: course.title, xpTotal: course.xpTotal }
        : null;
    })
    .filter((c): c is CompletedCourseItem => c !== null);
}

/** Derive skill data from completed courses */
function deriveSkillData(
  completedSlugs: string[],
  courseList: Course[],
): SkillDataPoint[] {
  const trackXP: Record<string, number> = {};
  for (const slug of completedSlugs) {
    const course = courseList.find((c) => c.slug === slug || c.id === slug);
    if (!course) continue;
    const trackName = TRACKS[course.trackId]?.display || "Other";
    trackXP[trackName] = (trackXP[trackName] || 0) + course.xpTotal;
  }
  const entries = Object.entries(trackXP);
  if (entries.length === 0) return [];
  const maxXP = Math.max(...entries.map(([, v]) => v), 1);
  return entries.map(([skill, value]) => ({
    skill,
    value: Math.round((value / maxXP) * 100),
  }));
}

// ──────────────────────────────────────────────
// Share buttons component
// ──────────────────────────────────────────────
function ShareActions({
  username,
  displayName,
}: {
  username: string;
  displayName: string;
}) {
  const t = useTranslations("profile");
  const [copied, setCopied] = useState(false);

  const profileUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/profile/${username}`
      : `/profile/${username}`;

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [profileUrl]);

  const twitterText = encodeURIComponent(
    `Check out ${displayName}'s learning profile on Superteam Academy! 🚀\n\n${profileUrl}\n\n@SuperteamBR`,
  );
  const twitterUrl = `https://twitter.com/intent/tweet?text=${twitterText}`;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleCopyLink}
        className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
        title={t("copyLink")}
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-brazil-green" />
            <span className="text-brazil-green">{t("linkCopied")}</span>
          </>
        ) : (
          <>
            <Link2 className="h-3.5 w-3.5" />
            {t("copyLink")}
          </>
        )}
      </button>
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
        title={t("shareOnTwitter")}
      >
        <Share2 className="h-3.5 w-3.5" />
        {t("shareOnTwitter")}
      </a>
    </div>
  );
}

// ──────────────────────────────────────────────
// Stat card
// ──────────────────────────────────────────────
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
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full ${bgClass}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className={`text-lg font-bold ${valueClass}`}>{value}</p>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Page component
// ──────────────────────────────────────────────
export interface PublicProfileClientProps {
  username: string;
}

export default function PublicProfileClient({
  username,
}: PublicProfileClientProps) {
  const t = useTranslations("profile");
  const tg = useTranslations("gamification");
  const { courses: allCourses } = useCourses();

  const [apiProfile, setApiProfile] = useState<ApiProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundFromApi, setNotFoundFromApi] = useState(false);

  useEffect(() => {
    fetch(`/api/profile/${encodeURIComponent(username)}`)
      .then(async (res) => {
        if (res.status === 404) {
          setNotFoundFromApi(true);
          return null;
        }
        return res.ok ? res.json() : null;
      })
      .then((data) => {
        if (data) setApiProfile(data as ApiProfile);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [username]);

  // Show loading spinner while fetching
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If not in DB and not a mock profile, 404
  const mockProfile = MOCK_PUBLIC_PROFILES[username];
  if (notFoundFromApi && !mockProfile) {
    notFound();
  }

  // Build a unified profile from API data (preferred) or mock data (fallback)
  const profile = apiProfile
    ? {
        displayName: apiProfile.displayName,
        bio: apiProfile.bio,
        joinedAt: apiProfile.joinedAt,
        socialLinks: apiProfile.socialLinks,
        xp: apiProfile.xp,
        streak: apiProfile.streak.currentStreak,
        achievements: apiProfile.achievements,
        completedSlugs: apiProfile.coursesCompleted,
        skillData:
          apiProfile.skillData ??
          deriveSkillData(apiProfile.coursesCompleted, allCourses),
      }
    : {
        displayName: mockProfile!.displayName,
        bio: mockProfile!.bio,
        joinedAt: mockProfile!.joinedAt,
        socialLinks: mockProfile!.socialLinks,
        xp: mockProfile!.xp,
        streak: 12,
        achievements: mockProfile!.achievements,
        completedSlugs: mockProfile!.coursesCompleted,
        skillData: mockProfile!.skillData,
      };

  const level = getLevel(profile.xp);
  const progress = xpProgress(profile.xp);
  const claimedCount = profile.achievements.filter((a) => a.claimed).length;
  const completedCourses = deriveCompletedCourses(
    profile.completedSlugs,
    allCourses,
  );
  const credentials = deriveCredentials(profile.completedSlugs, allCourses);

  const initials = profile.displayName
    .split(/[\s.]/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const joinDate = new Date(profile.joinedAt).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link
        href="/leaderboard"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToLeaderboard")}
      </Link>

      {/* Profile Header with share actions */}
      <ProfileHeader
        initials={initials}
        displayName={profile.displayName}
        bio={profile.bio}
        socialLinks={profile.socialLinks}
        joinDate={joinDate}
        labels={{ memberSince: t("memberSince", { date: joinDate }) }}
        actionSlot={
          <ShareActions username={username} displayName={profile.displayName} />
        }
      />

      {/* Stats Row */}
      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          icon={<Star className="h-5 w-5 text-xp" />}
          bgClass="bg-xp/10"
          label={tg("xp")}
          value={formatXP(profile.xp)}
          valueClass="text-xp"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5 text-level" />}
          bgClass="bg-level/10"
          label={tg("level")}
          value={level}
          valueClass="text-level"
        />
        <StatCard
          icon={<Trophy className="h-5 w-5 text-st-green" />}
          bgClass="bg-st-green/10"
          label={tg("achievement")}
          value={claimedCount}
          valueClass="text-st-green-light"
        />
        <StatCard
          icon={<BookOpen className="h-5 w-5 text-brazil-green" />}
          bgClass="bg-brazil-green/10"
          label={t("completedCourses")}
          value={completedCourses.length}
          valueClass="text-brazil-green"
        />
        <div className="glass col-span-2 flex items-center gap-3 rounded-xl p-4 sm:col-span-1 lg:col-span-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-streak/10">
            <Flame className="h-5 w-5 animate-flame text-streak" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              {tg("streak")}
            </p>
            <p className="text-lg font-bold text-streak">{profile.streak}d</p>
          </div>
        </div>
      </section>

      {/* Main Two-Column Layout */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <SkillChart
            skillData={profile.skillData}
            title={t("skills")}
            emptyMessage={t("noSkills")}
          />
          <AchievementGrid
            achievements={profile.achievements}
            claimedCount={claimedCount}
            title={tg("achievement")}
            emptyMessage={t("noBadges")}
          />
          <CourseHistory
            completedCourses={completedCourses}
            title={t("completedCourses")}
            emptyMessage={t("noCompletedCourses")}
          />
        </div>

        <div className="space-y-8">
          {/* Level Progress Card */}
          <div className="glass rounded-2xl p-6">
            <h2 className="mb-3 text-lg font-bold">{t("levelProgress")}</h2>
            <div className="text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-st-green to-brazil-teal">
                <span className="text-2xl font-bold text-white">{level}</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {formatXP(profile.xp - progress.currentLevelXp)} /{" "}
                {formatXP(progress.nextLevelXp - progress.currentLevelXp)} XP
              </p>
              <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-st-green to-brazil-teal transition-all duration-500"
                  style={{ width: `${Math.min(progress.progress, 100)}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {Math.round(progress.progress)}%
              </p>
            </div>
          </div>

          <CredentialDisplay
            credentials={credentials}
            title={t("credentials")}
            emptyMessage={t("noCredentials")}
          />
        </div>
      </div>
    </div>
  );
}
