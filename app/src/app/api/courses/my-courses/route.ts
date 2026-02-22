import { NextRequest, NextResponse } from "next/server";
import { serverClient } from "@/sanity/lib/server-client";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/courses/my-courses?wallet=...
 * Get all courses created by the professor (including drafts)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get("wallet");

    if (!wallet) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 });
    }

    // Verify user
    const user = await prisma.user.findUnique({
      where: { walletAddress: wallet },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role !== "professor" && user.role !== "admin") {
      return NextResponse.json(
        { error: "Only professors and admins can view their courses" },
        { status: 403 }
      );
    }

    // Fetch courses created by this user (check createdBy.userId)
    const courses = await serverClient.fetch(
      `*[_type == "course" && createdBy.userId == $userId] | order(_createdAt desc) {
        _id,
        title,
        "slug": slug.current,
        description,
        instructor,
        duration,
        difficulty,
        track,
        published,
        _createdAt,
        _updatedAt
      }`,
      { userId: user.id }
    );

    return NextResponse.json({ courses: courses || [] });
  } catch (error: any) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch courses" },
      { status: 500 }
    );
  }
}
