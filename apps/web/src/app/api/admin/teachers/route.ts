import "server-only";

import { NextRequest, NextResponse } from "next/server";
import {
  requireAdminAuth,
  adminUnauthorizedResponse,
  AdminAuthError,
} from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

// Only these two roles are grantable through this endpoint. `admin` is
// deliberately excluded — it is NOT grantable here and must never be settable
// by this route (see the strict action enum + explicit role map below).
const ROLE_BY_ACTION = {
  grant: "teacher",
  revoke: "learner",
} as const;

type Action = keyof typeof ROLE_BY_ACTION;

const MAX_USERNAME_LENGTH = 64;

function isAction(value: unknown): value is Action {
  return value === "grant" || value === "revoke";
}

/**
 * POST /api/admin/teachers — grant or revoke the `teacher` role for a user,
 * looked up by username. Admin-only (signed `admin_session` cookie).
 *
 * The role write goes through the service-role client (`createAdminClient`),
 * which the `enforce_profile_role_write` DB trigger recognizes as privileged;
 * a normal user-session client cannot mutate `role`. This endpoint can only
 * ever set `teacher` (grant) or `learner` (revoke) — never `admin`.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    requireAdminAuth(req);
  } catch (e) {
    if (e instanceof AdminAuthError) return adminUnauthorizedResponse();
    throw e;
  }

  let username: string;
  let action: Action;
  try {
    const body = (await req.json()) as {
      username?: unknown;
      action?: unknown;
    };

    if (
      typeof body.username !== "string" ||
      body.username.trim().length === 0 ||
      body.username.trim().length > MAX_USERNAME_LENGTH
    ) {
      return NextResponse.json(
        { error: "username is required" },
        { status: 400 }
      );
    }
    if (!isAction(body.action)) {
      return NextResponse.json(
        { error: "action must be 'grant' or 'revoke'" },
        { status: 400 }
      );
    }

    username = body.username.trim();
    action = body.action;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const role = ROLE_BY_ACTION[action];
  const supabase = createAdminClient();

  const { data: profile, error: lookupError } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", profile.id);

  if (updateError) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json({ username, role });
}
