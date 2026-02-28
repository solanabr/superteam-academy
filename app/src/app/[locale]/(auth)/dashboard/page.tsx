"use client";

import { useTranslations } from "next-intl";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useXpBalance } from "@/hooks/useXpBalance";
import { useStreak } from "@/hooks/useStreak";
import { useCredentials } from "@/hooks/useCredentials";
import { XPBar } from "@/components/gamification/XPBar";
import { StreakWidget } from "@/components/gamification/StreakWidget";
import { CredentialCard } from "@/components/solana/CredentialCard";
import { Link } from "@/i18n/navigation";
import {
  BookOpen,
  Award,
  Zap,
  CheckCircle2,
  Flame,
  TrendingUp,
  Clock,
  ChevronRight,
} from "lucide-react";

// ─── Mock data ────────────────────────────────────────────────────────────────

interface ActivityItem {
  id: string;
  type: "lesson" | "xp" | "milestone" | "enrollment" | "credential";
  message: string;
  detail?: string;
  timestamp: string;
}

const MOCK_ACTIVITY: ActivityItem[] = [
  {
    id: "1",
    type: "lesson",
    message: "Completed lesson: Account Model",
    detail: "Solana Basics · Module 2",
    timestamp: "2 hours ago",
  },
  {
    id: "2",
    type: "xp",
    message: "+50 XP earned",
    detail: "Lesson completion reward",
    timestamp: "2 hours ago",
  },
  {
    id: "3",
    type: "milestone",
    message: "Streak milestone: 7 days",
    detail: "You're on fire — keep it up!",
    timestamp: "Yesterday",
  },
  {
    id: "4",
    type: "enrollment",
    message: "Enrolled in: Anchor Framework 101",
    detail: "Track: Anchor Framework",
    timestamp: "3 days ago",
  },
  {
    id: "5",
    type: "credential",
    message: "Credential minted: Solana Basics",
    detail: "Soulbound NFT on Solana",
    timestamp: "1 week ago",
  },
];

interface RecommendedCourse {
  id: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  durationHours: number;
  xpReward: number;
  trackName: string;
  trackIcon: string;
  trackColor: string;
  slug: string;
  progressPercent?: number;
}

const RECOMMENDED_COURSES: RecommendedCourse[] = [
  {
    id: "rc1",
    title: "Solana Program Security",
    description:
      "Learn to identify and prevent common vulnerabilities in Solana programs — signer checks, owner validation, and more.",
    difficulty: "intermediate",
    durationHours: 4,
    xpReward: 500,
    trackName: "Anchor Framework",
    trackIcon: "⚓",
    trackColor: "#9945FF",
    slug: "solana-program-security",
  },
  {
    id: "rc2",
    title: "Token-2022 Extensions Deep Dive",
    description:
      "Explore advanced Token-2022 features: transfer hooks, confidential transfers, and non-transferable mints.",
    difficulty: "advanced",
    durationHours: 6,
    xpReward: 800,
    trackName: "Solana Basics",
    trackIcon: "◎",
    trackColor: "#14F195",
    slug: "token-2022-extensions",
  },
  {
    id: "rc3",
    title: "Building a DeFi AMM",
    description:
      "Implement a constant-product AMM from scratch using Anchor. Covers liquidity pools, swaps, and fee collection.",
    difficulty: "advanced",
    durationHours: 8,
    xpReward: 1200,
    trackName: "DeFi",
    trackIcon: "💹",
    trackColor: "#00D4FF",
    slug: "defi-amm",
  },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "#14F195",
  intermediate: "#F5A623",
  advanced: "#FF4444",
};

// ─── Daily challenge widget ───────────────────────────────────────────────────

