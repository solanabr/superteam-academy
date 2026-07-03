import "server-only";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type UserRole = "learner" | "teacher" | "admin";

/** Teachers and admins may author courses; learners may not. */
export function canAuthorCourses(role: UserRole): boolean {
  return role === "teacher" || role === "admin";
}

/**
 * The authenticated user id + role for the current request, or `null` when
 * unauthenticated. Role is read from the caller's OWN `profiles` row via the
 * user-session client (RLS permits own-row SELECT); it is never writable here.
 * SERVER-ONLY.
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

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = data?.role;
  return {
    userId: user.id,
    role: role === "teacher" || role === "admin" ? role : "learner",
  };
}

/**
 * Guard for teacher API routes: returns the authenticated author `{ userId,
 * role }`, or a ready-to-return NextResponse (401 unauthenticated, 403
 * non-author). Callers do `if (authed instanceof NextResponse) return authed;`.
 */
export async function requireCourseAuthor(): Promise<
  { userId: string; role: UserRole } | NextResponse
> {
  const session = await getSessionUserAndRole();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canAuthorCourses(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return session;
}
