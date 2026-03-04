import { auth } from "@/lib/auth"
import { db } from "@/drizzle/db"
import {
  CourseTable, UserCourseAccessTable, UserLessonCompleteTable,
  CourseSectionTable, LessonTable,
} from "@/drizzle/schema"
import { eq, and, asc, sql, ilike, or } from "drizzle-orm"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  BookOpen, Clock, Zap, Search, ChevronRight,
} from "lucide-react"
import { getServerI18n } from "@/lib/server-i18n"

interface SearchParams {
  q?: string
  difficulty?: string
  track?: string
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const session = await auth()
  const { t } = await getServerI18n()

  const courses = await getCourses({ userId: session?.user?.id, ...params })

  const difficultyColors = {
    beginner: { bg: "bg-primary/10", text: "text-primary", border: "border-primary/20" },
    intermediate: { bg: "bg-[#F59E0B]/10", text: "text-[#F59E0B]", border: "border-[#F59E0B]/20" },
    advanced: { bg: "bg-[#EF4444]/10", text: "text-[#EF4444]", border: "border-[#EF4444]/20" },
  }

  const trackIcons: Record<string, string> = {
    fundamentals: "🏗️",
    defi: "💱",
    nft: "🎨",
    security: "🛡️",
    frontend: "🖥️",
  }

