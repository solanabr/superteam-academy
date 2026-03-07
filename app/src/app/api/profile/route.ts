import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/client";
import { AchievementEngine } from "@/lib/services/achievements";
import { getCredentials } from "@/lib/services/onchain";
import type { AchievementWithStatus } from "@/types/achievements";
import { Errors, handleApiError } from "@/lib/api/errors";

export interface ProfileResponse {
  username: string | null;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  joinedAt: string;
  isPublic: boolean;
  primaryWallet: string | null;
  linkedWallets: string[];
  linkedProviders: string[];
  socialLinks: {
    twitter: string | null;
    github: string | null;
    discord: string | null;
    website: string | null;
  };
  preferredLocale: string;
  theme: string;
  achievements: AchievementWithStatus[];
  credentials: CredentialData[];
}

interface CredentialData {
  mintAddress: string;
  trackId: string;
  trackName: string;
  level: number;
  acquiredAt: string;
}

const UpdateProfileSchema = z.object({
  username: z.string().trim().min(3).max(32).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  displayName: z.string().trim().min(1).max(80).optional(),
  bio: z.string().trim().max(280).optional(),
  isPublic: z.boolean().optional(),
  twitterHandle: z.string().trim().max(50).optional(),
  githubHandle: z.string().trim().max(50).optional(),
  discordHandle: z.string().trim().max(50).optional(),
  websiteUrl: z.string().trim().max(200).optional(),
  preferredLocale: z.string().trim().min(2).max(12).optional(),
  theme: z.string().trim().min(4).max(12).optional(),
});

function normalizeNullableText(value: string | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function GET(): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw Errors.unauthorized("Unauthorized");
    }

    const userId = session.user.id;

    // Fetch user data with relations in parallel
    const [user, wallets, accounts, achievements] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          username: true,
          displayName: true,
          bio: true,
          avatarUrl: true,
          createdAt: true,
          isPublic: true,
          twitterHandle: true,
          githubHandle: true,
          discordHandle: true,
          websiteUrl: true,
          preferredLocale: true,
          theme: true,
        },
      }),
      prisma.userWallet.findMany({
        where: { userId },
        select: { address: true, isPrimary: true },
      }),
      prisma.account.findMany({
        where: { userId },
        select: { provider: true },
      }),
      new AchievementEngine().getAchievementsWithStatus(userId),
    ]);

    if (!user) {
      throw Errors.notFound("User not found");
    }

    const primaryWallet = wallets.find((w: { isPrimary: boolean; address: string }) => w.isPrimary)?.address ?? null;
    const walletAddresses = wallets.map((w: { address: string }) => w.address);
    const linkedProviders = accounts.map((a: { provider: string }) => a.provider);

    const credentials = primaryWallet
      ? (await getCredentials(primaryWallet)).map((credential) => ({
          mintAddress: credential.mintAddress,
          trackId: credential.trackName.toLowerCase().replace(/\s+/g, "-"),
          trackName: credential.trackName || credential.name,
          level: Number.parseInt(credential.level, 10) || 1,
          acquiredAt: new Date().toISOString(),
        }))
      : [];

    const response: ProfileResponse = {
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      joinedAt: user.createdAt.toISOString(),
      isPublic: user.isPublic ?? true,
      primaryWallet,
      linkedWallets: walletAddresses,
      linkedProviders,
      socialLinks: {
        twitter: user.twitterHandle,
        github: user.githubHandle,
        discord: user.discordHandle,
        website: user.websiteUrl,
      },
      preferredLocale: user.preferredLocale,
      theme: user.theme,
      achievements,
      credentials,
    };

    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw Errors.unauthorized("Unauthorized");
    }

    const body = (await request.json()) as unknown;

    const preprocess = z.object({
      username: z.string().optional(),
      displayName: z.string().optional(),
      bio: z.string().optional(),
      isPublic: z.boolean().optional(),
      twitterHandle: z.string().optional(),
      githubHandle: z.string().optional(),
      discordHandle: z.string().optional(),
      websiteUrl: z.string().optional(),
      preferredLocale: z.string().optional(),
      theme: z.string().optional(),
    });

    const raw = preprocess.parse(body);

    const parsed = UpdateProfileSchema.parse({
      ...raw,
      username: raw.username?.trim() === "" ? undefined : raw.username,
      displayName: raw.displayName?.trim() === "" ? undefined : raw.displayName,
      bio: raw.bio?.trim() === "" ? undefined : raw.bio,
      twitterHandle: raw.twitterHandle?.trim() === "" ? undefined : raw.twitterHandle,
      githubHandle: raw.githubHandle?.trim() === "" ? undefined : raw.githubHandle,
      discordHandle: raw.discordHandle?.trim() === "" ? undefined : raw.discordHandle,
      websiteUrl: raw.websiteUrl?.trim() === "" ? undefined : raw.websiteUrl,
      preferredLocale: raw.preferredLocale?.trim() === "" ? undefined : raw.preferredLocale,
      theme: raw.theme?.trim() === "" ? undefined : raw.theme,
    });

    const username = normalizeNullableText(parsed.username);
    const displayName = normalizeNullableText(parsed.displayName);
    const bio = normalizeNullableText(parsed.bio);
    const twitterHandle = normalizeNullableText(parsed.twitterHandle);
    const githubHandle = normalizeNullableText(parsed.githubHandle);
    const discordHandle = normalizeNullableText(parsed.discordHandle);
    const websiteUrl = normalizeNullableText(parsed.websiteUrl);
    const preferredLocale = normalizeNullableText(parsed.preferredLocale);
    const theme = normalizeNullableText(parsed.theme);

    const data: {
      username?: string | null;
      displayName?: string | null;
      bio?: string | null;
      isPublic?: boolean;
      twitterHandle?: string | null;
      githubHandle?: string | null;
      discordHandle?: string | null;
      websiteUrl?: string | null;
      preferredLocale?: string;
      theme?: string;
    } = {};

    if (raw.username !== undefined) data.username = username ?? null;
    if (raw.displayName !== undefined) data.displayName = displayName ?? null;
    if (raw.bio !== undefined) data.bio = bio ?? null;
    if (parsed.isPublic !== undefined) data.isPublic = parsed.isPublic;
    if (raw.twitterHandle !== undefined) data.twitterHandle = twitterHandle ?? null;
    if (raw.githubHandle !== undefined) data.githubHandle = githubHandle ?? null;
    if (raw.discordHandle !== undefined) data.discordHandle = discordHandle ?? null;
    if (raw.websiteUrl !== undefined) data.websiteUrl = websiteUrl ?? null;
    if (raw.preferredLocale !== undefined && preferredLocale) data.preferredLocale = preferredLocale;
    if (raw.theme !== undefined && theme) data.theme = theme;

    await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: { id: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.issues.reduce<Record<string, string[]>>((acc, issue) => {
        const key = issue.path.join(".") || "form";
        if (!acc[key]) acc[key] = [];
        acc[key].push(issue.message);
        return acc;
      }, {});
      return handleApiError(Errors.validation("Invalid profile data", fieldErrors));
    }

    const prismaCode =
      typeof error === "object" && error && "code" in error
        ? String((error as { code?: string }).code)
        : null;
    if (prismaCode === "P2002") {
      return handleApiError(Errors.conflict("Username is already taken"));
    }
    return handleApiError(error);
  }
}
