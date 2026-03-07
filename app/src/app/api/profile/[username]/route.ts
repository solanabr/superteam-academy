import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { AchievementEngine } from "@/lib/services/achievements";
import { getCredentials } from "@/lib/services/onchain";
import { Errors, handleApiError } from "@/lib/api/errors";

interface RouteContext {
  params: Promise<{ username: string }>;
}

export async function GET(
  _request: Request,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const { username } = await params;
    const user = await prisma.user.findFirst({
      where: {
        username,
        isPublic: true,
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
        twitterHandle: true,
        githubHandle: true,
        discordHandle: true,
        websiteUrl: true,
      },
    });

    if (!user) {
      throw Errors.notFound("Profile not found");
    }

    const [wallets, achievements, xpRecord] = await Promise.all([
      prisma.userWallet.findMany({
        where: { userId: user.id },
        select: { address: true, isPrimary: true },
      }),
      new AchievementEngine().getAchievementsWithStatus(user.id),
      prisma.userXP.findUnique({
        where: { userId: user.id },
        select: { totalXP: true },
      }),
    ]);

    const primaryWallet =
      wallets.find((wallet) => wallet.isPrimary)?.address ?? null;
    const credentials = primaryWallet ? await getCredentials(primaryWallet) : [];

    return NextResponse.json({
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      joinedAt: user.createdAt.toISOString(),
      socialLinks: {
        twitter: user.twitterHandle,
        github: user.githubHandle,
        discord: user.discordHandle,
        website: user.websiteUrl,
      },
      xp: xpRecord?.totalXP ?? 0,
      achievements: achievements.map((achievement) => ({
        id: achievement.id,
        slug: achievement.id,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        category: "special",
        unlockedAt: achievement.unlockedAt?.toISOString() ?? null,
      })),
      credentials: credentials.map((credential) => ({
        mintAddress: credential.mintAddress,
        trackId: credential.trackName.toLowerCase().replace(/\s+/g, "-"),
        trackName: credential.trackName || credential.name,
        level: Number.parseInt(credential.level, 10) || 1,
        imageUri: credential.imageUrl,
        metadataUri: credential.metadataUri,
        acquiredAt: new Date().toISOString(),
        verificationUrl: `https://explorer.solana.com/address/${credential.mintAddress}?cluster=devnet`,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
