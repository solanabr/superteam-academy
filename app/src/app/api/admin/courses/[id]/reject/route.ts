import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sanityWriteClient } from "@/lib/sanity/write-client";
import { sanityClient } from "@/lib/sanity/client";
import { isAdminWallet } from "@/lib/admin";

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
 * POST /api/admin/courses/[id]/reject
 * Reject a pending course. Admin only.
 * Body: { reason: string }
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
    const { reason } = await req.json();

    const course = await sanityClient.fetch(
      `*[_type == "course" && _id == $id][0]{ _id, status }`,
      { id },
    );

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    await sanityWriteClient
      .patch(id)
      .set({
        status: "rejected",
        isActive: false,
        isPublished: false,
        reviewedBy: adminWallet,
        reviewedAt: new Date().toISOString(),
        rejectionReason: reason ?? "",
      })
      .commit();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/courses/reject]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
