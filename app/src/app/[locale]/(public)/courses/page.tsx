import { getTranslations } from "next-intl/server";
import { getAllCourses } from "@/lib/sanity";
import { CourseCard } from "@/components/course/CourseCard";
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

// Fallback mock courses for when CMS is not configured
const MOCK_COURSES: SanityCourse[] = [
  {
    _id: "mock-1",
    title: "Solana Fundamentals",
    slug: "solana-fundamentals",
    description: "Master the core concepts of Solana: accounts, programs, transactions, and the runtime model.",
    difficulty: "beginner",
    durationHours: 3,
    xpReward: 500,
    trackId: 1,
    modules: [
      { _id: "m1", title: "Introduction", order: 1, lessons: [{ _id: "l1", title: "What is Solana?", type: "content", order: 1, xpReward: 50 }] },
      { _id: "m2", title: "Accounts", order: 2, lessons: [{ _id: "l2", title: "Account Model", type: "content", order: 1, xpReward: 50 }, { _id: "l3", title: "Account Challenge", type: "challenge", order: 2, xpReward: 100 }] },
    ],
    tags: ["solana", "basics"],
  },
  {
    _id: "mock-2",
    title: "Anchor Framework Basics",
    slug: "anchor-basics",
    description: "Build your first on-chain Solana program using the Anchor framework. PDAs, CPIs, and more.",
    difficulty: "intermediate",
    durationHours: 5,
    xpReward: 1200,
    trackId: 2,
    modules: [
      { _id: "m3", title: "Setup", order: 1, lessons: [{ _id: "l4", title: "Install Anchor", type: "content", order: 1, xpReward: 50 }] },
      { _id: "m4", title: "Programs", order: 2, lessons: [{ _id: "l5", title: "Your First Program", type: "challenge", order: 1, xpReward: 200 }] },
    ],
    tags: ["anchor", "programs"],
  },
  {
    _id: "mock-3",
    title: "Token-2022 & Extensions",
    slug: "token-2022",
    description: "Deep dive into Token-2022 with transfer hooks, metadata pointers, and non-transferable tokens.",
    difficulty: "advanced",
    durationHours: 4,
    xpReward: 2000,
    trackId: 4,
    modules: [
      { _id: "m5", title: "Token Extensions", order: 1, lessons: [{ _id: "l6", title: "Extension Overview", type: "content", order: 1, xpReward: 100 }] },
    ],
    tags: ["token-2022", "extensions"],
  },
];

interface CoursesPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ difficulty?: string; track?: string; q?: string }>;
}

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const t = await getTranslations("courses");
  const { difficulty, track, q } = await searchParams;

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
          {filtered.length} {filtered.length === 1 ? "course" : "courses"}
        </span>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-[#666666] font-mono text-sm">
          {t("empty")}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((course) => (
            <CourseCard key={course._id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
