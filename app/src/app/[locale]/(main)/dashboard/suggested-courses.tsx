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
import type { Course } from "@/data/courses";
import { localize } from "@/data/courses-i18n";

interface SuggestedCoursesProps {
  courses: Course[];
}

export function SuggestedCourses({ courses }: SuggestedCoursesProps) {
  const t = useTranslations("dashboard");
  const tCourses = useTranslations("courses");
  const locale = useLocale();
  const [suggested, setSuggested] = useState<Course[]>([]);

  useEffect(() => {
    try {
      const notStarted = courses.filter((course) => {
        const allLessons = course.modules.flatMap((m) => m.lessons);
        return !allLessons.some(
          (lesson) =>
            localStorage.getItem(
              `st-academy:lesson:${course.slug}:${lesson.id}`,
            ) === "completed",
        );
      });
      // Shuffle and pick 3
      const shuffled = notStarted.sort(() => Math.random() - 0.5);
      setSuggested(shuffled.slice(0, 3));
    } catch {
      setSuggested(courses.slice(0, 3));
    }
  }, [courses]);

  if (suggested.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="mb-1 text-center text-xl font-semibold text-[hsl(var(--brand-logo-green))] drop-shadow-md">
        {t("suggestedCourses")}
      </h2>
      <p className="mb-4 text-center text-sm text-muted-foreground">
        {t("suggestedCoursesDesc")}
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {suggested.map((course) => (
          <Link
            key={course.id}
            href={`/courses/${course.slug}`}
            className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Card className="h-full overflow-hidden transition-all hover:border-primary/50 hover:shadow-md">
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
              <CardContent>
                <Button
                  asChild
                  size="sm"
                  className="w-full card-button bg-blue-500 text-white hover:bg-blue-600 hover:text-white"
                >
                  <span>{tCourses("startCourse")}</span>
                </Button>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      <div className="mt-4 text-center">
        <Link
          href="/courses"
          className="text-sm font-medium text-sky-600 hover:underline"
        >
          {t("viewAll")} →
        </Link>
      </div>
    </section>
  );
}
