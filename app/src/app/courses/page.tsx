"use client";

import { CourseGrid } from "@/components/course/course-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCourses } from "@/hooks/use-courses";
import { useEnrollment } from "@/hooks/use-enrollment";
import { useUserStore } from "@/lib/store/user-store";
import type { Difficulty } from "@/types";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

const difficultyOptions: { value: Difficulty | undefined; label: string }[] = [
  { value: undefined, label: "All" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

export default function CoursesPage() {
  const t = useTranslations("Courses");
  const common = useTranslations("Common");
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty | undefined>();
  const { courses, loading } = useCourses(query, difficulty);
  const enrollments = useUserStore((state) => state.enrollments);
  const enrollment = useEnrollment();

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">{t("catalogTitle")}</h1>
        <p className="text-sm text-muted-foreground sm:text-base">{t("catalogSubtitle")}</p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground/70" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={common("search")}
            className="bg-secondary/50 pl-9"
          />
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-secondary/50 p-1">
          {difficultyOptions.map((opt) => (
            <Button
              key={opt.label}
              size="sm"
              variant={difficulty === opt.value ? "default" : "ghost"}
              className="text-xs"
              onClick={() => setDifficulty(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      <CourseGrid
        courses={courses}
        loading={loading}
        enrolledCourseIds={enrollments}
        pendingCourseId={enrollment.pendingCourseId ?? undefined}
        onEnroll={async (courseId) => {
          await enrollment.enrollInCourse(courseId);
        }}
      />

      {!loading && courses.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-secondary/50 px-6 py-10 text-center">
          <p className="text-base font-medium text-foreground/90">No courses matched your search</p>
          <p className="mt-1 text-sm text-muted-foreground">Try a different keyword.</p>
        </div>
      )}

      {enrollment.lastSignature && (
        <p className="text-xs text-st-yellow">Enrollment tx: {enrollment.lastSignature}</p>
      )}
    </div>
  );
}
