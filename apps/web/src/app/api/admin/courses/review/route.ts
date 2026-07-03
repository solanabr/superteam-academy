import "server-only";

import { NextRequest, NextResponse } from "next/server";
import {
  requireAdminAuth,
  adminUnauthorizedResponse,
  AdminAuthError,
} from "@/lib/admin/auth";
import { approveCourse, rejectCourse } from "@/lib/sanity/admin-mutations";

// Auth/cookie-gated + Sanity write — never statically prerender.
export const dynamic = "force-dynamic";

// Upper bound on rejection feedback. Keeps the note human-sized and prevents a
// malformed/oversized body from being persisted onto the course document.
const MAX_FEEDBACK_LENGTH = 2000;

/**
 * Admin-only review action for teacher-submitted courses (issue #268).
 *
 * This endpoint sets the authoring status ONLY:
 *   - approve → authoringStatus = "approved" (clears reviewFeedback)
 *   - reject  → authoringStatus = "draft" + stores reviewFeedback
 *
 * The on-chain course-sync is intentionally NOT triggered here — the admin UI
 * calls the existing `/api/admin/courses/sync` after a successful approve, so
 * the complex sync flow lives in exactly one place. The status this endpoint
 * can write is fixed by the server (approved | draft); arbitrary states can
 * never be set from client input.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    requireAdminAuth(req);
  } catch (e) {
    if (e instanceof AdminAuthError) return adminUnauthorizedResponse();
    throw e;
  }

  let courseId: string;
  let action: "approve" | "reject";
  let feedback: string | undefined;

  try {
    const body = (await req.json()) as {
      courseId?: unknown;
      action?: unknown;
      feedback?: unknown;
    };

    if (typeof body.courseId !== "string" || body.courseId.trim() === "") {
      return NextResponse.json(
        { error: "courseId is required" },
        { status: 400 }
      );
    }
    courseId = body.courseId;

    if (body.action !== "approve" && body.action !== "reject") {
      return NextResponse.json(
        { error: 'action must be "approve" or "reject"' },
        { status: 400 }
      );
    }
    action = body.action;

    if (action === "reject") {
      if (typeof body.feedback !== "string" || body.feedback.trim() === "") {
        return NextResponse.json(
          { error: "feedback is required when rejecting" },
          { status: 400 }
        );
      }
      if (body.feedback.length > MAX_FEEDBACK_LENGTH) {
        return NextResponse.json(
          {
            error: `feedback exceeds ${MAX_FEEDBACK_LENGTH} characters`,
          },
          { status: 400 }
        );
      }
      feedback = body.feedback;
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    if (action === "approve") {
      await approveCourse(courseId);
      return NextResponse.json({ status: "approved" });
    }

    await rejectCourse(courseId, feedback!);
    return NextResponse.json({ status: "draft" });
  } catch (e) {
    // Generic message only — never leak Sanity internals / stack traces.
    console.error("[admin/courses/review] mutation failed:", e);
    return NextResponse.json(
      { error: "Failed to update course status" },
      { status: 500 }
    );
  }
}
