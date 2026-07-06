import "server-only";

import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import {
  requireAdminAuth,
  adminUnauthorizedResponse,
  AdminAuthError,
} from "@/lib/admin/auth";
import { updateCoursePda } from "@/lib/solana/admin-signer";
import { writeCourseActive } from "@/lib/sanity/admin-mutations";
import { COURSES_CACHE_TAG } from "@/lib/sanity/queries";

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

  const result = await updateCoursePda({ courseId, newIsActive: true });
  if (!result.success) {
    return NextResponse.json(
      { error: result.error ?? "Reactivation failed" },
      { status: 500 }
    );
  }

  // Mirror the on-chain flag into Sanity + purge the catalog cache so the course
  // reappears on /courses immediately.
  let warning: string | undefined;
  try {
    await writeCourseActive(courseId, true);
    revalidateTag(COURSES_CACHE_TAG);
  } catch (err) {
    console.error("[admin/courses/reactivate] Sanity write-back failed:", err);
    warning =
      "Reactivated on-chain, but the catalog flag didn't update — the course may stay hidden until re-synced.";
  }

  return NextResponse.json({
    txSignature: result.signature,
    ...(warning ? { warning } : {}),
  });
}
