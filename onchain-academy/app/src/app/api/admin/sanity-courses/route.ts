import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isAdminRequest } from "@/lib/auth/admin";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** GET /api/admin/sanity-courses — List all courses from Supabase */
export async function GET(req: Request) {
  try {
    if (!(await isAdminRequest(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .order("title");

    if (error) {
      console.error("admin sanity-courses GET supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ courses: data });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch courses";
    console.error("admin sanity-courses GET error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** POST /api/admin/sanity-courses — Create a new course in Supabase */
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

    if (!title) {
      return NextResponse.json(
        { error: "Missing required field: title" },
        { status: 400 },
      );
    }

    const courseSlug = slug ? slugify(slug) : slugify(title);

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("courses")
      .insert({
        slug: courseSlug,
        title,
        description: description ?? "",
        track: track ?? "rust",
        difficulty: difficulty ?? "beginner",
        xp_reward: xpReward ?? 500,
        estimated_hours: estimatedHours ?? 4,
        published: false,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("admin sanity-courses POST supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      course: {
        _id: data.id,
        title: data.title,
        slug: data.slug,
      },
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to create course";
    console.error("admin sanity-courses POST error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
