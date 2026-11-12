import { env } from "@/lib/env";
import { siteUrl } from "@/lib/metadata/site-origin";

export const EVENT_IMAGE_BUCKET = "event-images";

/** Uploaded event artwork is accepted in these types, up to this size. */
export const EVENT_IMAGE_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};
export const MAX_EVENT_IMAGE_BYTES = 1024 * 1024;

function storagePrefix(): string {
  return `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${EVENT_IMAGE_BUCKET}/`;
}

/** True only for artwork in this project's event-images bucket. */
export function isEventStorageUrl(
  url: string | null | undefined
): url is string {
  return typeof url === "string" && url.startsWith(storagePrefix());
}

/** The generated default badge for an event without uploaded artwork. */
export function defaultEventImagePath(achievementId: string): string {
  return `/api/events/image/${encodeURIComponent(achievementId)}`;
}

/**
 * The image to show for an event: its uploaded artwork, or the generated badge.
 * Anything not in our bucket falls back to the generated badge, so an NFT never
 * points a wallet at an arbitrary host.
 */
export function eventImageUrl(
  event: { achievementId: string; imageUrl: string | null },
  origin: string
): string {
  return isEventStorageUrl(event.imageUrl)
    ? event.imageUrl
    : siteUrl(defaultEventImagePath(event.achievementId), origin);
}

/** `eventImageUrl` for the browser: same image, same-origin path for the default. */
export function eventImageSrc(event: {
  achievementId: string;
  imageUrl: string | null;
}): string {
  return isEventStorageUrl(event.imageUrl)
    ? event.imageUrl
    : defaultEventImagePath(event.achievementId);
}
