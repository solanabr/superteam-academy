import { db } from "@/drizzle/db"
import { AssignmentTable, CourseSectionTable, CourseTable, LessonTable } from "@/drizzle/schema"
import { revalidateCourseCache } from "./cache/courses"
import { eq, sql } from "drizzle-orm"

export async function insertCourse(data: typeof CourseTable.$inferInsert) {
  const [newCourse] = await db.insert(CourseTable).values(data).returning()
  if (newCourse == null) throw new Error("Failed to create course")
  revalidateCourseCache(newCourse.id)

  return newCourse
}

export async function updateCourse(
  id: string,
  data: typeof CourseTable.$inferInsert
) {
  const [updatedCourse] = await db
    .update(CourseTable)
    .set(data)
    .where(eq(CourseTable.id, id))
    .returning()
  if (updatedCourse == null) throw new Error("Failed to update course")
  revalidateCourseCache(updatedCourse.id)

  return updatedCourse
}

export async function deleteCourse(id: string) {
  const [deletedCourse] = await db
    .delete(CourseTable)
    .where(eq(CourseTable.id, id))
    .returning()
  if (deletedCourse == null) throw new Error("Failed to delete course")
  revalidateCourseCache(deletedCourse.id)

  return deletedCourse
}

export async function recalculateCourseXp(courseId: string) {
  const [lessonTotals] = await db
    .select({
      total: sql<number>`coalesce(sum(${LessonTable.xpReward}), 0)`.mapWith(Number),
    })
    .from(LessonTable)
    .innerJoin(
      CourseSectionTable,
      eq(CourseSectionTable.id, LessonTable.sectionId)
    )
    .where(eq(CourseSectionTable.courseId, courseId))

  const [assignmentTotals] = await db
    .select({
      total: sql<number>`coalesce(sum(${AssignmentTable.xpReward}), 0)`.mapWith(Number),
    })
    .from(AssignmentTable)
    .where(eq(AssignmentTable.courseId, courseId))

  const totalXp = (lessonTotals?.total ?? 0) + (assignmentTotals?.total ?? 0)

  await db
    .update(CourseTable)
    .set({ xpReward: totalXp })
    .where(eq(CourseTable.id, courseId))

  revalidateCourseCache(courseId)
}
