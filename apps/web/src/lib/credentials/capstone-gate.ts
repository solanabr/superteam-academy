import "server-only";

import type { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

// ---------------------------------------------------------------------------
// LX-E2 — Capstone-gated credential (owner decision O-2)
// ---------------------------------------------------------------------------
//
// The "Zero to Deployed" spine terminates in ONE graded, follow-along deploy:
// the learner ships the reference vault to devnet under their own upgrade
// authority. That verified deploy is the artifact the capstone credential
// attests, so the credential for the capstone course is withheld until a
// verified `deployed_programs` row exists for the capstone deploy lesson.
//
// "Verified" is load-bearing: `deployed_programs` has NO client INSERT/UPDATE
// RLS policy (20260726120000_lockdown_deployed_programs_rls), and the only
// write path is `/api/deploy/save`, which first confirms on-chain that the
// program is live, executable, and upgrade-authority-owned by the learner's
// linked wallet (#620 / LX-E1). A row therefore means a real, attributable
// deploy — not a self-reported claim.
//
// Identity is an app-side constant for launch; a content-schema flag comes
// later. The values below MUST match what the deploy panel writes to
// `deployed_programs`:
//   - courseId       = the page-level course `_id`   (courseInfo._id)
//   - deployLessonId = the lesson hosting the `deployed-program-card` block
//                      (ctx.lesson._id)
// Both are asserted against the committed content bundle in the accompanying
// test, so a content rename cannot silently break the gate (which would then
// deny every legitimate capstone credential).
//
// GRANDFATHERING: this gate never revokes. All three credential paths short-
// circuit on an already-issued credential (on-chain `credential_asset` / an
// existing `certificates` row) BEFORE reaching the gate, so pre-gate devnet
// certificates minted without a recorded deploy stay valid and are never
// re-evaluated.

export const CAPSTONE_CREDENTIAL = {
  courseId: "course-building-first-program",
  deployLessonId: "lesson-bfsp-m4-capstone",
} as const;

/** Whether a course's credential is subject to the capstone deploy gate. */
export function isCapstoneCourse(courseId: string): boolean {
  return courseId === CAPSTONE_CREDENTIAL.courseId;
}

export type CapstoneGateResult =
  // The course is not the capstone — the deploy gate does not apply; issue as usual.
  | { status: "not_capstone" }
  // Capstone course AND a verified deploy row exists — the credential may issue.
  | { status: "allowed" }
  // Capstone course but no verified deploy yet — withhold (fail-closed).
  | { status: "deploy_required" }
  // Capstone course but the deploy state could not be read — withhold (fail-closed).
  | { status: "indeterminate" };

/**
 * Decide whether a course credential may be issued to `userId`.
 *
 * Fail-closed by construction: a non-capstone course always returns
 * `not_capstone`; the capstone course returns `allowed` ONLY when a verified
 * `deployed_programs` row for the capstone deploy lesson exists. A read error
 * returns `indeterminate` (never `allowed`), so a database blip can never leak
 * an ungated credential — callers defer/deny on both `deploy_required` and
 * `indeterminate`.
 */
export async function checkCapstoneCredentialGate(
  adminClient: AdminClient,
  userId: string,
  courseId: string
): Promise<CapstoneGateResult> {
  if (!isCapstoneCourse(courseId)) return { status: "not_capstone" };

  const { data, error } = await adminClient
    .from("deployed_programs")
    .select("id")
    .eq("user_id", userId)
    .eq("course_id", CAPSTONE_CREDENTIAL.courseId)
    .eq("lesson_id", CAPSTONE_CREDENTIAL.deployLessonId)
    .limit(1)
    .maybeSingle();

  if (error) return { status: "indeterminate" };
  return data ? { status: "allowed" } : { status: "deploy_required" };
}
