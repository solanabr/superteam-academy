import { CourseSectionTable, UserRole } from "@/drizzle/schema"
import { eq } from "drizzle-orm"

type UserLike = { role: UserRole | undefined } | null | undefined

export function canCreateCourseSections(user: UserLike) {
  return user?.role === "admin"
}

export function canUpdateCourseSections(user: UserLike) {
  return user?.role === "admin"
}

export function canDeleteCourseSections(user: UserLike) {
  return user?.role === "admin"
}

export const wherePublicCourseSections = eq(CourseSectionTable.status, "public")