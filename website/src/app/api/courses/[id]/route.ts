import { NextRequest, NextResponse } from "next/server";
import { serverClient } from "@/sanity/lib/server-client";
import { prisma } from "@/lib/db";

/**
 * GET /api/courses/[id]
 * Get course by ID (including drafts, for editing)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const course = await serverClient.fetch(
      `*[_type == "course" && _id == $id][0] {
        _id,
        title,
        "slug": slug.current,
        description,
        instructor,
        duration,
        difficulty,
        track,
        image,
        published,
        createdBy,
        "modules": modules[]->{
          _id,
          title,
          sortOrder,
          "lessons": lessons[]->{
            _id,
            title,
            sortOrder,
            content,
            lessonType,
            "challenge": challenge->{ _id, title, starterCode, language, testCases }
          }
        }
      }`,
      { id }
    );

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json(course);
  } catch (error: any) {
    console.error("Error fetching course:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch course" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/courses/[id]
 * Update course fields
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { wallet, ...updates } = body;

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

    // Only creator or admin can edit (students and other professors are blocked)
    const canEdit =
      user.role === "admin" ||
      course.createdBy?.userId === user.id;

    if (!canEdit) {
      return NextResponse.json(
        { error: "You don't have permission to edit this course" },
        { status: 403 }
      );
    }

    // Handle slug update separately if title changed
    const patch = serverClient.patch(id);
    if (updates.title) {
      const slug = updates.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .slice(0, 96);
      patch.set({ slug: { current: slug } });
    }

    // Update other fields
    const fieldsToUpdate: Record<string, any> = {};
    if (updates.description !== undefined) fieldsToUpdate.description = updates.description;
    if (updates.instructor !== undefined) fieldsToUpdate.instructor = updates.instructor;
    if (updates.duration !== undefined) fieldsToUpdate.duration = updates.duration;
    if (updates.difficulty !== undefined) fieldsToUpdate.difficulty = updates.difficulty;
    if (updates.track !== undefined) fieldsToUpdate.track = updates.track;
    if (updates.published !== undefined) fieldsToUpdate.published = updates.published;

    if (Object.keys(fieldsToUpdate).length > 0) {
      patch.set(fieldsToUpdate);
    }

    const updated = await patch.commit();

    return NextResponse.json({ success: true, course: updated });
  } catch (error: any) {
    console.error("Error updating course:", error);
    
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
      { error: error.message || "Failed to update course" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/courses/[id]
 * Delete course (and optionally its modules/lessons)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get("wallet");

    if (!wallet) {
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
      `*[_type == "course" && _id == $id][0] { createdBy, "modules": modules[]->_id }`,
      { id }
    );

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Only creator or admin can delete
    const canDelete =
      user.role === "admin" || course.createdBy?.userId === user.id;

    if (!canDelete) {
      return NextResponse.json(
        { error: "You don't have permission to delete this course" },
        { status: 403 }
      );
    }

    // Delete course (Sanity will handle draft cleanup)
    await serverClient.delete(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting course:", error);
    
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
      { error: error.message || "Failed to delete course" },
      { status: 500 }
    );
  }
}
