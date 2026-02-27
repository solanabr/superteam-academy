import { getTranslations } from "next-intl/server";
import { getCourseBySlug, getAllCourses } from "@/lib/sanity";
import { notFound } from "next/navigation";
import { BookOpen, Clock, Zap, ChevronDown, Lock, CheckCircle } from "lucide-react";
import { DIFFICULTY_COLORS, TRACKS } from "@/types";
import type { Metadata } from "next";
import type { SanityCourse, SanityLesson } from "@/types";
import { EnrollButton } from "./EnrollButton";
import { Link } from "@/i18n/navigation";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug).catch(() => null);
  if (!course) return {};
  return { title: course.title, description: course.description };
}

export async function generateStaticParams() {
  const courses = await getAllCourses().catch(() => []);
  return courses.map((c: SanityCourse) => ({ slug: c.slug }));
}

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params;
  const t = await getTranslations("courses");

  let course = await getCourseBySlug(slug).catch(() => null);

  // Fallback for demo
  if (!course) {
    if (slug === "solana-fundamentals") {
      course = {
        _id: "mock-1", title: "Solana Fundamentals", slug,
        description: "Master the core concepts of Solana: accounts, programs, transactions.",
        difficulty: "beginner", durationHours: 3, xpReward: 500, trackId: 1,
        modules: [
          { _id: "m1", title: "Introduction", order: 1, description: "Get started with Solana",
            lessons: [
              { _id: "l1", title: "What is Solana?", type: "content", order: 1, xpReward: 50, estimatedMinutes: 10 },
              { _id: "l2", title: "The Solana Runtime", type: "content", order: 2, xpReward: 50, estimatedMinutes: 15 },
            ] },
          { _id: "m2", title: "Accounts", order: 2, description: "Understanding Solana accounts",
            lessons: [
              { _id: "l3", title: "Account Model Deep Dive", type: "content", order: 1, xpReward: 75, estimatedMinutes: 20 },
              { _id: "l4", title: "Account Challenge", type: "challenge", order: 2, xpReward: 150, estimatedMinutes: 30 },
            ] },
        ],
        tags: ["solana", "basics"],
      };
    } else {
      notFound();
    }
  }

  const track = TRACKS[course.trackId];
  const diffColor = DIFFICULTY_COLORS[course.difficulty] ?? "#666666";
  const totalLessons = course.modules.reduce((sum, m) => sum + (m.lessons?.length ?? 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs font-mono text-[#666666]">
            <Link href="/courses" className="hover:text-[#EDEDED] transition-colors">
              Courses
            </Link>
            <span>/</span>
            <span className="text-[#EDEDED]">{course.title}</span>
          </nav>

          {/* Header */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded-sm border"
                style={{ color: diffColor, backgroundColor: `${diffColor}15`, borderColor: `${diffColor}30` }}
              >
                {course.difficulty}
              </span>
              {track && (
                <span className="text-[10px] font-mono text-[#666666] bg-[#111111] border border-[#1F1F1F] px-2 py-0.5 rounded-sm">
                  {track.icon} {track.name}
                </span>
              )}
            </div>
            <h1 className="font-mono text-3xl font-bold text-[#EDEDED] mb-3">
              {course.title}
            </h1>
            <p className="text-[#666666] leading-relaxed">{course.description}</p>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-4 text-sm font-mono">
            <div className="flex items-center gap-1.5 text-[#666666]">
              <BookOpen className="h-4 w-4" />
              <span>{totalLessons} lessons</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#666666]">
              <Clock className="h-4 w-4" />
              <span>{course.durationHours}h estimated</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#14F195]">
              <Zap className="h-4 w-4" />
              <span>{course.xpReward.toLocaleString()} XP reward</span>
            </div>
          </div>

          {/* Modules */}
          <div>
            <h2 className="font-mono text-lg font-semibold text-[#EDEDED] mb-4">
              Course Content
            </h2>
            <div className="space-y-2">
              {course.modules.map((module) => (
                <details
                  key={module._id}
                  className="bg-[#111111] border border-[#1F1F1F] rounded group"
                  open={module.order === 1}
                >
                  <summary className="flex items-center justify-between p-4 cursor-pointer select-none list-none hover:bg-[#1A1A1A] rounded transition-colors">
                    <div>
                      <span className="font-mono text-sm font-semibold text-[#EDEDED]">
                        {module.title}
                      </span>
                      {module.description && (
                        <span className="text-xs text-[#666666] ml-2">
                          {module.description}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-[#666666] font-mono">
                        {module.lessons?.length ?? 0} lessons
                      </span>
                      <ChevronDown className="h-3.5 w-3.5 text-[#666666] transition-transform group-open:rotate-180" />
                    </div>
                  </summary>
                  <div className="border-t border-[#1F1F1F]">
                    {(module.lessons ?? []).map((lesson, i) => (
                      <LessonRow
                        key={lesson._id}
                        lesson={lesson}
                        courseSlug={slug}
                        index={i}
                        isFirst={module.order === 1 && i === 0}
                      />
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="lg:sticky lg:top-20 h-fit space-y-4">
          <div className="bg-[#111111] border border-[#1F1F1F] rounded p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="font-mono text-2xl font-bold text-[#14F195]">
                {course.xpReward.toLocaleString()}
                <span className="text-sm ml-1">XP</span>
              </div>
            </div>

            <EnrollButton courseId={course.onChainCourseId ?? course.slug} courseSlug={slug} />

            <div className="mt-4 pt-4 border-t border-[#1F1F1F] space-y-2 text-xs font-mono text-[#666666]">
              <div className="flex justify-between">
                <span>Difficulty</span>
                <span style={{ color: diffColor }}>{course.difficulty}</span>
              </div>
              <div className="flex justify-between">
                <span>Duration</span>
                <span className="text-[#EDEDED]">{course.durationHours}h</span>
              </div>
              <div className="flex justify-between">
                <span>Lessons</span>
                <span className="text-[#EDEDED]">{totalLessons}</span>
              </div>
              {track && (
                <div className="flex justify-between">
                  <span>Track</span>
                  <span className="text-[#EDEDED]">{track.icon} {track.name}</span>
                </div>
              )}
            </div>

            {course.tags && course.tags.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#1F1F1F]">
                <div className="flex flex-wrap gap-1.5">
                  {course.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-mono bg-[#1A1A1A] border border-[#1F1F1F] text-[#666666] px-2 py-0.5 rounded-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {course.instructor && (
            <div className="bg-[#111111] border border-[#1F1F1F] rounded p-5">
              <p className="text-xs text-[#666666] font-mono mb-2">Instructor</p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#1A1A1A] flex items-center justify-center text-xs font-mono">
                  {course.instructor.name[0]}
                </div>
                <div>
                  <p className="text-sm font-mono font-semibold text-[#EDEDED]">
                    {course.instructor.name}
                  </p>
                  {course.instructor.twitterHandle && (
                    <p className="text-xs text-[#666666]">@{course.instructor.twitterHandle}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function LessonRow({
  lesson,
  courseSlug,
  index,
  isFirst,
}: {
  lesson: SanityLesson;
  courseSlug: string;
  index: number;
  isFirst: boolean;
}) {
  const icon = lesson.type === "challenge" ? "⚡" : "📖";

  return (
    <Link
      href={{ pathname: "/courses/[slug]/lessons/[id]", params: { slug: courseSlug, id: lesson._id } }}
      className="flex items-center gap-3 px-4 py-3 border-b border-[#1F1F1F] last:border-0 hover:bg-[#1A1A1A] transition-colors group/row"
    >
      <span className="text-xs">{icon}</span>
      <span className="text-sm font-mono text-[#666666] group-hover/row:text-[#EDEDED] flex-1 transition-colors">
        {lesson.title}
      </span>
      <div className="flex items-center gap-2 text-[10px] font-mono text-[#666666]">
        {lesson.estimatedMinutes && <span>{lesson.estimatedMinutes}m</span>}
        <span className="text-[#14F195]">+{lesson.xpReward} XP</span>
      </div>
    </Link>
  );
}
