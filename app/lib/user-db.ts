import "server-only";
import { getCommunityPrisma } from "@/lib/prisma";

/**
 * Ensures a platform user exists for the given wallet (e.g. on first participation).
 * Idempotent: safe to call on every thread create, reply, or enroll.
 */
export async function ensurePlatformUser(walletAddress: string): Promise<void> {
  const prisma = getCommunityPrisma();
  const trimmed = walletAddress.trim().slice(0, 88);
  if (!trimmed) return;
  await prisma.platformUser.upsert({
    where: { walletAddress: trimmed },
    create: { walletAddress: trimmed },
    update: { updatedAt: new Date() },
  });
}
