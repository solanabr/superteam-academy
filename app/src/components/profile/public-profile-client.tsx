"use client";

import { useState, useCallback } from "react";
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
} from "lucide-react";
import { useTranslations } from "next-intl";
import { formatXP, xpProgress, getLevel } from "@/lib/utils";
import { TRACKS } from "@/lib/constants";
import { useCourses } from "@/lib/hooks/use-courses";
import type { Course } from "@/types";
import {
  ProfileHeader,
  SkillChart,
  AchievementGrid,
  CredentialDisplay,
  CourseHistory,
} from "@/components/profile";
import type { SkillDataPoint, CredentialItem, CompletedCourseItem } from "@/components/profile";
import type { Achievement } from "@/types";

// ──────────────────────────────────────────────
// Mock public profiles — rich demo data
// ──────────────────────────────────────────────
interface MockProfile {
  displayName: string;
  bio: string;
  joinedAt: string;
  socialLinks: { twitter?: string; github?: string; discord?: string };
  xp: number;
  coursesCompleted: string[];
  achievements: Achievement[];
  skillData: SkillDataPoint[];
}

const MOCK_PUBLIC_PROFILES: Record<string, MockProfile> = {
  "soldev-eth": {
    displayName: "SolDev.eth",
    bio: "Full-stack Solana builder. Learning Anchor, building DeFi, and shipping dApps. Superteam Brazil contributor.",
    joinedAt: "2025-11-15T00:00:00Z",
    socialLinks: { twitter: "SolDevEth", github: "soldev-eth" },
    xp: 1750,
    coursesCompleted: ["intro-to-solana", "anchor-fundamentals", "nextjs-solana-dapps"],
    achievements: [
      { id: 1, name: "First Steps", description: "Complete your first lesson", icon: "footprints", category: "progress", xpReward: 50, claimed: true, claimedAt: "2025-12-01T00:00:00Z" },
      { id: 2, name: "Fast Learner", description: "Complete 5 lessons in one day", icon: "zap", category: "progress", xpReward: 100, claimed: true, claimedAt: "2025-12-10T00:00:00Z" },
      { id: 5, name: "Course Master", description: "Complete an entire course", icon: "graduation-cap", category: "progress", xpReward: 200, claimed: true, claimedAt: "2026-01-10T00:00:00Z" },
      { id: 6, name: "Streak Starter", description: "Maintain a 7-day streak", icon: "flame", category: "streaks", xpReward: 75, claimed: true, claimedAt: "2025-12-20T00:00:00Z" },
      { id: 11, name: "Code Warrior", description: "Complete 10 coding challenges", icon: "code", category: "skills", xpReward: 100, claimed: true, claimedAt: "2026-01-15T00:00:00Z" },
      { id: 16, name: "Early Adopter", description: "Join the platform in its first month", icon: "rocket", category: "special", xpReward: 150, claimed: true, claimedAt: "2025-11-15T00:00:00Z" },
      { id: 3, name: "Speed Runner", description: "Complete a course in under 3 days", icon: "timer", category: "progress", xpReward: 150, claimed: false },
      { id: 8, name: "Monthly Master", description: "Maintain a 30-day streak", icon: "calendar-check", category: "streaks", xpReward: 200, claimed: false },
    ],
    skillData: [
      { skill: "Anchor Framework", value: 70 },
      { skill: "Standalone", value: 85 },
      { skill: "Frontend & dApps", value: 60 },
      { skill: "DeFi Development", value: 20 },
      { skill: "Program Security", value: 10 },
    ],
  },
  "anchor-pro": {
    displayName: "AnchorPro",
    bio: "Anchor framework specialist. Building on-chain programs for Superteam ecosystem. Security enthusiast.",
    joinedAt: "2025-12-01T00:00:00Z",
    socialLinks: { twitter: "AnchorPro", github: "anchor-pro", discord: "anchorpro" },
    xp: 3200,
    coursesCompleted: ["intro-to-solana", "anchor-fundamentals", "token-engineering", "solana-security", "defi-fundamentals"],
    achievements: [
      { id: 1, name: "First Steps", description: "Complete your first lesson", icon: "footprints", category: "progress", xpReward: 50, claimed: true, claimedAt: "2025-12-05T00:00:00Z" },
      { id: 2, name: "Fast Learner", description: "Complete 5 lessons in one day", icon: "zap", category: "progress", xpReward: 100, claimed: true, claimedAt: "2025-12-12T00:00:00Z" },
      { id: 5, name: "Course Master", description: "Complete an entire course", icon: "graduation-cap", category: "progress", xpReward: 200, claimed: true, claimedAt: "2025-12-15T00:00:00Z" },
      { id: 6, name: "Streak Starter", description: "Maintain a 7-day streak", icon: "flame", category: "streaks", xpReward: 75, claimed: true, claimedAt: "2025-12-18T00:00:00Z" },
      { id: 8, name: "Monthly Master", description: "Maintain a 30-day streak", icon: "calendar-check", category: "streaks", xpReward: 200, claimed: true, claimedAt: "2026-01-15T00:00:00Z" },
      { id: 11, name: "Code Warrior", description: "Complete 10 coding challenges", icon: "code", category: "skills", xpReward: 100, claimed: true, claimedAt: "2026-01-20T00:00:00Z" },
      { id: 12, name: "Security Expert", description: "Complete the Security track", icon: "shield", category: "skills", xpReward: 200, claimed: true, claimedAt: "2026-02-01T00:00:00Z" },
      { id: 13, name: "Token Engineer", description: "Complete the Token Engineering track", icon: "coins", category: "skills", xpReward: 150, claimed: true, claimedAt: "2026-01-20T00:00:00Z" },
      { id: 16, name: "Early Adopter", description: "Join the platform in its first month", icon: "rocket", category: "special", xpReward: 150, claimed: true, claimedAt: "2025-12-01T00:00:00Z" },
      { id: 3, name: "Speed Runner", description: "Complete a course in under 3 days", icon: "timer", category: "progress", xpReward: 150, claimed: false },
    ],
    skillData: [
      { skill: "Anchor Framework", value: 95 },
      { skill: "Standalone", value: 80 },
      { skill: "Token Engineering", value: 75 },
      { skill: "Program Security", value: 90 },
      { skill: "DeFi Development", value: 70 },
      { skill: "Frontend & dApps", value: 30 },
    ],
  },
};

