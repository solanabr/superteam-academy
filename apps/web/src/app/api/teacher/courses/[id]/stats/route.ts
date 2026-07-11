import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { coursesById, instructorsById } from "@/lib/content/store";
import { getCourseStats } from "@/lib/teacher/stats";

export const dynamic = "force-dynamic";

/** Resolve a course doc's `instructor` reference id (`{ _ref }`), or null. */
function instructorRefId(course: unknown): string | null {
  const inst = (course as { instructor?: unknown } | undefined)?.instructor;
  if (typeof inst === "object" && inst !== null && "_ref" in inst) {
    const ref = (inst as { _ref?: unknown })._ref;
    return typeof ref === "string" ? ref : null;
  }
  return null;
}

/**
 * GET /api/teacher/courses/[id]/stats — headline stats for a course whose
 * on-chain instructor wallet matches the caller's own linked wallet.
 *
 * SP1 PR-2 Task 7: replaces the retired `profiles.role` / `course.author`
 * authorization with instructor-wallet auth, mirroring the `/teach` viewer:
 * resolve the session's own `wallet_address` via Supabase SSR (RLS-scoped
 * own-row read — no session means no profile row to compare against, hence
 * 401), then compare it against the course's instructor wallet. SP2-B resolves
 * that wallet from the committed content bundle (`coursesById` →
 * `instructorsById`) instead of a Sanity fetch. No fallback and no admin
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
  const refId = instructorRefId(coursesById.get(id));
  const instructor = refId ? instructorsById.get(refId) : undefined;
  const instructorWallet = instructor?.wallet;
  const courseWallet =
    typeof instructorWallet === "string" ? instructorWallet : null;

  if (!courseWallet || courseWallet !== sessionWallet) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const stats = await getCourseStats(id);
  return NextResponse.json(stats);
}
