import "server-only";

import { NextRequest, NextResponse } from "next/server";
import {
  requireAdminAuth,
  adminUnauthorizedResponse,
  AdminAuthError,
} from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Admin-only teacher role management (grant/revoke), from the admin panel.
 * Authorized by the HMAC `admin_session` cookie (`requireAdminAuth`) — the same
 * gate as the rest of `/api/admin/*`. Writes go through the service_role client,
 * which is the only caller the `enforce_profile_role_write` trigger lets change
 * `profiles.role`.
 */

function guard(req: NextRequest): NextResponse | null {
  try {
    requireAdminAuth(req);
    return null;
  } catch (e) {
    if (e instanceof AdminAuthError) return adminUnauthorizedResponse();
    throw e;
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const denied = guard(req);
  if (denied) return denied;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id, username, role")
    .eq("role", "teacher")
    .order("username");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ teachers: data ?? [] });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const denied = guard(req);
  if (denied) return denied;

  let username: string;
  let action: "grant" | "revoke";
  try {
    const body = (await req.json()) as { username?: unknown; action?: unknown };
    if (typeof body.username !== "string" || !body.username.trim()) {
      return NextResponse.json(
        { error: "username is required" },
        { status: 400 }
      );
    }
    if (body.action !== "grant" && body.action !== "revoke") {
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

  const admin = createAdminClient();
  const { data: target, error: findErr } = await admin
    .from("profiles")
    .select("id, username, role")
    .eq("username", username)
    .maybeSingle();

  if (findErr) {
    return NextResponse.json({ error: findErr.message }, { status: 500 });
  }
  if (!target) {
    return NextResponse.json(
      { error: `No user found with username "${username}"` },
      { status: 404 }
    );
  }
  // This endpoint only toggles teacher/learner; it must never touch admins.
  if (target.role === "admin") {
    return NextResponse.json(
      { error: "Refusing to change an admin account's role" },
      { status: 409 }
    );
  }

  const newRole = action === "grant" ? "teacher" : "learner";
  const { error: updErr } = await admin
    .from("profiles")
    .update({ role: newRole })
    .eq("id", target.id);

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }
  return NextResponse.json({ username: target.username, role: newRole });
}
