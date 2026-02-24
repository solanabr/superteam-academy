import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sanityWriteClient } from "@/lib/sanity/write-client";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * POST /api/courses/create
 * Creates a new course draft in Sanity.
 * Any authenticated user can create a course.
 */
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get wallet address
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("wallet_address")
      .eq("id", user.id)
      .single();

    const walletAddress = profile?.wallet_address;
    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet not linked. Connect a wallet first." },
        { status: 400 },
      );
    }

    const formData = await req.formData();
    const dataStr = formData.get("data") as string | null;
    if (!dataStr) {
      return NextResponse.json({ error: "Missing form data" }, { status: 400 });
    }
    const body = JSON.parse(dataStr);
    const thumbnailFile = formData.get("thumbnail") as File | null;

    const { title, description, difficulty, trackId, duration, xpPerLesson, modules, whatYouLearn, instructor } = body;

    if (!title || !description || !difficulty) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const MAX_XP_PER_LESSON = 15;
    const MAX_COURSE_XP = 300;
    const clampedXpPerLesson = Math.min(xpPerLesson ?? MAX_XP_PER_LESSON, MAX_XP_PER_LESSON);

    // Build Sanity modules with quiz/challenge data
    let lessonCount = 0;
    let totalXp = 0;

    interface LessonInput {
      title: string;
      description?: string;
      type?: string;
      content?: string;
      videoUrl?: string;
      xp?: number;
      duration?: string;
      quiz?: {
        passingScore: number;
        questions: { question: string; options: string[]; correctIndex: number; explanation: string }[];
      };
      challenge?: {
        prompt: string;
        objectives: string[];
        starterCode: string;
        language: string;
        hints: string[];
      };
    }

    interface ModuleInput {
      title: string;
      description?: string;
      lessons?: LessonInput[];
    }

    const sanityModules = (modules ?? []).map((mod: ModuleInput, mi: number) => {
      const sanityLessons = (mod.lessons ?? []).map((les: LessonInput, li: number) => {
        lessonCount++;
        const lessonXp = Math.min(les.xp ?? clampedXpPerLesson, MAX_XP_PER_LESSON);
        totalXp += lessonXp;

        const base: Record<string, unknown> = {
          _key: `lesson-${mi}-${li}`,
          title: les.title,
          description: les.description ?? "",
          type: les.type ?? "content",
          htmlContent: les.content ?? "",
          videoUrl: les.videoUrl ?? "",
          xp: lessonXp,
          duration: les.duration ?? "",
        };

        if (les.type === "quiz" && les.quiz) {
          base.quiz = {
            passingScore: les.quiz.passingScore ?? 70,
            questions: les.quiz.questions.map((q, qi) => ({
              _key: `q-${mi}-${li}-${qi}`,
              question: q.question,
              options: q.options,
              correctIndex: q.correctIndex,
              explanation: q.explanation ?? "",
            })),
          };
        }

        if (les.type === "challenge" && les.challenge) {
          base.challenge = {
            prompt: les.challenge.prompt ?? "",
            objectives: les.challenge.objectives ?? [],
            starterCode: les.challenge.starterCode ?? "",
            language: les.challenge.language ?? "typescript",
            hints: les.challenge.hints ?? [],
          };
        }

        return base;
      });

      return {
        _key: `module-${mi}`,
        title: mod.title,
        description: mod.description ?? "",
        lessons: sanityLessons,
      };
    });

    if (totalXp > MAX_COURSE_XP) {
      return NextResponse.json(
        { error: `Total course XP (${totalXp}) exceeds maximum of ${MAX_COURSE_XP}` },
        { status: 400 },
      );
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const doc: Record<string, unknown> = {
      _type: "course",
      title,
      slug: { _type: "slug", current: slug },
      courseId: slug,
      description,
      difficulty: Number(difficulty),
      trackId: trackId ? Number(trackId) : 1,
      duration: duration ?? "",
      xpPerLesson: clampedXpPerLesson,
      lessonCount,
      modules: sanityModules,
      whatYouLearn: whatYouLearn ?? [],
      instructor: instructor ?? { name: walletAddress.slice(0, 8) },
      creator: walletAddress,
      submittedBy: walletAddress,
      status: "draft",
      isPublished: false,
      isActive: false,
      totalCompletions: 0,
      creatorRewardXp: 0,
    };

    // Upload thumbnail to Sanity if provided
    if (thumbnailFile && thumbnailFile.size > 0) {
      const buffer = Buffer.from(await thumbnailFile.arrayBuffer());
      const asset = await sanityWriteClient.assets.upload("image", buffer, {
        filename: thumbnailFile.name,
        contentType: thumbnailFile.type,
      });
      doc.thumbnail = {
        _type: "image",
        asset: { _type: "reference", _ref: asset._id },
      };
    }

    const created = await sanityWriteClient.create(doc as Parameters<typeof sanityWriteClient.create>[0]);

    return NextResponse.json({ id: created._id, slug });
  } catch (err) {
    console.error("[courses/create]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
