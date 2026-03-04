"use server"

import { getCurrentUser } from "@/lib/current-user"
import { canUpdateUserLessonCompleteStatus } from "../permissions/userLessonComplete"
import { updateLessonCompleteStatus as updateLessonCompleteStatusDb } from "../db/userLessonComplete"
import { awardXP } from "@/services/xp"
import { db } from "@/drizzle/db"
import { CourseSectionTable, LessonTable } from "@/drizzle/schema"
import { eq } from "drizzle-orm"

export async function updateLessonCompleteStatus(
  lessonId: string,
  complete: boolean,
  lessonIndex?: number
) {
  const currentUser = await getCurrentUser()
  const userId = currentUser?.id

  const hasPermission = await canUpdateUserLessonCompleteStatus(
    { userId },
    lessonId
  )

  if (userId == null || !hasPermission) {
    return { error: true, message: "Error updating lesson completion status" }
  }

  const completion = await updateLessonCompleteStatusDb({ lessonId, userId, complete })

  // Award XP when completing a lesson
  if (complete && completion) {
    const lesson = await db.query.LessonTable.findFirst({
      where: eq(LessonTable.id, lessonId),
      columns: { xpReward: true, sectionId: true },
    })
    if (lesson) {
      const section = await db.query.CourseSectionTable.findFirst({
        where: eq(CourseSectionTable.id, lesson.sectionId),
        columns: { courseId: true },
      })
      await awardXP(
        userId,
        lesson.xpReward ?? 0,
        "lesson_complete",
        section?.courseId ?? undefined,
        lessonId
      )

      // Fire on-chain complete_lesson in the background (non-blocking)
      // lessonIndex is the 0-based position in the bitmap — pass it from the lesson view
      if (lessonIndex !== undefined && lessonIndex >= 0) {
        const baseUrl =
          process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
        fetch(`${baseUrl}/api/lessons/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lessonId, lessonIndex }),
        }).catch((err) => {
          console.error("[complete_lesson onchain]", err)
        })
      }
    }
  }

  return {
    error: false,
    message: "Successfully updated lesson completion status",
  }
}
