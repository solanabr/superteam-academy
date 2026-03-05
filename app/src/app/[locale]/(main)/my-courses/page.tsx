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
import { BookOpen } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { localize } from "@/data/courses-i18n";
import { SubpageProfile } from "@/components/subpage-profile";
import { courses as allCourses } from "@/data/courses";
import type { Course } from "@/data/courses";

function getEnrollmentKey(wallet: string, courseSlug: string) {
  return `st-academy:${wallet}:enrolled:${courseSlug}`;
}

function getLessonKey(wallet: string, courseSlug: string, lessonId: string) {
  return `st-academy:${wallet}:lesson:${courseSlug}:${lessonId}`;
}

const LEGACY_ENROLLMENT_PREFIX = "st-academy:enrolled:";

interface CourseProgress {
  course: Course;
  completed: number;
  total: number;
  pct: number;
  enrolled: boolean;
}

export default function MyCoursesPage() {
  const t = useTranslations("dashboard");
  const tCourses = useTranslations("courses");
  const locale = useLocale();
  const { publicKey } = useAuth();
  const walletAddr = publicKey?.toBase58() ?? "";
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!walletAddr) {
      setLoading(false);
      return;
    }

    try {
      const courses = allCourses;
      const results: CourseProgress[] = [];

      for (const course of courses) {
        // Check enrollment (wallet-scoped + legacy migration)
        let enrolled =
          localStorage.getItem(getEnrollmentKey(walletAddr, course.slug)) ===
          "true";
        if (
          !enrolled &&
          localStorage.getItem(`${LEGACY_ENROLLMENT_PREFIX}${course.slug}`) ===
            "true"
        ) {
          localStorage.setItem(
            getEnrollmentKey(walletAddr, course.slug),
            "true",
          );
          enrolled = true;
        }

        const allLessons = course.modules.flatMap((m) => m.lessons);
        const total = allLessons.length;
        let completed = 0;

        for (const lesson of allLessons) {
          const walletKey = getLessonKey(walletAddr, course.slug, lesson.id);
          const legacyKey = `st-academy:lesson:${course.slug}:${lesson.id}`;
          if (localStorage.getItem(walletKey) === "completed") {
            completed++;
          } else if (localStorage.getItem(legacyKey) === "completed") {
            localStorage.setItem(walletKey, "completed");
            completed++;
          }
        }

        // Only show enrolled courses or courses with any progress
        if (enrolled || completed > 0) {
          const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
          results.push({ course, completed, total, pct, enrolled });
        }
      }

      // Sort: in-progress first, then completed
      results.sort((a, b) => {
        if (a.pct >= 100 && b.pct < 100) return 1;
        if (a.pct < 100 && b.pct >= 100) return -1;
        return b.pct - a.pct;
      });

      setCourseProgress(results);
    } catch {
      // localStorage unavailable
    }
    setLoading(false);
  }, [walletAddr]);

  return (
    <div className="container py-8">
      <SubpageProfile />

      {loading ? (
        <div className="py-16 text-center">
          <div className="h-8 w-8 mx-auto animate-spin rounded-full border-4 border-muted border-t-[hsl(var(--brand-logo-green))]" />
        </div>
      ) : courseProgress.length === 0 ? (
        <div className="py-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <p className="mt-4 text-muted-foreground">{t("noCoursesYet")}</p>
          <Button
            asChild
            className="mt-4 card-button bg-blue-500 text-white hover:bg-blue-600 hover:text-white"
          >
            <Link href="/courses" className="text-white">
              {tCourses("exploreCatalog")}
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <h2 className="mb-4 text-center text-xl font-semibold text-[hsl(var(--brand-logo-green))] drop-shadow-md">
            {t("myCoursesPageTitle")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courseProgress.map(({ course, completed, total, pct }) => (
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
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{pct}%</span>
                      <span>
                        {completed}/{total}
                      </span>
                    </div>
                  </div>
                  <Button
                    asChild
                    size="sm"
                    className="w-full card-button bg-blue-500 text-white hover:bg-blue-600 hover:text-white"
                  >
                    <Link
                      href={`/courses/${course.slug}`}
                      className="text-white"
                    >
                      {tCourses("startCourse")}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
