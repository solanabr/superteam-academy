import { NextRequest, NextResponse } from "next/server";
import { serverClient } from "@/sanity/lib/server-client";
import { prisma } from "@/lib/db";

type LessonInput = {
  _id?: string;
  title: string;
  sortOrder?: number;
  content?: string;
  testOutput?: string;
};

type ModuleInput = {
  _id?: string;
  title: string;
  sortOrder?: number;
  lessons?: LessonInput[];
  quiz?: {
    _id?: string;
    title: string;
    passingScore: number;
    questions: Array<{
      question: string;
      options: string[];
      correctIndex: number;
      explanation?: string;
    }>;
  };
};


/**
 * POST /api/courses/[id]/modules
 *
 * Upserts modules and lessons for a course from professor UI.
 * Body:
 * {
 *   wallet: string;
 *   modules: Array<{
 *     _id?: string;
 *     title: string;
 *     sortOrder?: number;
 *     lessons?: Array<{
 *       _id?: string;
 *       title: string;
 *       sortOrder?: number;
 *       content?: string;
 *     }>;
 *   }>;
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as {
      wallet?: string;
      modules?: ModuleInput[];
    };

    const wallet = body.wallet;
    const modules = body.modules;

    if (!wallet || typeof wallet !== "string") {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(modules)) {
      return NextResponse.json(
        { error: "Modules array is required" },
        { status: 400 }
      );
    }

    // Verify user and permissions
    const user = await prisma.user.findUnique({
      where: { walletAddress: wallet },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const course = await serverClient.fetch(
      `*[_type == "course" && _id == $id][0] { createdBy }`,
      { id }
    );

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Only creator can edit modules/lessons via this endpoint
    const canEdit = course.createdBy?.userId === user.id;

    if (!canEdit) {
      return NextResponse.json(
        { error: "You don't have permission to edit this course" },
        { status: 403 }
      );
    }

    const moduleRefs: Array<{ _type: "reference"; _ref: string }> = [];

    for (let mi = 0; mi < modules.length; mi++) {
      const mod = modules[mi];
      const moduleTitle = (mod.title || "").trim();
      if (!moduleTitle) continue;

      const lessonRefs: Array<{ _type: "reference"; _ref: string }> = [];
      const lessons = Array.isArray(mod.lessons) ? mod.lessons : [];

      for (let li = 0; li < lessons.length; li++) {
        const lesson = lessons[li];
        const lessonTitle = (lesson.title || "").trim();
        if (!lessonTitle) continue;

        const content = (lesson.content || "").trim();
        const testOutput = (lesson.testOutput || "").trim();

        let challengeId: string | undefined = undefined;
        if (testOutput) {
          // If testOutput is provided, upsert a challenge document
          // For simplicity in this automated flow, we'll create a single test case
          const challengeData = {
            _type: "challenge",
            title: `${lessonTitle} Challenge`,
            language: "rust", // Default to rust for ahora
            testCases: [
              {
                _key: "default-test",
                name: "Standard test case",
                expected: testOutput,
              },
            ],
          };

          // Check if lesson already has a challenge to update
          const existingLesson = lesson._id ? await serverClient.fetch(`*[_id == $id][0]{ challenge->{_id} }`, { id: lesson._id }) : null;

          if (existingLesson?.challenge?._id) {
            await serverClient.patch(existingLesson.challenge._id).set(challengeData).commit();
            challengeId = existingLesson.challenge._id;
          } else {
            const newChallenge = await serverClient.create(challengeData);
            challengeId = newChallenge._id;
          }
        }

        if (lesson._id) {
          const updatedLesson = await serverClient
            .patch(lesson._id)
            .set({
              title: lessonTitle,
              sortOrder: li,
              content: content,
              lessonType: challengeId ? "challenge" : "content",
              challenge: challengeId ? { _type: "reference", _ref: challengeId } : undefined,
            })
            .commit();

          lessonRefs.push({
            _type: "reference",
            _ref: updatedLesson._id,
          });
        } else {
          const createdLesson = await serverClient.create({
            _type: "lesson",
            title: lessonTitle,
            sortOrder: li,
            content: content,
            lessonType: challengeId ? "challenge" : "content",
            challenge: challengeId ? { _type: "reference", _ref: challengeId } : undefined,
          });

          lessonRefs.push({
            _type: "reference",
            _ref: createdLesson._id,
          });
        }
      }

      let quizRef: { _type: "reference", _ref: string } | undefined = undefined;

      if (mod.quiz) {
        const quizData = {
          title: mod.quiz.title,
          passingScore: mod.quiz.passingScore,
          questions: mod.quiz.questions.map(q => ({
            ...q,
            _key: Math.random().toString(36).substring(7)
          }))
        };

        if (mod.quiz._id) {
          const updatedQuiz = await serverClient.patch(mod.quiz._id).set(quizData).commit();
          quizRef = { _type: "reference", _ref: updatedQuiz._id };
        } else {
          const createdQuiz = await serverClient.create({
            _type: "quiz",
            ...quizData
          });
          quizRef = { _type: "reference", _ref: createdQuiz._id };
        }
      }

      if (mod._id) {
        const updatedModule = await serverClient
          .patch(mod._id)
          .set({
            title: moduleTitle,
            sortOrder: mi,
            lessons: lessonRefs,
            quiz: quizRef,
          })
          .commit();

        moduleRefs.push({
          _type: "reference",
          _ref: updatedModule._id,
        });
      } else {
        const createdModule = await serverClient.create({
          _type: "module",
          title: moduleTitle,
          sortOrder: mi,
          lessons: lessonRefs,
          quiz: quizRef,
        });

        moduleRefs.push({
          _type: "reference",
          _ref: createdModule._id,
        });
      }
    }

    // Update course modules with new module references
    const updatedCourse = await serverClient
      .patch(id)
      .set({ modules: moduleRefs })
      .commit();

    return NextResponse.json({ success: true, course: updatedCourse });
  } catch (error: any) {
    console.error("Error updating modules/lessons:", error);

    if (error.message?.includes("Insufficient permissions") || error.statusCode === 403) {
      return NextResponse.json(
        {
          error:
            "API token lacks write permissions. Please create a new token with Editor role in Sanity dashboard (Settings → API → Tokens). See docs/SANITY_TOKEN_SETUP.md for details.",
          details: error.message,
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to update modules and lessons" },
      { status: 500 }
    );
  }
}

