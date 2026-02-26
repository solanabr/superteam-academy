import { NextRequest, NextResponse } from "next/server";
import { sanityClient } from "@/lib/sanity/client";
import { trackLabels, difficultyLabels, courseThumbnails } from "@/lib/constants";

const PRODUCTION_URL = process.env.NEXT_PUBLIC_PRODUCTION_URL ?? "https://superteam-academy-six.vercel.app";
const DEFAULT_IMAGE = "https://i.ibb.co/FLrYxm5Y/solana.webp";

const CREDENTIAL_FIELDS = `
  courseId,
  title,
  description,
  difficulty,
  lessonCount,
  xpPerLesson,
  trackId,
  "thumbnailUrl": thumbnail.asset->url,
  "instructor": instructor{ name }
`;

interface CredentialCourse {
  courseId: string;
  title: string;
  description: string;
  difficulty: number;
  lessonCount: number;
  xpPerLesson: number;
  trackId: number;
  thumbnailUrl?: string;
  instructor?: { name: string };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const { courseId } = await params;

  const course = await sanityClient.fetch<CredentialCourse | null>(
    `*[_type == "course" && courseId == $courseId][0] { ${CREDENTIAL_FIELDS} }`,
    { courseId },
  );

  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const imageUrl = course.thumbnailUrl ?? courseThumbnails[courseId] ?? DEFAULT_IMAGE;

  // If imageOnly param is set, redirect to the image URL directly
  if (request.nextUrl.searchParams.get("imageOnly") === "true") {
    return NextResponse.redirect(imageUrl);
  }

  const totalXp = course.lessonCount * course.xpPerLesson;
  const track = trackLabels[course.trackId] ?? "Solana";
  const difficulty = difficultyLabels[course.difficulty] ?? "Beginner";

  const metadata = {
    name: `${course.title} — Superteam Academy`,
    symbol: "STACAD",
    description: `Credential for completing "${course.title}" on Superteam Academy. ${course.description ?? ""}`.trim(),
    image: imageUrl,
    external_url: `${PRODUCTION_URL}/courses/${courseId}`,
    attributes: [
      { trait_type: "Course", value: course.title },
      { trait_type: "Track", value: track },
      { trait_type: "Difficulty", value: difficulty },
      { trait_type: "Lessons", value: course.lessonCount },
      { trait_type: "Total XP", value: totalXp },
      ...(course.instructor?.name
        ? [{ trait_type: "Instructor", value: course.instructor.name }]
        : []),
    ],
    properties: {
      category: "credential",
      platform: "Superteam Academy",
      courseId: course.courseId,
    },
  };

  return NextResponse.json(metadata, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
