import { db } from "@/drizzle/db"
import { UserCourseAccessTable } from "@/drizzle/schema"
import { revalidateUserCourseAccessCache } from "./cache/userCourseAccess"
import { and, eq, inArray } from "drizzle-orm"

export async function addUserCourseAccess(
  {
    userId,
    courseIds,
  }: {
    userId: string
    courseIds: string[]
  },
  trx: Omit<typeof db, "$client"> = db
) {
  const accesses = await trx
    .insert(UserCourseAccessTable)
    .values(courseIds.map(courseId => ({ userId, courseId })))
    .onConflictDoNothing()
    .returning()

  accesses.forEach(revalidateUserCourseAccessCache)

  return accesses
}

export async function revokeUserCourseAccess(
  {
    userId,
    courseIds,
  }: {
    userId: string
    courseIds: string[]
  },
  trx: Omit<typeof db, "$client"> = db
) {
  const revokedAccesses = await trx
    .delete(UserCourseAccessTable)
    .where(
      and(
        eq(UserCourseAccessTable.userId, userId),
        inArray(UserCourseAccessTable.courseId, courseIds)
      )
    )
    .returning()

  revokedAccesses.forEach(revalidateUserCourseAccessCache)

  return revokedAccesses
}
