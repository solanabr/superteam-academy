import { db } from "@/drizzle/db"
import {
  CourseTable, UserCourseAccessTable, UserLessonCompleteTable,
  XpEventTable, AssignmentTable,
} from "@/drizzle/schema"
import { eq, and, or, sql } from "drizzle-orm"
import { getCurrentUser } from "@/lib/current-user"
import { isUuid } from "@/lib/is-uuid"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  BookOpen, Clock, Zap, Users, ChevronRight,
  PlayCircle, CheckCircle, Lock, Award, BarChart2, FileText,
} from "lucide-react"
import { EnrollButton } from "./EnrollButton"

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const user = await getCurrentUser()
  const whereCourse = isUuid(slug)
    ? or(eq(CourseTable.slug, slug), eq(CourseTable.id, slug))
    : eq(CourseTable.slug, slug)

  // Find course by slug or id
  const course = await db.query.CourseTable.findFirst({
    where: whereCourse,
    with: {
      courseSections: {
        orderBy: (s, { asc }) => [asc(s.order)],
        with: {
          lessons: {
            orderBy: (l, { asc }) => [asc(l.order)],
          },
        },
      },
    },
  })

  if (!course) notFound()

  // Check enrollment
  const isEnrolled = user
    ? !!(await db.query.UserCourseAccessTable.findFirst({
        where: and(
          eq(UserCourseAccessTable.userId, user.id),
          eq(UserCourseAccessTable.courseId, course.id)
        ),
      }))
    : false

  // Get completed lessons
  const completedLessonIds = new Set<string>()
  if (user && isEnrolled) {
    const completed = await db.query.UserLessonCompleteTable.findMany({
      where: eq(UserLessonCompleteTable.userId, user.id),
      columns: { lessonId: true },
    })
    completed.forEach((c) => completedLessonIds.add(c.lessonId))
  }

  const allLessons = course.courseSections.flatMap((s) => s.lessons)
  const totalLessons = allLessons.length
  const completedCount = allLessons.filter((l) => completedLessonIds.has(l.id)).length
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0
  const fallbackTotalXp = allLessons.reduce((sum, lesson) => sum + (lesson.xpReward ?? 0), 0)
  const totalCourseXp = course.xpReward > 0 ? course.xpReward : fallbackTotalXp

  // Fetch published quizzes for enrolled users
  const assignments = isEnrolled
    ? await db.query.AssignmentTable.findMany({
        where: and(
          eq(AssignmentTable.courseId, course.id),
          eq(AssignmentTable.status, "published")
        ),
        columns: { id: true, name: true, description: true, maxScore: true, xpReward: true },
      })
    : []

  const xpEarned = user
    ? (
        await db
          .select({
            total: sql<number>`coalesce(sum(${XpEventTable.amount}), 0)`.mapWith(Number),
          })
          .from(XpEventTable)
          .where(and(eq(XpEventTable.userId, user.id), eq(XpEventTable.courseId, course.id)))
      )[0]?.total ?? 0
    : 0
  const xpProgress = totalCourseXp > 0 ? Math.min(100, Math.round((xpEarned / totalCourseXp) * 100)) : 0

  const difficultyColors = {
    beginner: "text-primary bg-primary/10 border-primary/20",
    intermediate: "text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20",
    advanced: "text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/20",
  }

  const trackIcons: Record<string, string> = {
    fundamentals: "🏗️", defi: "💱", nft: "🎨", security: "🛡️", frontend: "🖥️",
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Course Hero */}
      <div className="bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 rounded-2xl p-6 sm:p-8 overflow-hidden relative">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative">
          {/* Track + Difficulty badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline" className="text-xs border-primary/30 text-primary capitalize">
              {trackIcons[course.track] ?? ""} {course.track}
            </Badge>
            <Badge
              variant="outline"
              className={`text-xs border capitalize ${difficultyColors[course.difficulty ?? "beginner"]}`}
            >
              {course.difficulty}
            </Badge>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold mb-3">{course.name}</h1>
          <p className="text-muted-foreground mb-6 max-w-2xl">{course.description}</p>

          {/* Course meta */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              {totalLessons} lessons
            </span>
            {course.durationHours > 0 && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {course.durationHours}h
              </span>
            )}
            <span className="flex items-center gap-1.5 text-primary">
              <Zap className="w-4 h-4" />
              {totalCourseXp} XP
            </span>
            {course.instructorName && (
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                {course.instructorName}
              </span>
            )}
          </div>

          {/* Progress (enrolled) */}
          {isEnrolled && totalLessons > 0 && (
            <div className="mb-6">
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>{progressPercent}% complete</span>
                <span>{completedCount}/{totalLessons} lessons</span>
              </div>
              <div className="h-2 bg-background/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
          {isEnrolled && totalCourseXp > 0 && (
            <div className="mb-6">
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>{xpEarned} / {totalCourseXp} XP</span>
                <span>{xpProgress}%</span>
              </div>
              <div className="h-2 bg-background/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* CTA */}
          {!user ? (
            <Link href="/sign-up">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Sign up to Enroll
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          ) : isEnrolled ? (
            <div className="flex gap-3 flex-wrap">
              {completedCount === 0 ? (
                <Link href={`/courses/${slug}/lessons/${allLessons[0]?.id}`}>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Start Learning
                  </Button>
                </Link>
              ) : progressPercent === 100 ? (
                <Link href={`/certificates/${course.id}`}>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Award className="w-4 h-4 mr-2" />
                    View Certificate
                  </Button>
                </Link>
              ) : (
                <Link href={`/courses/${slug}/lessons/${allLessons.find(l => !completedLessonIds.has(l.id))?.id}`}>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Continue Learning
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <EnrollButton courseId={course.id} onchainCourseId={course.onchainCourseId} />
          )}
        </div>
      </div>

      {/* Curriculum */}
      <div>
        <h2 className="text-lg font-bold mb-4">
          Course Curriculum
          <span className="text-sm font-normal text-muted-foreground ml-2">
            {course.courseSections.length} sections · {totalLessons} lessons
          </span>
        </h2>

        <div className="space-y-3">
          {course.courseSections.map((section, sectionIndex) => (
            <Card key={section.id} className="bg-card border-border overflow-hidden">
              <div className="px-5 py-3 border-b border-border bg-muted/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-mono">
                    Section {sectionIndex + 1}
                  </span>
                  <h3 className="font-semibold text-sm">{section.name}</h3>
                </div>
                <span className="text-xs text-muted-foreground">
                  {section.lessons.length} lessons
                </span>
              </div>

              <div className="divide-y divide-border">
                {section.lessons.map((lesson) => {
                  const isCompleted = completedLessonIds.has(lesson.id)
                  const canAccess = isEnrolled || lesson.status === "preview"

                  return (
                    <div
                      key={lesson.id}
                      className={`flex items-center gap-3 px-5 py-3 ${
                        canAccess ? "hover:bg-muted/20 cursor-pointer" : "opacity-60"
                      }`}
                    >
                      {/* Status Icon */}
                      <div className="shrink-0">
                        {isCompleted ? (
                          <CheckCircle className="w-4 h-4 text-primary" />
                        ) : canAccess ? (
                          <PlayCircle className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <Lock className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>

                      {/* Lesson name */}
                      <div className="flex-1 min-w-0">
                        {canAccess ? (
                          <Link
                            href={`/courses/${slug}/lessons/${lesson.id}`}
                            className="text-sm hover:text-primary transition-colors line-clamp-1"
                          >
                            {lesson.name}
                          </Link>
                        ) : (
                          <span className="text-sm text-muted-foreground line-clamp-1">{lesson.name}</span>
                        )}
                      </div>

                      {/* Preview badge */}
                      {lesson.status === "preview" && !isEnrolled && (
                        <Badge variant="outline" className="text-xs border-primary/30 text-primary shrink-0">
                          Preview
                        </Badge>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Course Quiz */}
      {isEnrolled && assignments.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-4">Course Assessment</h2>
          <div className="space-y-3">
            {assignments.map((assignment) => (
              <Card key={assignment.id} className="bg-card border-border overflow-hidden">
                <div className="px-5 py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm">{assignment.name}</div>
                      {assignment.description && (
                        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {assignment.description}
                        </div>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 text-primary">
                          <Zap className="w-3 h-3" />
                          {assignment.xpReward ?? 0} XP
                        </span>
                        <span>{assignment.maxScore} pts</span>
                      </div>
                    </div>
                  </div>
                  <Button asChild size="sm" className="shrink-0">
                    <Link href={`/courses/${slug}/quizzes/${assignment.id}`}>
                      <FileText className="w-4 h-4 mr-2" />
                      Take Quiz
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* What you'll learn */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary" />
            What you&apos;ll learn
          </h2>
          <div className="grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
            {allLessons.slice(0, 8).map((lesson, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>{lesson.name}</span>
              </div>
            ))}
            {allLessons.length === 0 && (
              <span>No lessons added yet.</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
