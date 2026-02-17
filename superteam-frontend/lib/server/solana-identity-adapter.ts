import type { AuthenticatedUser } from "@/lib/server/auth-adapter";
import type {
  IdentitySnapshot,
  IdentityAchievement,
} from "@/lib/identity/types";
import {
  ACADEMY_CLUSTER,
  ACADEMY_PROGRAM_ID,
} from "@/lib/generated/academy-program";
import {
  getLearnerProfileOnChain,
  getLearnerProfilePda,
} from "@/lib/server/academy-chain-read";
import {
  getCachedLeaderboard,
  getRankForWallet,
} from "@/lib/server/leaderboard-cache";
import { getTotalCompleted } from "@/lib/server/activity-store";

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

export async function getIdentitySnapshotForUser(
  user: AuthenticatedUser,
): Promise<IdentitySnapshot> {
  const onChainLearner = await getLearnerProfileOnChain(
    user.walletAddress,
  ).catch(() => null);
  const learnerPda = getLearnerProfilePda(user.walletAddress);
  const level = onChainLearner?.level ?? 1;
  const xp = onChainLearner?.xpTotal ?? 0;
  const streak = onChainLearner?.streakCurrent ?? 0;
  const totalCompleted = getTotalCompleted(user.walletAddress);
  const entries = await getCachedLeaderboard();
  const rank = getRankForWallet(entries, user.walletAddress);

  const badges: IdentityAchievement[] = BADGE_RULES.map((rule) => ({
    name: rule.name,
    earned: rule.earned({ xp, streak, totalCompleted, rank }),
  }));

  return {
    profile: {
      userId: user.id,
      walletAddress: user.walletAddress,
      username: user.username,
      name: user.username || user.walletAddress.slice(0, 8),
      bio: "",
      joinDate: "",
      level,
      xp,
      xpToNext: XP_PER_LEVEL,
      streak,
      rank: rank ?? 0,
      totalCompleted,
      badges,
      certificates: [],
    },
    chain: {
      programId: ACADEMY_PROGRAM_ID,
      cluster: ACADEMY_CLUSTER,
      learnerPda,
      hasLearnerProfile: Boolean(onChainLearner),
    },
  };
}
