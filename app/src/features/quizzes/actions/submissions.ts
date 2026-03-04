"use server"

import { z } from "zod"
import { submissionSchema } from "../schemas/quizzes"
import { getCurrentUser } from "@/lib/current-user"
import { revalidateTag } from "next/cache"
import {
  insertSubmission,
  updateSubmission as updateSubmissionDb,
  getUserSubmissionForAssignment,
  getAssignmentById,
  getSubmissionById,
} from "../db/quizzes"
import {
  getSubmissionGlobalTag,
  getSubmissionIdTag,
  getSubmissionUserTag,
  getSubmissionAssignmentTag,
} from "../db/cache/quizzes"
import { db } from "@/drizzle/db"
import { UserCourseAccessTable } from "@/drizzle/schema"
import { and, eq } from "drizzle-orm"
import { parseQuizConfig, getQuizTotalPoints } from "../lib/quiz"
import { awardXP } from "@/services/xp"

async function canSubmitToAssignment(userId: string, assignmentId: string): Promise<boolean> {
  const assignment = await getAssignmentById(assignmentId)
  if (!assignment) return false

  // Check if user has access to the course
  const access = await db.query.UserCourseAccessTable.findFirst({
    where: and(
      eq(UserCourseAccessTable.userId, userId),
      eq(UserCourseAccessTable.courseId, assignment.courseId)
    ),
  })

  if (!access) return false

  // Check if assignment is published and not closed
  if (assignment.status !== "published") return false

  // Check due date if late submissions not allowed
  if (assignment.dueDate && !assignment.allowLateSubmissions) {
    if (new Date() > assignment.dueDate) return false
  }

  return true
}

export async function submitAssignment(unsafeData: z.infer<typeof submissionSchema>) {
  const { success, data } = submissionSchema.safeParse(unsafeData)

  const user = await getCurrentUser()
  if (!success || !user?.id) {
    return { error: true, message: "There was an error submitting the assignment" }
  }

  const canSubmit = await canSubmitToAssignment(user.id, data.assignmentId)
  if (!canSubmit) {
    return { error: true, message: "You cannot submit to this assignment" }
  }

  // Fetch assignment once for grading + XP
  const assignment = await getAssignmentById(data.assignmentId)
  if (!assignment) {
    return { error: true, message: "Assignment not found" }
  }

  // Server-side grading for quiz submissions
  const quizConfig = parseQuizConfig(assignment.instructions ?? null)
  let serverScore: number | undefined
  let xpAwarded = 0

  if (quizConfig) {
    let answers: Record<string, string> = {}
    try {
      const parsed = JSON.parse(data.textContent ?? "")
      if (parsed?.answers && typeof parsed.answers === "object") {
        answers = parsed.answers
      }
    } catch {}

    const maxScore = getQuizTotalPoints(quizConfig)
    let rawScore = 0
    for (const q of quizConfig.questions) {
      if (answers[q.id] === q.correctOptionId) rawScore += q.points
    }
    serverScore = rawScore

    // Proportional XP: each correct answer earns its share of total quiz XP
    if (maxScore > 0 && (assignment.xpReward ?? 0) > 0) {
      xpAwarded = Math.round((rawScore / maxScore) * assignment.xpReward!)
    }
  }

  // Check if user already has a submission
  const existingSubmission = await getUserSubmissionForAssignment(user.id, data.assignmentId)

  if (existingSubmission) {
    // Update existing submission (no XP re-award on retake)
    await updateSubmissionDb(existingSubmission.id, {
      ...data,
      score: serverScore,
      status: quizConfig ? "graded" : "submitted",
      submittedAt: new Date(),
    })
    revalidateTag(getSubmissionIdTag(existingSubmission.id))
  } else {
    // First submission — save and award XP
    await insertSubmission({
      ...data,
      userId: user.id,
      score: serverScore,
      status: quizConfig ? "graded" : "submitted",
      submittedAt: new Date(),
    })

    if (xpAwarded > 0) {
      await awardXP(
        user.id,
        xpAwarded,
        "quiz_complete",
        assignment.courseId ?? undefined,
        undefined,
        data.assignmentId,
      )
    }
  }

  revalidateTag(getSubmissionGlobalTag())
  revalidateTag(getSubmissionUserTag(user.id))
  revalidateTag(getSubmissionAssignmentTag(data.assignmentId))

  return { error: false, message: "Quiz submitted successfully", xpAwarded }
}

export async function updateSubmission(
  id: string,
  unsafeData: Partial<z.infer<typeof submissionSchema>>
) {
  const user = await getCurrentUser()
  if (!user?.id) {
    return { error: true, message: "You must be logged in" }
  }

  const submission = await getSubmissionById(id)
  if (!submission) {
    return { error: true, message: "Submission not found" }
  }

  const isAdmin = user.role === "admin"
  const isOwner = submission.userId === user.id
  if (!isAdmin && !isOwner) {
    return { error: true, message: "Forbidden" }
  }

  await updateSubmissionDb(id, unsafeData)

  revalidateTag(getSubmissionGlobalTag())
  revalidateTag(getSubmissionIdTag(id))
  revalidateTag(getSubmissionUserTag(user.id))

  return { error: false, message: "Submission updated successfully" }
}
