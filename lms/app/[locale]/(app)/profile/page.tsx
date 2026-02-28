"use client";

import {
  Zap,
  Flame,
  Trophy,
  BookOpen,
  Award,
  Calendar,
  Code2,
  ExternalLink,
  CheckCircle2,
  Lock,
} from "lucide-react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  useXP,
  useLevel,
  useStreak,
  useAllProgress,
  useAchievements,
  useClaimAchievement,
  useCourses,
  useDisplayName,
  useBio,
  usePracticeProgress,
  useAvatar,
  useProfile,
} from "@/lib/hooks/use-service";
import { getAvatarSrc } from "@/lib/data/avatars";
import { getXpProgress, formatXP, shortenAddress } from "@/lib/utils";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import { TRACKS } from "@/types/course";
import {
  ACHIEVEMENTS,
  checkAchievementEligibility,
  type AchievementContext,
} from "@/types/gamification";
import {
  PRACTICE_MILESTONES,
  MILESTONE_LEVELS,
  PRACTICE_DIFFICULTY_CONFIG,
} from "@/types/practice";
import { PRACTICE_CHALLENGES } from "@/lib/data/practice-challenges";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useState } from "react";

function AvatarWithShimmer({
  src,
  displayName,
  address,
}: {
  src: string | undefined;
  displayName: string | undefined;
  address: string;
}) {
  const [loaded, setLoaded] = useState(false);

  if (!src) {
    return (
      <span className="text-2xl font-bold text-white">
        {(displayName ?? address).slice(0, 2).toUpperCase()}
      </span>
    );
  }

  return (
    <>
      {!loaded && (
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-muted via-muted-foreground/10 to-muted animate-shimmer bg-[length:200%_100%]" />
      )}
      <Image
        src={src}
        alt="Avatar"
        width={80}
        height={80}
        className={`h-full w-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
        onLoad={() => setLoaded(true)}
      />
    </>
  );
}

export default function ProfilePage() {
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const { data: displayName } = useDisplayName();
  const { data: bio } = useBio();
  const { data: avatar, isLoading: avatarLoading } = useAvatar();
  const { data: xp = 0 } = useXP();
  const { data: level = 0 } = useLevel();
  const { data: streak } = useStreak();
  const { data: allProgress } = useAllProgress();
  const { data: achievements } = useAchievements();
  const { data: courses } = useCourses();
  const {
    completed: practiceCompleted,
    claimedMilestones,
    milestoneTxHashes,
  } = usePracticeProgress();
  const { data: profile } = useProfile();
  const claimAchievement = useClaimAchievement();
  const [claimingId, setClaimingId] = useState<number | null>(null);

  const { data: balanceLamports } = useQuery({
    queryKey: ["solBalance", publicKey?.toBase58()],
    queryFn: () => connection.getBalance(publicKey!),
    enabled: !!publicKey,
    refetchInterval: 30_000,
  });
  const solBalance =
    balanceLamports != null ? balanceLamports / LAMPORTS_PER_SOL : null;

  const solEarned = claimedMilestones.reduce((sum, m) => {
    const level = MILESTONE_LEVELS[m];
    return sum + (level?.solReward ?? 0);
  }, 0);

  const xpProgress = getXpProgress(xp);
  const completedCourses = allProgress?.filter((p) => p.completedAt) ?? [];
  const claimedAchievements = achievements?.filter((a) => a.claimed) ?? [];

  const totalLessonsCompleted =
    allProgress?.reduce((sum, p) => sum + p.lessonsCompleted.length, 0) ?? 0;
  const completedTrackIds = completedCourses.reduce<number[]>((ids, p) => {
    const course = courses?.find(
      (c) => c.id === p.courseId || c.slug === p.courseId,
    );
    if (course && !ids.includes(course.trackId)) ids.push(course.trackId);
    return ids;
  }, []);
  const hasSpeedRun = completedCourses.some((p) => {
    if (!p.completedAt || !p.enrolledAt) return false;
    return (
      new Date(p.completedAt).toDateString() ===
      new Date(p.enrolledAt).toDateString()
    );
  });

  const achievementCtx: AchievementContext = {
    lessonsCompleted: totalLessonsCompleted,
    coursesCompleted: completedCourses.length,
    longestStreak: streak?.longest ?? 0,
    practiceCount: practiceCompleted.length,
    completedTrackIds,
    hasSpeedRun,
    referralCount: profile?.referralCount ?? 0,
  };

  const ta = useTranslations("achievements");

  if (!connected || !publicKey) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 text-center">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="mt-4 text-muted-foreground">{t("connectToView")}</p>
      </div>
    );
  }

  const address = publicKey.toBase58();

  // Calculate track progress
  const trackProgress = Object.entries(TRACKS)
    .map(([id, track]) => {
      const trackCourses =
        courses?.filter((c) => c.trackId === parseInt(id)) ?? [];
      const completed = completedCourses.filter((p) =>
        trackCourses.some((c) => c.id === p.courseId || c.slug === p.courseId),
      ).length;
      return {
        ...track,
        id: parseInt(id),
        total: trackCourses.length,
        completed,
      };
    })
    .filter((t) => t.total > 0);

  const practiceSolvedCount = practiceCompleted.length;
  const practiceXP = practiceCompleted.reduce((sum, id) => {
    const c = PRACTICE_CHALLENGES.find((ch) => ch.id === id);
    return sum + (c ? PRACTICE_DIFFICULTY_CONFIG[c.difficulty].xp : 0);
  }, 0);
  const currentTier = [...PRACTICE_MILESTONES]
    .reverse()
    .find((m) => practiceSolvedCount >= m);
  const currentTierLevel = currentTier ? MILESTONE_LEVELS[currentTier] : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Profile Header */}
      <Card className="mb-8">
        <CardContent className="p-8">
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <div className="relative h-20 w-20 rounded-full overflow-hidden bg-gradient-to-br from-[#008c4c] to-[#ffd23f] flex items-center justify-center shrink-0">
              {avatarLoading ? (
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-muted via-muted-foreground/10 to-muted animate-shimmer bg-[length:200%_100%]" />
              ) : (
                <AvatarWithShimmer
                  src={getAvatarSrc(avatar ?? undefined)}
                  displayName={displayName}
                  address={address}
                />
              )}
            </div>
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-2xl font-bold">
                {displayName ?? shortenAddress(address)}
              </h1>
              {bio && <p className="mt-1 text-muted-foreground">{bio}</p>}
              <p className="text-xs text-muted-foreground mt-1">{address}</p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-4 sm:justify-start">
                <Badge variant="xp" className="text-sm">
                  Level {level}
                </Badge>
                <span className="flex items-center gap-1 text-sm">
                  <Zap className="h-4 w-4 text-xp-gold" /> {formatXP(xp)} XP
                </span>
                <span className="flex items-center gap-1 text-sm">
                  <Flame className="h-4 w-4 text-streak-orange" />{" "}
                  {t("dayStreak", { count: streak?.current ?? 0 })}
                </span>
              </div>
            </div>
            <Link
              href="/settings"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {t("editProfile")}
            </Link>
          </div>
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-1">
              <span>Level {level}</span>
              <span>
                {t("xpToLevel", {
                  current: xpProgress.current,
                  needed: xpProgress.needed,
                  level: level + 1,
                })}
              </span>
            </div>
            <Progress
              value={xpProgress.percent}
              indicatorClassName="bg-gradient-to-r from-[#008c4c] to-[#ffd23f]"
            />
          </div>
        </CardContent>
      </Card>

      {/* SOL Stats */}
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("walletBalance")}
                </p>
                <p className="text-2xl font-bold mt-1">
                  {solBalance != null ? `${solBalance.toFixed(4)} SOL` : "—"}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-solana-purple/10">
                <Image
                  src="/image.png"
                  alt="SOL"
                  width={28}
                  height={28}
                  className="rounded-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("solEarned")}
                </p>
                <p className="text-2xl font-bold mt-1 text-solana-green">
                  {solEarned > 0 ? `${solEarned.toFixed(2)} SOL` : "0 SOL"}
                </p>
                {claimedMilestones.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("fromMilestones", { count: claimedMilestones.length })}
                  </p>
                )}
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-solana-green/10">
                <Image
                  src="/image.png"
                  alt="SOL"
                  width={28}
                  height={28}
                  className="rounded-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Skill Tracks */}
        <Card className="self-start">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="h-5 w-5" /> {t("skillTracks")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {trackProgress.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("completeCoursesToBuild")}
              </p>
            ) : (
              trackProgress.map((track) => (
                <div key={track.id}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">{track.display}</span>
                    <span className="text-muted-foreground">
                      {track.completed}/{track.total}
                    </span>
                  </div>
                  <Progress
                    value={
                      track.total > 0
                        ? (track.completed / track.total) * 100
                        : 0
                    }
                    indicatorClassName="bg-solana-purple"
                  />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5" />{" "}
              {t("achievements", { count: claimedAchievements.length })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {ACHIEVEMENTS.map((a) => {
                const claimed =
                  achievements?.some((ua) => ua.id === a.id && ua.claimed) ??
                  false;
                const eligible =
                  !claimed && checkAchievementEligibility(a.id, achievementCtx);
                const locked = !claimed && !eligible;

                return (
                  <div
                    key={a.id}
                    className={`flex flex-col items-center gap-1 rounded-lg p-3 text-center ${
                      claimed
                        ? "bg-solana-purple/10"
                        : eligible
                          ? "bg-xp-gold/10 ring-1 ring-xp-gold/30"
                          : "bg-muted opacity-50"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        claimed
                          ? "bg-solana-green/20"
                          : eligible
                            ? "bg-xp-gold/20"
                            : "bg-muted"
                      }`}
                    >
                      {claimed ? (
                        <CheckCircle2 className="h-5 w-5 text-solana-green" />
                      ) : locked ? (
                        <Lock className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <Trophy className="h-5 w-5 text-xp-gold" />
                      )}
                    </div>
                    <p className="text-xs font-medium">{a.name}</p>
                    <p className="text-[10px] text-xp-gold">+{a.xpReward} XP</p>
                    {claimed ? (
                      <span className="text-[10px] text-solana-green font-medium">
                        {ta("claimed")}
                      </span>
                    ) : eligible ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-2 border-xp-gold/50 text-xp-gold hover:bg-xp-gold/10"
                        disabled={claimingId !== null}
                        onClick={() => {
                          setClaimingId(a.id);
                          claimAchievement.mutate(a.id, {
                            onSuccess: () =>
                              toast.success(
                                ta("claimSuccess", { amount: a.xpReward }),
                              ),
                            onSettled: () => setClaimingId(null),
                          });
                        }}
                      >
                        {claimingId === a.id ? ta("claiming") : ta("claim")}
                      </Button>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">
                        {ta("locked")}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Practice Stats */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Code2 className="h-5 w-5" /> {t("practiceArena")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="font-medium">{t("problemsSolved")}</span>
              <span className="text-muted-foreground">
                {practiceSolvedCount} / 75
              </span>
            </div>
            <Progress
              value={(practiceSolvedCount / 75) * 100}
              indicatorClassName="bg-solana-purple"
            />
          </div>
          <div className="flex items-center gap-4">
            {currentTierLevel ? (
              <Badge
                style={{
                  backgroundColor: currentTierLevel.color,
                  color: "#fff",
                }}
              >
                {currentTierLevel.name}
              </Badge>
            ) : (
              <Badge variant="outline">{t("noTierYet")}</Badge>
            )}
            <span className="flex items-center gap-1 text-sm">
              <Zap className="h-4 w-4 text-xp-gold" />{" "}
              {t("xpFromPractice", { amount: practiceXP })}
            </span>
          </div>
          <Separator />
          <div className="space-y-2">
            {PRACTICE_MILESTONES.map((m) => {
              const level = MILESTONE_LEVELS[m];
              const reached = practiceSolvedCount >= m;
              const claimed = claimedMilestones.includes(m);
              const txHash = milestoneTxHashes[String(m)];
              return (
                <div
                  key={m}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <Trophy
                      className="h-4 w-4"
                      style={{ color: reached ? level.color : undefined }}
                    />
                    <span
                      className={
                        reached ? "font-medium" : "text-muted-foreground"
                      }
                    >
                      {level.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({m} {tc("solved")})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">
                      {level.solReward} SOL
                    </span>
                    {claimed && txHash ? (
                      <a
                        href={`https://explorer.solana.com/tx/${txHash}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-solana-green hover:underline"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : reached ? (
                      <span className="text-xs text-xp-gold">
                        {tc("eligible")}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {tc("locked")}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Completed Courses */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5" />{" "}
            {t("completedCourses", { count: completedCourses.length })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {completedCourses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("noCoursesCompleted")}
            </p>
          ) : (
            <div className="space-y-3">
              {completedCourses.map((p) => {
                const course = courses?.find(
                  (c) => c.id === p.courseId || c.slug === p.courseId,
                );
                return (
                  <div
                    key={p.courseId}
                    className="flex items-center justify-between rounded-lg bg-muted p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {course?.title ?? p.courseId}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Completed{" "}
                        {p.completedAt
                          ? new Date(p.completedAt).toLocaleDateString()
                          : ""}
                      </p>
                    </div>
                    <Badge variant="xp">{course?.xpTotal ?? 0} XP</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
