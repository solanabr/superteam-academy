import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sanityWriteClient } from "@/lib/sanity/write-client";
import { sanityClient } from "@/lib/sanity/client";
import { isAdminWallet } from "@/lib/admin";
import { createCourseOnChain, updateCourseOnChain, courseExistsOnChain } from "@/lib/solana/create-course";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function verifyAdmin(req: NextRequest): Promise<string | null> {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("wallet_address")
    .eq("id", user.id)
    .single();

  const wallet = profile?.wallet_address;
  if (!wallet || !isAdminWallet(wallet)) return null;

  return wallet;
}

/**
 * POST /api/admin/courses/[id]/approve
 * Approve a pending course. Admin only.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const adminWallet = await verifyAdmin(req);
    if (!adminWallet) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const course = await sanityClient.fetch(
      `*[_type == "course" && _id == $id][0]{
        _id, status, courseId, "slug": slug.current, lessonCount, difficulty, xpPerLesson, trackId, trackLevel
      }`,
      { id },
    );

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    await sanityWriteClient
      .patch(id)
      .set({
        status: "approved",
        isActive: true,
        isPublished: true,
        reviewedBy: adminWallet,
        reviewedAt: new Date().toISOString(),
      })
      .commit();

    // Create or update course on-chain (authority pays rent)
    let onChainTx: string | null = null;
    const onChainCourseId = course.courseId || course.slug;
    if (onChainCourseId) {
      // Backfill courseId in Sanity if it was missing
      if (!course.courseId && course.slug) {
        await sanityWriteClient.patch(id).set({ courseId: course.slug }).commit();
      }
      try {
        const exists = await courseExistsOnChain(onChainCourseId);
        if (exists) {
          // PDA already exists (re-approval after edit) — update on-chain data
          onChainTx = await updateCourseOnChain({
            courseId: onChainCourseId,
            xpPerLesson: course.xpPerLesson ?? 30,
            lessonCount: course.lessonCount ?? 1,
          });
        } else {
          onChainTx = await createCourseOnChain({
            courseId: onChainCourseId,
            lessonCount: course.lessonCount ?? 1,
            difficulty: course.difficulty ?? 1,
            xpPerLesson: course.xpPerLesson ?? 30,
            trackId: course.trackId ?? 1,
            trackLevel: course.trackLevel ?? 0,
          });
        }
      } catch (err) {
        console.error("[admin/courses/approve] on-chain creation failed:", err);
      }
    }

    return NextResponse.json({
      success: true,
      onChainTx,
    });
  } catch (err) {
    console.error("[admin/courses/approve]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
