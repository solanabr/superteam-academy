import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StreakCalendar } from "@/components/gamification/streak-calendar";
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
} from "@/lib/services";
import { getTranslations, getLocale } from "next-intl/server";

export default async function DashboardPage() {
  const [xp, streak, credentials, enrollments, courses] = await Promise.all([
    learningProgressService.getXpSummary(),
    learningProgressService.getStreak(),
    learningProgressService.getCredentials(),
    learningProgressService.getEnrollments(),
    courseService.getCourses(),
  ]);

  const t = await getTranslations();
  const locale = await getLocale();
  const courseMap = new Map(courses.map((c) => [c.slug, c]));

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
      {/* Achievements */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border border-border rounded-xl p-6 bg-card md:col-span-2">
          <h2 className="font-bold mb-4">🏅 Achievements</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: "⚡", name: "First Steps", desc: "Completed first lesson", earned: true },
              { icon: "🔥", name: "Week Warrior", desc: "7-day streak", earned: true },
              { icon: "🦀", name: "Rust Rookie", desc: "First Rust program", earned: false },
              { icon: "🏗️", name: "Builder", desc: "Deployed to Devnet", earned: false },
              { icon: "🌟", name: "Early Adopter", desc: "Joined at launch", earned: true },
              { icon: "👑", name: "Consistency King", desc: "30-day streak", earned: false },
            ].map(a => (
              <div key={a.name} className={"flex items-center gap-3 p-3 rounded-lg border " + (a.earned ? "border-primary/30 bg-primary/5" : "border-border opacity-40")}>
                <span className="text-2xl">{a.icon}</span>
                <div><div className="text-sm font-medium">{a.name}</div><div className="text-xs text-muted-foreground">{a.desc}</div></div>
                {a.earned && <span className="ml-auto text-xs text-primary font-bold">✓</span>}
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="border border-border rounded-xl p-6 bg-card">
            <h2 className="font-bold mb-4">📅 Streak</h2>
            <StreakCalendar />
          </div>
          <div className="border border-yellow-500/30 rounded-xl p-6 bg-yellow-500/5">
            <h2 className="font-bold mb-2">⚡ Daily Challenge</h2>
            <p className="text-sm text-muted-foreground mb-3">Write a Solana transfer instruction from scratch</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-yellow-400 font-bold">+50 XP</span>
              <a href="./courses/solana-fundamentals/lessons/3" className="text-xs bg-yellow-500 text-black px-3 py-1 rounded-full font-bold hover:bg-yellow-400 transition-colors">Start →</a>
            </div>
          </div>
        </div>
      </div>
      {/* Recommended courses */}
      <div className="mt-6 border border-border rounded-xl p-6 bg-card">
        <h2 className="font-bold mb-4">🎯 Recommended Next</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: "Anchor Development", xp: 2000, level: "Intermediate", emoji: "⚓" },
            { title: "DeFi on Solana", xp: 3000, level: "Advanced", emoji: "💱" },
            { title: "NFT Programs", xp: 1500, level: "Intermediate", emoji: "🎨" },
          ].map(c => (
            <div key={c.title} className="border border-border rounded-lg p-4 hover:border-primary/40 transition-all cursor-pointer">
              <div className="text-2xl mb-2">{c.emoji}</div>
              <div className="font-semibold text-sm">{c.title}</div>
              <div className="text-xs text-muted-foreground mt-1">{c.level} · {c.xp} XP</div>
            </div>
          ))}
        </div>
      </div>
  );
}
