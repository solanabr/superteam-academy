import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            include: {
              challenge: {
                include: {
                  testCases: { orderBy: { order: "asc" } },
                },
              },
            },
          },
        },
      },
      _count: {
        select: { enrollments: true },
      },
    },
  });

  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const completionsCount = await prisma.enrollment.count({
    where: { courseId: course.id, completedAt: { not: null } },
  });

  const lessonCount = course.modules.reduce(
    (sum, m) => sum + m.lessons.length,
    0,
  );
  const challengeCount = course.modules.reduce(
    (sum, m) => sum + m.lessons.filter((l) => l.type === "challenge").length,
    0,
  );

  const formatted = {
    id: course.id,
    slug: course.slug,
    title: course.title,
    description: course.description,
    thumbnail: course.thumbnail,
    difficulty: course.difficulty,
    duration: course.duration,
    lessonCount,
    challengeCount,
    xpTotal: course.xpTotal,
    trackId: course.trackId,
    trackLevel: course.trackLevel,
    trackName: course.trackName,
    creator: course.creator,
    creatorAvatar: course.creatorAvatar,
    isActive: course.isActive,
    totalEnrollments: course._count.enrollments,
    totalCompletions: completionsCount,
    modules: course.modules.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      order: m.order,
      lessons: m.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        description: l.description,
        type: l.type,
        order: l.order,
        xpReward: l.xpReward,
        content: l.content,
        duration: l.duration,
        challenge: l.challenge
          ? {
              id: l.challenge.id,
              prompt: l.challenge.prompt,
              starterCode: l.challenge.starterCode,
              language: l.challenge.language,
              hints: l.challenge.hints,
              testCases: l.challenge.testCases.map((t) => ({
                id: t.id,
                name: t.name,
                input: t.input,
              })),
            }
          : undefined,
      })),
    })),
    prerequisites: course.prerequisites,
    tags: course.tags,
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString(),
  };

  return NextResponse.json(formatted);
}
