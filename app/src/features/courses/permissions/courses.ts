import { UserRole } from "@/drizzle/schema"

type UserLike = { role: UserRole | undefined } | null | undefined

export function canCreateCourses(user: UserLike) {
  return user?.role === "admin"
}

export function canUpdateCourses(user: UserLike) {
  return user?.role === "admin"
}

export function canDeleteCourses(user: UserLike) {
  return user?.role === "admin"
}