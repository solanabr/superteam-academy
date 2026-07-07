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

// Solana base58 addresses are 32-44 chars; keep a generous bound.
const MAX_WALLET_LENGTH = 64;

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
 * looked up strictly by wallet address. Admin-only (signed `admin_session`
 * cookie).
 *
 * Wallet address is the only identifier accepted (issue #320): teacher features
 * are on-chain (creator rewards pay a linked wallet), so a teacher must have a
 * wallet anyway. Google/GitHub-only accounts with no `wallet_address` can't be
 * targeted here — they need a wallet linked first.
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

  let walletAddress: string;
  let action: Action;
  try {
    const body = (await req.json()) as {
      walletAddress?: unknown;
      action?: unknown;
    };

    if (
      typeof body.walletAddress !== "string" ||
      body.walletAddress.trim().length === 0 ||
      body.walletAddress.trim().length > MAX_WALLET_LENGTH
    ) {
      return NextResponse.json(
        { error: "walletAddress is required" },
        { status: 400 }
      );
    }
    if (!isAction(body.action)) {
      return NextResponse.json(
        { error: "action must be 'grant' or 'revoke'" },
        { status: 400 }
      );
    }

    walletAddress = body.walletAddress.trim();
    action = body.action;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const role = ROLE_BY_ACTION[action];
  const supabase = createAdminClient();

  const { data: profile, error: lookupError } = await supabase
    .from("profiles")
    .select("id, username, wallet_address, role")
    .eq("wallet_address", walletAddress)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
  if (!profile) {
    return NextResponse.json(
      { error: "No user found with that wallet address" },
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
