import { NextResponse } from "next/server";
import {
  getAllCourses,
  getCoursesByTrack,
  getCoursesByDifficulty,
} from "@/lib/data-service";
import type { Course } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const difficulty = searchParams.get("difficulty");
  const trackId = searchParams.get("trackId");
  const search = searchParams.get("search");

  let courses: Course[];

  if (trackId) {
    courses = await getCoursesByTrack(parseInt(trackId));
  } else if (difficulty) {
    courses = await getCoursesByDifficulty(difficulty as Course["difficulty"]);
  } else {
    courses = await getAllCourses();
  }

  if (search) {
    const q = search.toLowerCase();
    courses = courses.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }

  return NextResponse.json(courses);
}
