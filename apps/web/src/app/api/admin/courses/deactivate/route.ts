import "server-only";

import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import {
  requireAdminAuth,
  adminUnauthorizedResponse,
  AdminAuthError,
} from "@/lib/admin/auth";
import { isPlatformFrozen } from "@/lib/platform/freeze";
import { platformFrozenResponse } from "@/lib/platform/freeze-http";
import { deactivateCoursePda } from "@/lib/solana/admin-signer";
import { writeCourseActive } from "@/lib/content/deployment-writes";
import { COURSES_CACHE_TAG } from "@/lib/content/queries";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    requireAdminAuth(req);
  } catch (e) {
    if (e instanceof AdminAuthError) return adminUnauthorizedResponse();
    throw e;
  }

  // Global deploy-window freeze (reset wave B2) — deactivate is an on-chain
  // write (deactivateCoursePda), so it is frozen during the window.
  if (await isPlatformFrozen()) {
    return platformFrozenResponse();
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

  const result = await deactivateCoursePda(courseId);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error ?? "Deactivation failed" },
      { status: 500 }
    );
  }

  // Mirror the on-chain flag into the Supabase `onchain_deployments` row (via
  // deployment-writes) + purge the catalog cache so the course disappears from
  // /courses immediately. If this write fails the course stays visible despite
  // being deactivated on-chain, so surface a warning.
  let warning: string | undefined;
  try {
    await writeCourseActive(courseId, false);
    revalidateTag(COURSES_CACHE_TAG);
  } catch (err) {
    console.error(
      "[admin/courses/deactivate] deployment write-back failed:",
      err
    );
    warning =
      "Deactivated on-chain, but the catalog flag didn't update — the course may still show until re-synced.";
  }

  return NextResponse.json({
    txSignature: result.signature,
    ...(warning ? { warning } : {}),
  });
}
