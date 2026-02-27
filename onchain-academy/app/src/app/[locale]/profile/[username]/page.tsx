"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Copy,
  ExternalLink,
  Flame,
  Github,
  Twitter,
  Shield,
} from "lucide-react";
import { formatDate, formatNumber } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { StreakCalendar } from "@/components/gamification/streak-calendar";
import { AchievementBadge } from "@/components/gamification/achievement-badge";
import { SkillConstellation } from "@/components/gamification/skill-constellation";
import { achievements } from "@/lib/services/courses";
import { TRACK_LABELS, TRACK_COLORS } from "@/lib/constants";
import type { Track, UserProfile, Credential } from "@/lib/services/types";

function generateDemoActivity(): Record<string, number> {
  const history: Record<string, number> = {};
  const today = new Date();
  for (let i = 0; i < 60; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const key = date.toISOString().split("T")[0];
    const active =
      i < 12 ? true : i < 20 ? Math.random() > 0.3 : Math.random() > 0.6;
    history[key] = active ? Math.floor(Math.random() * 160) + 40 : 0;
  }
  return history;
}

const DEMO_CREDENTIALS: Credential[] = [
  {
    id: "rust-track-1",
    mint: "F2mk3n6gZVCk51YVLkYqwjy3RyToUKmQ26EweRejBYwx",
    track: "rust",
    level: 1,
    coursesCompleted: 1,
    xpEarned: 540,
    imageUrl: "",
    metadataUri: "https://arweave.net/placeholder-e2e-test-credential",
    issuedAt: "2026-02-27T00:00:00.000Z",
    explorerUrl:
      "https://explorer.solana.com/address/F2mk3n6gZVCk51YVLkYqwjy3RyToUKmQ26EweRejBYwx?cluster=devnet",
  },
];

const DEMO_USERS: Record<string, UserProfile> = {
  soldev: {
    wallet: "7Rq1...dK4f",
    displayName: "SolDev.eth",
    bio: "Solana developer building the future of decentralized learning. Rust enthusiast, DeFi explorer.",
    xp: 2800,
    level: 5,
    streak: {
      currentStreak: 12,
      longestStreak: 24,
      lastActivityDate: new Date().toISOString(),
      freezesAvailable: 2,
      activityHistory: generateDemoActivity(),
    },
    achievements: [
      {
        id: "first-lesson",
        name: "First Steps",
        description: "Complete your first lesson",
        icon: "🎯",
        xpReward: 50,
        unlockedAt: "2025-11-15T00:00:00.000Z",
        category: "learning",
      },
      {
        id: "streak-7",
        name: "Week Warrior",
        description: "7-day streak",
        icon: "🔥",
        xpReward: 100,
        unlockedAt: "2025-12-01T00:00:00.000Z",
        category: "streak",
      },
      {
        id: "first-challenge",
        name: "Code Runner",
        description: "Complete first code challenge",
        icon: "💻",
        xpReward: 75,
        unlockedAt: "2025-12-10T00:00:00.000Z",
        category: "learning",
      },
    ],
    credentials: DEMO_CREDENTIALS,
    skills: {
      rust: 65,
      anchor: 40,
      frontend: 80,
      security: 15,
      defi: 50,
      mobile: 10,
    },
    joinedAt: "2025-11-01T00:00:00.000Z",
    isPublic: true,
  },
  rustbuilder: {
    wallet: "9nQE...GFJk",
    displayName: "RustBuilder",
    bio: "Systems programmer exploring Solana. Building open-source tools for the ecosystem.",
    xp: 1900,
    level: 4,
    streak: {
      currentStreak: 7,
      longestStreak: 14,
      lastActivityDate: new Date().toISOString(),
      freezesAvailable: 1,
      activityHistory: generateDemoActivity(),
    },
    achievements: [
      {
        id: "first-lesson",
        name: "First Steps",
        description: "Complete your first lesson",
        icon: "🎯",
        xpReward: 50,
        unlockedAt: "2025-12-01T00:00:00.000Z",
        category: "learning",
      },
      {
        id: "streak-7",
        name: "Week Warrior",
        description: "7-day streak",
        icon: "🔥",
        xpReward: 100,
        unlockedAt: "2026-01-05T00:00:00.000Z",
        category: "streak",
      },
    ],
    credentials: [DEMO_CREDENTIALS[0], DEMO_CREDENTIALS[1]],
    skills: {
      rust: 85,
      anchor: 60,
      frontend: 20,
      security: 35,
      defi: 10,
      mobile: 0,
    },
    joinedAt: "2025-12-01T00:00:00.000Z",
    isPublic: true,
  },
};