  return (
    <div className="max-w-6xl mx-auto my-10 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-1">{t("coursesPage.title", "Course Catalog")}</h1>
        <p className="text-muted-foreground text-sm">
          {courses.length} {t("coursesPage.coursesCount", "course(s) available")}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <form className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            name="q"
            defaultValue={params.q}
            placeholder={t("coursesPage.searchPlaceholder", "Search courses...")}
            className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground"
          />
        </form>

        <div className="flex gap-2">
          {["all", "beginner", "intermediate", "advanced"].map((d) => (
            <Link
              key={d}
              href={`/courses${d === "all" ? "" : `?difficulty=${d}`}${params.track ? `&track=${params.track}` : ""}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                (params.difficulty ?? "all") === d
                  ? "bg-primary/20 border-primary/30 text-primary"
                  : "bg-card border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {d === "all"
                ? t("coursesPage.filters.all", "All")
                : d.charAt(0).toUpperCase() + d.slice(1)}
            </Link>
          ))}
        </div>
      </div>

      {/* Track filter pills */}
      <div className="flex flex-wrap gap-2">
        {["all", "fundamentals", "defi", "nft", "security", "frontend"].map((track) => (
          <Link
            key={track}
            href={`/courses${track === "all" ? "" : `?track=${track}`}${params.difficulty ? `&difficulty=${params.difficulty}` : ""}`}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              (params.track ?? "all") === track
                ? "bg-primary border-0 text-white"
                : "bg-card border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {track !== "all" && <span>{trackIcons[track]}</span>}
            <span>{track === "all" ? t("coursesPage.allTracks", "All Tracks") : track.charAt(0).toUpperCase() + track.slice(1)}</span>
          </Link>
        ))}
      </div>

      {/* Course Grid */}
      {courses.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border border-dashed rounded-xl">
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="font-semibold mb-1">{t("coursesPage.noCourses", "No courses found")}</p>
          <p className="text-sm text-muted-foreground mb-4">{t("coursesPage.adjustFilters", "Try adjusting your filters")}</p>
          <Link href="/courses">
            <Button variant="outline" size="sm">{t("coursesPage.clearFilters", "Clear filters")}</Button>
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course) => {
            const diff = course.difficulty ?? "beginner"
            const colors = difficultyColors[diff as keyof typeof difficultyColors] || difficultyColors.beginner
            const progressPercent = course.totalLessons > 0
              ? Math.round((course.completedLessons / course.totalLessons) * 100)
              : 0

            return (
              <Link key={course.id} href={`/courses/${course.slug ?? course.id}`}>
                <div className="group bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 transition-all hover:-translate-y-0.5 cursor-pointer flex flex-col h-full">
                  {/* Thumbnail */}
                  <div className="h-36 bg-gradient-to-br from-primary/20 to-primary/10 relative flex items-center justify-center">
                    {course.thumbnailUrl ? (
                      <Image
                        src={course.thumbnailUrl}
                        alt={course.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="text-4xl">{trackIcons[course.track ?? "fundamentals"] ?? "📚"}</div>
                    )}
                    <div className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-semibold border ${colors.bg} ${colors.text} ${colors.border}`}>
                      {diff}
                    </div>
                    {course.isEnrolled && (
                      <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/20 text-primary border border-primary/30">
                        {t("coursesPage.enrolled", "Enrolled")}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {course.name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                      {course.description}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        {course.totalLessons} {t("coursesPage.lessons", "lessons")}
                      </span>
                      {course.durationHours > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {course.durationHours}h
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-primary">
                        <Zap className="w-3.5 h-3.5" />
                        {course.xpReward} XP
                      </span>
                    </div>

                    {/* Progress bar (enrolled courses) */}
                    {course.isEnrolled && course.totalLessons > 0 && (
                      <div>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>{progressPercent}% {t("coursesPage.complete", "complete")}</span>
                          <span>{course.completedLessons}/{course.totalLessons}</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {!course.isEnrolled && (
                      <Button
                        size="sm"
                        className="w-full bg-primary border-0 text-white text-xs mt-auto hover:opacity-90"
                      >
                        {t("coursesPage.startCourse", "Start Course")}
                        <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

async function getCourses({
  userId,
  q,
  difficulty,
  track,
}: {
  userId?: string
  q?: string
  difficulty?: string
  track?: string
}) {
  const whereClauses = []

  if (q?.trim()) {
    const term = `%${q.trim()}%`
    whereClauses.push(
      or(
        ilike(CourseTable.name, term),
        ilike(CourseTable.description, term)
      )
    )
  }

  if (difficulty && difficulty !== "all") {
    whereClauses.push(eq(CourseTable.difficulty, difficulty as typeof CourseTable.difficulty._.data))
  }

  if (track && track !== "all") {
    whereClauses.push(eq(CourseTable.track, track as typeof CourseTable.track._.data))
  }

  const whereExpr = whereClauses.length > 0 ? and(...whereClauses) : undefined

  if (!userId) {
    const courses = await db
      .select({
        id: CourseTable.id,
        name: CourseTable.name,
        slug: CourseTable.slug,
        description: CourseTable.description,
        difficulty: CourseTable.difficulty,
        track: CourseTable.track,
        durationHours: CourseTable.durationHours,
        xpReward: CourseTable.xpReward,
        thumbnailUrl: CourseTable.thumbnailUrl,
        instructorName: CourseTable.instructorName,
        totalLessons: sql<number>`COALESCE(COUNT(DISTINCT ${LessonTable.id}), 0)`.mapWith(Number),
      })
      .from(CourseTable)
      .leftJoin(CourseSectionTable, eq(CourseSectionTable.courseId, CourseTable.id))
      .leftJoin(LessonTable, eq(LessonTable.sectionId, CourseSectionTable.id))
      .where(whereExpr)
      .groupBy(CourseTable.id)
      .orderBy(asc(CourseTable.name))

    return courses.map((c) => ({
      ...c,
      completedLessons: 0,
      isEnrolled: false,
    }))
  }

  const courses = await db
    .select({
      id: CourseTable.id,
      name: CourseTable.name,
      slug: CourseTable.slug,
      description: CourseTable.description,
      difficulty: CourseTable.difficulty,
      track: CourseTable.track,
      durationHours: CourseTable.durationHours,
      xpReward: CourseTable.xpReward,
      thumbnailUrl: CourseTable.thumbnailUrl,
      instructorName: CourseTable.instructorName,
      totalLessons: sql<number>`COALESCE(COUNT(DISTINCT ${LessonTable.id}), 0)`.mapWith(Number),
      completedLessons: sql<number>`COALESCE(COUNT(DISTINCT ${UserLessonCompleteTable.lessonId}), 0)`.mapWith(Number),
      isEnrolledCount: sql<number>`COALESCE(COUNT(DISTINCT ${UserCourseAccessTable.userId}), 0)`.mapWith(Number),
    })
    .from(CourseTable)
    .leftJoin(CourseSectionTable, eq(CourseSectionTable.courseId, CourseTable.id))
    .leftJoin(LessonTable, eq(LessonTable.sectionId, CourseSectionTable.id))
    .leftJoin(
      UserCourseAccessTable,
      and(
        eq(UserCourseAccessTable.courseId, CourseTable.id),
        eq(UserCourseAccessTable.userId, userId)
      )
    )
    .leftJoin(
      UserLessonCompleteTable,
      and(
        eq(UserLessonCompleteTable.lessonId, LessonTable.id),
        eq(UserLessonCompleteTable.userId, userId)
      )
    )
    .where(whereExpr)
    .groupBy(CourseTable.id)
    .orderBy(asc(CourseTable.name))

  return courses.map((c) => ({
    ...c,
    isEnrolled: c.isEnrolledCount > 0,
  }))
}
