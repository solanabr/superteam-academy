import "server-only";

import { unstable_cache } from "next/cache";
import { COURSES_CACHE_TAG } from "@/lib/content/queries";
import { parseVideoRef, youtubeOembedUrl } from "./youtube";
import type { VideoEmbedInfo, VideoEmbedMap } from "./types";

/**
 * Server-side YouTube embeddability probe (owner decision 2026-09-21).
 *
 * Lesson videos increasingly come from channels we do not control, and a
 * channel owner can disable playback on other websites at any time. The
 * embedded player then renders YouTube's own "Video unavailable — Playback on
 * other websites has been disabled by the video owner" box: a dead rectangle
 * with no way forward. `youtube.com/oembed` answers the question ahead of the
 * render — 200 for an embeddable id, 401 for a restricted one — so the lesson
 * can ship a watch-on-YouTube card instead of the dead player.
 *
 * Rules this seam holds to:
 *
 *  - NEVER block the page on YouTube. A timeout, DNS failure, 5xx or any other
 *    transport error resolves to `embeddable: true`, i.e. render the iframe
 *    exactly as before. The only outcome that swaps in the card is a definitive
 *    "no" (401/403/404).
 *  - One probe per video id per day, persisted via `unstable_cache` and tagged
 *    `COURSES_CACHE_TAG` so a content sync purges it with everything else.
 *    Lesson routes stay static/ISR.
 *  - The 200 body carries the real video `title`, which the card prefers over
 *    the lesson title. A 401 body carries nothing, hence `title: null`.
 */

export type { VideoEmbedInfo, VideoEmbedMap } from "./types";

const EMBEDDABLE: VideoEmbedInfo = { embeddable: true, title: null };
const OEMBED_TIMEOUT_MS = 4000;
const ONE_DAY_SECONDS = 86_400;

/** Injected in tests; the default hits YouTube. */
export type ProbeYouTube = (id: string) => Promise<VideoEmbedInfo>;

async function probeYouTube(id: string): Promise<VideoEmbedInfo> {
  try {
    const res = await fetch(youtubeOembedUrl(id), {
      signal: AbortSignal.timeout(OEMBED_TIMEOUT_MS),
    });
    // 401 is what a playback-restricted video answers; 403/404 mean private,
    // deleted or region-blocked. All three are definitive: no player will work.
    if (res.status === 401 || res.status === 403 || res.status === 404) {
      return { embeddable: false, title: null };
    }
    if (!res.ok) return EMBEDDABLE;
    const body = (await res.json()) as { title?: unknown };
    return {
      embeddable: true,
      title: typeof body.title === "string" ? body.title : null,
    };
  } catch {
    return EMBEDDABLE;
  }
}

/**
 * The per-id `unstable_cache` wrapper. Keyed by id so two lessons sharing a
 * video share one probe, and built lazily: `COURSES_CACHE_TAG` lives in
 * `lib/content/queries`, and reading it at module-eval time would touch that
 * module inside an import cycle (the same TDZ dance as `content/deployments`).
 */
const wrappers = new Map<string, () => Promise<VideoEmbedInfo>>();

function cachedProbe(id: string): Promise<VideoEmbedInfo> {
  let wrapper = wrappers.get(id);
  if (!wrapper) {
    wrapper = unstable_cache(
      () => probeYouTube(id),
      ["youtube-embeddable", id],
      {
        tags: [COURSES_CACHE_TAG],
        revalidate: ONE_DAY_SECONDS,
      }
    );
    wrappers.set(id, wrapper);
  }
  return wrapper();
}

/**
 * Probe every YouTube video in a lesson, returning a block-key-keyed map for
 * the client. Non-YouTube and unparseable urls are simply absent from the map;
 * the block treats a missing entry as embeddable (render the iframe).
 *
 * `opts.probe` is the test seam: injecting it bypasses `unstable_cache`
 * (which needs a live Next request scope) but keeps the per-run dedupe below,
 * so tests exercise the same call shape production does.
 */
export async function getLessonVideoEmbeds(
  blocks: readonly { key: string; _type: string; url?: string }[],
  opts: { probe?: ProbeYouTube } = {}
): Promise<VideoEmbedMap> {
  const videos = blocks.flatMap((b) => {
    if (b._type !== "video" || typeof b.url !== "string") return [];
    const ref = parseVideoRef(b.url);
    return ref && ref.provider === "youtube"
      ? [{ key: b.key, id: ref.id }]
      : [];
  });
  if (videos.length === 0) return {};

  // One probe per DISTINCT id per render, whatever the cache does across
  // requests — a lesson that repeats a video must not repeat the call.
  const resolve = opts.probe
    ? (id: string) => opts.probe!(id)
    : (id: string) => cachedProbe(id);
  const byId = new Map<string, Promise<VideoEmbedInfo>>();
  for (const { id } of videos) {
    if (!byId.has(id)) {
      // A cold cache during a YouTube outage throws out of `unstable_cache`;
      // degrade to "render the player", never to a broken page.
      byId.set(
        id,
        resolve(id).catch(() => EMBEDDABLE)
      );
    }
  }

  const entries = await Promise.all(
    videos.map(async ({ key, id }) => [key, await byId.get(id)!] as const)
  );
  return Object.fromEntries(entries);
}
