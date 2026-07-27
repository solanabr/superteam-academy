import "server-only";

import { NextRequest, NextResponse } from "next/server";
import {
  requireAdminAuth,
  adminUnauthorizedResponse,
  AdminAuthError,
} from "@/lib/admin/auth";
import { getCourseById } from "@/lib/content/queries";
import { sendNewCourseAnnouncement } from "@/lib/email/campaign";
import { defaultLocale } from "@/lib/i18n/config";

// Reads the admin cookie + service-role DB (recipient list) — never prerender.
export const dynamic = "force-dynamic";

// The campaign sends SERIALLY: recipients are chunked to Resend's 100/batch
// limit and each batch is followed by a 600ms courtesy delay
// (DELAY_BETWEEN_BATCHES_MS in lib/email/campaign.ts) plus the batch's own
// Resend round-trip. At the default serverless limit that outgrows the window
// after only a few thousand recipients, truncating a send mid-campaign. 300s is
// the Vercel plan's hard ceiling on this project (same value api/build-program
// and api/courses/test-out already use); at ~600ms + round-trip per 100-address
// batch it covers well over ten thousand opted-in recipients — beyond any near-
// term list — and the platform hard-kills at 300s regardless of a larger value.
export const maxDuration = 300;

/**
 * POST /api/admin/email/announce-course — admin-triggered "new course available"
 * announcement to marketing-opted-in users (#769). NO automatic sends: this is
 * the only trigger, behind the admin cookie. Consent + email-on-file gating live
 * in the `list_marketing_recipients` RPC the pipeline reads; this route only
 * resolves the course and hands off.
 *
 * Fail-closed: with no `RESEND_API_KEY` the pipeline returns `unconfigured` and
 * sends nothing (200 with that status, so the admin sees it wasn't sent).
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    requireAdminAuth(req);
  } catch (e) {
    if (e instanceof AdminAuthError) return adminUnauthorizedResponse();
    throw e;
  }

  let courseId: string;
  try {
    const body = (await req.json()) as { courseId?: unknown };
    if (typeof body.courseId !== "string" || !body.courseId) {
      return NextResponse.json(
        { error: "courseId is required" },
        { status: 400 }
      );
    }
    courseId = body.courseId;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const course = await getCourseById(courseId);
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  // Absolute URLs are required in email (unsubscribe + course links).
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_APP_URL must be set to send email" },
      { status: 500 }
    );
  }

  const result = await sendNewCourseAnnouncement({
    courseId,
    courseTitle: course.title,
    courseUrl: `${appUrl}/${defaultLocale}/courses/${course.slug}`,
    appUrl,
  });

  return NextResponse.json(result);
}
