"use client";

import { useState, useCallback, useRef, useEffect, startTransition } from "react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { User, Zap, Check, Copy, ExternalLink, Award, BookOpen, Pencil, X, Save, Twitter, Github, EyeOff, CalendarDays, CheckCircle2, TrendingUp, Flame } from "lucide-react";
import { StreakBadge } from "@/components/gamification/StreakBadge";
import { AchievementBadges } from "@/components/gamification/AchievementBadges";
import { useAchievements } from "@/hooks/useAchievements";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getLevel, getLevelProgress, formatXp, truncateAddress } from "@/lib/utils";
import { useXpBalance } from "@/hooks/useXpBalance";
import { useCredentials } from "@/hooks/useCredentials";
import { useProgressStore } from "@/stores/progress-store";
import { Progress } from "@/components/ui/progress";
import { SOLANA_NETWORK } from "@/lib/solana/constants";
import { Link } from "@/i18n/routing";
import { SkillRadarChart } from "@/components/profile/SkillRadarChart";
import { getCourseTrackMap, type CourseTrackInfo } from "@/lib/sanity/queries";
import type { HeliusAsset } from "@/lib/solana/helius";

const PROFILE_VISIBILITY_KEY = "academy:profile-public";
const JOIN_DATE_KEY = "academy:join-date";

const PROFILE_KEYS = {
  name: "superteam-profile-name",
  bio: "superteam-profile-bio",
  avatar: "superteam-profile-avatar",
  twitter: "superteam-profile-twitter",
  github: "superteam-profile-github",
} as const;

// Bio is shared with settings page — uses the same global key
const PROFILE_BIO_KEY = "superteam-profile-bio";

function formatCourseId(id: string): string {
  return id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function BadgeCard({ cred }: { cred: HeliusAsset }) {
  const t = useTranslations("profile");
  const name = cred.content.metadata.name;
  const imageUrl = cred.content?.json_uri;

  return (
    <Link href={`/certificates/${cred.id}` as string}>
      <div className="group flex flex-col items-center gap-3 rounded-xl border border-border/50 bg-gradient-to-br from-primary/5 to-secondary/5 p-4 text-center transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:scale-[1.02]">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            width={64}
            height={64}
            className="h-16 w-16 rounded-full object-cover ring-2 ring-primary/20"
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
            <Award className="h-8 w-8 text-primary" aria-hidden="true" />
          </div>
        )}
        <div className="min-w-0 w-full">
          <p className="truncate text-sm font-semibold">{name}</p>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            {truncateAddress(cred.id, 5)}
          </p>
          <Badge variant="outline" className="mt-2 text-xs">
            {t("badges.minted")}
          </Badge>
        </div>
        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
      </div>
    </Link>
  );
}

