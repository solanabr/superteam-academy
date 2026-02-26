import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sanityClient } from "@/lib/sanity/client";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * GET /api/courses/my
 * Returns courses created by the authenticated user.
 */
export async function GET(req: NextRequest) {
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
      return NextResponse.json({ courses: [] });
    }

    const courses = await sanityClient.fetch(
      `*[_type == "course" && creator == $wallet] | order(_createdAt desc) {
        _id,
        title,
        "slug": slug.current,
        description,
        difficulty,
        trackId,
        lessonCount,
        status,
        submittedAt,
        reviewedAt,
        rejectionReason,
        isActive,
        "thumbnailUrl": thumbnail.asset->url
      }`,
      { wallet: walletAddress },
    );

    return NextResponse.json({ courses });
  } catch (err) {
    console.error("[courses/my]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
