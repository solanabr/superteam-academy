"use server"

import { z } from "zod"
import { gradingSchema } from "../schemas/quizzes"
import { getCurrentUser } from "@/lib/current-user"
import { revalidateTag } from "next/cache"
import { canGradeSubmissions } from "../permissions/quizzes"
import {
  gradeSubmission as gradeSubmissionDb,
  getSubmissionById,
} from "../db/quizzes"
import {
  getSubmissionGlobalTag,
  getSubmissionIdTag,
  getSubmissionUserTag,
  getSubmissionAssignmentTag,
} from "../db/cache/quizzes"
import { sendAssignmentGradedEmail } from "@/lib/email"
import { db } from "@/drizzle/db"
import { XpEventTable } from "@/drizzle/schema"
import { and, eq } from "drizzle-orm"
import { awardXP } from "@/services/xp"

export async function gradeSubmission(unsafeData: z.infer<typeof gradingSchema>) {
  const { success, data } = gradingSchema.safeParse(unsafeData)

  const user = await getCurrentUser()
  if (!success || !canGradeSubmissions(user)) {
    return { error: true, message: "There was an error grading the submission" }
  }

  if (!user?.id) {
    return { error: true, message: "User not found. Please sign in again." }
  }

  // Get submission details before grading
  const submission = await getSubmissionById(data.submissionId)
  if (!submission) {
    return { error: true, message: "Submission not found" }
  }

  // Grade the submission
  await gradeSubmissionDb(
    data.submissionId,
    data.score,
    data.feedback,
    user.id
  )

  // Revalidate cache
  revalidateTag(getSubmissionGlobalTag())
  revalidateTag(getSubmissionIdTag(data.submissionId))
  revalidateTag(getSubmissionUserTag(submission.userId))
  revalidateTag(getSubmissionAssignmentTag(submission.assignmentId))

  // Award quiz XP once per graded submission
  if (submission.assignment?.xpReward && submission.assignment?.course?.id) {
    const existingXp = await db.query.XpEventTable.findFirst({
      where: and(
        eq(XpEventTable.userId, submission.userId),
        eq(XpEventTable.assignmentId, submission.assignmentId)
      ),
      columns: { id: true },
    })

    if (!existingXp) {
      await awardXP(
        submission.userId,
        submission.assignment.xpReward,
        "quiz_complete",
        submission.assignment.course.id,
        undefined,
        submission.assignmentId
      )
    }
  }

  // Send email notification if requested
  if (data.sendNotification && submission.user?.email) {
    try {
      await sendAssignmentGradedEmail({
        to: submission.user.email,
        studentName: submission.user.name ?? "Student",
        assignmentName: submission.assignment.name,
        courseName: submission.assignment.course.name,
        score: data.score,
        maxScore: submission.assignment.maxScore,
        feedback: data.feedback,
      })
    } catch (error) {
      console.error("Failed to send grading notification email:", error)
      // Don't fail the grading if email fails
    }
  }

  return { error: false, message: "Submission graded successfully" }
}
