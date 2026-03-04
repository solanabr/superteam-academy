"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useQuery } from "@tanstack/react-query";
import {
  Trophy,
  Flame,
  BookOpen,
  Award,
  Shield,
  ExternalLink,
  Copy,
  Check,
  Share2,
  Calendar,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  gamificationService,
  learningProgressService,
  credentialService,
  courseService,
} from "@/services";
import {
  formatXP,
  getLevel,
  truncateAddress,
  formatDate,
} from "@/lib/utils";

export function ProfilePage() {
  const t = useTranslations("profile");
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") || "overview";

  if (!connected) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="rounded-full bg-primary/10 p-6 mb-6">
          <Award className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Connect Your Wallet</h1>
        <p className="text-muted-foreground mb-6 max-w-md">
          Connect your wallet to view your profile, credentials, and achievements.
        </p>
        <Button size="lg" onClick={() => setVisible(true)}>
          Connect Wallet
        </Button>
      </div>
    );
  }

  return <ProfileContent walletAddress={publicKey?.toBase58() || ""} defaultTab={defaultTab} />;
}

function ProfileContent({
  walletAddress,
  defaultTab,
}: {
  walletAddress: string;
  defaultTab: string;
}) {
  const t = useTranslations("profile");
  const [copied, setCopied] = useState(false);

  // Fetch data
  const { data: xpData } = useQuery({
    queryKey: ["gamification", "xp", walletAddress],
    queryFn: () => gamificationService.getXPBalance(),
  });

  const { data: streakData } = useQuery({
    queryKey: ["gamification", "streak", walletAddress],
    queryFn: () => gamificationService.getStreak(),
  });

  const { data: achievementsData } = useQuery({
    queryKey: ["gamification", "achievements", walletAddress],
    queryFn: () => gamificationService.getAchievements(),
  });

  const { data: rankData } = useQuery({
    queryKey: ["gamification", "rank", walletAddress],
    queryFn: () => gamificationService.getRank(),
  });

  const { data: credentialsData } = useQuery({
    queryKey: ["credentials", walletAddress],
    queryFn: () => credentialService.getCredentials(walletAddress),
  });

  const { data: progressData } = useQuery({
    queryKey: ["progress", "all", walletAddress],
    queryFn: () => learningProgressService.getAllProgress("user-wallet"),
  });

  const { data: coursesData } = useQuery({
    queryKey: ["courses"],
    queryFn: () => courseService.getCourses({}),
  });

  const xp = xpData?.data || 0;
  const level = getLevel(xp);
  const streak = streakData?.data || { currentStreak: 0 };
  const achievements = achievementsData?.data || [];
  const rank = rankData?.data || 0;
  const credentials = credentialsData || [];
  const progressList: any[] = progressData || [];
  const courses = coursesData?.data || [];

  const completedCourses = courses.filter((course) => {
    const progress = progressList.find((p: any) => p.courseId === course.id);
    return progress && progress.completedLessons.length >= course.lessonCount;
  });

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container px-4 py-8">
      {/* Profile Header */}
      <div className="relative mb-8">
        {/* Banner */}
        <div className="h-32 md:h-48 rounded-xl bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20" />

        {/* Profile Info */}
        <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-16 md:-mt-12 px-4 md:px-8">
          <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-background">
            <AvatarImage src="" />
            <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
              {walletAddress.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold">
                {truncateAddress(walletAddress)}
              </h1>
              <Badge variant="secondary" className="gap-1">
                Level {level}
              </Badge>
              {rank > 0 && rank <= 100 && (
                <Badge variant="default" className="gap-1">
                  <Trophy className="h-3 w-3" />
                  Top {rank}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <code className="bg-muted px-2 py-0.5 rounded text-xs">
                {truncateAddress(walletAddress, 8)}
              </code>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={copyAddress}
                    >
                      {copied ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy address</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <a
                href={`https://solscan.io/account/${walletAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          <Button variant="outline" size="sm">
            <Share2 className="mr-2 h-4 w-4" />
            Share Profile
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-8">
        <StatCard
          icon={BookOpen}
          label={t("stats.coursesCompleted")}
          value={completedCourses.length.toString()}
        />
        <StatCard
          icon={Zap}
          label={t("stats.totalXP")}
          value={formatXP(xp)}
        />
        <StatCard
          icon={Flame}
          label={t("stats.currentStreak")}
          value={`${streak.currentStreak}`}
        />
        <StatCard
          icon={Trophy}
          label={t("stats.rank")}
          value={rank > 0 ? `#${rank}` : "—"}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue={defaultTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">{t("tabs.overview")}</TabsTrigger>
          <TabsTrigger value="credentials">{t("tabs.credentials")}</TabsTrigger>
          <TabsTrigger value="achievements">{t("tabs.achievements")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab
            courses={courses}
            progressList={progressList}
            completedCourses={completedCourses}
            achievements={achievements}
            credentials={credentials}
          />
        </TabsContent>

        <TabsContent value="credentials">
          <CredentialsTab credentials={credentials} />
        </TabsContent>

        <TabsContent value="achievements">
          <AchievementsTab achievements={achievements} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="rounded-full bg-primary/10 p-2">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function OverviewTab({
  courses,
  progressList,
  completedCourses,
  achievements,
  credentials,
}: any) {
  const unlockedAchievements = achievements.filter((a: any) => a.unlockedAt);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Completed Courses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Completed Courses ({completedCourses.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {completedCourses.length > 0 ? (
            <div className="space-y-3">
              {completedCourses.slice(0, 5).map((course: any) => (
                <Link
                  key={course.id}
                  href={`/courses/${course.slug}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{course.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatXP(course.xpReward)} XP earned
                    </p>
                  </div>
                  <Check className="h-5 w-5 text-success" />
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No courses completed yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Achievements ({unlockedAchievements.length}/{achievements.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {unlockedAchievements.length > 0 ? (
            <div className="space-y-3">
              {unlockedAchievements.slice(0, 5).map((achievement: any) => (
                <div
                  key={achievement.id}
                  className="flex items-center gap-3 p-2"
                >
                  <div className="text-2xl">{achievement.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{achievement.title}</p>
                    <p className="text-xs text-muted-foreground">
                      +{achievement.xpReward} XP
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No achievements unlocked yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Credentials Preview */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            On-Chain Credentials ({credentials.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {credentials.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {credentials.slice(0, 3).map((credential: any) => (
                <CredentialCard key={credential.id} credential={credential} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Complete courses to earn on-chain credentials
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CredentialsTab({ credentials }: { credentials: any[] }) {
  if (credentials.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="rounded-full bg-muted p-6 w-fit mx-auto mb-4">
          <Shield className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Credentials Yet</h3>
        <p className="text-muted-foreground mb-4">
          Complete courses to earn verifiable on-chain credentials
        </p>
        <Button asChild>
          <Link href="/courses">Browse Courses</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {credentials.map((credential) => (
        <CredentialCard key={credential.id} credential={credential} />
      ))}
    </div>
  );
}

function CredentialCard({ credential }: { credential: any }) {
  return (
    <Card className="overflow-hidden group">
      <div className="aspect-square relative bg-gradient-to-br from-primary/20 to-accent/20">
        {credential.image ? (
          <Image
            src={credential.image}
            alt={credential.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Shield className="h-16 w-16 text-primary/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Button variant="secondary" size="sm" asChild>
            <Link href={`/certificates/${credential.id}`}>
              View Certificate
            </Link>
          </Button>
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold truncate">{credential.name}</h3>
        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
          <Calendar className="h-3 w-3" />
          {credential.mintedAt ? formatDate(credential.mintedAt) : "Pending"}
        </p>
        {credential.verified && (
          <Badge variant="success" className="mt-2 gap-1">
            <Check className="h-3 w-3" />
            Verified
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

function AchievementsTab({ achievements }: { achievements: any[] }) {
  const unlocked = achievements.filter((a) => a.unlockedAt);
  const locked = achievements.filter((a) => !a.unlockedAt);

  return (
    <div className="space-y-8">
      {/* Unlocked */}
      <section>
        <h3 className="text-lg font-semibold mb-4">
          Unlocked ({unlocked.length})
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {unlocked.map((achievement) => (
            <Card key={achievement.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="text-4xl">{achievement.icon}</div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold">{achievement.title}</h4>
                  <p className="text-xs text-muted-foreground">
                    {achievement.description}
                  </p>
                  <Badge variant="secondary" className="mt-2 gap-1">
                    <Zap className="h-3 w-3" />
                    +{achievement.xpReward} XP
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Locked */}
      <section>
        <h3 className="text-lg font-semibold mb-4">
          Locked ({locked.length})
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {locked.map((achievement) => (
            <Card key={achievement.id} className="opacity-60">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="text-4xl grayscale">{achievement.icon}</div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold">{achievement.title}</h4>
                  <p className="text-xs text-muted-foreground">
                    {achievement.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Requirement: {achievement.requirement}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
