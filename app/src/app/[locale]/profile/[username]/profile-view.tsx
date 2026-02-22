"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { calculateLevel } from "@/types/gamification";
import type { Achievement } from "@/types/gamification";
import type { UserProfile, UserStats, Enrollment } from "@/types/user";
import type { Credential, SkillScore } from "@/services/interfaces";
import dynamic from "next/dynamic";

const RechartsRadar = dynamic(
  () => import("recharts").then((mod) => {
    const { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } = mod;

    function SkillRadar({ data }: { data: { subject: string; value: number; fullMark: number }[] }) {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid stroke="var(--muted-foreground)" strokeOpacity={0.25} gridType="polygon" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar name="Skills" dataKey="value" stroke="var(--primary)" strokeWidth={2} fill="var(--primary)" fillOpacity={0.35} dot={{ r: 4, fill: "var(--primary)", stroke: "var(--primary)", strokeWidth: 1 }} />
          </RadarChart>
        </ResponsiveContainer>
      );
    }
    return SkillRadar;
  }),
  { ssr: false, loading: () => <div className="flex h-full items-center justify-center"><p className="text-sm text-muted-foreground">Loading chart...</p></div> },
);
import {
  Star,
  Trophy,
  Calendar,
  Award,
  Globe,
  Edit,
  Shield,
  BookOpen,
  ExternalLink,
  Gem,
  Github,
  Share2,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "@/i18n/routing";

/** Format a date string to YYYY-MM-DD — stable across server and client */
function formatDate(dateStr: string): string {
  return dateStr.slice(0, 10);
}

const ACHIEVEMENT_DEFINITIONS = [
  { id: 0, name: "First Steps", icon: "footprints", category: "progress" as const, xpReward: 50 },
  { id: 1, name: "Course Completer", icon: "graduation-cap", category: "progress" as const, xpReward: 200 },
  { id: 2, name: "Speed Runner", icon: "zap", category: "progress" as const, xpReward: 500 },
  { id: 3, name: "Week Warrior", icon: "flame", category: "streak" as const, xpReward: 100 },
  { id: 4, name: "Monthly Master", icon: "calendar", category: "streak" as const, xpReward: 300 },
  { id: 5, name: "Consistency King", icon: "crown", category: "streak" as const, xpReward: 1000 },
  { id: 6, name: "Rust Rookie", icon: "code", category: "skill" as const, xpReward: 150 },
  { id: 7, name: "Anchor Expert", icon: "anchor", category: "skill" as const, xpReward: 500 },
  { id: 8, name: "Early Adopter", icon: "star", category: "special" as const, xpReward: 250 },
  { id: 9, name: "Bug Hunter", icon: "bug", category: "special" as const, xpReward: 200 },
  { id: 10, name: "Social Butterfly", icon: "users", category: "special" as const, xpReward: 100 },
  { id: 11, name: "Challenge Champion", icon: "trophy", category: "progress" as const, xpReward: 400 },
];

function deriveAchievements(flags: number[]): { name: string; unlocked: boolean; icon: string }[] {
  return ACHIEVEMENT_DEFINITIONS.map((def) => {
    const wordIndex = Math.floor(def.id / 32);
    const bitIndex = def.id % 32;
    const unlocked = ((flags[wordIndex] ?? 0) & (1 << bitIndex)) !== 0;
    return { name: def.name, unlocked, icon: def.icon };
  });
}

interface ProfileViewProps {
  profile: UserProfile;
  stats: UserStats | null;
  completedCourses: Enrollment[];
  skills: SkillScore[];
  isOwner: boolean;
}

function Avatar({ url, name }: { url: string | undefined; name: string }) {
  const [failed, setFailed] = useState(false);
  const initials = name.slice(0, 2).toUpperCase() || "?";

  if (!url || failed) {
    return (
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
        {initials}
      </div>
    );
  }

  return (
    <Image
      src={url}
      alt={name}
      width={64}
      height={64}
      className="h-16 w-16 rounded-full object-cover"
      onError={() => setFailed(true)}
      referrerPolicy="no-referrer"
    />
  );
}

function ShareButton({ username }: { username: string }) {
  const t = useTranslations("profile");
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    // Build URL with the actual username, not "me"
    const locale = window.location.pathname.split("/")[1];
    const url = `${window.location.origin}/${locale}/profile/${username}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success(t("linkCopied"));
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleShare}
      title={t("shareProfile")}
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Share2 className="h-4 w-4" />
      )}
    </Button>
  );
}

export default function ProfileView({
  profile,
  stats,
  completedCourses,
  skills,
  isOwner,
}: ProfileViewProps) {
  const t = useTranslations("profile");
  const tc = useTranslations("common");

  const totalXP = stats?.totalXP ?? 0;
  const levelInfo = calculateLevel(totalXP);

  const achievements = useMemo(
    () => deriveAchievements(stats?.achievementFlags ?? [0, 0, 0, 0]),
    [stats?.achievementFlags],
  );

  const [credentials, setCredentials] = useState<Credential[]>([]);
  useEffect(() => {
    if (!profile.walletAddress) return;
    fetch(`/api/gamification?type=achievements`)
      .then((res) => res.json())
      .catch(() => []);
    // Fetch on-chain credentials via credentials service
    fetch(`/api/leaderboard?wallet=${profile.walletAddress}`)
      .catch(() => {});
  }, [profile.walletAddress]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Profile Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col items-start gap-5 sm:flex-row">
            <Avatar url={profile.avatarUrl} name={profile.displayName} />
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{profile.displayName}</h1>
                {profile.username && (
                  <Badge variant="secondary">@{profile.username}</Badge>
                )}
                {profile.isPublic && (
                  <Badge variant="outline" className="gap-1">
                    <Globe className="h-3 w-3" />
                    {t("publicProfile")}
                  </Badge>
                )}
              </div>
              {profile.bio && (
                <p className="mt-2 text-muted-foreground">{profile.bio}</p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {t("joinedDate")} {formatDate(profile.createdAt)}
                </span>
                {profile.walletAddress && (
                  <span className="flex items-center gap-1">
                    <Shield className="h-4 w-4" />
                    {profile.walletAddress}
                  </span>
                )}
                {profile.socialLinks?.github && (
                  <a
                    href={`https://github.com/${profile.socialLinks.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    <Github className="h-4 w-4" />
                    {profile.socialLinks.github}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {profile.socialLinks?.website && (
                  <a
                    href={
                      profile.socialLinks.website.startsWith("http")
                        ? profile.socialLinks.website
                        : `https://${profile.socialLinks.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    <Globe className="h-4 w-4" />
                    {profile.socialLinks.website}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {profile.isPublic && <ShareButton username={profile.username} />}
              {isOwner && (
                <Link href="/settings">
                  <Button variant="outline" className="gap-2">
                    <Edit className="h-4 w-4" />
                    {t("editProfile")}
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Stats bar */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-border p-3 text-center">
              <p className="text-2xl font-bold text-primary">
                {totalXP.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">{tc("xp")}</p>
            </div>
            <div className="rounded-lg border border-border p-3 text-center">
              <p className="text-2xl font-bold">
                {tc("level")} {levelInfo.level}
              </p>
              <p className="text-xs text-muted-foreground">
                {Math.round(levelInfo.progress * 100)}%
              </p>
            </div>
            <div className="rounded-lg border border-border p-3 text-center">
              <p className="text-2xl font-bold">{stats?.currentStreak ?? 0}</p>
              <p className="text-xs text-muted-foreground">
                {tc("streak")} ({tc("days")})
              </p>
            </div>
            <div className="rounded-lg border border-border p-3 text-center">
              <p className="text-2xl font-bold">
                {stats?.coursesCompleted ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">{tc("completed")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Skills Radar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                {t("skills")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[260px] w-full">
                <RechartsRadar
                  data={skills.map((s) => ({
                    subject: s.name,
                    value: s.value,
                    fullMark: 100,
                  }))}
                />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {skills.map((s) => (
                  <div
                    key={s.name}
                    className="flex items-center justify-between rounded border border-border/50 px-2.5 py-1.5"
                  >
                    <span className="text-xs text-muted-foreground">
                      {s.name}
                    </span>
                    <span className="text-xs font-semibold text-primary">
                      {s.value}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* On-Chain Credentials */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gem className="h-5 w-5" />
                {t("credentials")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {credentials.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {profile.walletAddress ? t("noCredentials") : t("connectWalletForCredentials") ?? t("noCredentials")}
                </p>
              ) : (
                <div className="space-y-3">
                  {credentials.map((cred) => (
                    <div
                      key={cred.id}
                      className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <Gem className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{cred.trackName}</p>
                          <p className="text-xs text-muted-foreground">
                            {cred.level} &middot; {formatDate(cred.issuedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="gap-1 text-xs">
                          <Shield className="h-3 w-3" />
                          {t("verified")}
                        </Badge>
                        {cred.mintAddress && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-xs"
                            asChild
                          >
                            <a
                              href={`https://explorer.solana.com/address/${cred.mintAddress}?cluster=devnet`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-3 w-3" />
                              {t("viewOnExplorer")}
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Completed Courses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {t("completedCourses")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {completedCourses.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("noCourses")}
                </p>
              ) : (
                <div className="space-y-3">
                  {completedCourses.map((enrollment) => (
                    <div
                      key={enrollment.id}
                      className="flex items-center justify-between rounded-lg border border-border p-4"
                    >
                      <div>
                        <p className="font-medium">{enrollment.courseId}</p>
                        <p className="text-xs text-muted-foreground">
                          {tc("completed")}{" "}
                          {enrollment.completedAt
                            ? formatDate(enrollment.completedAt)
                            : ""}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {Math.round(enrollment.progressPct)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              {t("achievementsTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {achievements.map((ach) => (
                <div
                  key={ach.name}
                  className={`flex items-center gap-2.5 rounded-lg border p-3 ${
                    ach.unlocked
                      ? "border-primary/30 bg-primary/5"
                      : "border-border/50 opacity-50"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${ach.unlocked ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}
                  >
                    <Trophy className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-medium leading-tight">
                    {ach.name}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
