import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { coursesById } from "@/lib/content/store";
import { getCourseStats } from "@/lib/teacher/stats";

export const dynamic = "force-dynamic";

/** A course doc's `creator` wallet (issue #478), or null when unset. */
function creatorWallet(course: unknown): string | null {
  const creator = (course as { creator?: unknown } | undefined)?.creator;
  return typeof creator === "string" ? creator : null;
}

/**
 * GET /api/teacher/courses/[id]/stats — headline stats for a course whose
 * on-chain creator wallet matches the caller's own linked wallet.
 *
 * SP1 PR-2 Task 7: replaces the retired `profiles.role` / `course.author`
 * authorization with creator-wallet auth, mirroring the `/teach` viewer:
 * resolve the session's own `wallet_address` via Supabase SSR (RLS-scoped
 * own-row read — no session means no profile row to compare against, hence
 * 401), then compare it against the course's `creator` wallet (issue #478:
 * read directly off the committed content bundle's `coursesById`, no
 * separate instructor document to deref). No fallback and no admin
 * override — a missing/unresolved course wallet is a 403, same as a mismatched
 * one.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("wallet_address")
    .eq("id", user.id)
    .maybeSingle();
  const sessionWallet = profile?.wallet_address ?? null;

  const { id } = await params;
  const courseWallet = creatorWallet(coursesById.get(id));

  if (!courseWallet || courseWallet !== sessionWallet) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const stats = await getCourseStats(id);
  return NextResponse.json(stats);
}
