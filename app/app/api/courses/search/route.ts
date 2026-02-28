import { NextRequest, NextResponse } from "next/server";
import { searchCourses, resolveCourseImageUrl } from "@/lib/cms";

export async function GET(request: NextRequest) {
	const q = request.nextUrl.searchParams.get("q");
	if (!q || !q.trim()) {
		return NextResponse.json({ results: [] });
	}

	if (q.length > 200) {
		return NextResponse.json({ error: "Query too long" }, { status: 400 });
	}

	const courses = await searchCourses(q);

	const results = courses.map((course) => ({
		id: course._id,
		title: course.title,
		slug: course.slug?.current ?? "",
		description: course.description ?? "",
		level: course.level,
		image: resolveCourseImageUrl(course.image, 200, 112) ?? null,
	}));

	return NextResponse.json({ results });
}
