"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XPBar } from "@/components/gamification/XPBar";
import { LevelBadge } from "@/components/gamification/LevelBadge";
import { StreakCalendar } from "@/components/gamification/StreakCalendar";
import { AchievementGrid } from "@/components/gamification/AchievementGrid";
import { levelProgress } from "@/lib/gamification/levels";
import { achievements, unlockedAchievements } from "@/lib/gamification/achievements";
import { useI18n } from "@/lib/i18n/provider";
import type { CmsCourse } from "@/lib/cms/types";

export default function DashboardPage(): JSX.Element {
  const { t } = useI18n();
  const xp = 760;
  const progress = levelProgress(xp);
  const [currentCourses, setCurrentCourses] = useState<CmsCourse[]>([]);
  const unlocked = unlockedAchievements([achievements[0].id, achievements[2].id]);

  useEffect(() => {
    const run = async () => {
      const response = await fetch("/api/courses");
      const json = (await response.json()) as { courses: CmsCourse[] };
      setCurrentCourses(json.courses.slice(0, 2));
    };
    void run();
  }, []);

  const activeDays = Array.from({ length: 10 }).map((_, index) => {
    const d = new Date();
    d.setDate(d.getDate() - index);
    return d.toISOString().slice(0, 10);
  });

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-10">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold">{t("dashboard.title")}</h1>
        <p className="text-muted-foreground">{t("dashboard.subtitle")}</p>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {t("common.xp")}: {xp}
            </CardTitle>
            <CardDescription>
              {progress.currentLevelXP} / {progress.nextLevelXP}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <LevelBadge level={progress.level} />
            <XPBar value={progress.progressPercent} max={100} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.streakCalendar")}</CardTitle>
            <CardDescription>{t("common.streak")}: 10</CardDescription>
          </CardHeader>
          <CardContent>
            <StreakCalendar activeDays={activeDays} />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.currentCourses")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {currentCourses.map((course) => (
              <div key={course.slug} className="rounded-md border p-3">
                <p className="font-medium">{course.title}</p>
                <p className="text-sm text-muted-foreground">
                  {course.modules.reduce((sum, module) => sum + module.lessons.length, 0)} {t("common.lessons")}
                </p>
                <Button asChild size="sm" className="mt-2">
                  <Link href={`/courses/${course.slug}`}>{t("common.continue")}</Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.achievements")}</CardTitle>
          </CardHeader>
          <CardContent>
            <AchievementGrid items={unlocked} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
