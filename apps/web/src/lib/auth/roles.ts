import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type UserRole = "learner" | "teacher" | "admin";

/** Teachers and admins may author courses; learners may not. */
export function canAuthorCourses(role: UserRole): boolean {
  return role === "teacher" || role === "admin";
}

/**
 * Read a user's platform role. Uses the service_role client so it works
 * regardless of RLS; defaults to `learner` when the row/column is absent.
 * SERVER-ONLY.
 */
export async function getUserRole(userId: string): Promise<UserRole> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  const role = data?.role;
  return role === "teacher" || role === "admin" ? role : "learner";
}

/**
 * The authenticated user id + role for the current request, or `null` when the
 * request is unauthenticated. Used to gate the teacher authoring area.
 */
export async function getSessionUserAndRole(): Promise<{
  userId: string;
  role: UserRole;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { userId: user.id, role: await getUserRole(user.id) };
}
