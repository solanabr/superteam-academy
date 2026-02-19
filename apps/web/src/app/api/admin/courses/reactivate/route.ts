import "server-only";

import { NextRequest, NextResponse } from "next/server";
import {
  requireAdminAuth,
  adminUnauthorizedResponse,
  AdminAuthError,
} from "@/lib/admin/auth";
import { updateCoursePda } from "@/lib/solana/admin-signer";

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

  return NextResponse.json({ txSignature: result.signature });
}
