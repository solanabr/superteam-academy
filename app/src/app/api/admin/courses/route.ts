import { NextRequest, NextResponse } from "next/server";
import { isAdminWallet } from "@/lib/admin";
import { sanityWriteClient } from "@/sanity/write-client";
import { sanityClient } from "@/sanity/client";

function verifyAdmin(request: NextRequest) {
  const wallet = request.headers.get("X-Wallet-Address");
  if (!wallet || !isAdminWallet(wallet)) {
    return null;
  }
  return wallet;
}

export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const client = sanityWriteClient ?? sanityClient;
  if (!client) {
    return NextResponse.json(
      { error: "Sanity not configured" },
      { status: 500 },
    );
  }

  const courses = await client.fetch(`
    *[_type == "course"] | order(courseId asc) {
      _id, courseId,
      "slug": slug.current,
      title, difficulty, published,
      "thumbnailUrl": thumbnail.asset->url,
      "instructorName": instructor->name,
      "modulesCount": count(modules),
      "lessonsCount": count(modules[].lessons[])
    }
  `);

  return NextResponse.json(courses);
}

export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  if (!sanityWriteClient) {
    return NextResponse.json(
      { error: "SANITY_API_TOKEN not configured" },
      { status: 500 },
    );
  }

  const body = await request.json();

  const doc = {
    _type: "course" as const,
    courseId: body.courseId,
    slug: { _type: "slug" as const, current: body.slug },
    title: body.title,
    description: body.description,
    longDescription: body.longDescription,
    difficulty: body.difficulty,
    duration: body.duration,
    totalDurationMinutes: body.totalDurationMinutes,
    xpTotal: body.xpTotal,
    track: body.track,
    published: body.published ?? false,
    ...(body.thumbnailAssetId && {
      thumbnail: {
        _type: "image" as const,
        asset: { _type: "reference" as const, _ref: body.thumbnailAssetId },
      },
    }),
    ...(body.instructorRef && {
      instructor: { _type: "reference" as const, _ref: body.instructorRef },
    }),
    modules: (body.modules ?? []).map(
      (m: Record<string, unknown>, mi: number) => ({
        _type: "module",
        _key: `mod-${mi}`,
        moduleId: m.moduleId,
        title: m.title,
        lessons: ((m.lessons as Record<string, unknown>[]) ?? []).map(
          (l: Record<string, unknown>, li: number) => ({
            _type: "lesson",
            _key: `les-${mi}-${li}`,
            lessonId: l.lessonId,
            title: l.title,
            slug: l.slug,
            lessonType: l.lessonType,
            durationMinutes: l.durationMinutes,
            xpReward: l.xpReward,
            ...(l.content ? { content: l.content } : {}),
            ...(l.exercise
              ? {
                  exercise: {
                    _type: "exercise",
                    question: (l.exercise as Record<string, unknown>).question,
                    options: (
                      (l.exercise as Record<string, unknown>).options as Record<
                        string,
                        unknown
                      >[]
                    )?.map((o: Record<string, unknown>, oi: number) => ({
                      ...o,
                      _key: `opt-${oi}`,
                    })),
                    correctIndex: (l.exercise as Record<string, unknown>)
                      .correctIndex,
                  },
                }
              : {}),
            ...(l.challenge
              ? {
                  challenge: {
                    _type: "challengeBlock",
                    prompt: (l.challenge as Record<string, unknown>).prompt,
                    starterCode: (l.challenge as Record<string, unknown>)
                      .starterCode,
                    language: (l.challenge as Record<string, unknown>).language,
                    testCases: (
                      (l.challenge as Record<string, unknown>)
                        .testCases as Record<string, unknown>[]
                    )?.map((tc: Record<string, unknown>, ti: number) => ({
                      _type: "testCase",
                      _key: `tc-${ti}`,
                      input: tc.input,
                      expected: tc.expected,
                    })),
                  },
                }
              : {}),
          }),
        ),
      }),
    ),
  };

  const created = await sanityWriteClient.create(doc);
  return NextResponse.json({ _id: created._id }, { status: 201 });
}
