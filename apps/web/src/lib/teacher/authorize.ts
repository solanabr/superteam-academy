import "server-only";
import { createClient } from "@/lib/supabase/server";

/** Roles permitted to use the teacher authoring API. */
export type TeacherRole = "teacher" | "admin";

export interface AuthorizedCaller {
  userId: string;
  role: TeacherRole;
}

export type AuthorizeResult =
  | { ok: true; caller: AuthorizedCaller }
  | { ok: false; status: 401 | 403 };

/**
 * Shared server-side gate for every teacher-authoring route (issue #265).
 *
 * 1. Requires an authenticated Supabase session — else 401.
 * 2. Reads the caller's OWN `profiles.role` via the user-session client (RLS
 *    permits own-row SELECT) and requires `teacher` or `admin` — else 403.
 *
 * Role is read from the DB, NOT from any request-supplied value, so a caller
 * cannot claim a role they do not hold. This is the same source of truth the
 * `/teach` layout gate uses.
 */
export async function authorizeTeacher(): Promise<AuthorizeResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, status: 401 };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role;
  if (role !== "teacher" && role !== "admin") {
    return { ok: false, status: 403 };
  }

  return { ok: true, caller: { userId: user.id, role } };
}
