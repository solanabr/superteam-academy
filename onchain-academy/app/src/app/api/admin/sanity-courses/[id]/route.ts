import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isAdminRequest } from "@/lib/auth/admin";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** GET /api/admin/sanity-courses/[id] — Fetch single course with modules/lessons */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!(await isAdminRequest(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();

    // 1. Fetch course
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("*")
      .eq("id", id)
      .single();

    if (courseError || !course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 },
      );
    }

    // 2. Fetch modules for course
    const { data: modules, error: modulesError } = await supabase
      .from("modules")
      .select("*")
      .eq("course_id", id)
      .order("order");

    if (modulesError) {
      console.error("admin sanity-course GET modules error:", modulesError);
      return NextResponse.json(
        { error: modulesError.message },
        { status: 500 },
      );
    }

    // 3. Fetch all lessons for these modules in one query
    const moduleIds = (modules ?? []).map((m) => m.id);
    let allLessons: Record<string, unknown>[] = [];

    if (moduleIds.length > 0) {
      const { data: lessons, error: lessonsError } = await supabase
        .from("lessons")
        .select("*")
        .in("module_id", moduleIds)
        .order("order");

      if (lessonsError) {
        console.error("admin sanity-course GET lessons error:", lessonsError);
        return NextResponse.json(
          { error: lessonsError.message },
          { status: 500 },
        );
      }

      allLessons = lessons ?? [];
    }

    // Group lessons by module_id
    const lessonsByModule: Record<string, Record<string, unknown>[]> = {};
    for (const lesson of allLessons) {
      const mid = lesson.module_id as string;
      if (!lessonsByModule[mid]) lessonsByModule[mid] = [];
      lessonsByModule[mid].push(lesson);
    }

    // 4. Format response
    const formattedModules = (modules ?? []).map((m) => ({
      _id: m.id,
      title: m.title,
      description: m.description,
      order: m.order,
      lessons: (lessonsByModule[m.id] ?? []).map((l) => ({
        _id: l.id,
        title: l.title,
        slug: l.slug,
        type: l.type,
        xpReward: l.xp_reward,
        estimatedMinutes: l.estimated_minutes,
        order: l.order,
        markdownContent: l.content,
        challenge: l.challenge_instructions
          ? {
              instructions: l.challenge_instructions,
              starterCode: l.challenge_starter_code,
              solution: l.challenge_solution,
              language: l.challenge_language,
            }
          : undefined,
      })),
    }));

    return NextResponse.json({
      course: {
        _id: course.id,
        title: course.title,
        slug: course.slug,
        description: course.description,
        longDescription: course.long_description,
        track: course.track,
        difficulty: course.difficulty,
        estimatedHours: course.estimated_hours,
        xpReward: course.xp_reward,
        published: course.published,
        learningOutcomes: course.learning_outcomes,
        image: course.image_url,
        modules: formattedModules,
      },
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch course";
    console.error("admin sanity-course GET error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** PATCH /api/admin/sanity-courses/[id] — Update course fields */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!(await isAdminRequest(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const fields = body as {
      title?: string;
      description?: string;
      longDescription?: string;
      track?: string;
      difficulty?: string;
      xpReward?: number;
      estimatedHours?: number;
      learningOutcomes?: string[];
      published?: boolean;
    };

    const updates: Record<string, unknown> = {};

    if (fields.title !== undefined) {
      updates.title = fields.title;
      updates.slug = slugify(fields.title);
    }
    if (fields.description !== undefined)
      updates.description = fields.description;
    if (fields.longDescription !== undefined)
      updates.long_description = fields.longDescription;
    if (fields.track !== undefined) updates.track = fields.track;
    if (fields.difficulty !== undefined) updates.difficulty = fields.difficulty;
    if (fields.xpReward !== undefined) updates.xp_reward = fields.xpReward;
    if (fields.estimatedHours !== undefined)
      updates.estimated_hours = fields.estimatedHours;
    if (fields.learningOutcomes !== undefined)
      updates.learning_outcomes = fields.learningOutcomes;
    if (fields.published !== undefined) updates.published = fields.published;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("courses")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("admin sanity-course PATCH supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to update course";
    console.error("admin sanity-course PATCH error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
