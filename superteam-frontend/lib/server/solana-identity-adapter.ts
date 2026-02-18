import type { AuthenticatedUser } from "@/lib/server/auth-adapter";
import type {
  IdentitySnapshot,
  IdentityAchievement,
  IdentityCertificate,
} from "@/lib/identity/types";
import {
  ACADEMY_CLUSTER,
  ACADEMY_PROGRAM_ID,
} from "@/lib/generated/academy-program";
import {
  getLearnerProfileOnChain,
  getLearnerProfilePda,
  getCredentialNFTs,
  type OnChainLearnerProfile,
  type OnChainCredentialNFT,
} from "@/lib/server/academy-chain-read";
import {
  getCachedLeaderboard,
  getRankForWallet,
  type LeaderboardEntry,
} from "@/lib/server/leaderboard-cache";
import { getCurrentStreak } from "@/lib/server/activity-store";
import { countCompletedCoursesOnChain } from "@/lib/server/academy-program";
import { getCertificatesForWallet } from "@/lib/server/certificate-service";
import { getUserSettings } from "@/lib/server/user-settings-store";

const XP_PER_LEVEL = 10_000;

const BADGE_RULES: Array<{
  name: string;
  icon: string;
  earned: (p: {
    xp: number;
    streak: number;
    totalCompleted: number;
    rank: number | null;
  }) => boolean;
}> = [
  {
    name: "First Steps",
    icon: "footprints",
    earned: (p) => p.totalCompleted >= 1 || p.xp > 0,
  },
  {
    name: "Code Warrior",
    icon: "swords",
    earned: (p) => p.totalCompleted >= 2,
  },
  { name: "Streak Master", icon: "flame", earned: (p) => p.streak >= 7 },
  {
    name: "Top 100",
    icon: "trophy",
    earned: (p) => p.rank !== null && p.rank <= 100,
  },
  { name: "Bug Hunter", icon: "bug", earned: () => false },
  {
    name: "DeFi Builder",
    icon: "building",
    earned: (p) => p.totalCompleted >= 3,
  },
  { name: "Anchor Pro", icon: "anchor", earned: (p) => p.totalCompleted >= 4 },
  { name: "Speed Demon", icon: "zap", earned: (p) => p.xp >= 5000 },
];

type StoredIdentity = {
  profileAsset: string | null;
  lastSyncedAt: number;
};

const identityStore = new Map<string, StoredIdentity>();

function profileAssetForWallet(walletAddress: string): string {
  return `profile-${walletAddress.slice(0, 8)}`;
}

export async function ensureWalletIdentitySynced(
  walletAddress: string,
): Promise<void> {
  const now = Date.now();
  const current = identityStore.get(walletAddress);
  if (!current) {
    identityStore.set(walletAddress, {
      profileAsset: profileAssetForWallet(walletAddress),
      lastSyncedAt: now,
    });
    return;
  }
  identityStore.set(walletAddress, {
    ...current,
    lastSyncedAt: now,
  });
}

export async function getIdentitySnapshotForWallet(
  walletAddress: string,
): Promise<IdentitySnapshot> {
  const username = `user_${walletAddress.slice(0, 6).toLowerCase()}`;
  return getIdentitySnapshotForUser({
    id: walletAddress,
    walletAddress,
    username,
  });
}

export type IdentityPrefetch = {
  onChainLearner: OnChainLearnerProfile | null;
  streak: number;
  totalCompleted: number;
  leaderboard: LeaderboardEntry[];
  credentialNfts: OnChainCredentialNFT[];
  completedSlugs?: string[];
};

export async function buildIdentitySnapshot(
  user: AuthenticatedUser,
  data: IdentityPrefetch,
): Promise<IdentitySnapshot> {
  let certificates: IdentityCertificate[];
  if (data.credentialNfts.length > 0) {
    certificates = data.credentialNfts.map((nft) => ({
      id: nft.id,
      course: nft.name,
      date: nft.completionDate,
      mintAddress: nft.mintAddress,
    }));
  } else {
    const certs = await getCertificatesForWallet(
      user.walletAddress,
      data.completedSlugs,
    );
    certificates = certs.map((c) => ({
      id: c.id,
      course: c.courseTitle,
      date: c.completionDate,
      mintAddress: c.mintAddress,
    }));
  }

  const learnerPda = getLearnerProfilePda(user.walletAddress);
  const level = data.onChainLearner?.level ?? 1;
  const xp = data.onChainLearner?.xpTotal ?? 0;
  const rank = getRankForWallet(data.leaderboard, user.walletAddress);

  const badges: IdentityAchievement[] = BADGE_RULES.map((rule) => ({
    name: rule.name,
    earned: rule.earned({
      xp,
      streak: data.streak,
      totalCompleted: data.totalCompleted,
      rank,
    }),
  }));

  const settings = await getUserSettings(user.walletAddress);
  const socialLinks: IdentitySnapshot["profile"]["socialLinks"] = {
    twitter: settings.twitter || undefined,
    github: settings.github || undefined,
    linkedin: settings.linkedin || undefined,
    website: settings.website || undefined,
  };
  const hasSocials = Object.values(socialLinks).some(Boolean);

  return {
    profile: {
      userId: user.id,
      walletAddress: user.walletAddress,
      username: user.username,
      name: settings.name || user.username || user.walletAddress.slice(0, 8),
      bio: settings.bio || "",
      joinDate: "",
      level,
      xp,
      xpToNext: XP_PER_LEVEL,
      streak: data.streak,
      rank: rank ?? 0,
      totalCompleted: data.totalCompleted,
      badges,
      certificates,
      socialLinks: hasSocials ? socialLinks : undefined,
    },
    chain: {
      programId: ACADEMY_PROGRAM_ID,
      cluster: ACADEMY_CLUSTER,
      learnerPda,
      hasLearnerProfile: Boolean(data.onChainLearner),
    },
  };
}

export async function getIdentitySnapshotForUser(
  user: AuthenticatedUser,
): Promise<IdentitySnapshot> {
  const [
    onChainLearner,
    activityStreak,
    totalCompleted,
    leaderboard,
    credentialNfts,
  ] = await Promise.all([
    getLearnerProfileOnChain(user.walletAddress).catch(() => null),
    getCurrentStreak(user.walletAddress),
    countCompletedCoursesOnChain(user.walletAddress),
    getCachedLeaderboard(),
    getCredentialNFTs(user.walletAddress),
  ]);

  return buildIdentitySnapshot(user, {
    onChainLearner,
    streak: Math.max(onChainLearner?.streakCurrent ?? 0, activityStreak),
    totalCompleted,
    leaderboard,
    credentialNfts,
  });
}
