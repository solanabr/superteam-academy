import { getGlobalTag, getIdTag, getUserTag } from "@/lib/dataCache"
import { revalidateTag } from "next/cache"

export function getUserCourseAccessGlobalTag() {
  return getGlobalTag("userCourseAccess")
}

export function getUserCourseAccessIdTag({
  courseId,
  userId,
}: {
  courseId: string
  userId: string
}) {
  return getIdTag("userCourseAccess", `course:${courseId}-user:${userId}`)
}

export function getUserCourseAccessUserTag(userId: string) {
  return getUserTag("userCourseAccess", userId)
}

export function revalidateUserCourseAccessCache({
  courseId,
  userId,
}: {
  courseId: string
  userId: string
}) {
  revalidateTag(getUserCourseAccessGlobalTag())
  revalidateTag(getUserCourseAccessIdTag({ courseId, userId }))
  revalidateTag(getUserCourseAccessUserTag(userId))
}