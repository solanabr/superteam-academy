import { getTranslations } from "next-intl/server";
import { getCourseBySlug, getAllCourses } from "@/lib/sanity";
import { getMockCourseBySlug, MOCK_COURSES } from "@/lib/mock-courses";
import { getProfileByWallet } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { BookOpen, Clock, Zap, ChevronDown } from "lucide-react";
import { DIFFICULTY_COLORS, TRACKS } from "@/types";
import type { Metadata } from "next";
import type { SanityCourse, SanityLesson } from "@/types";
import { EnrollButton } from "./EnrollButton";
import { StudentReviews, RateCourseButton } from "./ReviewSection";
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
  const sanityCourses = await getAllCourses().catch(() => []);
  const mockSlugs = MOCK_COURSES.map((c) => ({ slug: c.slug }));
  const sanitySlugs = sanityCourses.map((c: SanityCourse) => ({ slug: c.slug }));
  return [...mockSlugs, ...sanitySlugs];
}

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params;
  const t = await getTranslations("courses");

  let course = await getCourseBySlug(slug).catch(() => null);

  if (!course) {
    course = getMockCourseBySlug(slug);
  }

  if (!course) notFound();

  const track = TRACKS[course.trackId];
  const diffColor = DIFFICULTY_COLORS[course.difficulty] ?? "#666666";
  const totalLessons = course.modules.reduce((sum, m) => sum + (m.lessons?.length ?? 0), 0);

  // Look up instructor's Supabase profile if they have a wallet address
  const instructorWallet = course.instructor?.walletAddress;
  const instructorProfile = instructorWallet
    ? await getProfileByWallet(instructorWallet).catch(() => null)
    : null;
  const instructorDisplayName =
    instructorProfile?.displayName ??
    instructorProfile?.username ??
    course.instructor?.name;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <Link href="/courses" className="hover:text-foreground transition-colors">
              Courses
            </Link>
            <span>/</span>
            <span className="text-foreground">{course.title}</span>
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
                <span className="text-[10px] font-mono text-muted-foreground bg-card border border-border px-2 py-0.5 rounded-sm">
                  {track.icon} {track.name}
                </span>
              )}
            </div>
            <h1 className="font-mono text-3xl font-bold text-foreground mb-3">
              {course.title}
            </h1>
            <p className="text-muted-foreground leading-relaxed">{course.description}</p>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-4 text-sm font-mono">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              <span>{totalLessons} lessons</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
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
            <h2 className="font-mono text-lg font-semibold text-foreground mb-4">
              Course Content
            </h2>
            <div className="space-y-2">
              {course.modules.map((module) => (
                <details
                  key={module._id}
                  className="bg-card border border-border rounded group"
                  open={module.order === 1}
                >
                  <summary className="flex items-center justify-between p-4 cursor-pointer select-none list-none hover:bg-elevated rounded transition-colors">
                    <div>
                      <span className="font-mono text-sm font-semibold text-foreground">
                        {module.title}
                      </span>
                      {module.description && (
                        <span className="text-xs text-muted-foreground ml-2">
                          {module.description}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {module.lessons?.length ?? 0} lessons
                      </span>
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-open:rotate-180" />
                    </div>
                  </summary>
                  <div className="border-t border-border">
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
          {/* Student Reviews */}
          <StudentReviews courseSlug={slug} />
        </div>

        {/* Sidebar */}
        <aside className="lg:sticky lg:top-20 h-fit space-y-4">
          <div className="bg-card border border-border rounded p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="font-mono text-2xl font-bold text-[#14F195]">
                {course.xpReward.toLocaleString()}
                <span className="text-sm ml-1">XP</span>
              </div>
            </div>

            <EnrollButton
              courseId={course.onChainCourseId ?? course.slug}
              courseSlug={slug}
              firstLessonId={course.modules?.[0]?.lessons?.[0]?._id}
              totalLessons={totalLessons}
            />
            <RateCourseButton courseSlug={slug} totalLessons={totalLessons} />

            <div className="mt-4 pt-4 border-t border-border space-y-2 text-xs font-mono text-muted-foreground">
              <div className="flex justify-between">
                <span>Difficulty</span>
                <span style={{ color: diffColor }}>{course.difficulty}</span>
              </div>
              <div className="flex justify-between">
                <span>Duration</span>
                <span className="text-foreground">{course.durationHours}h</span>
              </div>
              <div className="flex justify-between">
                <span>Lessons</span>
                <span className="text-foreground">{totalLessons}</span>
              </div>
              {track && (
                <div className="flex justify-between">
                  <span>Track</span>
                  <span className="text-foreground">{track.icon} {track.name}</span>
                </div>
              )}
            </div>

            {course.tags && course.tags.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex flex-wrap gap-1.5">
                  {course.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-mono bg-elevated border border-border text-muted-foreground px-2 py-0.5 rounded-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {course.instructor && (
            <div className="bg-card border border-border rounded p-5">
              <p className="text-xs text-muted-foreground font-mono mb-3">Instructor</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-elevated border border-border flex items-center justify-center font-mono text-sm font-bold text-[#14F195] shrink-0">
                  {(instructorDisplayName ?? "?")[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-mono font-semibold text-foreground truncate">
                    {instructorDisplayName ?? course.instructor.name}
                  </p>
                  {instructorWallet ? (
                    <Link
                      href={`/profile/${instructorProfile?.username ?? instructorWallet}` as Parameters<typeof Link>[0]["href"]}
                      className="text-[10px] font-mono text-muted-foreground hover:text-[#14F195] transition-colors"
                    >
                      ◎ {instructorWallet.slice(0, 6)}...{instructorWallet.slice(-4)}
                    </Link>
                  ) : course.instructor.twitterHandle ? (
                    <p className="text-[10px] font-mono text-muted-foreground">
                      @{course.instructor.twitterHandle}
                    </p>
                  ) : null}
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
  return (
    <Link
      href={{ pathname: "/courses/[slug]/lessons/[id]", params: { slug: courseSlug, id: lesson._id } }}
      className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-elevated transition-colors group/row"
    >
      <span
        className="text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0"
        style={
          lesson.type === "challenge"
            ? { color: "#F5A623", borderColor: "#F5A62330", backgroundColor: "#F5A62310" }
            : { color: "#666666", borderColor: "#33333380", backgroundColor: "transparent" }
        }
      >
        {lesson.type === "challenge" ? "challenge" : "lesson"}
      </span>
      <span className="text-sm font-mono text-muted-foreground group-hover/row:text-foreground flex-1 transition-colors">
        {lesson.title}
      </span>
      <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
        {lesson.estimatedMinutes && <span>{lesson.estimatedMinutes}m</span>}
        <span className="text-[#14F195]">+{lesson.xpReward} XP</span>
      </div>
    </Link>
  );
}
