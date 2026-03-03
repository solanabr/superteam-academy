import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const difficulty = searchParams.get("difficulty");
  const trackId = searchParams.get("trackId");
  const search = searchParams.get("search");

  const completionGroups = await prisma.enrollment.groupBy({
    by: ["courseId"],
    where: { completedAt: { not: null } },
    _count: { courseId: true },
  });
  const completionMap = new Map(
    completionGroups.map((g) => [g.courseId, g._count.courseId]),
  );

  const courses = await prisma.course.findMany({
    where: {
      isActive: true,
      ...(difficulty ? { difficulty } : {}),
      ...(trackId ? { trackId: parseInt(trackId) } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
              { tags: { hasSome: [search.toLowerCase()] } },
            ],
          }
        : {}),
    },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              title: true,
              description: true,
              type: true,
              order: true,
              xpReward: true,
              duration: true,
            },
          },
        },
      },
      _count: {
        select: {
          enrollments: true,
        },
      },
    },
    orderBy: [{ trackId: "asc" }, { trackLevel: "asc" }],
  });

  const formatted = courses.map((c) => {
    const lessonCount = c.modules.reduce((sum, m) => sum + m.lessons.length, 0);
    const challengeCount = c.modules.reduce(
      (sum, m) => sum + m.lessons.filter((l) => l.type === "challenge").length,
      0,
    );
    return {
      id: c.id,
      slug: c.slug,
      title: c.title,
      description: c.description,
      thumbnail: c.thumbnail,
      difficulty: c.difficulty,
      duration: c.duration,
      lessonCount,
      challengeCount,
      xpTotal: c.xpTotal,
      trackId: c.trackId,
      trackLevel: c.trackLevel,
      trackName: c.trackName,
      creator: c.creator,
      creatorAvatar: c.creatorAvatar,
      isActive: c.isActive,
      totalEnrollments: c._count.enrollments,
      totalCompletions: completionMap.get(c.id) ?? 0,
      modules: c.modules.map((m) => ({
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
          duration: l.duration,
        })),
      })),
      prerequisites: c.prerequisites,
      tags: c.tags,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    };
  });

  return NextResponse.json(formatted);
}
