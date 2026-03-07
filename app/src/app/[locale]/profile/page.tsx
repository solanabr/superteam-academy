"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AchievementGrid } from "@/components/achievements";
import { StreakCalendar } from "@/components/dashboard";
import { CredentialGrid } from "@/components/credentials";
import { GlassCard, LuxuryBadge } from "@/components/luxury/primitives";
import { useXP } from "@/lib/hooks/use-xp";
import { useStreak } from "@/lib/hooks/use-streak";
import { useAllProgress } from "@/lib/hooks/use-progress";
import { useLeaderboard } from "@/lib/hooks/use-leaderboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import {
  Trophy,
  Shield,
  ExternalLink,
  Settings,
  BookOpen,
  Loader2,
  Calendar,
  Flame,
  Star,
  Wallet,
  Github,
  Globe,
  MessageCircle,
  Twitter,
} from "lucide-react";
import type { AchievementWithStatus } from "@/types/achievements";

// Skill radar data interface
interface SkillData {
  fundamentals: number;
  rust: number;
  frontend: number;
  defi: number;
  security: number;
  testing: number;
}

// Course to skill mapping
const COURSE_SKILL_MAP: Record<string, keyof SkillData> = {
  "solana-fundamentals": "fundamentals",
  "anchor-development": "rust",
  "solana-frontend": "frontend",
  "defi-builder": "defi",
};

// On-chain XP data interface
interface OnChainXPData {
  onChainAvailable: boolean;
  balance?: number;
  mintAddress?: string;
  tokenAccount?: string | null;
  message?: string;
}

interface ProfileData {
  username: string | null;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  joinedAt: string;
  isPublic: boolean;
  socialLinks: {
    twitter: string | null;
    github: string | null;
    discord: string | null;
    website: string | null;
  };
  achievements: AchievementWithStatus[];
  primaryWallet: string | null;
}

