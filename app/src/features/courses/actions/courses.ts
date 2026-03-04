"use server"

import { z } from "zod"
import { courseSchema } from "../schemas/courses"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/current-user"
import { db } from "@/drizzle/db"
import { CourseTable } from "@/drizzle/schema"
import { eq } from "drizzle-orm"
import {
  canCreateCourses,
  canDeleteCourses,
  canUpdateCourses,
} from "../permissions/courses"
import {
  insertCourse,
  deleteCourse as deleteCourseDB,
  updateCourse as updateCourseDb,
} from "../db/courses"

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

function toActionErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Database error"
  if (message.includes("courses_slug_unique")) {
    return "A course with this title-generated slug already exists"
  }
  if (message.includes("courses_onchain_course_id_unique")) {
    return "On-chain course ID is already used by another course"
  }
  return message
}

export async function createCourse(unsafeData: z.infer<typeof courseSchema>) {
  const parsed = courseSchema.safeParse(unsafeData)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    return {
      error: true,
      message: firstIssue ? `${firstIssue.path.join(".")}: ${firstIssue.message}` : "Invalid course data",
    }
  }

  if (!canCreateCourses(await getCurrentUser())) {
    return { error: true, message: "You are not allowed to create courses" }
  }

  const normalizedOnchainCourseId = parsed.data.onchainCourseId.trim() || null
  const normalizedInstructorName = parsed.data.instructorName.trim()
  const normalizedThumbnailUrl = parsed.data.thumbnailUrl.trim()
  const generatedSlug = slugify(parsed.data.name)
  const payload = {
    ...parsed.data,
    slug: generatedSlug,
    onchainCourseId: normalizedOnchainCourseId,
    instructorName: normalizedInstructorName || null,
    thumbnailUrl: normalizedThumbnailUrl || null,
  }

  try {
    const course = await insertCourse(payload)
    redirect(`/admin/courses/${course.id}/edit`)
  } catch (error) {
    return { error: true, message: toActionErrorMessage(error) }
  }
}

export async function updateCourse(
  id: string,
  unsafeData: z.infer<typeof courseSchema>
) {
  const parsed = courseSchema.safeParse(unsafeData)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    return {
      error: true,
      message: firstIssue ? `${firstIssue.path.join(".")}: ${firstIssue.message}` : "Invalid course data",
    }
  }

  if (!canUpdateCourses(await getCurrentUser())) {
    return { error: true, message: "You are not allowed to update courses" }
  }

  try {
    const normalizedOnchainCourseId = parsed.data.onchainCourseId.trim() || null
    const normalizedInstructorName = parsed.data.instructorName.trim()
    const normalizedThumbnailUrl = parsed.data.thumbnailUrl.trim()
    const existing = await db.query.CourseTable.findFirst({
      where: eq(CourseTable.id, id),
      columns: { slug: true, onchainCourseId: true },
    })

    if (!existing) {
      return { error: true, message: "Course not found" }
    }

    const payload = {
      ...parsed.data,
      slug: existing.slug ?? slugify(parsed.data.name),
      onchainCourseId: normalizedOnchainCourseId,
      instructorName: normalizedInstructorName || null,
      thumbnailUrl: normalizedThumbnailUrl || null,
    }

    await updateCourseDb(id, payload)
  } catch (error) {
    return { error: true, message: toActionErrorMessage(error) }
  }

  return { error: false, message: "Successfully updated your course" }
}

export async function deleteCourse(id: string) {
  if (!canDeleteCourses(await getCurrentUser())) {
    return { error: true, message: "Error deleting your course" }
  }

  await deleteCourseDB(id)

  return { error: false, message: "Successfully deleted your course" }
}
