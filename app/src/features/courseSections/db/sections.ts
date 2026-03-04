import { CourseSectionTable } from "@/drizzle/schema"
import { revalidateCourseSectionCache } from "./cache"
import { db } from "@/drizzle/db"
import { eq } from "drizzle-orm"

export async function getNextCourseSectionOrder(courseId: string) {
  const section = await db.query.CourseSectionTable.findFirst({
    columns: { order: true },
    where: ({ courseId: courseIdCol }, { eq }) => eq(courseIdCol, courseId),
    orderBy: ({ order }, { desc }) => desc(order),
  })

  return section ? section.order + 1 : 0
}

export async function insertSection(
  data: typeof CourseSectionTable.$inferInsert
) {
  const [newSection] = await db
    .insert(CourseSectionTable)
    .values(data)
    .returning()
  if (newSection == null) throw new Error("Failed to create section")

  revalidateCourseSectionCache({
    courseId: newSection.courseId,
    id: newSection.id,
  })

  return newSection
}

export async function updateSection(
  id: string,
  data: Partial<typeof CourseSectionTable.$inferInsert>
) {
  const [updatedSection] = await db
    .update(CourseSectionTable)
    .set(data)
    .where(eq(CourseSectionTable.id, id))
    .returning()
  if (updatedSection == null) throw new Error("Failed to update section")

  revalidateCourseSectionCache({
    courseId: updatedSection.courseId,
    id: updatedSection.id,
  })

  return updatedSection
}

export async function deleteSection(id: string) {
  const [deletedSection] = await db
    .delete(CourseSectionTable)
    .where(eq(CourseSectionTable.id, id))
    .returning()
  if (deletedSection == null) throw new Error("Failed to delete section")

  revalidateCourseSectionCache({
    courseId: deletedSection.courseId,
    id: deletedSection.id,
  })

  return deletedSection
}

export async function updateSectionOrders(sectionIds: string[]) {
  const sections = await Promise.all(
    sectionIds.map((id, index) =>
      db
        .update(CourseSectionTable)
        .set({ order: index })
        .where(eq(CourseSectionTable.id, id))
        .returning({
          courseId: CourseSectionTable.courseId,
          id: CourseSectionTable.id,
        })
    )
  )

  sections.flat().forEach(({ id, courseId }) => {
    revalidateCourseSectionCache({
      courseId,
      id,
    })
  })
}