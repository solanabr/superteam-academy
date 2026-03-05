import { NextRequest, NextResponse } from "next/server";
import { isAdminWallet } from "@/lib/admin";
import { sanityWriteClient } from "@/sanity/write-client";
import { sanityClient } from "@/sanity/client";

function verifyAdmin(request: NextRequest) {
  const wallet = request.headers.get("X-Wallet-Address");
  if (!wallet || !isAdminWallet(wallet)) return null;
  return wallet;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const client = sanityWriteClient ?? sanityClient;
  if (!client) {
    return NextResponse.json(
      { error: "Sanity not configured" },
      { status: 500 },
    );
  }

  const course = await client.fetch(
    `*[_type == "course" && _id == $id][0] {
      _id, courseId,
      "slug": slug.current,
      title, description, longDescription,
      difficulty, duration, totalDurationMinutes, xpTotal,
      "thumbnailUrl": thumbnail.asset->url,
      "thumbnailAssetId": thumbnail.asset._ref,
      "instructorRef": instructor._ref,
      track, modules, published
    }`,
    { id },
  );

  if (!course) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(course);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  if (!sanityWriteClient) {
    return NextResponse.json(
      { error: "SANITY_API_TOKEN not configured" },
      { status: 500 },
    );
  }

  const { id } = await params;
  const body = await request.json();

  const data: Record<string, unknown> = {
    courseId: body.courseId,
    slug: { _type: "slug", current: body.slug },
    title: body.title,
    description: body.description,
    longDescription: body.longDescription,
    difficulty: body.difficulty,
    duration: body.duration,
    totalDurationMinutes: body.totalDurationMinutes,
    xpTotal: body.xpTotal,
    track: body.track,
    published: body.published ?? false,
  };

  if (body.thumbnailAssetId) {
    data.thumbnail = {
      _type: "image",
      asset: { _type: "reference", _ref: body.thumbnailAssetId },
    };
  }

  if (body.instructorRef) {
    data.instructor = { _type: "reference", _ref: body.instructorRef };
  }

  data.modules = (body.modules ?? []).map(
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
  );

  const updated = await sanityWriteClient.patch(id).set(data).commit();
  return NextResponse.json({ _id: updated._id });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  if (!sanityWriteClient) {
    return NextResponse.json(
      { error: "SANITY_API_TOKEN not configured" },
      { status: 500 },
    );
  }

  const { id } = await params;
  await sanityWriteClient.delete(id);
  return new NextResponse(null, { status: 204 });
}
