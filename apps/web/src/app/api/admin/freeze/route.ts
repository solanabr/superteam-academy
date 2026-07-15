import "server-only";

import { NextRequest, NextResponse } from "next/server";
import {
  requireAdminAuth,
  adminUnauthorizedResponse,
  AdminAuthError,
} from "@/lib/admin/auth";
import {
  setPlatformFrozen,
  getPlatformFreezeState,
} from "@/lib/platform/freeze";

// Reads/writes the freeze row per request — never statically prerender.
export const dynamic = "force-dynamic";

/**
 * The admin control for the GLOBAL deploy-window freeze (reset wave B2).
 *
 *   GET  → current freeze state (frozen / reason / updatedAt).
 *   POST → set or clear the freeze. Body: `{ frozen: boolean, reason?: string }`.
 *
 * Admin-gated exactly like the other admin routes (signed `admin_session`
 * cookie + the same-origin CSRF check that `requireAdminAuth` applies to every
 * state-changing method). The operator sets `frozen: true` at E1 and
 * `frozen: false` at E5.
 *
 * This route is deliberately NOT gated on the freeze itself — it is the control
 * that clears it — and it performs no on-chain write, so nothing here is
 * blocked while frozen.
 *
 * SQL fallback (no route needed) — the owner can flip the flag directly:
 *   update public.platform_freeze set frozen = true,  reason = 'v-next reset',
 *     updated_at = now() where id;   -- E1: freeze
 *   update public.platform_freeze set frozen = false, updated_at = now()
 *     where id;                      -- E5: unfreeze
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    requireAdminAuth(req);
  } catch (e) {
    if (e instanceof AdminAuthError) return adminUnauthorizedResponse();
    throw e;
  }

  try {
    const state = await getPlatformFreezeState();
    return NextResponse.json(state);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[admin/freeze] read failed:", message);
    return NextResponse.json(
      { error: "Failed to read freeze state" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    requireAdminAuth(req);
  } catch (e) {
    if (e instanceof AdminAuthError) return adminUnauthorizedResponse();
    throw e;
  }

  let frozen: boolean;
  let reason: string | undefined;
  try {
    const body = (await req.json()) as { frozen?: unknown; reason?: unknown };
    if (typeof body.frozen !== "boolean") {
      return NextResponse.json(
        { error: "frozen (boolean) is required" },
        { status: 400 }
      );
    }
    frozen = body.frozen;
    if (body.reason !== undefined) {
      if (typeof body.reason !== "string" || body.reason.length > 500) {
        return NextResponse.json(
          { error: "reason must be a string of at most 500 chars" },
          { status: 400 }
        );
      }
      reason = body.reason;
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    await setPlatformFrozen(frozen, reason);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[admin/freeze] write failed:", message);
    return NextResponse.json(
      { error: "Failed to update freeze state" },
      { status: 500 }
    );
  }

  return NextResponse.json({ frozen, reason: reason ?? null });
}
