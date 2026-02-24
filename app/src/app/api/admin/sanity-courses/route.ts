import { NextResponse } from "next/server";
import { getSanityWriteClient } from "@/lib/sanity/write-client";
import { adminAllCoursesQuery } from "@/lib/sanity/admin-queries";
import { isAdminRequest } from "@/lib/auth/admin";

/** GET /api/admin/sanity-courses — List all CMS courses */
export async function GET(req: Request) {
  try {
    if (!(await isAdminRequest(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const sanity = getSanityWriteClient();
    const courses = await sanity.fetch(adminAllCoursesQuery);

    return NextResponse.json({ courses });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch courses";
    console.error("admin sanity-courses GET error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** POST /api/admin/sanity-courses — Create a new course in Sanity CMS */
export async function POST(req: Request) {
  try {
    if (!(await isAdminRequest(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      slug,
      description,
      track,
      difficulty,
      xpReward,
      estimatedHours,
    } = body as {
      title?: string;
      slug?: string;
      description?: string;
      track?: string;
      difficulty?: string;
      xpReward?: number;
      estimatedHours?: number;
    };

    if (!title || !slug) {
      return NextResponse.json(
        { error: "Missing required fields: title, slug" },
        { status: 400 },
      );
    }

    const sanity = getSanityWriteClient();

    const course = await sanity.create({
      _type: "course",
      title,
      slug: { _type: "slug", current: slug },
      description: description ?? "",
      track: track ?? "rust",
      difficulty: difficulty ?? "beginner",
      xpReward: xpReward ?? 500,
      estimatedHours: estimatedHours ?? 4,
      published: false,
      modules: [],
      learningOutcomes: [],
    });

    return NextResponse.json({
      success: true,
      course: {
        _id: course._id,
        title: course.title,
        slug,
      },
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to create course";
    console.error("admin sanity-courses POST error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
