"use client";

import { CourseGrid } from "@/components/course/course-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCourses } from "@/hooks/use-courses";
import { useEnrollment } from "@/hooks/use-enrollment";
import { mockCourses } from "@/lib/data/mock-courses";
import { useUserStore } from "@/lib/store/user-store";
import type { Course } from "@/types";
import { useWallet } from "@solana/wallet-adapter-react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

const learningPaths = [
  { title: "Solana Developer", summary: "Account model to production clients", count: "3 courses" },
  { title: "DeFi Engineer", summary: "AMM math + protocol risk controls", count: "2 courses" },
  { title: "Security Specialist", summary: "Threat models and exploit simulations", count: "2 courses" },
] as const;

export default function CoursesPage() {
  const t = useTranslations("Courses");
  const common = useTranslations("Common");
  const wallet = useWallet();
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState<Course["difficulty"] | undefined>();
  const [category, setCategory] = useState("All");
  const { courses, loading } = useCourses(query, difficulty);
  const { enrollments } = useUserStore((state) => ({ enrollments: state.enrollments }));
  const enrollment = useEnrollment(wallet);

  const categories = useMemo(() => {
    const tags = Array.from(new Set(mockCourses.flatMap((course) => course.tags)));
    return ["All", ...tags.sort((a, b) => a.localeCompare(b))];
  }, []);

  const filters: Array<{ value?: Course["difficulty"]; label: string }> = useMemo(
    () => [
      { value: undefined, label: common("all") },
      { value: "beginner", label: common("beginner") },
      { value: "intermediate", label: common("intermediate") },
      { value: "advanced", label: common("advanced") },
    ],
    [common],
  );

  const filteredCourses = useMemo(() => {
    if (category === "All") {
      return courses;
    }
    return courses.filter((course) => course.tags.some((tag) => tag.toLowerCase() === category.toLowerCase()));
  }, [category, courses]);

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-zinc-100">{t("catalogTitle")}</h1>
        <p className="text-zinc-400">{t("catalogSubtitle")}</p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-zinc-900/70 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Learning paths</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {learningPaths.map((path) => (
            <article key={path.title} className="rounded-xl border border-white/10 bg-zinc-950/70 p-3">
              <p className="text-sm font-semibold text-zinc-100">{path.title}</p>
              <p className="mt-1 text-sm text-zinc-400">{path.summary}</p>
              <Badge variant="outline" className="mt-2 border-white/20 text-zinc-300">
                {path.count}
              </Badge>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-4 rounded-xl border border-white/10 bg-zinc-900/65 p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-zinc-500" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={common("search")}
              className="bg-zinc-950/60 pl-9"
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-zinc-500">{t("filterDifficulty")}</p>
            {filters.map((item) => (
              <Button
                key={item.label}
                variant={difficulty === item.value ? "default" : "outline"}
                className={
                  difficulty === item.value
                    ? "w-full justify-start bg-gradient-to-r from-[#9945FF] to-[#14F195] text-black"
                    : "w-full justify-start border-white/15 bg-transparent"
                }
                onClick={() => setDifficulty(item.value)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </aside>

        <div className="space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((item) => (
              <Button
                key={item}
                size="sm"
                variant={category === item ? "default" : "outline"}
                className={
                  category === item
                    ? "whitespace-nowrap bg-gradient-to-r from-[#9945FF] to-[#14F195] text-black"
                    : "whitespace-nowrap border-white/20 bg-transparent text-zinc-300"
                }
                onClick={() => setCategory(item)}
              >
                {item}
              </Button>
            ))}
          </div>

          <CourseGrid
            courses={filteredCourses}
            loading={loading}
            enrolledCourseIds={enrollments}
            pendingCourseId={enrollment.pendingCourseId ?? undefined}
            onEnroll={async (courseId) => {
              await enrollment.enrollInCourse(courseId);
            }}
          />

          {!loading && filteredCourses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/15 bg-zinc-950/50 px-6 py-10 text-center">
              <p className="text-base font-medium text-zinc-200">No courses matched your filters</p>
              <p className="mt-1 text-sm text-zinc-400">Try another keyword, category, or difficulty.</p>
            </div>
          ) : null}
        </div>
      </section>

      {enrollment.error ? <p className="text-sm text-red-300">{enrollment.error}</p> : null}
      {enrollment.lastSignature ? (
        <p className="text-xs text-[#14F195]">Enrollment tx: {enrollment.lastSignature}</p>
      ) : null}
    </div>
  );
}
