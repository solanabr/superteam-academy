import { currentUser } from "@/lib/mock-data"
import type { AuthenticatedUser } from "@/lib/server/auth-adapter"
import type { IdentitySnapshot } from "@/lib/identity/types"
import { ACADEMY_CLUSTER, ACADEMY_PROGRAM_ID } from "@/lib/generated/academy-program"
import { getLearnerProfileOnChain, getLearnerProfilePda } from "@/lib/server/academy-chain-read"

type StoredIdentity = {
  profileAsset: string | null
  lastSyncedAt: number
}

const identityStore = new Map<string, StoredIdentity>()

function profileAssetForWallet(walletAddress: string): string {
  return `profile-${walletAddress.slice(0, 8)}`
}

export async function ensureWalletIdentitySynced(walletAddress: string): Promise<void> {
  const now = Date.now()
  const current = identityStore.get(walletAddress)
  if (!current) {
    identityStore.set(walletAddress, {
      profileAsset: profileAssetForWallet(walletAddress),
      lastSyncedAt: now,
    })
    return
  }
  identityStore.set(walletAddress, {
    ...current,
    lastSyncedAt: now,
  })
}

export async function getIdentitySnapshotForUser(
  user: AuthenticatedUser,
): Promise<IdentitySnapshot> {
  const onChainLearner = await getLearnerProfileOnChain(user.walletAddress).catch(() => null)
  const learnerPda = getLearnerProfilePda(user.walletAddress)
  const name = currentUser.name

  return {
    profile: {
      userId: user.id,
      walletAddress: user.walletAddress,
      username: user.username,
      name,
      bio: currentUser.bio,
      joinDate: currentUser.joinDate,
      level: onChainLearner?.level ?? currentUser.level,
      xp: onChainLearner?.xpTotal ?? currentUser.xp,
      xpToNext: currentUser.xpToNext,
      streak: onChainLearner?.streakCurrent ?? currentUser.streak,
      rank: currentUser.rank,
      totalCompleted: currentUser.totalCompleted,
      badges: currentUser.badges.map((badge) => ({
        name: badge.name,
        earned: badge.earned,
      })),
      certificates: currentUser.certificates.map((certificate) => ({
        id: certificate.id,
        course: certificate.course,
        date: certificate.date,
        mintAddress: certificate.mintAddress,
      })),
      // Adapter state is maintained for post-login sync until full DAS/NFT reads are wired.
    },
    chain: {
      programId: ACADEMY_PROGRAM_ID,
      cluster: ACADEMY_CLUSTER,
      learnerPda,
      hasLearnerProfile: Boolean(onChainLearner),
    },
  }
}
