import { NextResponse, type NextRequest } from "next/server";
import { PrismaProgressService } from "@/lib/services/prisma-progress";
import { resolveUserId } from "@/lib/auth-utils";

const service = new PrismaProgressService();

/**
 * POST /api/progress/finalize
 *
 * Orchestrates course finalization: awards completion bonus XP,
 * creates/upgrades credential, and optionally triggers on-chain
 * finalize_course + issue_credential/upgrade_credential.
 */
export async function POST(request: NextRequest) {
  const userId = await resolveUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { courseId } = body;

  if (!courseId) {
    return NextResponse.json({ error: "Missing courseId" }, { status: 400 });
  }

  const result = await service.finalizeCourse(userId, courseId);

  return NextResponse.json(result);
}
