import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanityFetch } from "@/lib/sanity/client";
import { getCourseStats } from "@/lib/teacher/stats";

export const dynamic = "force-dynamic";

/**
 * GET /api/teacher/courses/[id]/stats — headline stats for a course whose
 * on-chain instructor wallet matches the caller's own linked wallet.
 *
 * SP1 PR-2 Task 7: replaces the retired `profiles.role` / `course.author`
 * authorization with instructor-wallet auth, mirroring the `/teach` viewer
 * (Task 6): resolve the session's own `wallet_address` via Supabase SSR
 * (RLS-scoped own-row read — no session means no profile row to compare
 * against, hence 401), then compare it against the course's
 * `instructor->wallet` in Sanity. No fallback and no admin override — a
 * missing/unresolved course wallet is a 403, same as a mismatched one.
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
  const course = await sanityFetch<{ wallet: string | null } | null>(
    `*[_type=="course" && _id==$id][0]{"wallet": instructor->wallet}`,
    { id },
    0
  );
  const courseWallet = course?.wallet ?? null;

  if (!courseWallet || courseWallet !== sessionWallet) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const stats = await getCourseStats(id);
  return NextResponse.json(stats);
}
