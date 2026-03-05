"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight02Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import type { Course } from "@/lib/services";
import { levelBadgeClasses } from "@/lib/utils";

const filters = ["All", "Beginner", "Intermediate", "Advanced"] as const;
type Filter = (typeof filters)[number];

const filterKeys: Record<Filter, string> = {
  All: "filterAll",
  Beginner: "filterBeginner",
  Intermediate: "filterIntermediate",
  Advanced: "filterAdvanced",
};

export function CourseGrid({ courses }: { courses: Course[] }) {
  const [active, setActive] = useState<Filter>("All");
  const t = useTranslations();
  const locale = useLocale();
  const filtered =
    active === "All"
      ? courses
      : courses.filter((c) => c.level === active);

  return (
    <>
      {/* Filter bar */}
      <div className="mb-6 flex items-center gap-2">
        {filters.map((f) => (
          <button key={f} onClick={() => setActive(f)}>
            <Badge
              variant="outline"
              className={
                active === f
                  ? f === "All"
                    ? "border-primary bg-primary text-primary-foreground"
                    : `border-transparent ${levelBadgeClasses(f)}`
                  : "cursor-pointer"
              }
            >
              {t(`courses.${filterKeys[f]}`)}
            </Badge>
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((course, i) => (
          <Card
            key={course.slug}
            className="animate-fade-in flex flex-col"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <CardHeader className="flex-1">
              <CardTitle>{course.title}</CardTitle>
              <CardDescription className="line-clamp-2">
                {course.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={`border-transparent ${levelBadgeClasses(course.level)}`}
                >
                  {course.level}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {t("common.lessons", { count: course.lessonCount })}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t("common.xp", { amount: course.totalXp.toLocaleString() })}
                </span>
              </div>
            </CardContent>
            <CardFooter>
              <Link href={`/${locale}/courses/${course.slug}`} className="w-full">
                <Button variant="outline" size="lg" className="w-full">
                  {t("common.viewCourse")}
                  <HugeiconsIcon
                    icon={ArrowRight02Icon}
                    size={14}
                    data-icon="inline-end"
                  />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          {t("courses.noCoursesMatch")}
        </p>
      )}
    </>
  );
}
