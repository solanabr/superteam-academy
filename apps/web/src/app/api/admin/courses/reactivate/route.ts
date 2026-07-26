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
import { updateCoursePda } from "@/lib/solana/admin-signer";
import { writeCourseActive } from "@/lib/content/deployment-writes";
import { recordCourseReactivated } from "@/lib/content/changelog-writes";
import { fetchCourse } from "@/lib/solana/academy-reads";
import { getProgramId } from "@/lib/solana/pda";
import { COURSES_CACHE_TAG } from "@/lib/content/queries";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    requireAdminAuth(req);
  } catch (e) {
    if (e instanceof AdminAuthError) return adminUnauthorizedResponse();
    throw e;
  }

  // Global deploy-window freeze (reset wave B2) — reactivate is an on-chain
  // write (updateCoursePda newIsActive), so it is frozen during the window.
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
    console.error(
      "[admin/courses/reactivate] deployment write-back failed:",
      err
    );
    warning =
      "Reactivated on-chain, but the catalog flag didn't update — the course may stay hidden until re-synced.";
  }

  // Course changelog (#738): record the reactivation. Non-fatal — the on-chain
  // flip already landed; a missing log entry must not fail the operation.
  // reactivate does not bump version, so record the current on-chain version;
  // if it can't be read, skip the entry rather than logging a wrong version.
  if (result.signature) {
    try {
      const connection = new Connection(serverEnv.SOLANA_RPC_URL, "confirmed");
      const onChain = await fetchCourse(courseId, connection, getProgramId());
      if (onChain) {
        await recordCourseReactivated({
          courseId,
          txSignature: result.signature,
          version: onChain.version,
        });
      } else {
        // #731 honesty standard: skipping (to avoid logging a wrong version)
        // must itself be visible — a silent miss is an invisible audit gap.
        console.warn(
          `[course-changelog] ${courseId}: 'reactivated' entry SKIPPED — on-chain course unreadable after mutation (tx ${result.signature})`
        );
      }
    } catch (changelogErr) {
      console.error(
        "[admin/courses/reactivate] changelog write failed:",
        changelogErr
      );
    }
  }

  return NextResponse.json({
    txSignature: result.signature,
    ...(warning ? { warning } : {}),
  });
}
