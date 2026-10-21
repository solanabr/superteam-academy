import { env } from "@/lib/env";
import { isLoopbackRpc } from "@/lib/solana/network";

/**
 * The origin of an absolute app URL. Plain http is accepted only on loopback,
 * for local dev. This is the display-side check: anything written on-chain
 * goes through `pinned-uri.ts`, which also ties a loopback origin to a local
 * validator.
 */
export function originOf(appUrl: string): string {
  const url = new URL(appUrl);
  const localHttp = url.protocol === "http:" && isLoopbackRpc(appUrl);
  if (url.protocol !== "https:" && !localHttp) {
    throw new Error(
      `NEXT_PUBLIC_APP_URL must be an https origin (got ${url.protocol}//${url.host})`
    );
  }
  return url.origin;
}

/** The site's own origin, from `NEXT_PUBLIC_APP_URL`. */
export function siteOrigin(): string {
  return originOf(env.NEXT_PUBLIC_APP_URL);
}

/** An absolute URL on the site, e.g. `siteUrl("/certificates")`. */
export function siteUrl(path: string, origin: string = siteOrigin()): string {
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}
