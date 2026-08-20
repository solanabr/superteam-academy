import "server-only";

import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { Connection } from "@solana/web3.js";
import {
  requireAdminAuth,
  adminUnauthorizedResponse,
  AdminAuthError,
} from "@/lib/admin/auth";
import { isPlatformFrozen } from "@/lib/platform/freeze";
import { platformFrozenResponse } from "@/lib/platform/freeze-http";
import { serverEnv } from "@/lib/env.server";
import { deactivateCoursePda } from "@/lib/solana/admin-signer";
import { writeCourseActive } from "@/lib/content/deployment-writes";
import { recordCourseDeactivated } from "@/lib/content/changelog-writes";
import { fetchCourse } from "@/lib/solana/academy-reads";
import { getProgramId } from "@/lib/solana/pda";
import { COURSES_CACHE_TAG } from "@/lib/content/queries";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    await requireAdminAuth(req);
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

  // Course changelog (#738): record the deactivation — the path #713 retires the
  // superseded courses with. Non-fatal. deactivate does not close the account or
  // bump version, so the course is still readable on-chain; record its current
  // version. NOTE: under the #654 RLS (synced+active only) this entry is not
  // publicly readable while the course is inactive — it becomes visible if the
  // course is later reactivated. See #738 on deferring the retired-course surface.
  if (result.signature) {
    try {
      const connection = new Connection(serverEnv.SOLANA_RPC_URL, "confirmed");
      const onChain = await fetchCourse(courseId, connection, getProgramId());
      if (onChain) {
        await recordCourseDeactivated({
          courseId,
          txSignature: result.signature,
          version: onChain.version,
        });
      } else {
        // #731 honesty standard: skipping (to avoid logging a wrong version)
        // must itself be visible — a silent miss is an invisible audit gap.
        console.warn(
          `[course-changelog] ${courseId}: 'deactivated' entry SKIPPED — on-chain course unreadable after mutation (tx ${result.signature})`
        );
      }
    } catch (changelogErr) {
      console.error(
        "[admin/courses/deactivate] changelog write failed:",
        changelogErr
      );
    }
  }

  return NextResponse.json({
    txSignature: result.signature,
    ...(warning ? { warning } : {}),
  });
}
