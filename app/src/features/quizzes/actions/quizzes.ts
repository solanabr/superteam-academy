"use server"

import { z } from "zod"
import { assignmentSchema } from "../schemas/quizzes"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/current-user"
import { revalidateTag } from "next/cache"
import {
  canCreateAssignments,
  canDeleteAssignments,
  canUpdateAssignments,
} from "../permissions/quizzes"
import {
  insertAssignment,
  deleteAssignment as deleteAssignmentDB,
  updateAssignment as updateAssignmentDb,
} from "../db/quizzes"
import {
  getAssignmentGlobalTag,
  getAssignmentIdTag,
  getAssignmentCourseTag,
} from "../db/cache/quizzes"

export async function createAssignment(unsafeData: z.infer<typeof assignmentSchema>) {
  const { success, data } = assignmentSchema.safeParse(unsafeData)

  if (!success || !canCreateAssignments(await getCurrentUser())) {
    return { error: true, message: "There was an error creating the assignment" }
  }

  const assignment = await insertAssignment(data)

  if (!assignment) {
    return { error: true, message: "Failed to create assignment" }
  }

  revalidateTag(getAssignmentGlobalTag())
  revalidateTag(getAssignmentCourseTag(data.courseId))

  redirect(`/admin/courses/${data.courseId}/quizzes/${assignment.id}/edit`)
}

export async function updateAssignment(
  id: string,
  unsafeData: z.infer<typeof assignmentSchema>
) {
  const { success, data } = assignmentSchema.safeParse(unsafeData)

  if (!success || !canUpdateAssignments(await getCurrentUser())) {
    return { error: true, message: "There was an error updating the assignment" }
  }

  await updateAssignmentDb(id, data)

  revalidateTag(getAssignmentGlobalTag())
  revalidateTag(getAssignmentIdTag(id))
  revalidateTag(getAssignmentCourseTag(data.courseId))

  return { error: false, message: "Successfully updated the assignment" }
}

export async function deleteAssignment(id: string, courseId: string) {
  if (!canDeleteAssignments(await getCurrentUser())) {
    return { error: true, message: "Error deleting the assignment" }
  }

  await deleteAssignmentDB(id)

  revalidateTag(getAssignmentGlobalTag())
  revalidateTag(getAssignmentIdTag(id))
  revalidateTag(getAssignmentCourseTag(courseId))

  return { error: false, message: "Successfully deleted the assignment" }
}
