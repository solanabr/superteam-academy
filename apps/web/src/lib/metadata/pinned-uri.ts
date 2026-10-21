import "server-only";

import { env } from "@/lib/env";
import { serverEnv } from "@/lib/env.server";
import { isLoopbackRpc, isMainnetCluster } from "@/lib/solana/network";
import { siteUrl } from "./site-origin";

/**
 * Every URL the app writes into an NFT goes through here: achievement types
 * (copied into every achievement they award), course collections and the
 * credential fallbacks. None of them can be edited once written, and content
 * never supplies the host.
 */

// Public hostnames that resolve to, or pose as, a loopback address
// (`localhost.example.com`, `127.0.0.1.nip.io`). Never a real site origin.
const LOOPBACK_LOOKALIKE = /^(localhost|127\.\d{1,3}\.\d{1,3}\.\d{1,3})\./;

export class UnpinnableOriginError extends Error {
  constructor(detail: string) {
    super(`Refusing to write NEXT_PUBLIC_APP_URL into an NFT: ${detail}`);
    this.name = "UnpinnableOriginError";
  }
}

/**
 * The origin an on-chain write may use, given the RPC the write goes through.
 *
 * - A loopback origin (localhost, 127.0.0.0/8, ::1, any scheme) only works on
 *   the machine that wrote it, so it is allowed only against a local
 *   validator, and never when the label or the RPC says mainnet.
 * - Anything else must be https.
 */
export function pinnableOrigin(appUrl: string, writeRpcUrl: string): string {
  let url: URL;
  try {
    url = new URL(appUrl);
  } catch {
    throw new UnpinnableOriginError("it is not an absolute URL");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new UnpinnableOriginError(`unsupported scheme ${url.protocol}`);
  }
  if (LOOPBACK_LOOKALIKE.test(url.hostname)) {
    throw new UnpinnableOriginError(`${url.host} poses as a loopback address`);
  }
  if (isLoopbackRpc(url.href)) {
    if (isMainnetCluster(writeRpcUrl)) {
      throw new UnpinnableOriginError(
        `${url.origin} is a loopback origin and this write targets mainnet`
      );
    }
    if (!isLoopbackRpc(writeRpcUrl)) {
      throw new UnpinnableOriginError(
        `${url.origin} is a loopback origin and the RPC is not a local validator`
      );
    }
    return url.origin;
  }
  if (url.protocol !== "https:") {
    throw new UnpinnableOriginError(`${url.origin} is not https`);
  }
  return url.origin;
}

/** {@link pinnableOrigin} for this deployment: the app URL and the server RPC. */
export function onChainOrigin(): string {
  return pinnableOrigin(env.NEXT_PUBLIC_APP_URL, serverEnv.SOLANA_RPC_URL);
}

/** An absolute site URL that may be written into an NFT. */
export function onChainSiteUrl(
  path: string,
  origin: string = onChainOrigin()
): string {
  return siteUrl(path, origin);
}

/** Metadata for an achievement type's collection and every NFT it awards. */
export function achievementMetadataUri(
  achievementId: string,
  origin: string = onChainOrigin()
): string {
  return siteUrl(
    `/api/achievements/metadata/${encodeURIComponent(achievementId)}`,
    origin
  );
}

/** Metadata for a course's credential collection. */
export function courseCollectionMetadataUri(
  courseId: string,
  origin: string = onChainOrigin()
): string {
  return siteUrl(
    `/api/certificates/metadata/${encodeURIComponent(courseId)}`,
    origin
  );
}

/** The app-served copy of one credential's metadata (`nft_metadata` row). */
export function credentialMetadataUri(
  metadataRowId: string,
  origin: string = onChainOrigin()
): string {
  return siteUrl(
    `/api/certificates/metadata?id=${encodeURIComponent(metadataRowId)}`,
    origin
  );
}
