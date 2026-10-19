import "server-only";

import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import {
  requireAdminAuth,
  adminUnauthorizedResponse,
  AdminAuthError,
} from "@/lib/admin/auth";
import { COURSES_CACHE_TAG } from "@/lib/content/queries";
import {
  recreateCourse,
  RecreateCourseError,
  type RecreatePhase,
} from "@/lib/admin/recreate-course";
import { sanitizeReason } from "@/lib/admin/sanitize-reason";

// 300 is the Vercel plan ceiling, as in api/build-program. Mainnet worst case
// is about 250s (about 258s with every bound hit): reads ~4s, deactivate 31s,
// a close that lands just before its blockhash expires ~83s (hard cap 90s),
// three creates ~97s, one restore update 31s, DB writes ~2s. A kill mid-way
// leaves the course inactive or down behind the maintenance gate, which
// expires after 10 minutes.
export const maxDuration = 300;

/**
 * preflight: refused, nothing touched. freeze (mainnet): stopped before the
 * close; the message says whether the course was re-activated or left
 * inactive. close/create: a server-side failure; `courseIntact: false` means
 * the course is down or its state is unknown.
 */
const STATUS_BY_PHASE: Record<RecreatePhase, number> = {
  preflight: 400,
  freeze: 409,
  close: 500,
  create: 500,
};

/**
 * POST /api/admin/courses/recreate — DESTRUCTIVE. Closes a course's on-chain PDA
 * and recreates it, to rewrite the create-only fields (`creator`, `difficulty`,
 * `trackId`, `trackLevel`, `prerequisite`) that `update_course` cannot touch.
 * See `lib/admin/recreate-course.ts` for the full rationale, the non-atomicity
 * window this is built around, and the 4 safety rails (admin-auth, the H3
 * lesson-count default, the maintenance gate, and the cluster rail: devnet, or
 * mainnet only while the course has zero enrollments).
 *
 * Guards, in order:
 *   1. `requireAdminAuth` — the caller's Supabase session must belong to a user
 *      on the `admin_users` allowlist, AND the same-origin (CSRF) check applies
 *      to every state-changing method. No unauthenticated path to a
 *      destructive close.
 *   2. An explicit `confirm` field that must EQUAL the target `courseId`. A
 *      CSRF-ish or fat-fingered call that merely reaches this route cannot
 *      destroy a course without naming it exactly. Checked before any on-chain
 *      call is made.
 *   3. F4 — `allowUnusualCreator` re-opens the #427/#440 creator-denylist guard
 *      inside `preflightRecreate`. A bare request-body boolean is too easy to
 *      flip by accident (or by a naive client bug) for a guard whose entire
 *      purpose is catching exactly this kind of mistake — so honoring it also
 *      requires `acknowledgeUnusualCreator` to equal the `courseId`, a SECOND,
 *      independent field naming the same course, mirroring the `confirm` gate
 *      above. Checked before any on-chain call is made.
 *   4. `recreateCourse` itself refuses (an unknown or mislabelled cluster, a
 *      mainnet course with enrollments, missing signer, bad creator, a
 *      lesson-count superset, a concurrent recreate already in progress, ...)
 *      before anything is touched — see `preflightRecreate`. On mainnet
 *      `allowUnusualCreator` is ignored there, and `recreateCourse` logs the
 *      bypass only when it is applied.
 *
 * No UI wires this yet — the confirmation button lands with the /admin/courses
 * screen in a follow-up (WS-2).
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  let adminUserId: string;
  try {
    ({ userId: adminUserId } = await requireAdminAuth(req));
  } catch (e) {
    if (e instanceof AdminAuthError) return adminUnauthorizedResponse();
    throw e;
  }

  let courseId: string;
  let confirm: string;
  let allowUnusualCreator = false;
  try {
    const body = (await req.json()) as {
      courseId?: unknown;
      confirm?: unknown;
      allowUnusualCreator?: unknown;
      acknowledgeUnusualCreator?: unknown;
    };
    if (typeof body.courseId !== "string" || !body.courseId) {
      return NextResponse.json(
        { error: "courseId is required" },
        { status: 400 }
      );
    }
    if (typeof body.confirm !== "string" || !body.confirm) {
      return NextResponse.json(
        {
          error:
            "confirm is required and must equal the courseId — this operation destroys an on-chain account",
        },
        { status: 400 }
      );
    }
    courseId = body.courseId;
    confirm = body.confirm;

    // F4 — do not honor a bare `allowUnusualCreator: true`. It bypasses the
    // #427/#440 creator-denylist guard, so re-opening it must be a deliberate,
    // explicit choice naming the exact course — not a flag a naive client
    // could set (or leave set) by accident. Mirrors the `confirm` gate: a
    // SECOND field that must equal the courseId, distinct from `confirm`.
    const wantsUnusualCreator = body.allowUnusualCreator === true;
    if (wantsUnusualCreator && body.acknowledgeUnusualCreator !== courseId) {
      return NextResponse.json(
        {
          error:
            "allowUnusualCreator requires acknowledgeUnusualCreator to equal the courseId — " +
            "this bypasses the creator-denylist guard (#427/#440) and must be an explicit, deliberate choice",
        },
        { status: 400 }
      );
    }
    allowUnusualCreator = wantsUnusualCreator;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // The confirmation gate. Nothing on-chain has been touched at this point.
  if (confirm !== courseId) {
    return NextResponse.json(
      {
        error: `confirm "${confirm}" does not match courseId "${courseId}" — refusing to close the course`,
      },
      { status: 400 }
    );
  }

  try {
    const result = await recreateCourse(
      courseId,
      allowUnusualCreator,
      adminUserId
    );
    // Audit trail for the destructive path: who recreated what.
    console.log(
      `[admin/courses/recreate] ${courseId} (admin=${adminUserId}): recreate complete`
    );
    // The course was closed and recreated — purge the catalog cache so the new
    // PDA / status is served immediately rather than after the 1h ISR window.
    revalidateTag(COURSES_CACHE_TAG);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof RecreateCourseError) {
      // When `courseIntact` is false the course is DOWN (or unknown), so the
      // caller must not treat this as a routine error. The message carries the
      // recovery instruction.
      const status = STATUS_BY_PHASE[e.phase];
      if (!e.courseIntact) {
        console.error(
          `[admin/courses/recreate] ${courseId} (admin=${adminUserId}): COURSE IS DOWN — ${e.message}`
        );
        // The PDA is gone, so the catalog/admin reads must re-derive from chain.
        revalidateTag(COURSES_CACHE_TAG);
      }
      // Scrub before returning: e.message wraps closeCoursePda/deployCoursePda
      // errors that can embed the api-keyed RPC URL (SOLANA_RPC_URL) or a secret
      // env name. The response `reason` is rendered verbatim client-side and can
      // flow into session-replay/telemetry, so redact at the source. Server logs
      // above keep the full message for debugging.
      return NextResponse.json(
        {
          error: sanitizeReason(e.message),
          phase: e.phase,
          courseIntact: e.courseIntact,
          ...(e.errorId ? { errorId: e.errorId } : {}),
        },
        { status }
      );
    }
    const message = e instanceof Error ? e.message : String(e);
    console.error(
      `[admin/courses/recreate] ${courseId} (admin=${adminUserId}): ${message}`
    );
    return NextResponse.json(
      { error: sanitizeReason(message) },
      { status: 500 }
    );
  }
}
