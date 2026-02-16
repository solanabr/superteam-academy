import { NextRequest, NextResponse } from "next/server";
import { serverClient } from "@/sanity/lib/server-client";
import { prisma } from "@/lib/db";

/**
 * POST /api/courses/[id]/publish
 * Publish a course (set published: true)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { wallet } = body;

    if (!wallet || typeof wallet !== "string") {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 });
    }

    // Verify user and permissions
    const user = await prisma.user.findUnique({
      where: { walletAddress: wallet },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get course to check ownership
    const course = await serverClient.fetch(
      `*[_type == "course" && _id == $id][0] { createdBy }`,
      { id }
    );

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Only creator or admin can publish (students and other professors are blocked)
    const canPublish =
      user.role === "admin" ||
      course.createdBy?.userId === user.id;

    if (!canPublish) {
      return NextResponse.json(
        { error: "You don't have permission to publish this course" },
        { status: 403 }
      );
    }

    // Publish: set published to true
    // Sanity handles draft/published versions automatically
    // We patch by query to update both draft and published if they exist
    const publishedId = id.startsWith("drafts.") ? id.replace("drafts.", "") : id;
    
    // Update both draft and published versions
    await Promise.all([
      serverClient.patch(publishedId).set({ published: true }).commit().catch(() => null),
      serverClient.patch(`drafts.${publishedId}`).set({ published: true }).commit().catch(() => null),
    ]);

    return NextResponse.json({ success: true, published: true });
  } catch (error: any) {
    console.error("Error publishing course:", error);
    
    if (error.message?.includes("Insufficient permissions") || error.statusCode === 403) {
      return NextResponse.json(
        { 
          error: "API token lacks write permissions. Please create a new token with Editor role in Sanity dashboard (Settings → API → Tokens). See docs/SANITY_TOKEN_SETUP.md for details.",
          details: error.message 
        },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || "Failed to publish course" },
      { status: 500 }
    );
  }
}
