"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Copy,
  ExternalLink,
  ShieldCheck,
  Activity,
  Award,
  Github,
  Twitter,
  BookOpen,
  CheckCircle2,
  Flame,
  Zap,
  Star,
  Trophy,
} from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { learningProgressService } from "@/services/learning-progress-service";
import type { Credential, UserProgressSummary } from "@/types/domain";
import { useLocale } from "@/providers/locale-provider";
import { useUserStore } from "@/store/user-store";
import { apiFetch } from "@/lib/api-client";
import { requestOnboardingRetake } from "@/lib/onboarding";

type UserProfileResponse = {
  id: string;
  username: string | null;
  displayName: string | null;
  email: string | null;
  bio: string | null;
  avatarUrl: string | null;
  twitterUrl: string | null;
  githubUrl: string | null;
  language: "en" | "pt-BR" | "es";
  theme: "light" | "dark" | "system";
  profileVisibility: "public" | "private";
};

type SkillScore = {
  label: string;
  value: number;
};

type Achievement = {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  earned: boolean;
  color: string;
};

const SKILL_AXES = ["Rust", "Anchor", "DeFi", "Security", "Frontend"];
const CHART_SIZE = 240;
const CENTER = CHART_SIZE / 2;
const RADIUS = CHART_SIZE / 2 - 32;
const N = SKILL_AXES.length;

function polarToXY(angleDeg: number, r: number): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CENTER + r * Math.cos(rad), y: CENTER + r * Math.sin(rad) };
}

function buildPolygon(scores: number[]): string {
  return scores
    .map((score, i) => {
      const { x, y } = polarToXY((360 / N) * i, (score / 100) * RADIUS);
      return `${x},${y}`;
    })
    .join(" ");
}

