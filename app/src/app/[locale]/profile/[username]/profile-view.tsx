"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Achievement } from "@/types/gamification";
import { usePlayerStats } from "@/hooks/use-player-stats";
import { useCoursesCompleted } from "@/hooks/use-courses-completed";
import { StatsBar } from "@/components/stats-bar";
import type { UserProfile, UserStats } from "@/types/user";
import type { SkillScore } from "@/services/interfaces";
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
  GraduationCap,
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
  courseMap: Record<string, string>;
  trackMap: Record<number, string>;
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
  courseMap,
  trackMap,
  skills,
  isOwner,
}: ProfileViewProps) {
  const t = useTranslations("profile");
  const tc = useTranslations("common");

  const playerStats = usePlayerStats(profile.walletAddress);

  const {
    coursesCompleted,
    credentials,
    loading: coursesLoading,
  } = useCoursesCompleted(profile.walletAddress);

  const achievements = useMemo(
    () => deriveAchievements(stats?.achievementFlags ?? [0, 0, 0, 0]),
    [stats?.achievementFlags],
  );

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
          <div className="mt-6">
            <StatsBar
              xp={playerStats.xp}
              streak={playerStats.streak?.currentStreak ?? 0}
              coursesCompleted={coursesCompleted}
              loadingStats={playerStats.loading}
              loadingCourses={coursesLoading}
              variant="compact"
            />
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

          {/* On-Chain Credentials & Completed Courses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gem className="h-5 w-5" />
                {t("credentials")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {coursesLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="rounded-lg border border-border p-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : credentials.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {profile.walletAddress ? t("noCredentials") : t("connectWalletForCredentials") ?? t("noCredentials")}
                </p>
              ) : (
                <div className="space-y-4">
                  {credentials.map((cred) => {
                    const resolvedTrackName = trackMap[cred.trackId] ?? cred.trackName;
                    const courseEntries = (cred.completedCourseIds ?? [])
                      .map((id) => ({ id, title: courseMap[id] }))
                      .filter((e) => e.title);
                    return (
                      <div
                        key={cred.id}
                        className="rounded-lg border border-primary/20 bg-primary/5 p-5"
                      >
                        <div className="flex gap-4">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={cred.imageUrl || "/images/credentials/sample.png"}
                            alt={resolvedTrackName}
                            width={120}
                            height={120}
                            className="h-[120px] w-[120px] shrink-0 rounded-lg object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-lg font-semibold">{resolvedTrackName}</p>
                                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                  {cred.level > 0 && (
                                    <>
                                      <span>{tc("level")} {cred.level}</span>
                                      <span>&middot;</span>
                                    </>
                                  )}
                                  {cred.coursesCompleted != null && (
                                    <>
                                      <span>{cred.coursesCompleted} {cred.coursesCompleted === 1 ? "course" : "courses"}</span>
                                      <span>&middot;</span>
                                    </>
                                  )}
                                  {cred.totalXp != null && (
                                    <>
                                      <span>{cred.totalXp.toLocaleString()} XP</span>
                                      <span>&middot;</span>
                                    </>
                                  )}
                                  <Badge variant="secondary" className="gap-1 text-xs">
                                    <Shield className="h-3 w-3" />
                                    {t("verified")}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <Link href={`/certificates/${cred.id}`}>
                                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                                  <GraduationCap className="h-3.5 w-3.5" />
                                  {t("viewCertificate")}
                                </Button>
                              </Link>
                              {cred.explorerUrl && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="gap-1.5 text-xs"
                                  asChild
                                >
                                  <a
                                    href={cred.explorerUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    {t("viewOnExplorer")}
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                        {courseEntries.length > 0 && (
                          <div className="mt-4">
                            <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              {t("coursesCompletedLabel")}
                            </p>
                            <div className="space-y-1 rounded-md border border-border/50 bg-background/50 px-3 py-2">
                              {courseEntries.map((entry) => (
                                <Link key={entry.id} href={`/courses/${entry.id}`} className="flex items-center gap-2 py-1 text-sm text-muted-foreground hover:text-primary transition-colors">
                                  <BookOpen className="h-3.5 w-3.5 shrink-0" />
                                  {entry.title}
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
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
