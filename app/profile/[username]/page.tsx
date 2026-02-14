"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Award, ExternalLink, Flame, Globe, Trophy, Zap, MapPin, Calendar, BookOpen } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkillRadar } from "@/components/shared/SkillRadar";
import { levelProgress } from "@/lib/gamification/levels";
import { useI18n } from "@/lib/i18n/provider";
import type { CmsCourse } from "@/lib/cms/types";

type ProfilePageProps = {
  params: {
    username: string;
  };
};

const demoXP = 4350;
const demoStreak = 16;
const demoBio = "Solana developer building the future of decentralized education. Superteam Brazil contributor.";
const demoJoined = "Nov 2025";
const demoLocation = "São Paulo, BR";

const credentials = [
  {
    title: "Solana Foundations",
    type: "Course Completion",
    date: "Dec 2025",
    explorerUrl: "#",
  },
  {
    title: "Anchor Development",
    type: "Course Completion",
    date: "Jan 2026",
    explorerUrl: "#",
  },
  {
    title: "Challenge Master",
    type: "Achievement",
    date: "Jan 2026",
    explorerUrl: "#",
  },
];

const completedSlugs = new Set(["solana-foundations", "anchor-development"]);

export default function ProfilePage({ params }: ProfilePageProps): JSX.Element {
  const { t } = useI18n();
  const [courses, setCourses] = useState<CmsCourse[]>([]);
  const progress = levelProgress(demoXP);

  useEffect(() => {
    const run = async () => {
      const response = await fetch("/api/courses");
      const json = (await response.json()) as { courses: CmsCourse[] };
      setCourses(json.courses);
    };
    void run();
  }, []);

  const skills = [
    { label: "Solana", value: 84 },
    { label: "Anchor", value: 78 },
    { label: "TypeScript", value: 82 },
    { label: "Rust", value: 64 },
    { label: "Testing", value: 71 },
    { label: "Security", value: 69 },
  ];

  const initials = params.username.replace(/[._-]/g, " ").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

  const statItems = [
    { icon: Zap, label: "XP", value: demoXP.toLocaleString(), color: "text-solana-green" },
    { icon: Trophy, label: t("common.level"), value: progress.level.toString(), color: "text-solana-purple" },
    { icon: Flame, label: t("common.streak"), value: `${demoStreak}d`, color: "text-orange-400" },
    { icon: Award, label: "Credentials", value: credentials.length.toString(), color: "text-amber-400" },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-10">
      {/* Profile header */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-24 solana-gradient opacity-10" />
        <CardContent className="relative pt-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            {/* Avatar */}
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-background bg-solana-purple/20 text-2xl font-bold text-solana-purple shadow-lg">
              {initials}
            </div>

            {/* Info */}
            <div className="flex-1 space-y-3">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-bold">@{params.username}</h1>
                  <span className="inline-flex items-center gap-1 rounded-full border border-solana-purple/30 bg-solana-purple/10 px-3 py-0.5 text-xs font-medium text-solana-purple">
                    {t("common.level")} {progress.level}
                  </span>
                </div>
                <p className="mt-1 max-w-lg text-sm text-muted-foreground">{demoBio}</p>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {demoLocation}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Joined {demoJoined}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  en, pt-br
                </span>
              </div>
            </div>
          </div>

          {/* Stat pills */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {statItems.map((stat) => (
              <div key={stat.label} className="flex items-center gap-2.5 rounded-lg border p-3">
                <stat.icon className={`h-4 w-4 shrink-0 ${stat.color}`} />
                <div>
                  <p className="text-lg font-bold tabular-nums leading-tight">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Skills + Credentials row */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-solana-purple" />
              {t("profile.skills")}
            </CardTitle>
            <CardDescription>Based on completed lessons and challenges</CardDescription>
          </CardHeader>
          <CardContent>
            <SkillRadar values={skills} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="h-5 w-5 text-amber-400" />
              {t("profile.credentials")}
            </CardTitle>
            <CardDescription>On-chain credentials on Solana Devnet</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {credentials.map((cred) => (
              <div
                key={cred.title}
                className="flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:border-solana-purple/30"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-solana-green/10">
                    <Award className="h-4 w-4 text-solana-green" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{cred.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {cred.type} &middot; {cred.date}
                    </p>
                  </div>
                </div>
                <Button asChild size="sm" variant="outline" className="shrink-0 h-8 px-2.5">
                  <Link href={cred.explorerUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* Completed courses */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-solana-green" />
            {t("profile.completedCourses")}
          </CardTitle>
          <CardDescription>
            {courses.filter((c) => completedSlugs.has(c.slug)).length} of {courses.length} courses completed
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {courses.map((course) => {
            const completed = completedSlugs.has(course.slug);
            const lessonCount = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
            const diffColor =
              course.difficulty === "beginner"
                ? "bg-emerald-500/10 text-emerald-500"
                : course.difficulty === "intermediate"
                  ? "bg-amber-500/10 text-amber-500"
                  : "bg-red-500/10 text-red-500";

            return (
              <Link
                key={course.slug}
                href={`/courses/${course.slug}`}
                className={`group rounded-lg border p-4 transition-all hover:shadow-md ${
                  completed
                    ? "border-solana-green/30 bg-solana-green/5 hover:border-solana-green/50"
                    : "opacity-50 hover:opacity-70"
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${diffColor}`}>
                    {course.difficulty}
                  </span>
                  {completed && (
                    <span className="text-xs font-medium text-solana-green">{"\u2713"} Done</span>
                  )}
                </div>
                <p className="font-medium text-sm group-hover:text-solana-purple transition-colors">{course.title}</p>
                <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span>{lessonCount} lessons</span>
                  <span className="text-solana-green">{course.xpReward} XP</span>
                </div>
                {/* Progress bar */}
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-solana-green transition-all"
                    style={{ width: completed ? "100%" : "0%" }}
                  />
                </div>
              </Link>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
