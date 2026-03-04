import { db } from "@/drizzle/db"
import {
  CourseTable,
  UserCourseAccessTable,
  UserLessonCompleteTable,
  LessonTable,
} from "@/drizzle/schema"
import { wherePublicCourseSections } from "@/features/courseSections/permissions/sections"
import { updateLessonCompleteStatus } from "@/features/lessons/actions/userLessonComplete"
import { wherePublicLessons } from "@/features/lessons/permissions/lessons"
import { getCurrentUser } from "@/lib/current-user"
import { isUuid } from "@/lib/is-uuid"
import { and, eq, or } from "drizzle-orm"
import { notFound } from "next/navigation"
import { LessonViewClient } from "./LessonViewClient"

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>
}) {
  const { slug, id: lessonId } = await params
  const user = await getCurrentUser()
  const whereCourse = isUuid(slug)
    ? or(eq(CourseTable.slug, slug), eq(CourseTable.id, slug))
    : eq(CourseTable.slug, slug)

  // Load course + all sections/lessons for sidebar
  const course = await db.query.CourseTable.findFirst({
    where: whereCourse,
    with: {
      courseSections: {
        orderBy: (s, { asc }) => [asc(s.order)],
        where: wherePublicCourseSections,
        with: {
          lessons: {
            orderBy: (l, { asc }) => [asc(l.order)],
            where: wherePublicLessons,
          },
        },
      },
    },
  })

  if (!course) notFound()

  // Load the specific lesson
  const lesson = await db.query.LessonTable.findFirst({
    where: and(eq(LessonTable.id, lessonId), wherePublicLessons),
  })

  if (!lesson) notFound()

  // Check enrollment
  const isEnrolled = user
    ? !!(await db.query.UserCourseAccessTable.findFirst({
        where: and(
          eq(UserCourseAccessTable.userId, user.id),
          eq(UserCourseAccessTable.courseId, course.id)
        ),
      }))
    : false

  // Permission: preview lessons are visible to all, public lessons require enrollment
  const canView =
    lesson.status === "preview" || (user != null && isEnrolled)

  if (!canView) {
    notFound()
  }

  // Completed lessons for this user
  const completedLessonIds = new Set<string>()
  if (user) {
    const completed = await db.query.UserLessonCompleteTable.findMany({
      where: eq(UserLessonCompleteTable.userId, user.id),
      columns: { lessonId: true },
    })
    completed.forEach((c) => completedLessonIds.add(c.lessonId))
  }

  const isComplete = completedLessonIds.has(lessonId)

  // Prev / next lesson (flat across all sections)
  const allLessons = course.courseSections.flatMap((s) =>
    s.lessons.map((l) => ({ ...l, sectionName: s.name }))
  )
  const currentIdx = allLessons.findIndex((l) => l.id === lessonId)
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null
  const nextLesson =
    currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null
  const lessonXp = lesson.xpReward ?? 0

  // Map sections with completion state for sidebar
  const sections = course.courseSections.map((section) => ({
    id: section.id,
    name: section.name,
    lessons: section.lessons.map((l) => ({
      id: l.id,
      name: l.name,
      status: l.status,
      isComplete: completedLessonIds.has(l.id),
    })),
  }))

  return (
    <LessonViewClient
      courseSlug={slug}
      courseName={course.name}
      lesson={{
        id: lesson.id,
        name: lesson.name,
        description: lesson.description,
        youtubeVideoId: lesson.youtubeVideoId,
        status: lesson.status,
        xpReward: lesson.xpReward,
      }}
      sections={sections}
      isComplete={isComplete}
      canMarkComplete={!!user && isEnrolled}
      lessonXp={lessonXp}
      lessonIndex={currentIdx}
      prevLessonId={prevLesson?.id ?? null}
      nextLessonId={nextLesson?.id ?? null}
      markCompleteAction={updateLessonCompleteStatus}
    />
  )
}
