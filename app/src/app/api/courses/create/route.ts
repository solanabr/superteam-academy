import { NextRequest, NextResponse } from "next/server";
import { serverClient } from "@/sanity/lib/server-client";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

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
      modules?: Array<{
        title?: string;
        description?: string;
        quiz?: {
          passingScore: number;
          questions: Array<{
            question: string;
            options: string[];
            correctIndex: number;
            explanation: string;
          }>;
        };
        lessons?: Array<{
          title: string;
          type: string;
          content?: string;
          videoUrl?: string;
          duration?: string;
          xp?: number;
          challenge?: {
            prompt: string;
            objectives: string[];
            starterCode: string;
            solutionCode: string;
            language: string;
            hints: string[];
          };
        }>;
      }>;
      published?: boolean;
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

            let challengeRef = null;
            let lessonType = "content";

            // If it's a challenge, create the Challenge doc first
            if (lt.type === "challenge" && lt.challenge) {
              lessonType = "challenge";
              const challengeDoc = await serverClient.create({
                _type: "challenge",
                title: `${lessonTitle} - Challenge`,
                prompt: lt.challenge.prompt || "",
                language: lt.challenge.language || "typescript",
                starterCode: lt.challenge.starterCode || "",
                // Map the educator's solution string to the primary test case
                testCases: lt.challenge.solutionCode ? [
                  {
                    _key: `tc-${Date.now()}`,
                    name: "Primary Validation",
                    expected: lt.challenge.solutionCode,
                  }
                ] : []
              });
              challengeRef = { _type: "reference", _ref: challengeDoc._id };
            }

            // Create simple Portable Text block for the lesson content
            const contentBlocks = lt.content ? [
              {
                _type: "block",
                _key: Date.now().toString(36) + Math.random().toString(36).substring(2),
                style: "normal",
                markDefs: [],
                children: [
                  {
                    _type: "span",
                    _key: Date.now().toString(36) + Math.random().toString(36).substring(2),
                    text: lt.content,
                  }
                ]
              }
            ] : [];

            // Create Lesson doc
            const lessonDocPayload: any = {
              _type: "lesson",
              title: lessonTitle,
              sortOrder: li,
              lessonType,
              content: contentBlocks,
            };

            if (lt.videoUrl) lessonDocPayload.videoUrl = lt.videoUrl;
            if (lt.duration) lessonDocPayload.estimatedTime = lt.duration;
            if (challengeRef) lessonDocPayload.challenge = challengeRef;

            const lessonDoc = await serverClient.create(lessonDocPayload);

            lessonRefs.push({ _type: "reference", _ref: lessonDoc._id });
          }
        }

        let quizRef = null;
        if (mod.quiz && Array.isArray(mod.quiz.questions) && mod.quiz.questions.length > 0 && mod.quiz.questions[0].question.trim() !== '') {
          const quizDoc = await serverClient.create({
            _type: "quiz",
            title: `${mod.title || `Module ${mi + 1}`} - Quiz`,
            passingScore: mod.quiz.passingScore || 70,
            questions: mod.quiz.questions.map(q => ({
              _key: Date.now().toString(36) + Math.random().toString(36).substring(2),
              question: q.question,
              options: q.options,
              correctIndex: q.correctIndex,
              explanation: q.explanation || ""
            }))
          });
          quizRef = { _type: "reference", _ref: quizDoc._id };
        }

        const modulePayload: any = {
          _type: "module",
          title: mod.title || `Module ${mi + 1}`,
          description: mod.description || "",
          sortOrder: mi,
          lessons: lessonRefs,
        };
        if (quizRef) modulePayload.quiz = quizRef;

        const moduleDoc = await serverClient.create(modulePayload);

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
    // Proactively revalidate the courses list and detail paths
    try {
      revalidatePath("/[locale]/(platform)/courses", "page");
      revalidatePath("/[locale]/(platform)/courses/[slug]", "page");
      console.log(`[api/courses/create] ISR paths revalidated for course: ${slug}`);
    } catch (revalidateError) {
      console.error("[api/courses/create] Non-blocking revalidation failed:", revalidateError);
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
