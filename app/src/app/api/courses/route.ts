import { NextResponse } from "next/server";
import { fetchAllCourses, getCourseMetadata } from "@/lib/services/course-service";

export async function GET() {
  try {
    const courses = await fetchAllCourses();
    const enriched = courses.map((course) => ({
      ...course,
      publicKey: course.publicKey.toBase58(),
      creator: course.creator.toBase58(),
      metadata: getCourseMetadata(course.courseId),
    }));

    return NextResponse.json({ courses: enriched });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}
