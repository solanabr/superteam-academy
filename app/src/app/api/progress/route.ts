import { NextResponse, type NextRequest } from "next/server";
import { PrismaProgressService } from "@/lib/services/prisma-progress";
import { resolveUserId } from "@/lib/auth-utils";

const service = new PrismaProgressService();

export async function GET(request: NextRequest) {
  const userId = await resolveUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("courseId");

  if (courseId) {
    const progress = await service.getProgress(userId, courseId);
    return NextResponse.json(progress);
  }

  const allProgress = await service.getAllProgress(userId);
  return NextResponse.json(allProgress);
}

export async function POST(request: NextRequest) {
  const userId = await resolveUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { courseId, lessonIndex } = body;

  if (!courseId || lessonIndex === undefined) {
    return NextResponse.json(
      { error: "Missing courseId or lessonIndex" },
      { status: 400 },
    );
  }

  const result = await service.completeLesson(userId, courseId, lessonIndex);

  return NextResponse.json(result);
}
