import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sanityClient } from "@/lib/sanity/client";
import { sanityWriteClient } from "@/lib/sanity/write-client";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function getWalletFromToken(token: string) {
  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("wallet_address")
    .eq("id", user.id)
    .single();

  return profile?.wallet_address ?? null;
}

/**
 * GET /api/courses/[id]
 * Fetch full course data for editing (owner only).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const wallet = await getWalletFromToken(token);
    if (!wallet) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const course = await sanityClient.fetch(
      `*[_type == "course" && _id == $id && creator == $wallet][0] {
        _id,
        title,
        "slug": slug.current,
        description,
        difficulty,
        trackId,
        duration,
        xpPerLesson,
        status,
        whatYouLearn,
        "thumbnailUrl": thumbnail.asset->url,
        "instructor": instructor { name, bio },
        "modules": modules[] {
          title,
          description,
          "lessons": lessons[] {
            title,
            description,
            type,
            htmlContent,
            videoUrl,
            xp,
            duration,
            "quiz": quiz {
              passingScore,
              "questions": questions[] {
                question,
                options,
                correctIndex,
                explanation
              }
            },
            "challenge": challenge {
              prompt,
              objectives,
              starterCode,
              language,
              hints
            }
          }
        }
      }`,
      { id, wallet },
    );

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json({ course });
  } catch (err) {
    console.error("[courses/[id] GET]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/courses/[id]
 * Update an existing course. Resets status to "draft" requiring re-approval.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const wallet = await getWalletFromToken(token);
    if (!wallet) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership and get existing courseId
    const existing = await sanityClient.fetch(
      `*[_type == "course" && _id == $id && creator == $wallet][0] { _id, courseId }`,
      { id, wallet },
    );

    if (!existing) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const dataStr = formData.get("data") as string | null;
    if (!dataStr) {
      return NextResponse.json(
        { error: "Missing form data" },
        { status: 400 },
      );
    }
    const body = JSON.parse(dataStr);
    const thumbnailFile = formData.get("thumbnail") as File | null;

    const {
      title,
      description,
      difficulty,
      trackId,
      duration,
      xpPerLesson,
      modules,
      whatYouLearn,
      instructor,
    } = body;

    if (!title || !description || !difficulty) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const MAX_XP_PER_LESSON = 15;
    const MAX_COURSE_XP = 300;
    const clampedXpPerLesson = Math.min(
      xpPerLesson ?? MAX_XP_PER_LESSON,
      MAX_XP_PER_LESSON,
    );

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
        questions: {
          question: string;
          options: string[];
          correctIndex: number;
          explanation: string;
        }[];
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

    let lessonCount = 0;
    let totalXp = 0;

    const sanityModules = (modules ?? []).map(
      (mod: ModuleInput, mi: number) => {
        const sanityLessons = (mod.lessons ?? []).map(
          (les: LessonInput, li: number) => {
            lessonCount++;
            const lessonXp = Math.min(
              les.xp ?? clampedXpPerLesson,
              MAX_XP_PER_LESSON,
            );
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
          },
        );

        return {
          _key: `module-${mi}`,
          title: mod.title,
          description: mod.description ?? "",
          lessons: sanityLessons,
        };
      },
    );

    if (totalXp > MAX_COURSE_XP) {
      return NextResponse.json(
        {
          error: `Total course XP (${totalXp}) exceeds maximum of ${MAX_COURSE_XP}`,
        },
        { status: 400 },
      );
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const patch: Record<string, unknown> = {
      title,
      slug: { _type: "slug", current: slug },
      courseId: existing.courseId || slug,
      description,
      difficulty: Number(difficulty),
      trackId: trackId ? Number(trackId) : 1,
      duration: duration ?? "",
      xpPerLesson: clampedXpPerLesson,
      lessonCount,
      modules: sanityModules,
      whatYouLearn: whatYouLearn ?? [],
      instructor: instructor ?? { name: wallet.slice(0, 8) },
      // Reset status so it needs re-approval
      status: "draft",
      isPublished: false,
      isActive: false,
    };

    // Upload thumbnail to Sanity if provided
    if (thumbnailFile && thumbnailFile.size > 0) {
      const buffer = Buffer.from(await thumbnailFile.arrayBuffer());
      const asset = await sanityWriteClient.assets.upload("image", buffer, {
        filename: thumbnailFile.name,
        contentType: thumbnailFile.type,
      });
      patch.thumbnail = {
        _type: "image",
        asset: { _type: "reference", _ref: asset._id },
      };
    }

    await sanityWriteClient.patch(id).set(patch).commit();

    return NextResponse.json({ id, slug });
  } catch (err) {
    console.error("[courses/[id] PUT]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
