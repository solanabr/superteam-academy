import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

interface SaveDeployRequest {
  lessonId: string;
  courseId: string;
  programId: string;
}

// The deployed_programs table exists but isn't in the generated types yet.
// Use a typed helper to avoid `never` inference.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: SupabaseClient<any>) {
  return supabase;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = db(await createClient());
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as SaveDeployRequest;

    if (!body.lessonId || !body.courseId || !body.programId) {
      return NextResponse.json(
        { error: "lessonId, courseId, and programId are required" },
        { status: 400 }
      );
    }

    // Validate programId looks like a base58 Solana address (32-44 chars)
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(body.programId)) {
      return NextResponse.json(
        { error: "Invalid program ID format" },
        { status: 400 }
      );
    }

    // Upsert — if user re-deploys to the same lesson, update the program_id
    const { error } = await supabase.from("deployed_programs").upsert(
      {
        user_id: user.id,
        course_id: body.courseId,
        lesson_id: body.lessonId,
        program_id: body.programId,
        network: "devnet",
        deployed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,course_id,lesson_id" }
    );

    if (error) {
      console.error("Failed to save deployment:", error);
      return NextResponse.json(
        { error: "Failed to save deployment" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET: check if user has a deployment for a given lesson (or course).
// Query params:
//   - courseId (required) — find deployments for this course
//   - lessonId (optional) — narrow to a specific lesson
export async function GET(request: NextRequest) {
  try {
    const supabase = db(await createClient());
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const lessonId = request.nextUrl.searchParams.get("lessonId");
    const courseId = request.nextUrl.searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json(
        { error: "courseId is required" },
        { status: 400 }
      );
    }

    let query = supabase
      .from("deployed_programs")
      .select("program_id, network, deployed_at")
      .eq("user_id", user.id)
      .eq("course_id", courseId);

    if (lessonId) {
      query = query.eq("lesson_id", lessonId);
    }

    const { data } = await query
      .order("deployed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) {
      return NextResponse.json({ deployed: false });
    }

    return NextResponse.json({
      deployed: true,
      programId: data.program_id,
      network: data.network,
      deployedAt: data.deployed_at,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