function ProfileContent() {
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const { data: session } = useSession();

  // Fetch real data from hooks
  const { xp, level, levelProgress, isLoading: isLoadingXP } = useXP();
  const { streak, isLoading: isLoadingStreak } = useStreak();
  const { progressList, isLoading: isLoadingProgress } = useAllProgress();
  const { userRank, isLoading: isLoadingRank } = useLeaderboard(50);

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // On-chain XP state
  const [onChainXP, setOnChainXP] = useState<OnChainXPData | null>(null);
  const [isLoadingOnChain, setIsLoadingOnChain] = useState(true);

  // Get wallet address from session or profile
  const walletAddress =
    profileData?.primaryWallet ?? session?.user?.walletAddress ?? null;

  // Fetch on-chain XP
  useEffect(() => {
    async function fetchOnChainXP() {
      if (!walletAddress) {
        setIsLoadingOnChain(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/onchain/xp?wallet=${encodeURIComponent(walletAddress)}`
        );
        if (response.ok) {
          const data = (await response.json()) as { data: OnChainXPData };
          setOnChainXP(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch on-chain XP:", err);
      } finally {
        setIsLoadingOnChain(false);
      }
    }
    void fetchOnChainXP();
  }, [walletAddress]);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch("/api/profile");
        if (response.ok) {
          const data = (await response.json()) as ProfileData;
          setProfileData(data);
        }
      } catch {
        // fail silently, render empty
      } finally {
        setIsLoadingProfile(false);
      }
    }
    void fetchProfile();
  }, []);

  // Calculate skill values from course progress
  const skillData: SkillData = {
    fundamentals: 0,
    rust: 0,
    frontend: 0,
    defi: 0,
    security: 0,
    testing: 0,
  };

  progressList.forEach((progress) => {
    const skillKey = COURSE_SKILL_MAP[progress.courseSlug];
    if (skillKey) {
      skillData[skillKey] = progress.completionPercent;
    }
  });

  const isLoading =
    isLoadingXP ||
    isLoadingStreak ||
    isLoadingProgress ||
    isLoadingProfile ||
    isLoadingRank;

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const name =
    profileData?.displayName ??
    profileData?.username ??
    session?.user?.name ??
    t("defaultName");
  const socialLinks = [
    profileData?.socialLinks?.twitter
      ? {
          href: `https://x.com/${profileData.socialLinks.twitter.replace(/^@/, "")}`,
          label: "X / Twitter",
          icon: Twitter,
          value: profileData.socialLinks.twitter,
        }
      : null,
    profileData?.socialLinks?.github
      ? {
          href: `https://github.com/${profileData.socialLinks.github.replace(/^@/, "")}`,
          label: "GitHub",
          icon: Github,
          value: profileData.socialLinks.github,
        }
      : null,
    profileData?.socialLinks?.discord
      ? {
          href: `https://discord.com/users/${profileData.socialLinks.discord}`,
          label: "Discord",
          icon: MessageCircle,
          value: profileData.socialLinks.discord,
        }
      : null,
    profileData?.socialLinks?.website
      ? {
          href: profileData.socialLinks.website,
          label: "Website",
          icon: Globe,
          value: profileData.socialLinks.website,
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);
  const skillRadarData = [
    { skill: t("skillsFundamentals"), value: skillData.fundamentals },
    { skill: t("skillsRust"), value: skillData.rust },
    { skill: t("skillsFrontend"), value: skillData.frontend },
    { skill: t("skillsDeFi"), value: skillData.defi },
    { skill: t("skillsSecurity"), value: skillData.security },
    { skill: t("skillsTesting"), value: skillData.testing },
  ];

  return (
    <div className="academy-fade-up container py-8 md:py-10">
      {/* Profile Header */}
      <GlassCard className="mb-8 p-6 md:p-8" glowColor="amber">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <Avatar className="h-24 w-24">
          <AvatarImage
            src={profileData?.avatarUrl ?? session?.user?.image ?? undefined}
            alt={name}
          />
          <AvatarFallback className="text-2xl">
            {name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <h1 className="text-2xl font-bold text-foreground">{name}</h1>
            <Badge variant="outline">
              {tc("level")} {level}
            </Badge>
          </div>
          {profileData?.bio && (
            <p className="mt-2 text-muted-foreground">{profileData.bio}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground sm:justify-start">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {t("joined", {
                date: profileData?.joinedAt
                  ? new Date(profileData.joinedAt).toLocaleDateString()
                  : "—",
              })}
            </span>
            {walletAddress && (
              <a
                href={`https://explorer.solana.com/address/${walletAddress}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-primary"
              >
                {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          {socialLinks.length > 0 ? (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/20 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  <link.icon className="h-3.5 w-3.5" />
                  <span>{link.value}</span>
                </a>
              ))}
            </div>
          ) : null}
        </div>
        <Link href="/settings">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            {t("editProfile")}
          </Button>
        </Link>
      </div>
      </GlassCard>

      {/* Stats Row */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{xp.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{tc("xp")}</p>
            {/* On-chain XP display */}
            {!isLoadingOnChain && (
              <div className="mt-1">
                {walletAddress ? (
                  onChainXP?.onChainAvailable ? (
                    <div className="space-y-1">
                      <p className="text-xs text-emerald-500">
                        {t("onChainXPLabel", {
                          amount: (onChainXP.balance ?? 0).toLocaleString(),
                        })}
                      </p>
                      {onChainXP.tokenAccount && (
                        <a
                          href={`https://explorer.solana.com/address/${onChainXP.tokenAccount}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          {t("viewTokenAccount")}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {t("onChainPending")}
                    </p>
                  )
                ) : (
                  <Link
                    href="/settings"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                  >
                    <Wallet className="h-3 w-3" />
                    {t("linkWalletPromptShort")}
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{level}</p>
            <p className="text-xs text-muted-foreground">{tc("level")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <Flame className="h-5 w-5 text-orange-500" />
              <p className="text-2xl font-bold">{streak.currentStreak}</p>
            </div>
            <p className="text-xs text-muted-foreground">{t("dayStreak")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">
              {userRank ? `#${userRank}` : "—"}
            </p>
            <p className="text-xs text-muted-foreground">{tc("rank")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Level Progress */}
      <Card className="mb-8">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-solana-purple" />
              <span className="font-medium">{tc("level")} {level}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {Math.round(levelProgress.current)} / {levelProgress.required} {tc("xp")} · {t("xpToLevel", { level: level + 1 })}
            </span>
          </div>
          <Progress value={levelProgress.percent} className="mt-2 h-2" />
        </CardContent>
      </Card>

      {/* Skills Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-base">
            <LuxuryBadge color="purple">{t("skills")}</LuxuryBadge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
            <div className="h-[20rem] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={skillRadarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis
                    dataKey="skill"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  />
                  <Radar
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {skillRadarData.map((item) => (
                <SkillBar key={item.skill} label={item.skill} value={item.value} />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Streak Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4" />
            {t("learningStreak")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StreakCalendar
            streakHistory={streak.streakHistory}
            currentStreak={streak.currentStreak}
            longestStreak={streak.longestStreak}
          />
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="courses">
        <TabsList>
          <TabsTrigger value="courses">{t("completedCourses")}</TabsTrigger>
          <TabsTrigger value="badges">{t("badges")}</TabsTrigger>
          <TabsTrigger value="credentials">{t("credentials")}</TabsTrigger>
        </TabsList>

        {/* Completed Courses */}
        <TabsContent value="courses" className="mt-6">
          {progressList.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-12 text-center">
                <BookOpen className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">{t("noCoursesStarted")}</p>
                <Link href="/courses" className="mt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                  >
                    {tc("exploreCourses")}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {progressList.map((cp) => (
                <Card key={cp.courseSlug}>
                  <CardContent className="flex items-center gap-4 p-4">
                    {cp.completionPercent === 100 ? (
                      <Trophy className="h-5 w-5 text-solana-green" />
                    ) : (
                      <BookOpen className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{cp.courseSlug}</p>
                      <p className="text-xs text-muted-foreground">
                        {cp.completedLessons.length} / {cp.totalLessons} {tc("lessons")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={cp.completionPercent} className="h-1.5 w-24" />
                      <span className="w-10 text-right text-xs text-muted-foreground">
                        {cp.completionPercent}%
                      </span>
                    </div>
                    {cp.completionPercent === 100 ? (
                      <Badge variant="success">{tc("completed")}</Badge>
                    ) : (
                      <Link href={`/courses/${cp.courseSlug}`}>
                        <Button variant="ghost" size="sm">
                          Continue
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Badges */}
        <TabsContent value="badges" className="mt-6">
          <AchievementGrid />
        </TabsContent>

        {/* Credentials - Updated with CredentialGrid */}
        <TabsContent value="credentials" className="mt-6">
          {!walletAddress ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Shield className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">
                  {t("linkWalletPrompt", { link: t("settingsLink") })}
                </p>
                <Link href="/settings" className="mt-3 text-sm text-primary hover:underline">
                  {t("settingsLink")}
                </Link>
              </CardContent>
            </Card>
          ) : (
            <CredentialGrid walletAddress={walletAddress} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Skill bar component
function SkillBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">{value}%</span>
      </div>
      <Progress value={value} className="h-1.5" />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}
