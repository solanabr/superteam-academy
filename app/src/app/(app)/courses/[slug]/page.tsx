import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseBySlug, getCourses } from "@/lib/cms/sanity";
import type { Course } from "@/lib/cms/schemas";
import { EnrollButton } from "@/components/course/EnrollButton";
import { CurriculumWithProgress } from "@/components/course/CurriculumWithProgress";

export const revalidate = 60;

export async function generateStaticParams() {
  const courses: Course[] = await getCourses();
  return courses.map((c) => ({ slug: c.slug?.current ?? c._id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) return { title: "Course Not Found | Caminho." };
  return {
    title: `${course.title} | Caminho.`,
    description: course.description,
  };
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course: Course | null = await getCourseBySlug(slug);

  if (!course) notFound();

  const totalLessons =
    course.modules?.reduce(
      (acc: number, m: { lessons?: unknown[] }) => acc + (m.lessons?.length ?? 0),
      0
    ) ?? 0;

  const difficultyColors: Record<string, string> = {
    beginner: "bg-emerald-50 text-emerald-700 border-emerald-200",
    intermediate: "bg-amber-50 text-amber-700 border-amber-200",
    advanced: "bg-rose-50 text-rose-700 border-rose-200",
  };

  return (
    <div className="mx-auto space-y-10 animate-fade-in">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-neutral-400">
        <Link href="/courses" className="hover:text-neutral-900 transition-colors">
          Courses
        </Link>
        <span>/</span>
        <span className="text-neutral-700">{course.title}</span>
      </nav>

      {/* Hero */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Course Image Placeholder */}
        <div className="w-full md:w-80 h-48 md:h-56 rounded-2xl bg-gradient-to-br from-neutral-100 to-neutral-50 border border-neutral-200 flex items-center justify-center flex-shrink-0">
          <span className="text-5xl opacity-20">
            {course.difficulty === "beginner"
              ? "\u{1F331}"
              : course.difficulty === "advanced"
              ? "\u{1F525}"
              : "\u{1F332}"}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {course.track && (
              <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
                {course.track.title}
              </span>
            )}
            {course.difficulty && (
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                  difficultyColors[course.difficulty] ?? ""
                }`}
              >
                {course.difficulty}
              </span>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            {course.title}
          </h1>

          <p className="text-neutral-500 leading-relaxed">
            {course.description}
          </p>

          {/* Quick stats */}
          <div className="flex flex-wrap items-center gap-5 text-sm text-neutral-500">
            {course.duration && (
              <div className="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {course.duration}
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
              {totalLessons} lessons
            </div>
            {course.modules && (
              <div className="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
                {course.modules.length} modules
              </div>
            )}
            {course.xpReward && (
              <span className="font-mono font-semibold text-neutral-700">
                +{course.xpReward} XP
              </span>
            )}
          </div>

          {/* Instructor */}
          <div className="flex items-center gap-3 pt-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#9945FF] to-[#14F195] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              ST
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Superteam Brazil</p>
              <p className="text-xs text-neutral-400">Course Instructor</p>
            </div>
          </div>

          {/* Tags */}
          {course.tags && course.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {course.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full bg-neutral-100 text-xs font-medium text-neutral-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Enroll CTA */}
          <EnrollButton
            courseId={course._id}
            courseTitle={course.title}
            courseSlug={course.slug?.current ?? course._id}
            totalLessons={totalLessons}
            onChainCourseId={course.onChainCourseId}
          />
        </div>
      </div>

      {/* Prerequisites */}
      {course.prerequisites && course.prerequisites.length > 0 && (
        <div className="p-6 rounded-2xl border border-neutral-200 bg-white">
          <h2 className="text-lg font-semibold mb-3">Prerequisites</h2>
          <ul className="space-y-2">
            {course.prerequisites.map((prereq) => (
              <li
                key={prereq}
                className="flex items-start gap-2 text-sm text-neutral-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 text-neutral-400 flex-shrink-0"><path d="M20 6 9 17l-5-5"/></svg>
                {prereq}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Course Curriculum with Progress */}
      <CurriculumWithProgress
        courseId={course._id}
        courseSlug={slug}
        modules={course.modules}
      />

      {/* Reviews Section */}
      <div>
        <h2 className="text-xl font-semibold mb-5">Student Reviews</h2>
        <div className="space-y-4">
          {STATIC_REVIEWS.map((review, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-xs font-bold text-neutral-600 dark:text-neutral-300">
                  {review.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium">{review.name}</p>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <svg
                        key={j}
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill={j < review.rating ? "currentColor" : "none"}
                        stroke="currentColor"
                        strokeWidth="2"
                        className={j < review.rating ? "text-amber-400" : "text-neutral-300 dark:text-neutral-600"}
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                  </div>
                </div>
                <span className="ml-auto text-xs text-neutral-400">{review.date}</span>
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {review.comment}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const STATIC_REVIEWS = [
  {
    name: "Lucas M.",
    rating: 5,
    date: "2 weeks ago",
    comment:
      "Excellent course structure! The hands-on challenges really helped me understand Solana development concepts. The progression from basics to advanced topics felt very natural.",
  },
  {
    name: "Ana S.",
    rating: 4,
    date: "1 month ago",
    comment:
      "Great content and well-organized modules. The code challenges are the highlight — they force you to actually write and test code rather than just reading. Would love more advanced security topics.",
  },
  {
    name: "Pedro R.",
    rating: 5,
    date: "1 month ago",
    comment:
      "Best Solana learning resource I've found. The on-chain credential system is a nice touch — having proof of completion as an NFT is very Web3-native. Highly recommended for anyone starting out.",
  },
];
