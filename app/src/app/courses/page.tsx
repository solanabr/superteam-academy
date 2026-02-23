"use client";

import { CourseGrid } from "@/components/course/course-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCourses } from "@/hooks/use-courses";
import { useEnrollment } from "@/hooks/use-enrollment";
import { useUserStore } from "@/lib/store/user-store";
import type { Course } from "@/types";
import { useWallet } from "@solana/wallet-adapter-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

export default function CoursesPage() {
  const t = useTranslations("Courses");
  const common = useTranslations("Common");
  const wallet = useWallet();
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState<Course["difficulty"] | undefined>();
  const { courses, loading } = useCourses(query, difficulty);
  const { enrollments } = useUserStore((state) => ({ enrollments: state.enrollments }));
  const enrollment = useEnrollment(wallet);

  const filters: Array<{ value?: Course["difficulty"]; label: string }> = useMemo(
    () => [
      { value: undefined, label: common("all") },
      { value: "beginner", label: common("beginner") },
      { value: "intermediate", label: common("intermediate") },
      { value: "advanced", label: common("advanced") },
    ],
    [common],
  );

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-3xl font-semibold text-zinc-100">{t("catalogTitle")}</h1>
        <p className="mt-2 text-zinc-400">{t("catalogSubtitle")}</p>
      </header>

      <section className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-4 rounded-xl border border-white/10 bg-zinc-900/65 p-4">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={common("search")}
            className="bg-zinc-950/60"
          />
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-zinc-500">{t("filterDifficulty")}</p>
            {filters.map((item) => (
              <Button
                key={item.label}
                variant={difficulty === item.value ? "default" : "outline"}
                className="w-full justify-start border-white/15 bg-transparent"
                onClick={() => setDifficulty(item.value)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </aside>

        <CourseGrid
          courses={courses}
          loading={loading}
          enrolledCourseIds={enrollments}
          pendingCourseId={enrollment.pendingCourseId ?? undefined}
          onEnroll={async (courseId) => {
            await enrollment.enrollInCourse(courseId);
          }}
        />
      </section>

      {enrollment.error ? (
        <p className="text-sm text-red-300">{enrollment.error}</p>
      ) : null}
      {enrollment.lastSignature ? (
        <p className="text-xs text-[#14F195]">Enrollment tx: {enrollment.lastSignature}</p>
      ) : null}
    </div>
  );
}
