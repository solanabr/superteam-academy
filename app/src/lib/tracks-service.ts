import { TRACKS } from "@/lib/constants";

export interface TrackMeta {
  name: string;
  display: string;
  short: string;
  color: string;
  icon: string;
  collectionAddress?: string;
}

/**
 * Fetch all tracks from Payload CMS, falling back to the hardcoded TRACKS constant.
 * Server-side only.
 */
export async function getAllTracks(): Promise<Record<number, TrackMeta>> {
  try {
    const { getPayload } = await import("@/lib/payload");
    const payload = await getPayload();
    const result = await payload.find({
      collection: "tracks",
      sort: "trackId",
      limit: 100,
    });
    if (result.docs.length > 0) {
      const tracks: Record<number, TrackMeta> = {};
      for (const doc of result.docs) {
        const id = doc.trackId as number;
        tracks[id] = {
          name: doc.name as string,
          display: doc.display as string,
          short: doc.short as string,
          color: doc.color as string,
          icon: doc.icon as string,
          collectionAddress: (doc.collectionAddress as string) || undefined,
        };
      }
      return tracks;
    }
  } catch {
    // Payload not configured — fall through to constant
  }
  return TRACKS;
}

/**
 * Look up the collection address for a given track.
 * Prefers the CMS-stored collectionAddress, falls back to TRACK_COLLECTION_N env var.
 */
export function getTrackCollectionAddress(
  tracks: Record<number, TrackMeta>,
  trackId: number,
): string | undefined {
  return tracks[trackId]?.collectionAddress || undefined;
}