export function Profile() {
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const locale = useLocale();
  const { data: session, status: sessionStatus } = useSession();
  const { publicKey, connected } = useWallet();
  const { setVisible: setWalletModalVisible } = useWalletModal();
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const bioTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const { xp, loading: xpLoading } = useXpBalance();
  const { credentials, loading: credLoading } = useCredentials();
  const { completedLessons, streakDays } = useProgressStore();
  const { unlockedBitmap } = useAchievements(publicKey);
  const [joinDate, setJoinDate] = useState<string | null>(null);
  const [courseTrackMap, setCourseTrackMap] = useState<CourseTrackInfo[]>([]);

  // Profile settings from localStorage (set in Settings page)
  const [profileName, setProfileName] = useState("");
  const [profileAvatar, setProfileAvatar] = useState("");
  const [profileTwitter, setProfileTwitter] = useState("");
  const [profileGithub, setProfileGithub] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      startTransition(() => {
        setProfileName(localStorage.getItem(PROFILE_KEYS.name) ?? "");
        setProfileAvatar(localStorage.getItem(PROFILE_KEYS.avatar) ?? "");
        setProfileTwitter(localStorage.getItem(PROFILE_KEYS.twitter) ?? "");
        setProfileGithub(localStorage.getItem(PROFILE_KEYS.github) ?? "");
      });
    }
  }, []);

  // Join date — set on first render if not already stored
  useEffect(() => {
    if (typeof window !== "undefined") {
      let stored = localStorage.getItem(JOIN_DATE_KEY);
      if (!stored) {
        stored = new Date().toISOString();
        localStorage.setItem(JOIN_DATE_KEY, stored);
      }
      startTransition(() => setJoinDate(stored));
    }
  }, []);

  // Fetch lightweight course track metadata for the SkillRadarChart
  useEffect(() => {
    getCourseTrackMap(locale).then(setCourseTrackMap).catch(() => {
      // Non-fatal: radar will show empty state if fetch fails
    });
  }, [locale]);

  // Profile visibility toggle (public/private)
  const [isPublic, setIsPublic] = useState(true);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(PROFILE_VISIBILITY_KEY);
      startTransition(() => setIsPublic(stored !== "false"));
    }
  }, []);
  const togglePublic = (value: boolean) => {
    setIsPublic(value);
    localStorage.setItem(PROFILE_VISIBILITY_KEY, String(value));
  };

  // Bio state
  const [bio, setBio] = useState("");
  const [editingBio, setEditingBio] = useState(false);
  const [draftBio, setDraftBio] = useState("");
  const [bioSaved, setBioSaved] = useState(false);

  const startEditBio = useCallback(() => {
    setDraftBio(bio);
    setEditingBio(true);
  }, [bio]);

  const cancelEditBio = useCallback(() => {
    setEditingBio(false);
    setDraftBio("");
  }, []);

  const saveBio = useCallback(() => {
    localStorage.setItem(PROFILE_BIO_KEY, draftBio);
    setBio(draftBio);
    setEditingBio(false);
    clearTimeout(bioTimerRef.current);
    setBioSaved(true);
    bioTimerRef.current = setTimeout(() => setBioSaved(false), 2000);
  }, [draftBio]);

  const level = getLevel(xp);
  const levelProgress = getLevelProgress(xp);

  const totalLessonsCompleted = Object.values(completedLessons).reduce(
    (sum, set) => sum + set.size,
    0
  );
  const coursesWithProgress = Object.keys(completedLessons).length;
  const completedCourseIds = Object.keys(completedLessons);

  const formattedJoinDate = joinDate
    ? new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric" }).format(new Date(joinDate))
    : null;

  const copyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toBase58()).catch(() => {});
      clearTimeout(copyTimerRef.current);
      setCopied(true);
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
    }
  };

  // Cleanup timers on unmount
  useEffect(() => () => {
    clearTimeout(copyTimerRef.current);
    clearTimeout(bioTimerRef.current);
  }, []);

  // Re-read bio from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(PROFILE_BIO_KEY) ?? "";
      startTransition(() => setBio(stored));
    }
  }, []);

  if (sessionStatus === "loading") {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 flex justify-center">
        <div
          role="status"
          aria-label={tc("loading")}
          className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
        />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20">
        <EmptyState
          icon={User}
          title={t("signInRequired")}
          description={t("signInRequiredDesc")}
          action={
            <Link href="/auth/signin">
              <Button>{tc("signIn")}</Button>
            </Link>
          }
        />
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20">
        <EmptyState
          icon={User}
          title={t("walletRequired")}
          description={t("walletRequiredDesc")}
          action={
            <Button className="gap-2" onClick={() => setWalletModalVisible(true)}>
              {tc("connectWallet")}
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 space-y-6">
      {/* Private profile indicator */}
      {!isPublic && (
        <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/50 px-4 py-2 text-sm text-muted-foreground">
          <EyeOff className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{t("privacy.privateIndicator")}</span>
        </div>
      )}

      {/* Hero card */}
      <Card className="overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-primary/60 via-secondary/40 to-primary/20" aria-hidden="true" />
        <CardContent className="p-8">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <Avatar className="h-20 w-20 shrink-0">
              {profileAvatar && <AvatarImage src={profileAvatar} alt={profileName || t("profile.avatarAlt")} />}
              <AvatarFallback className="bg-primary/10 text-2xl">
                <User className="h-10 w-10 text-primary" aria-hidden="true" />
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-3 text-center sm:text-left">
              {/* Display name or wallet address */}
              {profileName ? (
                <h2 className="text-xl font-bold">{profileName}</h2>
              ) : null}
              {publicKey && (
                <div className="flex items-center justify-center gap-2 sm:justify-start">
                  <code className="text-sm font-mono text-muted-foreground">
                    {truncateAddress(publicKey.toBase58(), 8)}
                  </code>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={copyAddress}
                          aria-label={copied ? tc("copied") : tc("copyAddress")}
                        >
                          {copied ? (
                            <Check className="h-3.5 w-3.5 text-green-500" aria-hidden="true" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{copied ? tc("copied") : tc("copyAddress")}</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          href={`https://explorer.solana.com/address/${publicKey.toBase58()}?cluster=${SOLANA_NETWORK}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={tc("viewOnExplorer")}>
                            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                          </Button>
                        </a>
                      </TooltipTrigger>
                      <TooltipContent>{tc("viewOnExplorer")}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}

              {xpLoading ? (
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <Badge className="gap-1 text-sm">
                    <Zap className="h-3.5 w-3.5" aria-hidden="true" />
                    {formatXp(xp)} XP
                  </Badge>
                  <Badge variant="outline" className="text-sm">
                    {tc("level")} {level}
                  </Badge>
                  {streakDays > 0 && (
                    <StreakBadge streak={streakDays} />
                  )}
                </div>
              )}

              {/* Level progress bar */}
              {!xpLoading && (
                <div className="max-w-xs">
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>{tc("level")} {level}</span>
                    <span>{tc("level")} {level + 1}</span>
                  </div>
                  <Progress value={levelProgress} className="h-1.5" aria-label={tc("levelProgress")} />
                </div>
              )}

              {/* Social links */}
              {(profileTwitter || profileGithub) && (
                <div className="flex items-center justify-center gap-2 sm:justify-start">
                  {profileTwitter && (
                    <a
                      href={`https://twitter.com/${profileTwitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Twitter: @${profileTwitter}`}
                    >
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <Twitter className="h-3.5 w-3.5" aria-hidden="true" />
                        @{profileTwitter}
                      </Button>
                    </a>
                  )}
                  {profileGithub && (
                    <a
                      href={`https://github.com/${profileGithub}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`GitHub: ${profileGithub}`}
                    >
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <Github className="h-3.5 w-3.5" aria-hidden="true" />
                        {profileGithub}
                      </Button>
                    </a>
                  )}
                </div>
              )}

              {/* Member since */}
              {formattedJoinDate && (
                <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground sm:justify-start">
                  <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{t("memberSince")} {formattedJoinDate}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bio card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" aria-hidden="true" />
              {t("bio.title")}
            </CardTitle>
            {!editingBio ? (
              <Button variant="ghost" size="sm" className="gap-1" onClick={startEditBio}>
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                {bioSaved ? t("bio.saved") : tc("edit")}
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={cancelEditBio}>
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="sr-only">{tc("cancel")}</span>
                </Button>
                <Button size="sm" className="gap-1" onClick={saveBio}>
                  <Save className="h-3.5 w-3.5" aria-hidden="true" />
                  {tc("save")}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editingBio ? (
            <div>
              <textarea
                value={draftBio}
                onChange={(e) => setDraftBio(e.target.value)}
                placeholder={t("bio.placeholder")}
                aria-label={t("bio.placeholder")}
                rows={4}
                maxLength={500}
                className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <span className="text-xs text-muted-foreground">{draftBio.length}/500</span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {bio || t("bio.empty")}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* XP — purple */}
        <Card className="overflow-hidden border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
              {t("totalXp")}
              <Zap className="h-4 w-4 text-purple-400 opacity-70" aria-hidden="true" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {xpLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{formatXp(xp)}</p>
            )}
          </CardContent>
        </Card>

        {/* Level — green */}
        <Card className="overflow-hidden border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
              {tc("level")}
              <TrendingUp className="h-4 w-4 text-green-400 opacity-70" aria-hidden="true" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {xpLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{level}</p>
            )}
          </CardContent>
        </Card>

        {/* Courses — blue */}
        <Card className="overflow-hidden border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
              {t("coursesCompleted")}
              <BookOpen className="h-4 w-4 text-blue-400 opacity-70" aria-hidden="true" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{coursesWithProgress}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {tc("lessonsTotal", { count: totalLessonsCompleted })}
            </p>
          </CardContent>
        </Card>

        {/* Streak — orange */}
        <Card className="overflow-hidden border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
              {t("streak")}
              <Flame className="h-4 w-4 text-orange-400 opacity-70" aria-hidden="true" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{streakDays}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("streakDays")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Completed Courses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            {t("completedCoursesList")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {completedCourseIds.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="rounded-full bg-muted p-5 mb-4">
                <BookOpen className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">{t("noCompletedCourses")}</p>
              <Link href="/courses">
                <Button size="sm" className="gap-1.5">
                  <BookOpen className="h-4 w-4" aria-hidden="true" />
                  {t("startLearning")}
                </Button>
              </Link>
            </div>
          ) : (
            <ul className="space-y-2">
              {completedCourseIds.map((courseId) => (
                <li key={courseId}>
                  <Link href={`/courses/${courseId}` as string}>
                    <div className="flex items-center gap-3 rounded-lg border border-border/50 px-4 py-3 text-sm transition-colors hover:bg-muted/50">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" aria-hidden="true" />
                      <span className="font-medium truncate">{formatCourseId(courseId)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Achievement Badges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" aria-hidden="true" />
            {t("badges.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {credLoading ? (
            <div className="grid gap-4 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          ) : credentials.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-muted p-6 mb-4">
                <Award className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t("badges.noBadges")}</h3>
              <p className="text-muted-foreground max-w-md mb-6">{t("badges.noBadgesDescription")}</p>
              <Link href="/courses">
                <Button className="gap-1">
                  <BookOpen className="h-4 w-4" aria-hidden="true" />
                  {tc("browseCourses")}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {credentials.map((cred) => (
                <BadgeCard key={cred.id} cred={cred} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Achievement Badge Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" aria-hidden="true" />
            {t("achievementBadges.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AchievementBadges unlockedBitmap={unlockedBitmap} />
        </CardContent>
      </Card>

      {/* Skill Radar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" aria-hidden="true" />
            {t("skills.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SkillRadarChart completedLessons={completedLessons} courseTrackMap={courseTrackMap} />
        </CardContent>
      </Card>

      {/* Privacy toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("privacy.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="profile-visibility" className="cursor-pointer font-medium">
                {isPublic ? t("privacy.public") : t("privacy.private")}
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isPublic ? t("privacy.publicDesc") : t("privacy.privateDesc")}
              </p>
            </div>
            <Switch
              id="profile-visibility"
              checked={isPublic}
              onCheckedChange={togglePublic}
              aria-label={isPublic ? t("privacy.public") : t("privacy.private")}
            />
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
