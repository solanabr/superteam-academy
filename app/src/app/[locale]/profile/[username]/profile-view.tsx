"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { calculateLevel } from "@/types/gamification";
import type { UserProfile, UserStats, Enrollment } from "@/types/user";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
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

const SKILLS = [
  { name: "Solana Core", value: 75 },
  { name: "Rust", value: 45 },
  { name: "Anchor", value: 30 },
  { name: "DeFi", value: 20 },
  { name: "NFTs", value: 15 },
  { name: "Web3 Frontend", value: 60 },
];

const ACHIEVEMENTS = [
  { name: "First Steps", unlocked: true, icon: "footprints" },
  { name: "Week Warrior", unlocked: true, icon: "flame" },
  { name: "Early Adopter", unlocked: true, icon: "star" },
  { name: "Course Completer", unlocked: false, icon: "graduation-cap" },
  { name: "Speed Runner", unlocked: false, icon: "zap" },
  { name: "Rust Rookie", unlocked: false, icon: "code" },
  { name: "Monthly Master", unlocked: false, icon: "calendar" },
  { name: "Challenge Champion", unlocked: false, icon: "trophy" },
];

const CREDENTIALS = [
  {
    trackName: "Solana Core",
    level: "Silver",
    mintAddress: "HN7c...3YWr",
    issuedAt: "2026-02-10",
    verified: true,
  },
  {
    trackName: "Web3 Integration",
    level: "Bronze",
    mintAddress: "9xKp...8mVq",
    issuedAt: "2026-02-12",
    verified: true,
  },
];

interface ProfileViewProps {
  profile: UserProfile;
  stats: UserStats | null;
  completedCourses: Enrollment[];
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
    <img
      src={url}
      alt={name}
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
  isOwner,
}: ProfileViewProps) {
  const t = useTranslations("profile");
  const tc = useTranslations("common");

  const totalXP = stats?.totalXP ?? 0;
  const levelInfo = calculateLevel(totalXP);

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
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart
                    cx="50%"
                    cy="50%"
                    outerRadius="80%"
                    data={SKILLS.map((s) => ({
                      subject: s.name,
                      value: s.value,
                      fullMark: 100,
                    }))}
                  >
                    <PolarGrid
                      stroke="var(--muted-foreground)"
                      strokeOpacity={0.25}
                      gridType="polygon"
                    />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{
                        fill: "var(--muted-foreground)",
                        fontSize: 11,
                      }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 100]}
                      tick={false}
                      axisLine={false}
                    />
                    <Radar
                      name="Skills"
                      dataKey="value"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      fill="var(--primary)"
                      fillOpacity={0.35}
                      dot={{
                        r: 4,
                        fill: "var(--primary)",
                        stroke: "var(--primary)",
                        strokeWidth: 1,
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {SKILLS.map((s) => (
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
              {CREDENTIALS.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("noCredentials")}
                </p>
              ) : (
                <div className="space-y-3">
                  {CREDENTIALS.map((cred) => (
                    <div
                      key={cred.mintAddress}
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
                        {cred.verified && (
                          <Badge variant="secondary" className="gap-1 text-xs">
                            <Shield className="h-3 w-3" />
                            {t("verified")}
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-xs"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {t("viewOnExplorer")}
                        </Button>
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
              {ACHIEVEMENTS.map((ach) => (
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
