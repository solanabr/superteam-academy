/**
 * Video URL parsing + YouTube URL construction, shared by the lesson video
 * block, its non-embeddable fallback card, and the server embeddability probe.
 *
 * Pure and client-safe: no `server-only`, no fetch. The network side lives in
 * `embeddability.ts`.
 */

export interface VideoRef {
  provider: "youtube" | "vimeo";
  id: string;
}

/**
 * Parse a lesson video url into a provider + id. Returns `null` for anything
 * we cannot embed (a bad url, an unknown host, a host url with no id) — the
 * block renders nothing in that case, as it always has.
 */
export function parseVideoRef(url: string): VideoRef | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, "");
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const v = u.searchParams.get("v");
    if (v) return { provider: "youtube", id: v };
    // /embed/<id> and /shorts/<id> — authored occasionally, and what our own
    // embed url looks like if it ever round-trips through here.
    const m = /^\/(?:embed|shorts|v)\/([^/]+)/.exec(u.pathname);
    return m ? { provider: "youtube", id: m[1]! } : null;
  }
  if (host === "youtu.be") {
    const id = u.pathname.slice(1);
    return id ? { provider: "youtube", id } : null;
  }
  if (host === "vimeo.com") {
    const id = u.pathname.slice(1);
    return id ? { provider: "vimeo", id } : null;
  }
  return null;
}

/** The player url for an embeddable video. */
export function embedUrlFor(ref: VideoRef): string {
  return ref.provider === "youtube"
    ? `https://www.youtube.com/embed/${ref.id}`
    : `https://player.vimeo.com/video/${ref.id}`;
}

/** Where "Watch on YouTube" sends the learner. */
export function youtubeWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}

/**
 * Poster frame for the fallback card. Verified 2026-09-21: `hqdefault.jpg` is
 * served with HTTP 200 for ids whose EMBEDDING is disabled (the oembed call for
 * the same id 401s), so a restricted video still shows its real thumbnail.
 */
export function youtubeThumbnailUrl(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

/** The oembed endpoint used by the embeddability probe and the content linter. */
export function youtubeOembedUrl(id: string): string {
  return `https://www.youtube.com/oembed?url=${encodeURIComponent(
    youtubeWatchUrl(id)
  )}&format=json`;
}
