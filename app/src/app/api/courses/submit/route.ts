import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sanityWriteClient } from "@/lib/sanity/write-client";
import { sanityClient } from "@/lib/sanity/client";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * POST /api/courses/submit
 * Submit a draft course for admin review.
 * Body: { courseId: string }
 */
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("wallet_address")
      .eq("id", user.id)
      .single();

    const walletAddress = profile?.wallet_address;
    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet not linked" }, { status: 400 });
    }

    const { courseId } = await req.json();
    if (!courseId) {
      return NextResponse.json({ error: "Missing courseId" }, { status: 400 });
    }

    // Verify ownership
    const course = await sanityClient.fetch(
      `*[_type == "course" && _id == $id][0]{ _id, creator, status }`,
      { id: courseId },
    );

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
    if (course.creator !== walletAddress) {
      return NextResponse.json({ error: "Not your course" }, { status: 403 });
    }
    if (course.status === "pending_review") {
      return NextResponse.json({ error: "Already submitted" }, { status: 400 });
    }
    if (course.status === "approved") {
      return NextResponse.json({ error: "Already approved" }, { status: 400 });
    }

    await sanityWriteClient
      .patch(courseId)
      .set({
        status: "pending_review",
        submittedAt: new Date().toISOString(),
        submittedBy: walletAddress,
        rejectionReason: "",
      })
      .commit();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[courses/submit]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
