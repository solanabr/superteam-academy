import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PrismaProgressService } from "@/lib/services/prisma-progress";

const service = new PrismaProgressService();

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;

  // Look up by wallet address, displayName, or name (case-insensitive)
  const user = await prisma.user.findFirst({
    where: {
      isPublic: true,
      OR: [
        { wallet: username },
        { displayName: { equals: username, mode: "insensitive" } },
        { name: { equals: username, mode: "insensitive" } },
      ],
    },
    include: {
      socialLinks: true,
      enrollments: {
        select: { courseId: true, completedAt: true },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Profile not found or private" }, { status: 404 });
  }

  const [xp, streak, achievements, credentials] = await Promise.all([
    service.getXP(user.id),
    service.getStreak(user.id),
    service.getAchievements(user.id),
    user.wallet ? service.getCredentials(user.wallet) : Promise.resolve([]),
  ]);

  const levelFromXP = (x: number) => Math.floor(Math.sqrt(x / 100));

  return NextResponse.json({
    displayName: user.displayName ?? user.name ?? "Anonymous",
    bio: user.bio ?? "",
    joinedAt: user.createdAt.toISOString(),
    socialLinks: {
      twitter: user.socialLinks?.twitter ?? null,
      github: user.socialLinks?.github ?? null,
      discord: user.socialLinks?.discord ?? null,
    },
    xp,
    level: levelFromXP(xp),
    streak,
    achievements,
    credentials,
    coursesCompleted: user.enrollments
      .filter((e) => e.completedAt !== null)
      .map((e) => e.courseId),
    enrolledCourses: user.enrollments.map((e) => e.courseId),
  });
}
