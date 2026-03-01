import "server-only";
import { getCommunityPrisma } from "@/lib/prisma";

/**
 * Read from the indexing layer (Postgres) for faster UX.
 * Data is written by the backend on-chain events; app reads for display.
 * Falls back to backend API / Helius when indexed data is empty.
 */

export interface CredentialCollectionRow {
  trackId: number;
  collectionAddress: string;
  name: string | null;
  imageUrl: string | null;
  metadataUri: string | null;
}

export async function getCredentialCollectionsFromDb(): Promise<{
  collections: Record<string, string>;
  list: CredentialCollectionRow[];
} | null> {
  const prisma = getCommunityPrisma();
  try {
    const rows = await prisma.credentialCollection.findMany({
      orderBy: { trackId: "asc" },
    });
    if (rows.length === 0) return null;
    const collections: Record<string, string> = {};
    const list: CredentialCollectionRow[] = rows.map((r) => {
      collections[String(r.trackId)] = r.collectionAddress;
      return {
        trackId: r.trackId,
        collectionAddress: r.collectionAddress,
        name: r.name,
        imageUrl: r.imageUrl,
        metadataUri: r.metadataUri,
      };
    });
    return { collections, list };
  } catch {
    return null;
  }
}

export interface LeaderboardEntryRow {
  rank: number;
  wallet: string;
  xp: number;
  coursesCompleted?: number;
}

export async function getLeaderboardFromDb(limit = 100): Promise<LeaderboardEntryRow[] | null> {
  const prisma = getCommunityPrisma();
  try {
    const rows = await prisma.leaderboardEntry.findMany({
      orderBy: [{ totalXp: "desc" }],
      take: limit,
    });
    if (rows.length === 0) return null;
    return rows.map((r, i) => ({
      rank: i + 1,
      wallet: r.wallet,
      xp: r.totalXp,
      coursesCompleted: r.coursesCompleted,
    }));
  } catch {
    return null;
  }
}
