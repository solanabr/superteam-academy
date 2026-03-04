import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { canCreateCourses } from "@/features/courses/permissions/courses";
import { createBunnyVideo } from "@/lib/bunny";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || !canCreateCourses(user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: "Video title is required" },
        { status: 400 }
      );
    }

    const uploadCredentials = await createBunnyVideo(title);

    return NextResponse.json(uploadCredentials);
  } catch (error) {
    console.error("Create video error:", error);
    return NextResponse.json(
      { error: "Failed to create video" },
      { status: 500 }
    );
  }
}