function SkillRadarChart({ skills }: { skills: SkillScore[] }) {
  const scores = skills.map((s) => s.value);
  const rings = [25, 50, 75, 100];

  return (
    <svg
      width={CHART_SIZE}
      height={CHART_SIZE}
      viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`}
      className="overflow-visible"
      aria-label="Skill radar chart"
    >
      {/* Ring guides */}
      {rings.map((pct) => (
        <polygon
          key={pct}
          points={Array.from({ length: N }, (_, i) => {
            const { x, y } = polarToXY((360 / N) * i, (pct / 100) * RADIUS);
            return `${x},${y}`;
          }).join(" ")}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
        />
      ))}
      {/* Axis spokes */}
      {Array.from({ length: N }, (_, i) => {
        const { x, y } = polarToXY((360 / N) * i, RADIUS);
        return (
          <line
            key={i}
            x1={CENTER}
            y1={CENTER}
            x2={x}
            y2={y}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
        );
      })}
      {/* Score polygon */}
      <polygon
        points={buildPolygon(scores)}
        fill="rgba(20,241,149,0.12)"
        stroke="#14F195"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Data dots */}
      {scores.map((score, i) => {
        const { x, y } = polarToXY((360 / N) * i, (score / 100) * RADIUS);
        return (
          <circle key={i} cx={x} cy={y} r="3" fill="#14F195" opacity="0.9" />
        );
      })}
      {/* Axis labels */}
      {skills.map((skill, i) => {
        const labelR = RADIUS + 20;
        const { x, y } = polarToXY((360 / N) * i, labelR);
        return (
          <text
            key={i}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="10"
            fill="rgba(255,255,255,0.6)"
            fontFamily="monospace"
          >
            {skill.label}
          </text>
        );
      })}
    </svg>
  );
}

function deriveSkillScores(
  credentials: Credential[],
  xp: number,
): SkillScore[] {
  const baseXp = Math.min(50, Math.floor(xp / 20));
  const trackMap: Record<string, number> = {};
  for (const cred of credentials) {
    const track = cred.track.toLowerCase();
    trackMap[track] = (trackMap[track] ?? 0) + 1;
  }

  function scoreForTrack(keywords: string[]): number {
    let count = 0;
    for (const [track, n] of Object.entries(trackMap)) {
      if (keywords.some((kw) => track.includes(kw))) {
        count += n;
      }
    }
    return Math.min(100, baseXp + count * 25);
  }

  return [
    { label: "Rust", value: scoreForTrack(["rust"]) },
    { label: "Anchor", value: scoreForTrack(["anchor"]) },
    { label: "DeFi", value: scoreForTrack(["defi", "finance", "swap"]) },
    {
      label: "Security",
      value: scoreForTrack(["security", "audit", "program"]),
    },
    {
      label: "Frontend",
      value: scoreForTrack(["frontend", "web", "react", "ui"]),
    },
  ];
}

function buildAchievements(
  xp: number,
  level: number,
  longestStreak: number,
  credentials: Credential[],
  allProgress: UserProgressSummary[],
): Achievement[] {
  const completedCourses = allProgress.filter(
    (p) => p.completionPercent >= 100,
  ).length;

  return [
    {
      id: "first-xp",
      label: "First XP",
      description: "Earned your first XP",
      icon: <Zap className="h-5 w-5" />,
      earned: xp > 0,
      color: "#14F195",
    },
    {
      id: "level-up",
      label: "Level Up",
      description: "Reached level 2",
      icon: <Star className="h-5 w-5" />,
      earned: level >= 2,
      color: "#f59e0b",
    },
    {
      id: "century",
      label: "Century",
      description: "Earned 100+ XP",
      icon: <Zap className="h-5 w-5" />,
      earned: xp >= 100,
      color: "#14F195",
    },
    {
      id: "first-cred",
      label: "NFT Earned",
      description: "Received first credential NFT",
      icon: <ShieldCheck className="h-5 w-5" />,
      earned: credentials.length >= 1,
      color: "#9945FF",
    },
    {
      id: "multi-cred",
      label: "Collector",
      description: "Earned 3+ credentials",
      icon: <Trophy className="h-5 w-5" />,
      earned: credentials.length >= 3,
      color: "#9945FF",
    },
    {
      id: "course-done",
      label: "Graduate",
      description: "Completed a full course",
      icon: <BookOpen className="h-5 w-5" />,
      earned: completedCourses >= 1,
      color: "#22d3ee",
    },
    {
      id: "multi-course",
      label: "Scholar",
      description: "Completed 3+ courses",
      icon: <BookOpen className="h-5 w-5" />,
      earned: completedCourses >= 3,
      color: "#22d3ee",
    },
    {
      id: "streak-week",
      label: "Week Warrior",
      description: "7-day learning streak",
      icon: <Flame className="h-5 w-5" />,
      earned: longestStreak >= 7,
      color: "#f97316",
    },
    {
      id: "streak-month",
      label: "Iron Will",
      description: "30-day learning streak",
      icon: <Flame className="h-5 w-5" />,
      earned: longestStreak >= 30,
      color: "#ef4444",
    },
  ];
}

export default function ProfilePage(): React.JSX.Element {
  const { t } = useLocale();
  const { data: session } = useSession();
  const { publicKey } = useWallet();
  const { xp, level, streakDays, longestStreakDays } = useUserStore();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [allProgress, setAllProgress] = useState<UserProgressSummary[]>([]);
  const [displayName, setDisplayName] = useState("Builder");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [twitterUrl, setTwitterUrl] = useState<string | null>(null);
  const [githubUrl, setGithubUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const addressString = publicKey ? publicKey.toBase58() : null;
  const displayAddress = addressString
    ? `${addressString.slice(0, 6)}...${addressString.slice(-4)}`
    : t("profilePage.guestUser");

  const initials = displayName
    .split(" ")
    .map((w) => w[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");

  useEffect(() => {
    if (!publicKey) {
      setCredentials([]);
      setAllProgress([]);
      return;
    }
    const addr = publicKey.toBase58();
    void learningProgressService
      .getCredentials(addr)
      .then(setCredentials)
      .catch(() => setCredentials([]));
    void learningProgressService
      .getUserAllProgress(addr)
      .then(setAllProgress)
      .catch(() => setAllProgress([]));
  }, [publicKey]);

  useEffect(() => {
    const userId = session?.user?.id ?? publicKey?.toBase58();
    if (!userId) {
      setDisplayName("Builder");
      setBio(t("profilePage.bio"));
      return;
    }

    void apiFetch<UserProfileResponse>(
      `/user/profile/${encodeURIComponent(userId)}`,
    )
      .then((profile) => {
        setDisplayName(profile.displayName ?? profile.username ?? "Builder");
        setBio(profile.bio ?? t("profilePage.bio"));
        setAvatarUrl(profile.avatarUrl ?? null);
        setTwitterUrl(profile.twitterUrl ?? null);
        setGithubUrl(profile.githubUrl ?? null);
      })
      .catch(() => {
        setDisplayName("Builder");
        setBio(t("profilePage.bio"));
      });
  }, [session?.user?.id, publicKey, t]);

  function handleCopyAddress(): void {
    if (!addressString || typeof navigator === "undefined") return;
    void navigator.clipboard.writeText(addressString).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function handleRetakeOnboarding(): void {
    if (!addressString || typeof window === "undefined") {
      return;
    }
    requestOnboardingRetake(addressString);
  }

  const skills = deriveSkillScores(credentials, xp);
  const achievements = buildAchievements(
    xp,
    level,
    longestStreakDays,
    credentials,
    allProgress,
  );
  const earnedCount = achievements.filter((a) => a.earned).length;
  const completedCourses = allProgress.filter(
    (p) => p.completionPercent >= 100,
  );
  const inProgressCourses = allProgress.filter(
    (p) => p.completionPercent > 0 && p.completionPercent < 100,
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-fade-in">
      {/* ── Profile Header ── */}
      <div className="relative rounded-3xl border border-border/50 bg-background/50 backdrop-blur-xl overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 pointer-events-none" />

        <div className="p-8 sm:p-12 relative z-10 flex flex-col sm:flex-row gap-8 items-start">
          {/* Avatar */}
          <div className="relative h-28 w-28 shrink-0 rounded-2xl border-4 border-background bg-muted/50 overflow-hidden shadow-xl mt-10">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayName}
                width={112}
                height={112}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center h-full w-full">
                <span className="font-display text-3xl text-primary font-bold">
                  {initials || "?"}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 pt-10">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-2">
                  {displayName}
                </h1>
                <button
                  onClick={handleCopyAddress}
                  className="flex items-center gap-2 text-muted-foreground text-sm font-mono bg-muted/40 px-3 py-1.5 rounded-lg w-fit hover:bg-muted/70 transition-colors"
                >
                  {displayAddress}
                  <Copy
                    className={`h-3 w-3 transition-colors ${copied ? "text-primary" : ""}`}
                  />
                </button>
              </div>

              {/* Social links */}
              <div className="flex gap-2">
                {githubUrl ? (
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full bg-background/50 backdrop-blur"
                    asChild
                  >
                    <a href={githubUrl} target="_blank" rel="noreferrer">
                      <Github className="h-4 w-4" />
                    </a>
                  </Button>
                ) : null}
                {twitterUrl ? (
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full bg-background/50 backdrop-blur"
                    asChild
                  >
                    <a href={twitterUrl} target="_blank" rel="noreferrer">
                      <Twitter className="h-4 w-4" />
                    </a>
                  </Button>
                ) : null}
                <Button variant="outline" size="sm" asChild>
                  <Link href="/settings">Edit Profile</Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetakeOnboarding}
                  disabled={!addressString}
                >
                  {t("profilePage.retakeOnboarding")}
                </Button>
              </div>
            </div>

            <p className="mt-4 text-muted-foreground max-w-xl leading-relaxed">
              {bio || t("profilePage.bio")}
            </p>

            {/* XP / Level / Streak chips */}
            <div className="mt-5 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold text-primary">
                  {xp.toLocaleString()} XP
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary/10 border border-secondary/20">
                <Star className="h-4 w-4 text-secondary" />
                <span className="text-sm font-bold text-secondary">
                  Level {level}
                </span>
              </div>
              {streakDays > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
                  <Flame className="h-4 w-4 text-orange-400" />
                  <span className="text-sm font-bold text-orange-400">
                    {streakDays}d streak
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/40 border border-border/40">
                <Award className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {earnedCount}/{achievements.length} badges
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 1: Skill Radar + Achievements ── */}
      <div className="grid md:grid-cols-[280px_1fr] gap-6">
        {/* Skill Radar */}
        <Card className="bg-background/40 backdrop-blur-md border-border/50 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" /> Skills
            </CardTitle>
            <CardDescription>On-chain activity breakdown</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 pb-6">
            <SkillRadarChart skills={skills} />
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 w-full px-2">
              {skills.map((skill) => (
                <div
                  key={skill.label}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-muted-foreground">{skill.label}</span>
                  <span className="font-mono text-primary">{skill.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Achievement Badges */}
        <Card className="bg-background/40 backdrop-blur-md border-border/50 shadow-lg">
          <CardHeader className="border-b border-border/30 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 font-display text-xl">
                  <Award className="h-5 w-5 text-amber-400" /> Achievements
                </CardTitle>
                <CardDescription>
                  Earned through your learning journey
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className="font-mono text-xs text-muted-foreground"
              >
                {earnedCount}/{achievements.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-3 gap-3">
              {achievements.map((ach) => (
                <div
                  key={ach.id}
                  title={ach.description}
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl border text-center transition-all ${
                    ach.earned
                      ? "border-border/50 bg-muted/20 hover:border-primary/30"
                      : "border-border/20 bg-muted/5 opacity-35 grayscale"
                  }`}
                >
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center"
                    style={{
                      backgroundColor: ach.earned
                        ? `${ach.color}18`
                        : "transparent",
                      color: ach.earned ? ach.color : "rgba(255,255,255,0.2)",
                      border: `1px solid ${ach.earned ? `${ach.color}30` : "rgba(255,255,255,0.06)"}`,
                    }}
                  >
                    {ach.icon}
                  </div>
                  <span className="text-xs font-semibold leading-tight">
                    {ach.label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Row 2: Completed Courses + Credentials ── */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Completed / In-Progress Courses */}
        <Card className="bg-background/40 backdrop-blur-md border-border/50 shadow-lg">
          <CardHeader className="border-b border-border/30 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 font-display text-xl">
                  <BookOpen className="h-5 w-5 text-secondary" /> Courses
                </CardTitle>
                <CardDescription>Your learning history</CardDescription>
              </div>
              <Badge
                variant="outline"
                className="font-mono text-xs text-muted-foreground"
              >
                {completedCourses.length} completed
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {allProgress.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {publicKey
                  ? "No course activity yet. Start learning!"
                  : t("profilePage.connectWalletHint")}
              </p>
            ) : (
              <ul className="space-y-3">
                {[...completedCourses, ...inProgressCourses].map((prog) => (
                  <li
                    key={prog.courseId}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-muted/10 hover:border-border/70 transition-colors"
                  >
                    <div
                      className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                        prog.completionPercent >= 100
                          ? "bg-primary/15 text-primary"
                          : "bg-secondary/15 text-secondary"
                      }`}
                    >
                      {prog.completionPercent >= 100 ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <BookOpen className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {prog.courseId}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-muted/50 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${prog.completionPercent}%`,
                              background:
                                prog.completionPercent >= 100
                                  ? "#14F195"
                                  : "#9945FF",
                            }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground font-mono shrink-0">
                          {prog.completionPercent}%
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono shrink-0">
                      {prog.xpEarned} XP
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Credentials / Digital Backpack */}
        <Card className="bg-background/40 backdrop-blur-md border-border/50 shadow-lg">
          <CardHeader className="border-b border-border/30 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 font-display text-xl">
                  <ShieldCheck className="h-5 w-5 text-primary" />{" "}
                  {t("profilePage.credentials")}
                </CardTitle>
                <CardDescription>
                  {t("profilePage.onchainProof")}
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className="font-mono text-xs text-muted-foreground"
              >
                {credentials.length} {t("profilePage.earned")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {credentials.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {t("profilePage.connectWalletHint")}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {credentials.map((credential) => (
                  <div
                    key={credential.credentialId}
                    className="group rounded-2xl border border-border/50 bg-muted/20 p-4 flex flex-col items-center text-center hover:border-primary/50 transition-colors"
                  >
                    <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 mb-3 shadow-inner flex items-center justify-center">
                      <ShieldCheck className="h-8 w-8 text-primary opacity-80" />
                    </div>
                    <h4 className="font-bold text-sm mb-1">
                      {credential.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      {credential.track} • {t("profilePage.level")}{" "}
                      {credential.level}
                    </p>
                    <div className="flex gap-2 w-full">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs h-8"
                        asChild
                      >
                        <Link href={`/certificates/${credential.credentialId}`}>
                          {t("profilePage.view")}
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-8 px-2"
                        asChild
                      >
                        <a
                          href={credential.explorerUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Activity Feed ── */}
      <Card className="bg-background/40 backdrop-blur-md border-border/50 shadow-lg">
        <CardHeader className="border-b border-border/30 pb-4">
          <CardTitle className="flex items-center gap-2 font-display text-xl">
            <Activity className="h-5 w-5 text-secondary" />{" "}
            {t("profilePage.recentActivity")}
          </CardTitle>
          <CardDescription>{t("profilePage.latestMilestones")}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-border/30">
            {[
              {
                text: t("profilePage.activity1"),
                time: t("profilePage.time2h"),
                type: "success",
              },
              {
                text: t("profilePage.activity2"),
                time: t("profilePage.time1d"),
                type: "achievement",
              },
              {
                text: t("profilePage.activity3"),
                time: t("profilePage.time1d"),
                type: "streak",
              },
              {
                text: t("profilePage.activity4"),
                time: t("profilePage.time3d"),
                type: "enrollment",
              },
            ].map((act, i) => (
              <li
                key={i}
                className="p-5 flex items-start gap-4 hover:bg-muted/10 transition-colors"
              >
                <div className="mt-0.5 shrink-0">
                  {act.type === "success" && (
                    <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  )}
                  {act.type === "achievement" && (
                    <div className="h-2 w-2 rounded-full bg-yellow-500 mt-1.5 shadow-[0_0_8px_rgba(234,179,8,0.8)]" />
                  )}
                  {act.type === "streak" && (
                    <div className="h-2 w-2 rounded-full bg-orange-500 mt-1.5 shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                  )}
                  {act.type === "enrollment" && (
                    <div className="h-2 w-2 rounded-full bg-secondary mt-1.5 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {act.text}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {act.time}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
