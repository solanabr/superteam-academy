import "server-only";
import { createClient } from "next-sanity";

const sanityAdmin = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  token: process.env.SANITY_ADMIN_TOKEN,
  useCdn: false,
  apiVersion: "2024-01-01",
});

export async function writeCourseOnChainStatus(
  sanityId: string,
  status: string,
  coursePda: string,
  txSignature: string
): Promise<void> {
  await sanityAdmin
    .patch(sanityId)
    .set({
      "onChainStatus.status": status,
      "onChainStatus.coursePda": coursePda,
      "onChainStatus.lastSynced": new Date().toISOString(),
      "onChainStatus.txSignature": txSignature,
    })
    .commit();
}

export async function writeCourseTrackCollection(
  sanityId: string,
  trackCollectionAddress: string
): Promise<void> {
  await sanityAdmin
    .patch(sanityId)
    .set({
      "onChainStatus.trackCollectionAddress": trackCollectionAddress,
    })
    .commit();
}

export async function writeAchievementOnChainStatus(
  sanityId: string,
  achievementPda: string,
  collectionAddress: string
): Promise<void> {
  await sanityAdmin
    .patch(sanityId)
    .set({
      "onChainStatus.status": "synced",
      "onChainStatus.achievementPda": achievementPda,
      "onChainStatus.collectionAddress": collectionAddress,
      "onChainStatus.lastSynced": new Date().toISOString(),
    })
    .commit();
}
