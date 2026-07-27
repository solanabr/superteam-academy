import "server-only";

import { parse as parseYaml } from "yaml";
import { createGitHubClient } from "@/lib/github/github";
import { extractTarball } from "@/lib/content/compile/tarball";

/**
 * Prior-content resolver for the course changelog (#757).
 *
 * A `lessons_removed` changelog entry needs the id + title of each retired
 * lesson, but a removed lesson is BY DEFINITION gone from the CURRENT content
 * bundle — resolving it against the current bundle yields `{id:null,title:null}`
 * (the observed prod bug on the C3 sync, tx 5T1jeJ68GF3D). The faithful source
 * is the PRIOR content revision: `Course.content_tx_id` (read off-chain before
 * the update) is a padded courses-academy git SHA, and at that SHA the removed
 * lessons were still live — their `courses/<dir>/slots.lock.json` still maps
 * their id→slot, and their `lesson.yaml` still carries the title.
 *
 * This is issue #757's Option 1 ("resolve from the previous bundle ... the
 * faithful answer, at the cost of a git read in the write path"). It runs ONLY
 * on the rare retire-a-live-lesson sync, and is BEST-EFFORT: any failure (no
 * GITHUB_TOKEN, network/tarball error, prior content unparseable, course not
 * found) returns an empty map and the caller degrades to slot-only — never
 * worse than today, never a fabricated name.
 *
 * The course dir is NOT the slug (e.g. slug `building-first-program` lives in
 * `courses/building-your-first-solana-program/`), so the course is located by
 * scanning each `course.yaml`'s `id`, not by constructing a path.
 */

const decoder = new TextDecoder();

/**
 * Bound the whole prior-content fetch (redirect + tarball body read). A hung
 * GitHub response must not stall the admin sync; on timeout the AbortController
 * aborts the fetch and we degrade to slot-only. 30s is generous for a
 * small-repo tarball while still failing a truly stuck request.
 */
const TARBALL_TIMEOUT_MS = 30_000;

/** Prefix every prior-content degrade log so an operator can grep the cause. */
const LOG = "[changelog:prior-content]";

/**
 * Decode `Course.content_tx_id` (§11.0: 12 leading zero bytes + a 20-byte git
 * SHA-1) back to the 40-hex sha. Returns `null` when the bytes are not a padded
 * sha — e.g. all-zero (a course that never committed content) or non-zero in
 * the pad — so the caller simply skips the prior read.
 */
export function contentShaFromTxId(
  txId: readonly number[] | Uint8Array
): string | null {
  const bytes = Array.from(txId);
  if (bytes.length !== 32) return null;
  if (bytes.some((b) => !Number.isInteger(b) || b < 0 || b > 255)) return null;
  for (let i = 0; i < 12; i++) if (bytes[i] !== 0) return null;
  const sha = bytes
    .slice(12)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  if (!/^[0-9a-f]{40}$/.test(sha) || /^0{40}$/.test(sha)) return null;
  return sha;
}

type PriorRef = { id: string; title: string | null };

function parseYamlDoc(bytes: Uint8Array): Record<string, unknown> | null {
  try {
    const doc = parseYaml(decoder.decode(bytes));
    return doc && typeof doc === "object"
      ? (doc as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/**
 * Resolve removed slots → `{id, title}` from the prior courses-academy revision
 * at `priorSha`. Best-effort: returns an empty map on any failure, and omits any
 * individual slot it can't resolve (the caller keeps the slot-only fallback for
 * those). Never throws.
 */
export async function resolvePriorRemovedLessons(params: {
  courseId: string;
  priorSha: string;
  removedSlots: number[];
}): Promise<Map<number, PriorRef>> {
  const out = new Map<number, PriorRef>();
  if (params.removedSlots.length === 0) return out;

  let tree: Map<string, Uint8Array>;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TARBALL_TIMEOUT_MS);
  try {
    const tarball = await createGitHubClient().fetchTarball(
      params.priorSha,
      controller.signal
    );
    tree = await extractTarball(tarball);
  } catch (err) {
    // No GITHUB_TOKEN, network/HTTP error, timeout, or a tarball too large/
    // corrupt. Log loudly (#731 bar) so an admin retiring lessons with, e.g.,
    // an expired token sees WHY enrichment degraded rather than silent nulls.
    const reason = err instanceof Error ? err.message : String(err);
    console.warn(
      `${LOG} ${params.courseId}: could not fetch/extract prior content at ${params.priorSha} — removed lessons will record slot-only (${reason})`
    );
    return out;
  } finally {
    clearTimeout(timer);
  }

  // 1. Locate the course by matching each course.yaml's `id` (dir != slug).
  let courseDir: string | null = null;
  for (const [path, bytes] of tree) {
    if (!/^courses\/[^/]+\/course\.ya?ml$/.test(path)) continue;
    const doc = parseYamlDoc(bytes);
    if (doc?.id === params.courseId) {
      courseDir = path.slice(0, path.lastIndexOf("/"));
      break;
    }
  }
  if (!courseDir) {
    console.warn(
      `${LOG} ${params.courseId}: not found in prior content at ${params.priorSha} — removed lessons will record slot-only`
    );
    return out;
  }

  // 2. Reverse the prior slots.lock.json (lessonId→slot) for the removed slots.
  const lockBytes = tree.get(`${courseDir}/slots.lock.json`);
  if (!lockBytes) {
    console.warn(
      `${LOG} ${params.courseId}: ${courseDir}/slots.lock.json missing at ${params.priorSha} — removed lessons will record slot-only`
    );
    return out;
  }
  const slotToId = new Map<number, string>();
  try {
    const lock = JSON.parse(decoder.decode(lockBytes)) as {
      slots?: Record<string, number>;
    };
    for (const [lessonId, slot] of Object.entries(lock.slots ?? {})) {
      slotToId.set(Number(slot), lessonId);
    }
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.warn(
      `${LOG} ${params.courseId}: ${courseDir}/slots.lock.json unparseable at ${params.priorSha} — removed lessons will record slot-only (${reason})`
    );
    return out;
  }

  // 3. Snapshot titles from the prior lesson.yaml docs under this course.
  const titleById = new Map<string, string>();
  const lessonsPrefix = `${courseDir}/lessons/`;
  for (const [path, bytes] of tree) {
    if (!path.startsWith(lessonsPrefix) || !/\/lesson\.ya?ml$/.test(path)) {
      continue;
    }
    const doc = parseYamlDoc(bytes);
    if (typeof doc?.id === "string" && typeof doc?.title === "string") {
      titleById.set(doc.id, doc.title);
    }
  }

  for (const slot of params.removedSlots) {
    const id = slotToId.get(slot);
    if (!id) continue; // not in the prior lock either → leave slot-only
    out.set(slot, { id, title: titleById.get(id) ?? null });
  }
  return out;
}
