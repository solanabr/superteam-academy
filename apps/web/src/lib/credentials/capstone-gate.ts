import "server-only";

import { getLabConnection } from "@/lib/solana/lab-server";
import { parseWalletAddress } from "@/lib/solana/linked-wallet";
import { isDevnetFailClosed } from "@/lib/solana/network";
import { verifyProgramDeployment } from "@/lib/solana/verify-program-deploy";
import type { createAdminClient } from "@/lib/supabase/admin";
import { CAPSTONE_CREDENTIAL, isCapstoneCourse } from "./capstone-identity";

type AdminClient = ReturnType<typeof createAdminClient>;

// The capstone identity itself lives in `./capstone-identity` — a
// non-`server-only` module, so the lesson client can render the AI hard-off
// (#867) from the SAME constant instead of a forked string. Re-exported here so
// every existing `@/lib/credentials/capstone-gate` importer is unchanged; this
// file remains the home of the gate's database logic.
export {
  CAPSTONE_CREDENTIAL,
  isCapstoneCourse,
  isCapstoneLesson,
} from "./capstone-identity";

// ---------------------------------------------------------------------------
// LX-E2 — Capstone-gated credential (owner decision O-2)
// ---------------------------------------------------------------------------
//
// The "Zero to Deployed" spine terminates in ONE graded, follow-along deploy:
// the learner ships the reference vault to devnet under their own upgrade
// authority. That deploy is the artifact the capstone credential attests, so
// the credential for the capstone course is withheld until both hold:
//
//   1. a `deployed_programs` row exists for the capstone deploy lesson. The
//      table has NO client INSERT/UPDATE RLS policy
//      (20260726121000_lockdown_deployed_programs_rls); its only write path is
//      `/api/deploy/save`, which records the program a lab key deployed.
//   2. at check time that program is live and executable on devnet, and its
//      upgrade authority is the learner's linked wallet
//      (`profiles.wallet_address`).
//
// The gate counts a deploy whose upgrade authority is the linked wallet. A
// row alone does not open it: the row says which program to read, and the
// chain says whose it is. The program is read through the lab's server
// connection, after the same devnet genesis check the save route makes.
//
// Identity is an app-side constant for launch (see `./capstone-identity`); a
// content-schema flag comes later. Those values MUST match what the deploy
// panel writes to `deployed_programs`:
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

export type CapstoneGateResult =
  // The course is not the capstone — the deploy gate does not apply; issue as usual.
  | { status: "not_capstone" }
  // Capstone course AND the recorded deploy's upgrade authority is the
  // learner's linked wallet — the credential may issue.
  | { status: "allowed" }
  // Capstone course but no such deploy: no row, no linked wallet, or a program
  // whose upgrade authority is not the linked wallet — withhold (fail-closed).
  | { status: "deploy_required" }
  // Capstone course but the deploy could not be checked: a database or RPC
  // read failed, or the lab RPC is not on devnet — withhold (fail-closed).
  | { status: "indeterminate" };

/**
 * Decide whether a course credential may be issued to `userId`.
 *
 * Fail-closed by construction: a non-capstone course always returns
 * `not_capstone`; the capstone course returns `allowed` ONLY when the
 * `deployed_programs` row for the capstone deploy lesson names a program that
 * is, right now, live on devnet with the learner's linked wallet as its
 * upgrade authority. Every read that fails returns `indeterminate` (never
 * `allowed`), so a database or RPC error can never open the gate — callers
 * defer/deny on both `deploy_required` and `indeterminate`.
 */
export async function checkCapstoneCredentialGate(
  adminClient: AdminClient,
  userId: string,
  courseId: string
): Promise<CapstoneGateResult> {
  if (!isCapstoneCourse(courseId)) return { status: "not_capstone" };

  const { data, error } = await adminClient
    .from("deployed_programs")
    .select("program_id")
    .eq("user_id", userId)
    .eq("course_id", CAPSTONE_CREDENTIAL.courseId)
    .eq("lesson_id", CAPSTONE_CREDENTIAL.deployLessonId)
    .limit(1)
    .maybeSingle();

  if (error) return { status: "indeterminate" };
  if (!data) return { status: "deploy_required" };
  const programId = parseWalletAddress(data.program_id);
  if (!programId) return { status: "deploy_required" };

  // The wallet the deploy must belong to: the learner's linked wallet, read
  // for this user id and never taken from a request.
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("wallet_address")
    .eq("id", userId)
    .maybeSingle();
  if (profileError) return { status: "indeterminate" };
  const linkedWallet = parseWalletAddress(profile?.wallet_address);
  if (!linkedWallet) return { status: "deploy_required" };

  try {
    // The lab connection, never the Academy one: the program is on devnet,
    // and the Academy RPC can be on another chain. Anything but devnet's
    // genesis hash is refused before the program is read.
    const connection = getLabConnection();
    if (!(await isDevnetFailClosed(() => connection.getGenesisHash()))) {
      return { status: "indeterminate" };
    }
    const verification = await verifyProgramDeployment(
      connection,
      programId,
      linkedWallet
    );
    return verification.ok
      ? { status: "allowed" }
      : { status: "deploy_required" };
  } catch {
    // The genesis hash or the program could not be read. Not an answer.
    return { status: "indeterminate" };
  }
}
