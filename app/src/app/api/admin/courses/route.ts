import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sanityClient } from "@/lib/sanity/client";
import { isAdminWallet } from "@/lib/admin";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const COURSE_FIELDS = `
  _id,
  title,
  "slug": slug.current,
  description,
  difficulty,
  trackId,
  trackLevel,
  duration,
  xpPerLesson,
  lessonCount,
  status,
  creator,
  submittedBy,
  submittedAt,
  reviewedBy,
  reviewedAt,
  rejectionReason,
  isActive,
  isPublished,
  "thumbnailUrl": thumbnail.asset->url,
  whatYouLearn,
  "instructor": instructor{ name, "avatar": avatar.asset->url, bio },
  "modules": modules[]{
    _key,
    title,
    description,
    "lessons": lessons[]{
      _key,
      title,
      description,
      type,
      xp,
      duration
    }
  }
`;

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
 * GET /api/admin/courses
 * Returns courses filtered by status. Admin only.
 * Query: ?status=pending_review (default) | draft | approved | rejected | all
 */
export async function GET(req: NextRequest) {
  try {
    const adminWallet = await verifyAdmin(req);
    if (!adminWallet) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? "pending_review";

    let filter: string;
    if (status === "all") {
      filter = `_type == "course"`;
    } else if (status === "hidden") {
      filter = `_type == "course" && isActive == false`;
    } else if (status === "approved") {
      // Include legacy courses (no status field) that are active
      filter = `_type == "course" && (status == "approved" || (!defined(status) && isActive == true))`;
    } else {
      filter = `_type == "course" && status == "${status}"`;
    }

    const courses = await sanityClient.fetch(
      `*[${filter}] | order(submittedAt desc) { ${COURSE_FIELDS} }`,
    );

    return NextResponse.json({ courses });
  } catch (err) {
    console.error("[admin/courses]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
