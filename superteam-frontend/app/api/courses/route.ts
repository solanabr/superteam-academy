import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/server/auth-adapter";
import { courseService } from "@/lib/cms/course-service";
import { getCourseProgressSnapshot } from "@/lib/server/academy-progress-adapter";
import type { CourseCardData } from "@/lib/course-catalog";

function toCard(course: {
  slug: string;
  title: string;
  description: string;
  instructor: string;
  instructorAvatar: string;
  difficulty: string;
  duration: string;
  lessons: number;
  rating: number;
  enrolled: number;
  tags: string[];
  progress: number;
  xp: number;
  thumbnail: string;
}): CourseCardData {
  return {
    slug: course.slug,
    title: course.title,
    description: course.description,
    instructor: course.instructor,
    instructorAvatar: course.instructorAvatar,
    difficulty: course.difficulty as CourseCardData["difficulty"],
    duration: course.duration,
    lessons: course.lessons,
    rating: course.rating,
    enrolled: course.enrolled,
    tags: course.tags,
    progress: course.progress,
    xp: course.xp,
    thumbnail: course.thumbnail,
  };
}

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const offset = Math.max(0, Number(searchParams.get("offset") ?? 0));
  const limit = Math.min(
    24,
    Math.max(1, Number(searchParams.get("limit") ?? 6)),
  );

  const allCourses = await courseService.getAllCourses();
  const page = allCourses.slice(offset, offset + limit);

  const cards: CourseCardData[] = await Promise.all(
    page.map(async (course) => {
      try {
        const snapshot = await getCourseProgressSnapshot(
          user.walletAddress,
          course.slug,
        );
        return snapshot
          ? toCard(snapshot.course)
          : toCard({ ...course, progress: 0 });
      } catch {
        return toCard({ ...course, progress: 0 });
      }
    }),
  );

  return NextResponse.json({
    courses: cards,
    total: allCourses.length,
    offset,
    hasMore: offset + limit < allCourses.length,
  });
}
