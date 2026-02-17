"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  Award,
  CheckCircle2,
  ExternalLink,
  Flame,
  Github,
  Globe,
  Linkedin,
  Trophy,
  Twitter,
  Zap,
} from "lucide-react";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import type { Course } from "@/lib/course-catalog";
import type { IdentitySnapshot } from "@/lib/identity/types";
import { ActivityHeatmap } from "@/components/activity-heatmap";

type SkillMap = {
  rust: number;
  anchor: number;
  frontend: number;
  security: number;
  defi: number;
  testing: number;
};

type ProfileUser = {
  id: string;
  name: string;
  username: string;
  bio: string;
  joinDate: string;
  avatar: string;
  level: number;
  xp: number;
  xpToNext: number;
  streak: number;
  rank: number;
  totalCompleted: number;
  socialLinks?: {
    github?: string;
    twitter?: string;
    linkedin?: string;
    website?: string;
  };
  skills: SkillMap;
  achievements: Array<{ id: string; name: string; earned: boolean }>;
  onChainCredentials: Array<{
    id: string;
    name: string;
    mintAddress: string;
    date: string;
  }>;
  completedCourses: Course[];
};

const chartConfig = {
  value: {
    label: "Skill Score",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

const EMPTY_SKILLS: SkillMap = {
  rust: 0,
  anchor: 0,
  frontend: 0,
  security: 0,
  defi: 0,
  testing: 0,
};

function buildProfileUser(
  identity: IdentitySnapshot | undefined,
  completedCourses: Course[],
): ProfileUser | null {
  const profile = identity?.profile;
  if (!profile) return null;
  return {
    id: profile.userId,
    name: profile.name,
    username: profile.username,
    bio: profile.bio,
    joinDate: profile.joinDate,
    avatar: profile.walletAddress.slice(0, 2).toUpperCase(),
    level: profile.level,
    xp: profile.xp,
    xpToNext: profile.xpToNext,
    streak: profile.streak,
    rank: profile.rank,
    totalCompleted: profile.totalCompleted,
    socialLinks: undefined,
    skills: EMPTY_SKILLS,
    achievements: profile.badges.map((b, i) => ({
      id: `${i}-${b.name}`,
      name: b.name,
      earned: b.earned,
    })),
    onChainCredentials: profile.certificates.map((c) => ({
      id: c.id,
      name: c.course,
      mintAddress: c.mintAddress,
      date: c.date,
    })),
    completedCourses,
  };
}

function shortAddress(mint: string): string {
  if (mint.length <= 12) return mint;
  return `${mint.slice(0, 4)}...${mint.slice(-4)}`;
}

export default function ProfilePageComponent({
  username: usernameParam,
  identity,
  activityDays = [],
  completedCourses = [],
}: {
  username?: string;
  identity?: IdentitySnapshot;
  activityDays?: Array<{ date: string; intensity: number; count?: number }>;
  completedCourses?: Course[];
}) {
  const user = useMemo(
    () => buildProfileUser(identity, completedCourses),
    [identity, completedCourses],
  );
  if (usernameParam != null && user && user.username !== usernameParam) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 lg:px-6">
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            User not found.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 lg:px-6">
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            User not found.
          </CardContent>
        </Card>
      </div>
    );
  }

  const skillRows = [
    { label: "Rust", value: user.skills.rust },
    { label: "Anchor", value: user.skills.anchor },
    { label: "Frontend", value: user.skills.frontend },
    { label: "Security", value: user.skills.security },
    { label: "DeFi", value: user.skills.defi },
    { label: "Testing", value: user.skills.testing },
  ];

  const chartData = skillRows.map((row) => ({
    skill: row.label,
    value: row.value,
  }));
  const xpProgress = Math.min(100, Math.round((user.xp / user.xpToNext) * 100));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6 lg:py-10">
      <Card className="overflow-hidden border-primary/20 bg-card">
        <div className="h-24 bg-gradient-to-r from-primary/25 via-primary/10 to-transparent" />
        <CardContent className="-mt-10 pb-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <Avatar className="h-20 w-20 border-4 border-background bg-primary/20">
                <AvatarFallback className="text-xl font-semibold text-primary">
                  {typeof user.avatar === "string" && user.avatar.length >= 2
                    ? user.avatar.slice(0, 2)
                    : user.name.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold text-foreground">
                    {user.name}
                  </h1>
                  <Badge
                    variant="outline"
                    className="border-border text-muted-foreground"
                  >
                    @{user.username}
                  </Badge>
                  <Badge className="bg-primary/15 text-primary hover:bg-primary/15">
                    Rank #{user.rank}
                  </Badge>
                </div>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  {user.bio}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <SocialLink
                    href={
                      user.socialLinks?.twitter
                        ? `https://x.com/${user.socialLinks.twitter}`
                        : null
                    }
                    label="Twitter"
                    icon={Twitter}
                  />
                  <SocialLink
                    href={
                      user.socialLinks?.github
                        ? `https://github.com/${user.socialLinks.github}`
                        : null
                    }
                    label="GitHub"
                    icon={Github}
                  />
                  <SocialLink
                    href={
                      user.socialLinks?.linkedin
                        ? `https://linkedin.com/in/${user.socialLinks.linkedin}`
                        : null
                    }
                    label="LinkedIn"
                    icon={Linkedin}
                  />
                  <SocialLink
                    href={
                      user.socialLinks?.website
                        ? `https://${user.socialLinks.website.replace(/^https?:\/\//, "")}`
                        : null
                    }
                    label="Website"
                    icon={Globe}
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="border-border text-foreground"
              >
                Share Profile
              </Button>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Edit Profile
              </Button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatPill
              icon={Trophy}
              label="Global Rank"
              value={`#${user.rank}`}
            />
            <StatPill
              icon={Zap}
              label="Total XP"
              value={user.xp.toLocaleString()}
            />
            <StatPill
              icon={Flame}
              label="Current Streak"
              value={`${user.streak} days`}
            />
            <StatPill
              icon={CheckCircle2}
              label="Courses Completed"
              value={`${user.totalCompleted}`}
            />
          </div>

          <div className="mt-4 rounded-lg border border-border bg-background/40 p-3">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Level {user.level} progress
              </span>
              <span className="font-medium text-foreground">
                {user.xp.toLocaleString()} / {user.xpToNext.toLocaleString()} XP
              </span>
            </div>
            <Progress
              value={xpProgress}
              className="h-2 bg-secondary [&>div]:bg-primary"
            />
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Activity
            </h2>
            <ActivityHeatmap activityDays={activityDays} />
          </section>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Completed Courses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {user.completedCourses.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No completed courses yet.
                </p>
              ) : (
                user.completedCourses.map((course) => (
                  <div
                    key={course.slug}
                    className="rounded-lg border border-border bg-background/40 p-3 transition-colors hover:border-primary/30"
                  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-foreground">
                          {course.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {course.instructor}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="border-border text-muted-foreground"
                      >
                        {course.difficulty}
                      </Badge>
                    </div>
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium text-primary">
                        {course.progress}%
                      </span>
                    </div>
                    <Progress
                      value={course.progress}
                      className="h-1.5 bg-secondary [&>div]:bg-primary"
                    />
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{course.duration}</span>
                      <span>{course.xp} XP</span>
                    </div>
                  </div>
                ))
              )}
              <Link
                href="/courses"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                Browse all courses <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={chartConfig}
                className="mx-auto h-52 w-full"
              >
                <RadarChart data={chartData}>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent />}
                  />
                  <PolarGrid />
                  <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11 }} />
                  <Radar
                    dataKey="value"
                    stroke="var(--color-value)"
                    fill="var(--color-value)"
                    fillOpacity={0.55}
                  />
                </RadarChart>
              </ChartContainer>
              <div className="mt-3 space-y-2">
                {skillRows.map((skill) => (
                  <div key={skill.label}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {skill.label}
                      </span>
                      <span className="font-medium text-foreground">
                        {skill.value}%
                      </span>
                    </div>
                    <Progress
                      value={skill.value}
                      className="h-1.5 bg-secondary [&>div]:bg-primary"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Achievements</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {user.achievements.map((achievement) => (
                <Badge
                  key={achievement.id}
                  variant={achievement.earned ? "default" : "outline"}
                  className={
                    achievement.earned
                      ? "bg-primary/15 text-primary hover:bg-primary/15"
                      : ""
                  }
                >
                  <Award className="mr-1 h-3 w-3" />
                  {achievement.name}
                </Badge>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">On-Chain Credentials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {user.onChainCredentials.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No credentials issued yet.
                </p>
              ) : (
                user.onChainCredentials.map((credential) => (
                  <div
                    key={credential.id}
                    className="rounded-lg border border-border bg-background/40 p-3"
                  >
                    <p className="font-medium text-foreground">
                      {credential.name}
                    </p>
                    <div className="mt-1 space-y-1 text-xs text-muted-foreground">
                      <p>Mint: {shortAddress(credential.mintAddress)}</p>
                      <p>Issued: {credential.date}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 h-7 px-2 text-primary"
                    >
                      Verify
                      <ExternalLink className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Profile Visibility</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Public Profile
                </p>
                <p className="text-xs text-muted-foreground">
                  Joined {user.joinDate}
                </p>
              </div>
              <Badge
                variant="outline"
                className="border-primary/30 text-primary"
              >
                Public
              </Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SocialLink({
  href,
  label,
  icon: Icon,
}: {
  href: string | null;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex">
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 border-border text-foreground"
      >
        <Icon className="h-3.5 w-3.5" />
        {label}
      </Button>
    </a>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-background/40 px-3 py-2.5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
