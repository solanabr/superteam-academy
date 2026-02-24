import { NextResponse } from "next/server";
import { getSanityWriteClient } from "@/lib/sanity/write-client";
import { isAdminRequest } from "@/lib/auth/admin";

export async function POST(req: Request) {
  try {
    if (!(await isAdminRequest(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const {
      moduleId,
      title,
      type,
      markdownContent,
      xpReward,
      estimatedMinutes,
      order,
      challenge,
    } = body as {
      moduleId?: string;
      title?: string;
      type?: string;
      markdownContent?: string;
      xpReward?: number;
      estimatedMinutes?: number;
      order?: number;
      challenge?: {
        instructions?: string;
        starterCode?: string;
        solution?: string;
        language?: string;
      };
    };

    if (!moduleId || !title || !type) {
      return NextResponse.json(
        { error: "Missing required fields: moduleId, title, type" },
        { status: 400 },
      );
    }

    const sanity = getSanityWriteClient();

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const lessonDoc: Record<string, unknown> = {
      _type: "lesson",
      title,
      slug: { _type: "slug", current: slug },
      type,
      markdownContent: markdownContent ?? "",
      xpReward: xpReward ?? 25,
      estimatedMinutes: estimatedMinutes ?? 10,
      order: order ?? 0,
    };

    if (type === "challenge" && challenge) {
      lessonDoc.challenge = {
        instructions: challenge.instructions ?? "",
        starterCode: challenge.starterCode ?? "",
        solution: challenge.solution ?? "",
        language: challenge.language ?? "typescript",
      };
    }

    const lesson = await sanity.create(lessonDoc as { _type: string; [key: string]: unknown });

    // Append lesson reference to module.lessons array
    await sanity
      .patch(moduleId)
      .setIfMissing({ lessons: [] })
      .append("lessons", [{ _type: "reference", _ref: lesson._id }])
      .commit();

    return NextResponse.json({
      success: true,
      lesson: {
        _id: lesson._id,
        title: lesson.title,
        slug,
        type: lesson.type,
        xpReward: lesson.xpReward,
        order: lesson.order,
      },
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to create lesson";
    console.error("create-lesson error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
