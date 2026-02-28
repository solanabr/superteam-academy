import { getTranslations } from "next-intl/server";
import { getAllCourses } from "@/lib/sanity";
import { CourseCard } from "@/components/course/CourseCard";
import { MOCK_COURSES } from "@/lib/mock-courses";
import type { Metadata } from "next";
import type { SanityCourse } from "@/types";
import { Link } from "@/i18n/navigation";
import { Search } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "courses" });
  return { title: t("title"), description: t("subtitle") };
}


interface CoursesPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ difficulty?: string; track?: string; q?: string; sort?: string }>;
}

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const t = await getTranslations("courses");
  const { difficulty, track, q, sort } = await searchParams;

  let courses = await getAllCourses().catch(() => [] as SanityCourse[]);
  if (courses.length === 0) courses = MOCK_COURSES;

  // Filter
  let filtered = courses;
  if (difficulty && difficulty !== "all") {
    filtered = filtered.filter((c) => c.difficulty === difficulty);
  }
  if (track) {
    filtered = filtered.filter((c) => c.trackId === Number(track));
  }
  if (q) {
    const query = q.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.title.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query)
    );
  }

  // Sort
  const activeSort = sort ?? "newest";
  let sorted = [...filtered];
  if (activeSort === "xpReward") {
    sorted.sort((a, b) => (b.xpReward ?? 0) - (a.xpReward ?? 0));
  } else if (activeSort === "difficulty") {
    const order: Record<string, number> = { beginner: 0, intermediate: 1, advanced: 2 };
    sorted.sort(
      (a, b) =>
        (order[a.difficulty as string] ?? 0) - (order[b.difficulty as string] ?? 0)
    );
  }
  // newest = default, no sort needed (Sanity returns newest first)

  const difficulties: Array<{ value: string; label: string }> = [
    { value: "all", label: t("filters.all") },
    { value: "beginner", label: t("filters.beginner") },
    { value: "intermediate", label: t("filters.intermediate") },
    { value: "advanced", label: t("filters.advanced") },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-mono text-3xl font-bold text-[#EDEDED] mb-1">
          {t("title")}
        </h1>
        <p className="text-sm text-[#666666]">{t("subtitle")}</p>
      </div>

      {/* Search */}
      <form method="GET" action="" className="mb-4">
        {difficulty && <input type="hidden" name="difficulty" value={difficulty} />}
        {track && <input type="hidden" name="track" value={track} />}
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#666666] pointer-events-none" />
          <input
            type="text"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search courses..."
            className="w-full bg-[#111111] border border-[#1F1F1F] focus:border-[#14F195]/50 rounded pl-9 pr-3 py-1.5 text-sm font-mono text-[#EDEDED] placeholder-[#666666] focus:outline-none transition-colors"
          />
        </div>
      </form>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        {difficulties.map(({ value, label }) => {
          const filterQuery: Record<string, string> = {};
          if (value !== "all") filterQuery.difficulty = value;
          if (track) filterQuery.track = track;
          if (q) filterQuery.q = q;
          return (
            <Link
              key={value}
              href={{ pathname: "/courses", query: Object.keys(filterQuery).length ? filterQuery : undefined }}
              className={[
                "px-3 py-1.5 rounded text-xs font-mono transition-colors border",
                (difficulty ?? "all") === value
                  ? "bg-[#14F195] text-black border-[#14F195]"
                  : "bg-transparent text-[#666666] border-[#1F1F1F] hover:border-[#2E2E2E] hover:text-[#EDEDED]",
              ].join(" ")}
            >
              {label}
            </Link>
          );
        })}
        <span className="ml-auto text-xs text-[#666666] font-mono">
          {sorted.length} {sorted.length === 1 ? "course" : "courses"}
        </span>
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2 mb-6">
        <form method="GET">
          {q && <input type="hidden" name="q" value={q} />}
          {difficulty && difficulty !== "all" && (
            <input type="hidden" name="difficulty" value={difficulty} />
          )}
          {track && <input type="hidden" name="track" value={track} />}
          <div className="inline-flex items-center gap-2">
            <label className="text-xs font-mono text-[#666666]">Sort by</label>
            <select
              name="sort"
              defaultValue={activeSort}
              className="bg-[#111111] border border-[#1F1F1F] text-[#EDEDED] font-mono text-xs rounded px-2 py-1.5 focus:outline-none focus:border-[#14F195]/50"
            >
              <option value="newest">{t("sort.newest")}</option>
              <option value="xpReward">{t("sort.xpReward")}</option>
              <option value="difficulty">{t("sort.difficulty")}</option>
            </select>
            <button
              type="submit"
              className="px-3 py-1.5 bg-[#111111] border border-[#1F1F1F] text-[#666666] hover:text-[#EDEDED] hover:border-[#2E2E2E] font-mono text-xs rounded transition-colors"
            >
              Apply
            </button>
          </div>
        </form>
      </div>

      {/* Grid */}
      {sorted.length === 0 ? (
        <div className="text-center py-20 text-[#666666] font-mono text-sm">
          {t("empty")}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((course) => (
            <CourseCard key={course._id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