export default function PublicProfilePage() {
  const t = useTranslations("profile");
  const params = useParams();
  const locale = params.locale as string;
  const username = (params.username as string).toLowerCase();

  const profileUser = DEMO_USERS[username];

  if (!profileUser) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 text-center">
        <div className="rounded-[2px] border border-dashed border-[var(--c-border-prominent)] p-4 mb-6 inline-block">
          <Shield className="w-12 h-12 text-[var(--c-text-2)]/30" />
        </div>
        <h1 className="text-xl font-semibold text-[var(--c-text)] mb-2">
          {t("profileNotFound")}
        </h1>
        <p className="text-sm text-[var(--c-text-2)] mb-6">
          {t("profileNotFoundDesc")}
        </p>
        <Link
          href={`/${locale}/leaderboard`}
          className="text-sm text-[#00FFA3] hover:underline"
        >
          {t("viewLeaderboard")}
        </Link>
      </div>
    );
  }

  const userAchievements = achievements.map((a) => {
    const unlocked = profileUser.achievements.find((ua) => ua.id === a.id);
    return unlocked ? { ...a, unlockedAt: unlocked.unlockedAt } : a;
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Public Profile Banner */}
      <div className="mb-6 rounded-[2px] border border-[#55E9AB]/20 bg-[#55E9AB]/5 p-3 flex items-center gap-3">
        <Shield className="h-4 w-4 text-[#55E9AB] shrink-0" />
        <p className="text-xs text-[var(--c-text-2)]">
          {t("publicProfileBanner")}
        </p>
      </div>

      {/* Identity Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
        <Avatar
          fallback={profileUser.displayName.charAt(0)}
          size="xl"
          className="h-24 w-24 rounded-[2px] ring-4 ring-[var(--c-bg-card)] shadow-xl"
        />
        <div className="flex-1 text-center md:text-left min-w-0">
          <h1 className="text-2xl font-semibold text-[var(--c-text)]">
            {profileUser.displayName}
          </h1>
          {profileUser.wallet && (
            <p className="mt-1 flex items-center justify-center md:justify-start gap-2 font-mono text-sm text-[var(--c-text-2)]">
              {profileUser.wallet}
              <button
                onClick={() =>
                  navigator.clipboard.writeText(profileUser.wallet ?? "")
                }
                className="hover:text-[var(--c-text)] transition-colors"
                aria-label="Copy wallet address"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </p>
          )}
          {profileUser.bio && (
            <p className="mt-2 text-[var(--c-text-2)] text-sm">
              {profileUser.bio}
            </p>
          )}
          <p className="mt-2 text-xs text-[var(--c-text-2)]">
            {t("joined")} {formatDate(profileUser.joinedAt, locale)}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--c-text-2)] hover:text-[#55E9AB] transition-colors"
              aria-label="Twitter profile"
            >
              <Twitter className="h-4 w-4" />
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--c-text-2)] hover:text-[#55E9AB] transition-colors"
              aria-label="GitHub profile"
            >
              <Github className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Stat Ribbon */}
      <dl className="flex flex-wrap gap-4 border-y border-[var(--c-border-subtle)] py-6 mb-8">
        <div className="flex-1 min-w-[100px] text-center">
          <dd className="text-3xl font-mono text-[var(--c-text)] tabular-nums">
            {formatNumber(profileUser.xp, locale)}
          </dd>
          <dt className="text-xs font-medium text-[var(--c-text-2)] uppercase tracking-wider mt-1">
            {t("totalXP")}
          </dt>
        </div>
        <div
          className="w-px bg-[var(--c-border-subtle)] hidden sm:block"
          role="presentation"
        />
        <div className="flex-1 min-w-[100px] text-center">
          <dd className="text-3xl font-mono text-[var(--c-text)] tabular-nums">
            {profileUser.credentials.length}
          </dd>
          <dt className="text-xs font-medium text-[var(--c-text-2)] uppercase tracking-wider mt-1">
            {t("credentials")}
          </dt>
        </div>
        <div
          className="w-px bg-[var(--c-border-subtle)] hidden sm:block"
          role="presentation"
        />
        <div className="flex-1 min-w-[100px] text-center">
          <dd className="flex items-center justify-center gap-1.5">
            <Flame className="h-5 w-5 text-[var(--streak)]" />
            <span className="text-3xl font-mono text-[var(--c-text)] tabular-nums">
              {profileUser.streak.currentStreak}
            </span>
          </dd>
          <dt className="text-xs font-medium text-[var(--c-text-2)] uppercase tracking-wider mt-1">
            {t("dayStreak")}
          </dt>
        </div>
        <div
          className="w-px bg-[var(--c-border-subtle)] hidden sm:block"
          role="presentation"
        />
        <div className="flex-1 min-w-[100px] text-center">
          <dd className="text-3xl font-mono text-[var(--c-text)] tabular-nums">
            {userAchievements.filter((a) => a.unlockedAt).length}
          </dd>
          <dt className="text-xs font-medium text-[var(--c-text-2)] uppercase tracking-wider mt-1">
            {t("achievements")}
          </dt>
        </div>
      </dl>

      {/* Tabs */}
      <Tabs defaultValue="skills">
        <TabsList className="mb-6">
          <TabsTrigger value="skills">{t("skills")}</TabsTrigger>
          <TabsTrigger value="credentials">{t("credentials")}</TabsTrigger>
          <TabsTrigger value="achievements">{t("achievements")}</TabsTrigger>
        </TabsList>

        <TabsContent value="skills">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-sm font-medium text-[var(--c-text-2)] uppercase tracking-wider">
                {t("skillConstellation")}
              </h2>
              <span className="text-xs font-mono text-[#00FFA3]">
                {t("interactive")}
              </span>
            </div>
            <SkillConstellation skills={profileUser.skills} />
          </div>
          <div className="bg-[var(--c-bg-card)] border border-[var(--c-border-subtle)] rounded-[2px] p-6">
            <h2 className="text-sm font-medium text-[var(--c-text-2)] uppercase tracking-wider mb-6">
              {t("trackProgress")}
            </h2>
            <div className="grid gap-5 sm:grid-cols-2">
              {(Object.entries(profileUser.skills) as [Track, number][]).map(
                ([track, level]) => (
                  <div key={track} className="flex items-center gap-4">
                    <div
                      className="w-20 text-sm font-medium shrink-0"
                      style={{ color: TRACK_COLORS[track] }}
                    >
                      {TRACK_LABELS[track]}
                    </div>
                    <div className="flex-1">
                      <div className="h-1.5 w-full overflow-hidden rounded-sm bg-[var(--c-border-subtle)]">
                        <div
                          className="h-full rounded-sm transition-all duration-700"
                          style={{
                            width: `${level}%`,
                            backgroundColor: TRACK_COLORS[track],
                          }}
                        />
                      </div>
                    </div>
                    <span className="w-10 text-right text-sm tabular-nums font-mono font-medium text-[var(--c-text-em)]">
                      {level}%
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>
          <div className="bg-[var(--c-bg-card)] border border-[var(--c-border-subtle)] rounded-[2px] p-6 mt-6">
            <h2 className="text-sm font-medium text-[var(--c-text-2)] uppercase tracking-wider mb-6">
              {t("activity")}
            </h2>
            <StreakCalendar streak={profileUser.streak} />
          </div>
        </TabsContent>

        <TabsContent value="credentials">
          {profileUser.credentials.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2">
              {profileUser.credentials.map((cred) => (
                <div
                  key={cred.id}
                  className="group metallic-border aspect-[3/4] relative overflow-hidden flex flex-col"
                >
                  <div className="credential-sheen absolute inset-0 pointer-events-none z-10" />
                  <div className="relative z-0 flex flex-col flex-1 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="outline">
                        {TRACK_LABELS[cred.track]}
                      </Badge>
                      <span className="text-sm font-bold tabular-nums text-[var(--c-text)]">
                        {t("trackLevel")} {cred.level}
                      </span>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                      <div className="h-16 w-16 rounded-[2px] flex items-center justify-center mb-4 border border-[var(--c-border-prominent)] bg-[var(--c-border-subtle)]">
                        <span className="text-2xl font-bold text-[var(--c-text)]">
                          {TRACK_LABELS[cred.track].charAt(0)}
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-[var(--c-text)] mb-1">
                        {TRACK_LABELS[cred.track]} {t("credential")}
                      </h2>
                      <p className="text-sm text-[var(--c-text-2)]">
                        {cred.coursesCompleted} {t("coursesCompleted")}
                      </p>
                      <p className="text-sm font-mono font-semibold text-[#00FFA3] mt-1">
                        {formatNumber(cred.xpEarned, locale)} XP
                      </p>
                    </div>
                    <div className="space-y-2 text-sm border-t border-[var(--c-border-subtle)] pt-4 mt-auto">
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--c-text-2)]">
                          {t("mintAddress")}
                        </span>
                        <span className="font-mono text-xs text-[var(--c-text-em)]">
                          {cred.mint.slice(0, 8)}...{cred.mint.slice(-4)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--c-text-2)]">
                          {t("issuedOn")}
                        </span>
                        <span className="text-[var(--c-text-em)]">
                          {formatDate(cred.issuedAt, locale)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[var(--c-bg-card)] border border-[var(--c-border-subtle)] rounded-[2px] flex flex-col items-center justify-center py-16">
              <EmptyState
                icon={Shield}
                title={t("noCredentials")}
                description={t("noCredentialsHint")}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="achievements">
          <div className="bg-[var(--c-bg-card)] border border-[var(--c-border-subtle)] rounded-[2px] p-6">
            <div className="grid grid-cols-3 gap-6 sm:grid-cols-5">
              {userAchievements.map((achievement) => (
                <AchievementBadge
                  key={achievement.id}
                  achievement={achievement}
                />
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
