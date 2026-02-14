import { NextRequest, NextResponse } from "next/server";
import { getCoursesFromCms } from "@/lib/cms/sanity-client";
import { filterCoursesByText } from "@/lib/cms/queries";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const courses = await getCoursesFromCms();
  const filtered = filterCoursesByText(courses, q);

  const results = filtered.flatMap((course) => {
    const courseResult = {
      type: "course" as const,
      id: course._id,
      title: course.title,
      slug: course.slug,
      snippet: course.description
    };

    const lessonResults = course.modules.flatMap((module) =>
      module.lessons.map((lesson) => ({
        type: "lesson" as const,
        id: lesson._id,
        title: lesson.title,
        slug: `${course.slug}/lessons/${lesson.order}`,
        snippet: lesson.content
      }))
    );

    return [courseResult, ...lessonResults];
  });

  const needle = q.trim().toLowerCase();
  const narrowed = needle
    ? results.filter(
        (item) =>
          item.title.toLowerCase().includes(needle) || item.snippet.toLowerCase().includes(needle)
      )
    : results;

  return NextResponse.json({ results: narrowed.slice(0, 30) });
}
