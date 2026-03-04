import { UserRole } from "@/drizzle/schema"


export function canAccessAdminPages(
  user: { role: UserRole | null | undefined } | null | undefined
) {
  return user?.role === "admin"
}