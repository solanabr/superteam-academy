import { db } from "@/drizzle/db"
import {
  CourseSectionTable,
  CourseTable,
  LessonTable,
  UserCourseAccessTable,
} from "@/drizzle/schema"
import { wherePublicCourseSections } from "@/features/courseSections/permissions/sections"
import { and, eq } from "drizzle-orm"
import { wherePublicLessons } from "./lessons"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"
import { getUserCourseAccessUserTag } from "@/features/courses/db/cache/userCourseAccess"
import { getLessonIdTag } from "../db/cache/lessons"

export async function canUpdateUserLessonCompleteStatus(
  user: { userId?: string | undefined; id?: string | undefined } | null | undefined,
  lessonId: string
) {
  "use cache"
  cacheTag(getLessonIdTag(lessonId))
  const userId = user?.id ?? user?.userId
  if (userId == null) return false

  cacheTag(getUserCourseAccessUserTag(userId))

  const [courseAccess] = await db
    .select({ courseId: CourseTable.id })
    .from(UserCourseAccessTable)
    .innerJoin(CourseTable, eq(CourseTable.id, UserCourseAccessTable.courseId))
    .innerJoin(
      CourseSectionTable,
      and(
        eq(CourseSectionTable.courseId, CourseTable.id),
        wherePublicCourseSections
      )
    )
    .innerJoin(
      LessonTable,
      and(eq(LessonTable.sectionId, CourseSectionTable.id), wherePublicLessons)
    )
    .where(
      and(
        eq(LessonTable.id, lessonId),
        eq(UserCourseAccessTable.userId, userId)
      )
    )
    .limit(1)

  return courseAccess != null
}
