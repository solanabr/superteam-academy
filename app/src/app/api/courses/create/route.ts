import { NextRequest, NextResponse } from "next/server";
import { serverClient } from "@/sanity/lib/server-client";
import { prisma } from "@/lib/db";

/**
 * POST /api/courses/create
 *
 * Creates a course in Sanity from professor's form submission.
 * Uses server-side SANITY_API_TOKEN (developer credentials), but stores
 * professor's user_id/walletAddress in the course document for attribution.
 *
 * Request body:
 * {
 *   title: string
 *   description?: string
 *   instructor?: string
 *   duration?: string
 *   difficulty?: "beginner" | "intermediate" | "advanced"
 *   track?: string
 *   wallet: string (professor's wallet address for attribution)
 *   modules?: Array<{
 *     title?: string
 *     lessons?: Array<{ title: string }>
 *   }>
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      instructor,
      duration,
      difficulty,
      track,
      wallet,
      modules,
    } = body as {
      title: string;
      description?: string;
      instructor?: string;
      duration?: string;
      difficulty?: "beginner" | "intermediate" | "advanced";
      track?: string;
      wallet: string;
      modules?: Array<{ title?: string; lessons?: Array<{ title: string }> }>;
    };

    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!wallet || typeof wallet !== "string") {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 });
    }

    // Verify professor exists and has correct role
    let user: { id: string; role: string } | null = null;
    try {
      user = await prisma.user.findUnique({
        where: { walletAddress: wallet },
        select: { id: true, role: true },
      });
    } catch (dbError: any) {
      console.error("DB error during course creation role check:", dbError?.message ?? dbError);
      return NextResponse.json(
        { error: "Database temporarily unavailable. Please try again in a few seconds." },
        { status: 503 }
      );
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role !== "professor" && user.role !== "admin") {
      return NextResponse.json(
        { error: "Only professors and admins can create courses" },
        { status: 403 }
      );
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 96);

    // Optionally create modules and lessons in Sanity
    const moduleRefs: Array<{ _type: "reference"; _ref: string }> = [];

    if (Array.isArray(modules)) {
      for (let mi = 0; mi < modules.length; mi++) {
        const mod = modules[mi];
        const lessonRefs: Array<{ _type: "reference"; _ref: string }> = [];

        if (Array.isArray(mod.lessons)) {
          for (let li = 0; li < mod.lessons.length; li++) {
            const lt = mod.lessons[li];
            const lessonTitle = lt?.title?.trim();
            if (!lessonTitle) continue;

            const lessonDoc = await serverClient.create({
              _type: "lesson",
              title: lessonTitle,
              sortOrder: li,
              content: [],
              lessonType: "content",
            });

            lessonRefs.push({ _type: "reference", _ref: lessonDoc._id });
          }
        }

        const moduleDoc = await serverClient.create({
          _type: "module",
          title: mod.title || `Module ${mi + 1}`,
          sortOrder: mi,
          lessons: lessonRefs,
        });

        moduleRefs.push({ _type: "reference", _ref: moduleDoc._id });
      }
    }

    // Create course document in Sanity
    // NOTE: This uses YOUR SANITY_API_TOKEN (developer credentials), but we store
    // the professor's info in createdBy for attribution.
    // Create course document in Sanity
    const course = await serverClient.create({
      _type: "course",
      title,
      slug: { current: slug },
      description: description || "",
      instructor: instructor || "",
      duration: duration || "",
      difficulty: difficulty || "beginner",
      track: track || "other",
      modules: moduleRefs,
      published: body.published === true, // Allow immediate publishing
      createdBy: {
        userId: user.id,
        walletAddress: wallet,
        role: user.role,
      },
    });

    // AUTO-SYNC ON-CHAIN if published immediately (Offload to Inngest)
    if (body.published === true && process.env.NEXT_PUBLIC_USE_ONCHAIN === "true") {
      try {
        const { inngest } = await import("@/lib/inngest/client");

        // Count total lessons across all modules
        let lessonCount = 0;
        if (Array.isArray(modules)) {
          modules.forEach(m => {
            if (Array.isArray(m.lessons)) {
              lessonCount += m.lessons.length;
            }
          });
        }
        if (lessonCount === 0) lessonCount = 1;

        console.log(`[api/courses/create] Dispatching background sync for course ${course._id}...`);
        await inngest.send({
          name: "solana/course.published",
          data: {
            courseId: course._id,
            wallet: wallet,
            lessonCount: lessonCount,
            difficulty: 1, // Default, can be expanded
            xpPerLesson: 100,
            trackId: 1,
            trackLevel: 1
          }
        });
      } catch (syncError) {
        console.error("[api/courses/create] Background sync dispatch failed:", syncError);
      }
    }

    return NextResponse.json({
      success: true,
      course: {
        id: course._id,
        slug: course.slug?.current,
        title: course.title,
      },
    });
  } catch (error: any) {
    console.error("Error creating course:", error);

    // Provide helpful error message for permission issues
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
      { error: error.message || "Failed to create course" },
      { status: 500 }
    );
  }
}
