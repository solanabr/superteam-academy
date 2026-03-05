"use client";

import { useEffect, useState } from "react";
import { RemoteImage } from "@/components/remote-image";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { localize } from "@/data/courses-i18n";
import type { Course } from "@/data/courses";

interface DashboardCoursesProps {
  courses: Course[];
}

export function DashboardCourses({ courses }: DashboardCoursesProps) {
  const t = useTranslations("dashboard");
  const tCourses = useTranslations("courses");
  const locale = useLocale();
  const { publicKey } = useAuth();
  const walletAddr = publicKey?.toBase58() ?? "";
  const [progressMap, setProgressMap] = useState<
    Record<string, { completed: number; total: number }>
  >({});

  useEffect(() => {
    if (!walletAddr) return;
    try {
      const map: Record<string, { completed: number; total: number }> = {};
      for (const course of courses) {
        const allLessons = course.modules.flatMap((m) => m.lessons);
        const total = allLessons.length;
        let completed = 0;
        for (const lesson of allLessons) {
          const walletKey = `st-academy:${walletAddr}:lesson:${course.slug}:${lesson.id}`;
          const legacyKey = `st-academy:lesson:${course.slug}:${lesson.id}`;
          if (localStorage.getItem(walletKey) === "completed") {
            completed++;
          } else if (localStorage.getItem(legacyKey) === "completed") {
            localStorage.setItem(walletKey, "completed");
            completed++;
          }
        }
        map[course.slug] = { completed, total };
      }
      setProgressMap(map);
    } catch {
      // localStorage unavailable
    }
  }, [courses, walletAddr]);

  return (
    <section className="mb-8">
      <h2 className="mb-1 text-center text-xl font-semibold text-[hsl(var(--brand-logo-green))] drop-shadow-md">
        {t("myCourses")}
      </h2>
      <p className="mb-4 text-center text-sm text-muted-foreground">
        {t("myCoursesDesc")}
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.slice(0, 3).map((course) => {
          const p = progressMap[course.slug];
          const pct =
            p && p.total > 0 ? Math.round((p.completed / p.total) * 100) : 0;
          return (
            <Card
              key={course.id}
              className="h-full overflow-hidden transition-all hover:border-primary/50 hover:shadow-md"
            >
              <div className="relative h-36 w-full shrink-0 overflow-hidden bg-muted">
                <RemoteImage src={course.thumbnail} alt={course.title} />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {localize(locale, course.slug, "title", course.title)}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {localize(
                    locale,
                    course.slug,
                    "description",
                    course.description,
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Progress value={pct} className="h-2" />
                  <p className="text-xs text-muted-foreground">{pct}%</p>
                </div>
                <Button
                  asChild
                  size="sm"
                  className="w-full card-button bg-blue-500 text-white hover:bg-blue-600 hover:text-white"
                >
                  <Link href={`/courses/${course.slug}`} className="text-white">
                    {tCourses("startCourse")}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <div className="mt-4 text-center">
        <Link
          href="/my-courses"
          className="text-sm font-medium text-sky-600 hover:underline"
        >
          {t("viewAll")} →
        </Link>
      </div>
    </section>
  );
}
