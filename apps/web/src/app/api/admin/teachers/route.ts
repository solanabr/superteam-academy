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

// The identifier is a wallet address (base58, 32-44 chars) OR a username; keep a
// generous bound covering both.
const MAX_IDENTIFIER_LENGTH = 64;

function isAction(value: unknown): value is Action {
  return value === "grant" || value === "revoke";
}

/**
 * GET /api/admin/teachers — list current teachers (for the admin panel).
 * Admin-only (signed `admin_session` cookie).
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    requireAdminAuth(req);
  } catch (e) {
    if (e instanceof AdminAuthError) return adminUnauthorizedResponse();
    throw e;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, wallet_address, role")
    .eq("role", "teacher")
    .order("username");

  if (error) {
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
  return NextResponse.json({ teachers: data ?? [] });
}

/**
 * POST /api/admin/teachers — grant or revoke the `teacher` role for a user,
 * looked up by `identifier` (wallet address OR username). Admin-only (signed
 * `admin_session` cookie).
 *
 * Wallet address is the primary identifier, but `wallet_address` is nullable —
 * Google/GitHub-only accounts never link one. Falling back to username keeps
 * those wallet-less accounts (and any teacher granted before a wallet was
 * linked) manageable instead of stranding them (see PR #311 review).
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

  let identifier: string;
  let action: Action;
  try {
    const body = (await req.json()) as {
      identifier?: unknown;
      action?: unknown;
    };

    if (
      typeof body.identifier !== "string" ||
      body.identifier.trim().length === 0 ||
      body.identifier.trim().length > MAX_IDENTIFIER_LENGTH
    ) {
      return NextResponse.json(
        { error: "identifier is required (wallet address or username)" },
        { status: 400 }
      );
    }
    if (!isAction(body.action)) {
      return NextResponse.json(
        { error: "action must be 'grant' or 'revoke'" },
        { status: 400 }
      );
    }

    identifier = body.identifier.trim();
    action = body.action;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const role = ROLE_BY_ACTION[action];
  const supabase = createAdminClient();
  const profileColumns = "id, username, wallet_address, role";

  // Resolve the target: wallet address first (the common case), then username.
  const byWallet = await supabase
    .from("profiles")
    .select(profileColumns)
    .eq("wallet_address", identifier)
    .maybeSingle();
  if (byWallet.error) {
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }

  let profile = byWallet.data;
  if (!profile) {
    const byUsername = await supabase
      .from("profiles")
      .select(profileColumns)
      .eq("username", identifier)
      .maybeSingle();
    if (byUsername.error) {
      return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
    }
    profile = byUsername.data;
  }

  if (!profile) {
    return NextResponse.json(
      { error: "No user found with that wallet address or username" },
      { status: 404 }
    );
  }
  // This endpoint only toggles teacher <-> learner; never touch admin accounts.
  if (profile.role === "admin") {
    return NextResponse.json(
      { error: "Refusing to change an admin account's role" },
      { status: 409 }
    );
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", profile.id);

  if (updateError) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json({
    username: profile.username,
    walletAddress: profile.wallet_address,
    role,
  });
}
