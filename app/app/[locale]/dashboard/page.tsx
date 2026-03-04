"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useWallet } from "@/hooks/use-wallet";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight02Icon,
  Fire02Icon,
  Award01Icon,
  Blockchain01Icon,
  Clock01Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import {
  learningProgressService,
  courseService,
  onChainUserService,
} from "@/lib/services";
import { useTranslations } from "next-intl";

interface Course {
  slug: string;
  title: string;
  lessonCount: number;
}

interface Enrollment {
  courseSlug: string;
  completedLessons: number;
  totalLessons: number;
  isCompleted: boolean;
}

interface Credential {
  id: string;
  track: string;
  level: number;
  issuedAt: string;
}

export default function DashboardPage() {
  const { address, authenticated } = useWallet();
  const t = useTranslations();
  const locale = useLocale();
  const [mounted] = useState(true);
  const [xp, setXp] = useState({ total: 0, level: 1 });
  const [streak, setStreak] = useState({ current: 0, longest: 0, lastActiveDate: "" });
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mounted) return;

    async function loadData() {
      const coursesData = await courseService.getCourses();
      setCourses(coursesData);
      
      const shouldUseOnChain = Boolean(address && authenticated);
      
      if (shouldUseOnChain && address) {
        try {
          const [xpData, streakData, creds, enrollData] = await Promise.all([
            onChainUserService.getXpSummary(address),
            onChainUserService.getStreak(address),
            onChainUserService.getCredentials(address),
            onChainUserService.getEnrollments(address),
          ]);
          
          setXp(xpData);
          setStreak(streakData);
          setCredentials(creds);
          setEnrollments(enrollData);
        } catch (error) {
          console.error("Error fetching on-chain data:", error);
          const [fallbackXp, fallbackStreak, fallbackCreds, fallbackEnroll] = await Promise.all([
            learningProgressService.getXpSummary(),
            learningProgressService.getStreak(),
            learningProgressService.getCredentials(),
            learningProgressService.getEnrollments(),
          ]);
          setXp(fallbackXp);
          setStreak(fallbackStreak);
          setCredentials(fallbackCreds);
          setEnrollments(fallbackEnroll);
        }
      } else {
        const [fallbackXp, fallbackStreak, fallbackCreds, fallbackEnroll] = await Promise.all([
          learningProgressService.getXpSummary(),
          learningProgressService.getStreak(),
          learningProgressService.getCredentials(),
          learningProgressService.getEnrollments(),
        ]);
        setXp(fallbackXp);
        setStreak(fallbackStreak);
        setCredentials(fallbackCreds);
        setEnrollments(fallbackEnroll);
      }
      
      setLoading(false);
    }
    
    loadData();
  }, [mounted, address, authenticated]);

  if (!mounted || loading) {
    return (
      <div className="py-4">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {t("dashboard.heading")}
          </h1>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-4">
                <div className="h-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const courseMap = new Map(courses.map((c: Course) => [c.slug, c]));

  return (
    <div className="py-4">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {t("dashboard.heading")}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t("dashboard.description")}
        </p>
      </div>

      {/* Stats row */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="animate-fade-in">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <HugeiconsIcon icon={Blockchain01Icon} size={18} strokeWidth={2} color="currentColor" />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight text-foreground">
                  {xp.total.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">{t("dashboard.totalXp")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in" style={{ animationDelay: "60ms" }}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <HugeiconsIcon icon={Fire02Icon} size={18} strokeWidth={2} color="currentColor" />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight text-foreground">
                  {streak.current}
                </p>
                <p className="text-xs text-muted-foreground">{t("dashboard.dayStreak")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in" style={{ animationDelay: "120ms" }}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <HugeiconsIcon icon={Award01Icon} size={18} strokeWidth={2} color="currentColor" />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight text-foreground">
                  {credentials.length}
                </p>
                <p className="text-xs text-muted-foreground">{t("common.credentials", { count: credentials.length })}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in" style={{ animationDelay: "180ms" }}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <HugeiconsIcon icon={Clock01Icon} size={18} strokeWidth={2} color="currentColor" />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight text-foreground">
                  {t("common.level", { level: xp.level })}
                </p>
                <p className="text-xs text-muted-foreground">{t("dashboard.currentLevel")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Enrolled courses */}
        <div className="lg:col-span-2">
          <h2 className="mb-4 text-xl font-semibold tracking-tight text-foreground">
            {t("dashboard.enrolledCourses")}
          </h2>

          {enrollments.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  {t("dashboard.noEnrollments")}
                </p>
                <Link href={`/${locale}/courses`} className="mt-3 inline-block">
                  <Button size="sm">
                    {t("common.browseCourses")}
                    <HugeiconsIcon icon={ArrowRight02Icon} size={14} data-icon="inline-end" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {enrollments.map((enrollment, i) => {
                const course = courseMap.get(enrollment.courseSlug);
                if (!course) return null;
                const progress = Math.round(
                  (enrollment.completedLessons / enrollment.totalLessons) * 100
                );

                return (
                  <Link
                    key={enrollment.courseSlug}
                    href={`/${locale}/courses/${enrollment.courseSlug}`}
                    className="group"
                  >
                    <Card
                      className="animate-fade-in transition-colors hover:bg-muted/30"
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-foreground group-hover:text-primary">
                                {course.title}
                              </span>
                              {enrollment.isCompleted && (
                                <HugeiconsIcon
                                  icon={CheckmarkCircle02Icon}
                                  size={14}
                                  strokeWidth={2}
                                  className="text-primary"
                                  color="currentColor"
                                />
                              )}
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {t("dashboard.lessonsProgress", {
                                completed: enrollment.completedLessons,
                                total: enrollment.totalLessons,
                              })}
                            </p>
                          </div>

                          <div className="flex shrink-0 items-center gap-4">
                            {/* Progress bar */}
                            <div className="hidden w-32 sm:block">
                              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                  className="h-full rounded-full bg-primary transition-all"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">
                              {progress}%
                            </span>
                            <HugeiconsIcon
                              icon={ArrowRight02Icon}
                              size={14}
                              color="currentColor"
                              className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6">
          {/* Streak card */}
          <Card className="animate-fade-in" style={{ animationDelay: "100ms" }}>
            <CardHeader>
              <CardTitle className="text-base">{t("dashboard.streak")}</CardTitle>
              <CardDescription>{t("dashboard.keepMomentum")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight text-foreground">
                  {streak.current}
                </span>
                <span className="text-sm text-muted-foreground">{t("common.days")}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {t("dashboard.longestStreak", { days: streak.longest })}
              </p>
            </CardContent>
          </Card>

          {/* Credentials */}
          <Card className="animate-fade-in" style={{ animationDelay: "160ms" }}>
            <CardHeader>
              <CardTitle className="text-base">{t("common.credentials", { count: credentials.length })}</CardTitle>
              <CardDescription>{t("dashboard.onChainAchievements")}</CardDescription>
            </CardHeader>
            <CardContent>
              {credentials.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  {t("dashboard.completeFirst")}
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {credentials.map((cred) => (
                    <div
                      key={cred.id}
                      className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <HugeiconsIcon
                          icon={Award01Icon}
                          size={14}
                          strokeWidth={2}
                          className="text-primary"
                          color="currentColor"
                        />
                        <span className="text-sm text-foreground">
                          {cred.track}
                        </span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {t("dashboard.lvl", { level: cred.level })}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          <Link href={`/${locale}/courses`}>
            <Button variant="outline" size="lg" className="w-full">
              {t("common.browseMoreCourses")}
              <HugeiconsIcon icon={ArrowRight02Icon} size={14} data-icon="inline-end" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
