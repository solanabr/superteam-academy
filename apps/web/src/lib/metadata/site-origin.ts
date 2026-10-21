import { env } from "@/lib/env";
import { isLoopbackRpc } from "@/lib/solana/network";

/**
 * The origin of an absolute app URL, refusing anything that shouldn't end up
 * inside an NFT. Plain http is allowed only on loopback, for local dev.
 */
export function originOf(appUrl: string): string {
  const url = new URL(appUrl);
  const localHttp = url.protocol === "http:" && isLoopbackRpc(appUrl);
  if (url.protocol !== "https:" && !localHttp) {
    throw new Error(
      `NEXT_PUBLIC_APP_URL must be an https origin to build NFT metadata URLs (got ${url.protocol}//${url.host})`
    );
  }
  return url.origin;
}

/**
 * The one origin that metadata URIs written on-chain are built from. Content
 * never supplies a host: a typo or an old domain in a content file must not be
 * able to end up in an achievement type or a collection, which can't be edited
 * later.
 */
export function siteOrigin(): string {
  return originOf(env.NEXT_PUBLIC_APP_URL);
}

/** An absolute URL on the site, e.g. `siteUrl("/certificates")`. */
export function siteUrl(path: string, origin: string = siteOrigin()): string {
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Metadata for an achievement type's collection and every NFT it awards. */
export function achievementMetadataUri(
  achievementId: string,
  origin: string = siteOrigin()
): string {
  return siteUrl(
    `/api/achievements/metadata/${encodeURIComponent(achievementId)}`,
    origin
  );
}

/** Metadata for a course's credential collection. */
export function courseCollectionMetadataUri(
  courseId: string,
  origin: string = siteOrigin()
): string {
  return siteUrl(
    `/api/certificates/metadata/${encodeURIComponent(courseId)}`,
    origin
  );
}

/** The app-served copy of one credential's metadata (`nft_metadata` row). */
export function credentialMetadataUri(
  metadataRowId: string,
  origin: string = siteOrigin()
): string {
  return siteUrl(
    `/api/certificates/metadata?id=${encodeURIComponent(metadataRowId)}`,
    origin
  );
}