/** Exported for server-side metadata generation */
export { MOCK_PUBLIC_PROFILES };
export type { MockProfile };

/** Derive credentials from completed courses */
function deriveCredentials(completedSlugs: string[], courseList: Course[]): CredentialItem[] {
  const trackMap: Record<number, { count: number; xp: number }> = {};
  for (const slug of completedSlugs) {
    const course = courseList.find((c) => c.slug === slug);
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
      label: data.count >= 3 ? "Advanced" : data.count >= 2 ? "Intermediate" : "Beginner",
      coursesCompleted: data.count,
      totalXp: data.xp,
    };
  });
}

/** Derive completed course items from slugs */
function deriveCompletedCourses(slugs: string[], courseList: Course[]): CompletedCourseItem[] {
  return slugs
    .map((slug) => {
      const course = courseList.find((c) => c.slug === slug);
      return course ? { slug, title: course.title, xpTotal: course.xpTotal } : null;
    })
    .filter((c): c is CompletedCourseItem => c !== null);
}

// ──────────────────────────────────────────────
// Share buttons component
// ──────────────────────────────────────────────
function ShareActions({ username, displayName }: { username: string; displayName: string }) {
  const t = useTranslations("profile");
  const [copied, setCopied] = useState(false);

  const profileUrl = typeof window !== "undefined"
    ? `${window.location.origin}/profile/${username}`
    : `/profile/${username}`;

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [profileUrl]);

  const twitterText = encodeURIComponent(
    `Check out ${displayName}'s learning profile on Superteam Academy! 🚀\n\n${profileUrl}\n\n@SuperteamBR`
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

// ──────────────────────────────────────────────
// Page component
// ──────────────────────────────────────────────
export interface PublicProfileClientProps {
  username: string;
}

export default function PublicProfileClient({ username }: PublicProfileClientProps) {
  const t = useTranslations("profile");
  const tg = useTranslations("gamification");
  const { courses: allCourses } = useCourses();

  const profile = MOCK_PUBLIC_PROFILES[username];
  if (!profile) {
    notFound();
  }

  const level = getLevel(profile.xp);
  const progress = xpProgress(profile.xp);
  const claimedCount = profile.achievements.filter((a) => a.claimed).length;
  const completedCourses = deriveCompletedCourses(profile.coursesCompleted, allCourses);
  const credentials = deriveCredentials(profile.coursesCompleted, allCourses);

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
        actionSlot={<ShareActions username={username} displayName={profile.displayName} />}
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
            <p className="text-xs font-medium text-muted-foreground">{tg("streak")}</p>
            <p className="text-lg font-bold text-streak">12d</p>
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
