import { registerCheck } from "../lint";
import { type RepoModel } from "../model";
import { diag, type Diagnostic } from "../diagnostics";

/**
 * Gate 23 — YouTube embeddability of every lesson video (owner decision
 * 2026-09-21). Numbered after gate 22.
 *
 * Lesson videos increasingly come from channels we do not control, and a
 * channel owner can switch off "allow playback on other websites" at any time.
 * The embedded player then shows YouTube's own "Video unavailable" box.
 * `youtube.com/oembed` answers the question from CI: 200 for an embeddable id,
 * 401 (or 403/404 for private/deleted/region-blocked) otherwise.
 *
 * The app degrades gracefully — a non-embeddable video renders a
 * watch-on-YouTube card instead of a dead player — so this is a WARNING, not
 * an error: the content is shippable, the author just deserves to know their
 * learners will leave the site to watch it, and can swap the id for one that
 * embeds. A visible checkpoint, never a merge blocker.
 *
 * Both sides of a translated course are checked: the source `lesson.yaml` video
 * block and every `l10n/<locale>/strings.yaml` overlay that replaces the url
 * (which is how course-visao-geral-solana's English overlay came to point at 16
 * non-embeddable ids).
 *
 * Network failure is a NOTICE, exactly like gate 21b: content CI must not go
 * red because YouTube is slow.
 */

/** Per-request bound — flakiness must degrade to a notice, never hang CI. */
const OEMBED_TIMEOUT_MS = 5000;
/** Politeness cap on parallel oembed calls. */
const MAX_CONCURRENCY = 5;

export type OembedStatus =
  | { ok: true }
  | { ok: false; kind: "refused"; status: number }
  | { ok: false; kind: "unreachable" };

/** Resolve one video id's embeddability. Injected in tests; the default hits YouTube. */
export type ProbeOembed = (videoId: string) => Promise<OembedStatus>;

/** The video id from any YouTube url shape authors use; null for non-YouTube. */
export function youtubeVideoId(url: string): string | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, "");
  if (host === "youtu.be") {
    const id = u.pathname.slice(1);
    return id || null;
  }
  if (host !== "youtube.com" && host !== "youtube-nocookie.com") return null;
  const v = u.searchParams.get("v");
  if (v) return v;
  const m = /^\/(?:embed|shorts|v)\/([^/]+)/.exec(u.pathname);
  return m ? m[1]! : null;
}

async function defaultProbe(videoId: string): Promise<OembedStatus> {
  const target = encodeURIComponent(
    `https://www.youtube.com/watch?v=${videoId}`
  );
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${target}&format=json`,
      { signal: AbortSignal.timeout(OEMBED_TIMEOUT_MS) }
    );
    if (res.status === 401 || res.status === 403 || res.status === 404) {
      return { ok: false, kind: "refused", status: res.status };
    }
    // Any other non-2xx is YouTube having a bad minute, not a verdict.
    return res.ok ? { ok: true } : { ok: false, kind: "unreachable" };
  } catch {
    return { ok: false, kind: "unreachable" };
  }
}

/** One authored video url, with enough context to name it in a diagnostic. */
interface VideoRef {
  /** Repo-relative file the url is authored in. */
  file: string;
  /** Lesson id (source) or lesson slug (overlay). */
  lesson: string;
  /** Content locale — the course's source locale is reported as "source". */
  locale: string;
  blockKey: string;
  videoId: string;
}

/** Lesson dir basename = the slug an l10n overlay keys its lessons by. */
function lessonSlug(dir: string): string {
  return dir.split("/").filter(Boolean).pop() ?? dir;
}

export function collectVideoRefs(model: RepoModel): VideoRef[] {
  const out: VideoRef[] = [];

  for (const entry of model.lessons) {
    for (const raw of entry.lesson.blocks as Record<string, unknown>[]) {
      if (raw.type !== "video" || typeof raw.url !== "string") continue;
      const videoId = youtubeVideoId(raw.url);
      if (!videoId) continue;
      out.push({
        file: entry.file,
        lesson: entry.id,
        locale: "source",
        blockKey: String(raw.key ?? "?"),
        videoId,
      });
    }
  }

  for (const { file, strings } of model.l10n) {
    for (const [slug, lesson] of Object.entries(strings.lessons ?? {})) {
      for (const [blockKey, block] of Object.entries(lesson.blocks ?? {})) {
        if (typeof block.url !== "string") continue;
        const videoId = youtubeVideoId(block.url);
        if (!videoId) continue;
        out.push({
          file,
          lesson: slug,
          locale: strings.locale,
          blockKey,
          videoId,
        });
      }
    }
  }

  return out;
}

/** Resolve `ids` through `probe`, at most `MAX_CONCURRENCY` calls in flight. */
async function probeAll(
  ids: string[],
  probe: ProbeOembed
): Promise<Map<string, OembedStatus>> {
  const resolved = new Map<string, OembedStatus>();
  let next = 0;
  async function worker(): Promise<void> {
    while (next < ids.length) {
      const id = ids[next++]!;
      try {
        resolved.set(id, await probe(id));
      } catch {
        resolved.set(id, { ok: false, kind: "unreachable" });
      }
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(MAX_CONCURRENCY, ids.length) }, worker)
  );
  return resolved;
}

export interface Gate23Options {
  probe?: ProbeOembed;
}

export async function gate23Check(
  model: RepoModel,
  opts: Gate23Options = {}
): Promise<Diagnostic[]> {
  const out: Diagnostic[] = [];
  const refs = collectVideoRefs(model);
  // No YouTube video anywhere ⇒ no network call. Keeps every other gate's
  // test suite offline and fast (same contract as gate 21).
  if (refs.length === 0) return out;

  const ids = [...new Set(refs.map((r) => r.videoId))];
  const resolved = await probeAll(ids, opts.probe ?? defaultProbe);

  for (const ref of refs) {
    const status = resolved.get(ref.videoId);
    if (!status || status.ok || status.kind !== "refused") continue;
    out.push(
      diag(
        "gate-23",
        "warning",
        ref.file,
        `video not embeddable (HTTP ${status.status}) — learners get the watch-on-YouTube card: lesson "${ref.lesson}", locale ${ref.locale}, block "${ref.blockKey}" (https://www.youtube.com/watch?v=${ref.videoId})`
      )
    );
  }

  // One aggregate notice for the whole run, never per url: a YouTube outage
  // must read as one skipped check, not a wall of noise — and NEVER as red CI.
  const unreachable = ids
    .filter((id) => {
      const s = resolved.get(id);
      return s && !s.ok && s.kind === "unreachable";
    })
    .sort();
  if (unreachable.length > 0) {
    out.push(
      diag(
        "gate-23",
        "notice",
        "",
        `YouTube oembed unreachable for ${unreachable.length} video(s) (${unreachable.join(
          ", "
        )}); embeddability check skipped for those`
      )
    );
  }

  return out;
}

registerCheck((model) => gate23Check(model));
