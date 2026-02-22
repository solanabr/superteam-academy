"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/course/course-card";
import { createClient } from "@/lib/supabase/client";
import type { Course } from "@/lib/sanity/types";

type Difficulty = "beginner" | "intermediate" | "advanced";
export type CourseStatus = "enrolled" | "completed";

interface CourseCatalogClientProps {
  courses: Course[];
}

/** v9 difficulty filter pill styles — active filled, inactive ghost with border token */
const difficultyFilterStyles = {
  beginner: {
    active:
      "bg-primary border-primary-dark text-white shadow-[0_2px_0_0_var(--primary-dark)]",
    inactive:
      "border-border text-text-3 hover:[background:var(--primary-bg)] hover:border-primary hover:text-primary",
  },
  intermediate: {
    active: "bg-xp border-xp-dark text-white shadow-[0_2px_0_0_var(--xp-dark)]",
    inactive:
      "border-border text-text-3 hover:[background:var(--xp-dim)] hover:border-xp hover:text-xp",
  },
  advanced: {
    active:
      "bg-streak border-streak text-white shadow-[0_2px_0_0_var(--streak)]",
    inactive:
      "border-border text-text-3 hover:[background:var(--streak-light)] hover:border-streak hover:text-streak",
  },
} as const;

function useCourseStatuses() {
  const [statuses, setStatuses] = useState<Map<string, CourseStatus>>(
    new Map()
  );

  useEffect(() => {
    async function fetchStatuses() {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return;

      const [{ data: enrollments }, { data: certificates }] = await Promise.all(
        [
          supabase
            .from("enrollments")
            .select("course_id")
            .eq("user_id", session.user.id),
          supabase
            .from("certificates")
            .select("course_id")
            .eq("user_id", session.user.id),
        ]
      );

      const map = new Map<string, CourseStatus>();

      // Enrolled courses first
      for (const row of enrollments ?? []) {
        map.set(row.course_id, "enrolled");
      }

      // Completed courses override enrolled
      for (const row of certificates ?? []) {
        map.set(row.course_id, "completed");
      }

      setStatuses(map);
    }

    fetchStatuses();
  }, []);

  return statuses;
}

export function CourseCatalogClient({ courses }: CourseCatalogClientProps) {
  const t = useTranslations("courses");
  const tCommon = useTranslations("common");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDifficulty, setActiveDifficulty] = useState<Difficulty | null>(
    null
  );
  const courseStatuses = useCourseStatuses();

  const difficulties: Difficulty[] = ["beginner", "intermediate", "advanced"];

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      !searchQuery ||
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty =
      !activeDifficulty || course.difficulty === activeDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-black tracking-[-0.5px]">
          {t("catalog")}
        </h1>
        <p className="mt-1 text-text-3">{t("catalogSubtitle")}</p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <MagnifyingGlass
            size={18}
            weight="bold"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3"
          />
          <input
            type="text"
            placeholder={tCommon("search") + "..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-md border-[2.5px] border-border bg-card pl-10 pr-4 font-body text-sm text-text outline-none transition-all duration-150 placeholder:text-text-3 focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-dim)]"
            aria-label={tCommon("search")}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-3 hover:text-text"
              aria-label={tCommon("close")}
            >
              <X size={16} weight="bold" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {difficulties.map((diff) => (
            <button
              key={diff}
              onClick={() =>
                setActiveDifficulty(activeDifficulty === diff ? null : diff)
              }
              className={`rounded-full border-[2.5px] px-4 py-1.5 font-display text-sm font-bold transition-colors ${
                activeDifficulty === diff
                  ? difficultyFilterStyles[diff].active
                  : difficultyFilterStyles[diff].inactive
              }`}
            >
              {t(diff)}
            </button>
          ))}
          {activeDifficulty && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveDifficulty(null)}
            >
              <X size={14} weight="bold" className="mr-1" />
              {tCommon("close")}
            </Button>
          )}
        </div>
      </div>

      {/* Course Grid */}
      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course, idx) => (
            <CourseCard
              key={course._id}
              slug={course.slug}
              title={course.title}
              description={course.description}
              difficulty={course.difficulty}
              duration={course.duration}
              lessonCount={course.modules?.reduce(
                (sum, m) => sum + (m.lessons?.length ?? 0),
                0
              )}
              xpReward={course.xpReward}
              instructorName={course.instructor?.name}
              status={courseStatuses.get(course._id)}
              courseNum={idx + 1}
            />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-subtle">
            <MagnifyingGlass
              size={32}
              weight="duotone"
              className="text-text-3"
            />
          </div>
          <p className="text-text-3">{t("noResults")}</p>
        </div>
      )}
    </div>
  );
}
