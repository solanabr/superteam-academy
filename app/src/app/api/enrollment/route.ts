import { NextResponse, type NextRequest } from "next/server";
import { PrismaProgressService } from "@/lib/services/prisma-progress";
import { resolveUserId } from "@/lib/auth-utils";

const service = new PrismaProgressService();

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

  const result = await service.enrollInCourse(userId, courseId);

  return NextResponse.json({ success: true, ...result });
}

export async function DELETE(request: NextRequest) {
  const userId = await resolveUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { courseId } = body;

  if (!courseId) {
    return NextResponse.json({ error: "Missing courseId" }, { status: 400 });
  }

  const result = await service.closeEnrollment(userId, courseId);

  return NextResponse.json({ success: true, ...result });
}
