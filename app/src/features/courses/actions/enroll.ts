"use server"

import { db } from "@/drizzle/db"
import { UserCourseAccessTable } from "@/drizzle/schema"
import { revalidateUserCourseAccessCache } from "@/features/courses/db/cache/userCourseAccess"
import { getCurrentUser } from "@/lib/current-user"
import { and, eq } from "drizzle-orm"
import { redirect } from "next/navigation"

export async function enrollInCourse(courseId: string) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/sign-in")
  }

  // Check not already enrolled
  const existing = await db.query.UserCourseAccessTable.findFirst({
    where: and(
      eq(UserCourseAccessTable.userId, user.id),
      eq(UserCourseAccessTable.courseId, courseId)
    ),
  })

  if (existing) {
    return { error: false, message: "Already enrolled" }
  }

  await db
    .insert(UserCourseAccessTable)
    .values({ userId: user.id, courseId })
    .onConflictDoNothing()

  revalidateUserCourseAccessCache({ userId: user.id, courseId })

  return { error: false, message: "Enrolled successfully" }
}