function DailyChallengeWidget() {
  // Mock daily challenge — in production, fetched from CMS
  const challenge = {
    title: "Bitmap Lesson Tracker",
    description: "Implement a function that reads a u64 bitmap and returns which lesson indices are completed.",
    xpReward: 50,
    difficulty: "intermediate" as const,
    expiresIn: "14h 22m",
    completedBy: 47,
  };

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="font-mono text-lg font-semibold text-foreground">Daily Challenge</h2>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#14F195]/10 border border-[#14F195]/20 text-[#14F195] animate-pulse">
          LIVE
        </span>
        <span className="ml-auto text-xs font-mono text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" /> Resets in {challenge.expiresIn}
        </span>
      </div>
      <div className="bg-card border border-[#14F195]/20 rounded p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle at top right, rgba(20,241,149,0.06), transparent 70%)" }} />
        <div className="flex items-start justify-between gap-4 relative">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm text-[#F5A623] bg-[#F5A623]/10 border border-[#F5A623]/20">
                {challenge.difficulty}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">
                {challenge.completedBy} devs completed today
              </span>
            </div>
            <h3 className="font-mono text-sm font-semibold text-foreground mb-1">{challenge.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{challenge.description}</p>
          </div>
          <div className="flex-shrink-0 text-right">
            <div className="font-mono text-2xl font-bold text-[#14F195]">+{challenge.xpReward}</div>
            <div className="text-[10px] text-muted-foreground font-mono">XP</div>
          </div>
        </div>
        <div className="mt-4">
          <Link
            href={{
              pathname: "/courses/[slug]/lessons/[id]",
              params: { slug: "solana-fundamentals", id: "l6" },
            }}
            className="inline-flex items-center gap-2 bg-[#14F195] text-black font-mono font-semibold text-sm px-5 py-2 rounded hover:bg-accent-dim transition-colors"
          >
            <Zap className="h-3.5 w-3.5" />
            Solve Challenge
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Activity icon ────────────────────────────────────────────────────────────

function ActivityIcon({ type }: { type: ActivityItem["type"] }) {
  switch (type) {
    case "lesson":
      return <CheckCircle2 className="h-3.5 w-3.5 text-[#14F195]" />;
    case "xp":
      return <Zap className="h-3.5 w-3.5 text-[#F5A623]" />;
    case "milestone":
      return <Flame className="h-3.5 w-3.5 text-[#F5A623]" />;
    case "enrollment":
      return <BookOpen className="h-3.5 w-3.5 text-[#9945FF]" />;
    case "credential":
      return <Award className="h-3.5 w-3.5 text-[#00D4FF]" />;
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { data: xpData, loading: xpLoading } = useXpBalance();
  const { streak } = useStreak();
  const { credentials, loading: credsLoading } = useCredentials();

  if (!connected) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <span className="text-5xl">◎</span>
        <h2 className="font-mono text-xl font-bold text-foreground">
          Connect your wallet
        </h2>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          Connect your Solana wallet to view your dashboard, XP balance, and
          learning progress.
        </p>
        <button
          onClick={() => setVisible(true)}
          className="mt-2 bg-[#14F195] text-black font-mono font-semibold px-6 py-2.5 rounded hover:bg-accent-dim transition-colors"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-mono text-3xl font-bold text-foreground">
          {t("title")}
        </h1>
        {publicKey && (
          <p className="text-xs text-muted-foreground font-mono mt-1">
            {publicKey.toBase58().slice(0, 20)}...
          </p>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {/* XP Card */}
        <div className="bg-card border border-border rounded p-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-[#14F195]" />
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
              XP Balance
            </span>
          </div>
          {xpLoading ? (
            <div className="h-8 bg-elevated rounded animate-pulse mb-3" />
          ) : xpData ? (
            <>
              <div className="font-mono text-3xl font-bold text-foreground mb-1">
                {xpData.balance.toLocaleString()}
                <span className="text-sm text-muted-foreground ml-1">XP</span>
              </div>
              <XPBar xpData={xpData} showLabel={true} />
            </>
          ) : (
            <div className="font-mono text-3xl font-bold text-foreground">
              0 XP
            </div>
          )}
        </div>

        {/* Credentials Card */}
        <div className="bg-card border border-border rounded p-5">
          <div className="flex items-center gap-2 mb-3">
            <Award className="h-4 w-4 text-[#9945FF]" />
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
              Credentials
            </span>
          </div>
          {credsLoading ? (
            <div className="h-8 bg-elevated rounded animate-pulse" />
          ) : (
            <div className="font-mono text-3xl font-bold text-foreground">
              {credentials.length}
              <span className="text-sm text-muted-foreground ml-1">NFTs</span>
            </div>
          )}
          <p className="text-[10px] text-muted-foreground font-mono mt-2">
            Soulbound on Solana
          </p>
        </div>

        {/* Activity summary */}
        <div className="bg-card border border-border rounded p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-[#00D4FF]" />
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
              This Week
            </span>
          </div>
          <div className="font-mono text-3xl font-bold text-foreground">
            {MOCK_ACTIVITY.filter((a) => a.type === "lesson").length}
            <span className="text-sm text-muted-foreground ml-1">lessons</span>
          </div>
          <p className="text-[10px] text-muted-foreground font-mono mt-2">
            Keep the momentum going
          </p>
        </div>
      </div>

      {/* Streak calendar */}
      <div className="bg-card border border-border rounded p-5 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm">🔥</span>
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
            Streak
          </span>
        </div>
        <StreakWidget streak={streak} />
      </div>

      {/* Two-column layout: activity feed + recommended courses */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
        {/* Activity feed — 2 cols */}
        <div className="lg:col-span-2 bg-card border border-border rounded p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-mono text-sm font-semibold text-foreground uppercase tracking-wider">
              Recent Activity
            </h2>
            <span className="text-[10px] font-mono text-muted-foreground">
              Last 7 days
            </span>
          </div>

          <ol className="relative">
            {MOCK_ACTIVITY.map((item, idx) => (
              <li key={item.id} className="flex gap-3 group">
                {/* Timeline line + dot */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-background border border-border flex-shrink-0 mt-0.5 group-hover:border-border-hover transition-colors">
                    <ActivityIcon type={item.type} />
                  </div>
                  {idx < MOCK_ACTIVITY.length - 1 && (
                    <div className="w-px flex-1 bg-elevated my-1 min-h-[16px]" />
                  )}
                </div>

                {/* Content */}
                <div className="pb-4 flex-1 min-w-0">
                  <p className="text-xs font-mono text-foreground leading-snug">
                    {item.message}
                  </p>
                  {item.detail && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {item.detail}
                    </p>
                  )}
                  <p className="text-[10px] text-subtle font-mono mt-1 flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {item.timestamp}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Recommended courses — 3 cols */}
        <div className="lg:col-span-3 bg-card border border-border rounded p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-mono text-sm font-semibold text-foreground uppercase tracking-wider">
              Up Next
            </h2>
            <Link
              href="/courses"
              className="text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5"
            >
              Browse all
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            {RECOMMENDED_COURSES.map((course) => {
              const diffColor =
                DIFFICULTY_COLORS[course.difficulty] ?? "#666666";
              return (
                <Link
                  key={course.id}
                  href={{
                    pathname: "/courses/[slug]",
                    params: { slug: course.slug },
                  }}
                >
                  <article className="group flex gap-3 p-3 rounded border border-border hover:border-border-hover hover:bg-background transition-all">
                    {/* Track icon */}
                    <div
                      className="flex-shrink-0 w-10 h-10 rounded flex items-center justify-center text-xl"
                      style={{
                        backgroundColor: `${course.trackColor}15`,
                        border: `1px solid ${course.trackColor}30`,
                      }}
                    >
                      {course.trackIcon}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-mono text-xs font-semibold text-foreground group-hover:text-white transition-colors leading-snug line-clamp-1">
                        {course.title}
                      </h3>
                      <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5 line-clamp-2">
                        {course.description}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded-sm"
                          style={{
                            color: diffColor,
                            backgroundColor: `${diffColor}18`,
                            border: `1px solid ${diffColor}35`,
                          }}
                        >
                          {course.difficulty}
                        </span>
                        <span className="text-[9px] font-mono text-muted-foreground flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          {course.durationHours}h
                        </span>
                        <span className="text-[9px] font-mono text-[#14F195] flex items-center gap-0.5 ml-auto">
                          <Zap className="h-2.5 w-2.5" />
                          {course.xpReward.toLocaleString()} XP
                        </span>
                      </div>
                    </div>

                    <ChevronRight className="h-4 w-4 text-subtle flex-shrink-0 self-center group-hover:text-muted-foreground transition-colors" />
                  </article>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <DailyChallengeWidget />

      {/* Continue Learning (existing) */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-mono text-lg font-semibold text-foreground">
            {t("continueLearning")}
          </h2>
          <Link
            href="/courses"
            className="text-xs text-muted-foreground hover:text-foreground font-mono transition-colors"
          >
            Browse all →
          </Link>
        </div>
        <div className="bg-card border border-border rounded p-6 text-center">
          <BookOpen className="h-8 w-8 text-subtle mx-auto mb-3" />
          <p className="text-sm text-muted-foreground font-mono mb-4">
            {t("noActivity")}
          </p>
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 bg-[#14F195] text-black font-mono font-semibold text-sm px-5 py-2 rounded hover:bg-accent-dim transition-colors"
          >
            Browse Courses
          </Link>
        </div>
      </div>

      {/* Credentials grid */}
      {credentials.length > 0 && (
        <div>
          <h2 className="font-mono text-lg font-semibold text-foreground mb-4">
            {t("credentials")}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {credentials.map((cred) => (
              <CredentialCard key={cred.id} credential={cred} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
