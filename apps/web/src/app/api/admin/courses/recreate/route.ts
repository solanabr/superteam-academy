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
} from "@/lib/admin/recreate-course";

/**
 * POST /api/admin/courses/recreate — DESTRUCTIVE. Closes a course's on-chain PDA
 * and recreates it, to rewrite the create-only fields (`creator`, `difficulty`,
 * `trackId`, `trackLevel`, `prerequisite`) that `update_course` cannot touch.
 * See `lib/admin/recreate-course.ts` for the full rationale, the non-atomicity
 * window this is built around, and the 4 safety rails (admin-auth, the H3
 * lesson-count default, the maintenance gate, and the mainnet hard-refusal).
 *
 * Guards, in order:
 *   1. `requireAdminAuth` — the signed `admin_session` cookie AND the same-origin
 *      (CSRF) check that it applies to every state-changing method. No
 *      unauthenticated path to a destructive close.
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
 *   4. `recreateCourse` itself refuses (mainnet, missing signer, bad creator,
 *      a lesson-count superset, a concurrent recreate already in progress, ...)
 *      before anything is touched — see `preflightRecreate`.
 *
 * No UI wires this yet — the confirmation button lands with the /admin/courses
 * screen in a follow-up (WS-2).
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    requireAdminAuth(req);
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

  if (allowUnusualCreator) {
    console.warn(
      `[admin/courses/recreate] ${courseId}: allowUnusualCreator=true acknowledged — bypassing the creator-denylist guard for this recreate.`
    );
  }

  try {
    const result = await recreateCourse(courseId, allowUnusualCreator);
    // The course was closed and recreated — purge the catalog cache so the new
    // PDA / status is served immediately rather than after the 1h ISR window.
    revalidateTag(COURSES_CACHE_TAG);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof RecreateCourseError) {
      // A pre-flight refusal is a bad request: the params were invalid and NOTHING
      // was touched. A close/create failure is a server-side failure — and when
      // `courseIntact` is false the course is DOWN, so the caller must not treat
      // this as a routine error. The message carries the recovery instruction.
      const status = e.phase === "preflight" ? 400 : 500;
      if (!e.courseIntact) {
        console.error(
          `[admin/courses/recreate] ${courseId}: COURSE IS DOWN — ${e.message}`
        );
        // The PDA is gone, so the catalog/admin reads must re-derive from chain.
        revalidateTag(COURSES_CACHE_TAG);
      }
      return NextResponse.json(
        { error: e.message, phase: e.phase, courseIntact: e.courseIntact },
        { status }
      );
    }
    const message = e instanceof Error ? e.message : String(e);
    console.error(`[admin/courses/recreate] ${courseId}: ${message}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
