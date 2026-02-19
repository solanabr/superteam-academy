// app/src/app/api/lesson/save/route.ts
import { NextResponse } from "next/server";
import { saveLessonProgress } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { walletAddress, courseId, lessonIndex, code } = await request.json();

    const result = await saveLessonProgress(
      walletAddress, 
      courseId, 
      lessonIndex, 
      code
    );
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Save progress error:", error);
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}