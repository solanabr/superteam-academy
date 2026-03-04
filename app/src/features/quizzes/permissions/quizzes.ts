import { UserRole } from "@/drizzle/schema"

type UserLike = { role: UserRole | undefined } | null | undefined

export function canCreateAssignments(user: UserLike) {
  return user?.role === "admin"
}

export function canUpdateAssignments(user: UserLike) {
  return user?.role === "admin"
}

export function canDeleteAssignments(user: UserLike) {
  return user?.role === "admin"
}

export function canGradeSubmissions(user: UserLike) {
  return user?.role === "admin"
}
