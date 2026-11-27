import "server-only";

import { NextRequest, NextResponse } from "next/server";
import {
  requireAdminAuth,
  adminUnauthorizedResponse,
  AdminAuthError,
} from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseXHandle } from "@/lib/profiles/x-account";
import {
  toVerifiedKind,
  type VerifiedKind,
} from "@/lib/profiles/public-profile";

// Reads the admin cookie + service-role DB — never statically prerender.
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface VerifiedAuthor {
  id: string;
  username: string;
  displayName: string | null;
  verifiedKind: VerifiedKind | null;
  xUsername: string | null;
}

/**
 * GET /api/admin/authors — every verified, non-deleted author, for the Authors
 * screen. Service-role read: `x_username` on a private profile is not in
 * public_profiles.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    await requireAdminAuth(req);
  } catch (e) {
    if (e instanceof AdminAuthError) return adminUnauthorizedResponse(e);
    throw e;
  }

  const { data, error } = await createAdminClient()
    .from("profiles")
    .select("id, username, display_name, verified_kind, x_username")
    .eq("verified", true)
    .is("deleted_at", null)
    .order("username");

  if (error) {
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }

  const authors: VerifiedAuthor[] = (data ?? []).map((row) => ({
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    verifiedKind: toVerifiedKind(row.verified_kind),
    xUsername: row.x_username,
  }));
  return NextResponse.json({ authors });
}

/**
 * POST /api/admin/authors — set or clear a verified author's X handle.
 * Body: `{ userId, xUsername }`, where `xUsername` is what the admin typed
 * (`handle`, `@handle` or an x.com URL) or `null`/empty to clear it. Only a
 * verified profile is written: the database refuses a handle on anyone else
 * (`chk_profiles_x_username`), and the filter here turns that into a 404.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    await requireAdminAuth(req);
  } catch (e) {
    if (e instanceof AdminAuthError) return adminUnauthorizedResponse(e);
    throw e;
  }

  let userId: string;
  let xUsername: string | null;
  try {
    const body = (await req.json()) as {
      userId?: unknown;
      xUsername?: unknown;
    };
    if (typeof body.userId !== "string" || !UUID.test(body.userId)) {
      return NextResponse.json({ error: "invalidUser" }, { status: 400 });
    }
    userId = body.userId;

    if (body.xUsername === null || body.xUsername === "") {
      xUsername = null;
    } else if (typeof body.xUsername === "string") {
      xUsername = parseXHandle(body.xUsername);
      if (!xUsername) {
        return NextResponse.json({ error: "invalidHandle" }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: "invalidHandle" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { data, error } = await createAdminClient()
    .from("profiles")
    .update({ x_username: xUsername })
    .eq("id", userId)
    .eq("verified", true)
    .is("deleted_at", null)
    .select("id");

  if (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
  if (!data?.length) {
    return NextResponse.json({ error: "notVerified" }, { status: 404 });
  }
  return NextResponse.json({ xUsername });
}
