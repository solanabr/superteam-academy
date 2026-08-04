import "server-only";

import type { createAdminClient } from "@/lib/supabase/admin";
import { coursesById } from "@/lib/content/store";
import { CAPSTONE_CREDENTIAL } from "./capstone-gate";

type AdminClient = ReturnType<typeof createAdminClient>;

// ---------------------------------------------------------------------------
// LX-E2 — Capstone credential funnel observability (#725)
// ---------------------------------------------------------------------------
//
// The capstone credential is withheld until `/api/deploy/save` writes a
// verified `deployed_programs` row for the capstone deploy lesson (see
// capstone-gate.ts). That design is fail-closed on purpose, but it makes ONE
// failure mode invisible: if the save path is broken, no row is ever written,
// the gate returns `deploy_required`, the webhook defers the certificate onto
// the retry queue — and "gate correctly withholding an unearned credential"
// looks IDENTICAL to "write path silently broken". Nobody alerts on the
// absence of a row.
//
// This funnel makes that difference legible at a glance. It counts, for the
// capstone course only, the three stages a learner passes through:
//
//   completions  learners who finished the capstone DEPLOY lesson
//                (user_progress.completed) — they reached the deploy step
//   deploys      verified `deployed_programs` rows for that same lesson
//                — the artifact the credential attests
//   deferrals    unresolved `certificate` retry-queue rows parked by the
//                capstone gate (last_error `capstone-gate-…`) — credentials
//                withheld pending a deploy row
//   certificates issued capstone credentials (terminal success)
//
// The tell: `completions > 0 AND deploys === 0 AND deferrals > 0` means
// learners finished the deploy lesson, no verified deploy landed, and
// credentials are piling up unissued — the write path is broken, not merely
// idle. `verdict` encodes exactly that so a human (or an alert) doesn't have
// to eyeball four numbers.

export type CapstoneFunnelVerdict =
  // The capstone course is not in the compiled content bundle — the whole
  // funnel is dormant, not merely quiet. Distinct from `idle` on purpose: idle
  // says "nobody has reached the deploy lesson yet", which would be a lie while
  // the course is parked (see the dormancy note in capstone-identity.ts).
  | "dormant"
  // No learner has reached the deploy lesson yet — nothing to conclude.
  | "idle"
  // Deploy rows are landing (deploys > 0) — the write path demonstrably works.
  | "healthy"
  // Learners completed the deploy lesson and credentials are deferred, yet no
  // deploy row exists: the write path is the prime suspect.
  | "write_path_suspect"
  // Completions without deploys, but nothing is deferred yet — worth watching,
  // not yet alarming (a learner mid-flow, or completion-without-deploy).
  | "watch"
  // A count read failed — cannot judge; treated as non-healthy by callers.
  | "unavailable";

export interface CapstoneFunnel {
  courseId: string;
  deployLessonId: string;
  /** Learners who completed the capstone deploy lesson (user_progress). */
  completions: number;
  /** Verified deploy rows for the capstone deploy lesson. */
  deploys: number;
  /** Unresolved certificate retry-queue rows parked by the capstone gate. */
  deferrals: number;
  /** Capstone credentials actually issued. */
  certificates: number;
  verdict: CapstoneFunnelVerdict;
}

/** Read the exact count off a head+count response, or `null` if it errored. */
function countOrNull(response: {
  count: number | null;
  error: unknown;
}): number | null {
  return response.error ? null : (response.count ?? 0);
}

function decideVerdict(
  completions: number,
  deploys: number,
  deferrals: number
): CapstoneFunnelVerdict {
  if (deploys > 0) return "healthy";
  if (completions === 0) return "idle";
  // completions > 0, deploys === 0
  return deferrals > 0 ? "write_path_suspect" : "watch";
}

/**
 * Read the capstone credential funnel counters via the service-role client.
 * Aggregate counts only (head+count, no rows transferred, no PII). A single
 * failed read collapses `verdict` to `"unavailable"` rather than reporting a
 * misleading "healthy".
 */
export async function getCapstoneFunnel(
  adminClient: AdminClient
): Promise<CapstoneFunnel> {
  const { courseId, deployLessonId } = CAPSTONE_CREDENTIAL;

  // Dormant until track-1 restores: with the capstone course out of the bundle
  // no learner can reach the deploy lesson, so the four counts are structurally
  // zero and reading them would only dress that up as `idle`. Report the real
  // reason and skip the round-trips.
  if (!coursesById.has(courseId)) {
    return {
      courseId,
      deployLessonId,
      completions: 0,
      deploys: 0,
      deferrals: 0,
      certificates: 0,
      verdict: "dormant",
    };
  }

  const [completionsRes, deploysRes, deferralsRes, certificatesRes] =
    await Promise.all([
      adminClient
        .from("user_progress")
        .select("id", { count: "exact", head: true })
        .eq("course_id", courseId)
        .eq("lesson_id", deployLessonId)
        .eq("completed", true),
      adminClient
        .from("deployed_programs")
        .select("id", { count: "exact", head: true })
        .eq("course_id", courseId)
        .eq("lesson_id", deployLessonId),
      adminClient
        .from("pending_onchain_actions")
        .select("id", { count: "exact", head: true })
        .eq("action_type", "certificate")
        .is("resolved_at", null)
        .like("last_error", `capstone-gate-%:${courseId}`),
      adminClient
        .from("certificates")
        .select("id", { count: "exact", head: true })
        .eq("course_id", courseId),
    ]);

  const completions = countOrNull(completionsRes);
  const deploys = countOrNull(deploysRes);
  const deferrals = countOrNull(deferralsRes);
  const certificates = countOrNull(certificatesRes);

  const anyUnavailable =
    completions === null ||
    deploys === null ||
    deferrals === null ||
    certificates === null;

  return {
    courseId,
    deployLessonId,
    completions: completions ?? 0,
    deploys: deploys ?? 0,
    deferrals: deferrals ?? 0,
    certificates: certificates ?? 0,
    verdict: anyUnavailable
      ? "unavailable"
      : decideVerdict(completions, deploys, deferrals),
  };
}
