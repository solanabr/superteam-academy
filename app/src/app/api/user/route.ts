import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { PrismaProgressService } from "@/lib/services/prisma-progress";
import { resolveUserId } from "@/lib/auth-utils";

const service = new PrismaProgressService();

export async function GET() {
  const userId = await resolveUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      socialLinks: true,
      enrollments: {
        select: { courseId: true, completedAt: true },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const xp = await service.getXP(user.id);
  const streak = await service.getStreak(user.id);
  const achievements = await service.getAchievements(user.id);
  const credentials = user.wallet ? await service.getCredentials(user.wallet) : [];

  const levelFromXP = (xp: number) => Math.floor(Math.sqrt(xp / 100));

  return NextResponse.json({
    id: user.id,
    wallet: user.wallet,
    displayName: user.displayName ?? user.name ?? "Anonymous",
    bio: user.bio,
    avatar: user.image,
    isAdmin: user.isAdmin,
    socialLinks: {
      twitter: user.socialLinks?.twitter,
      github: user.socialLinks?.github,
      discord: user.socialLinks?.discord,
    },
    joinedAt: user.createdAt.toISOString(),
    isPublic: user.isPublic,
    xp,
    level: levelFromXP(xp),
    streak,
    achievements,
    credentials,
    completedCourses: user.enrollments
      .filter((e) => e.completedAt !== null)
      .map((e) => e.courseId),
    enrolledCourses: user.enrollments.map((e) => e.courseId),
    skills: {},
  });
}

export async function PATCH(request: NextRequest) {
  const userId = await resolveUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { displayName, bio, isPublic, wallet, socialLinks } = body;

  const updateData: Record<string, unknown> = {};
  if (displayName !== undefined) updateData.displayName = displayName;
  if (bio !== undefined) updateData.bio = bio;
  if (isPublic !== undefined) updateData.isPublic = isPublic;
  if (wallet !== undefined) updateData.wallet = wallet;

  await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  if (socialLinks) {
    await prisma.socialLinks.upsert({
      where: { userId },
      create: {
        userId,
        twitter: socialLinks.twitter,
        github: socialLinks.github,
        discord: socialLinks.discord,
      },
      update: {
        twitter: socialLinks.twitter,
        github: socialLinks.github,
        discord: socialLinks.discord,
      },
    });
  }

  return NextResponse.json({ success: true });
}
