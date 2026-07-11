#!/usr/bin/env tsx
/**
 * parity-check.ts — prove the committed content bundle (src/content/generated)
 * is byte-for-byte what the live Sanity dataset still serves, so that when Sanity
 * is deleted (SP2-C/D) nothing the app reads is lost.
 *
 * This anchor is TEMPORARY: it exists only while Sanity and the bundle coexist.
 * It is deleted with Sanity, replaced by the golden fixtures from SP2-A Tasks 1–3.
 *
 * Pipeline: read content.lock → read the contentSync singleton's sha from the
 * PUBLIC Sanity dataset (no token) → if the singleton is ahead of the pin, LOUD
 * skip (exit 0; freshness still gates the bundle itself) → else fetch every
 * managed doc, canonicalize BOTH sides (strip Sanity metadata + overlays + nulls,
 * sort keys, normalize asset urls to basenames) and deep-diff per _id. Any doc
 * mismatch or a bundle doc missing from Sanity fails; a managed Sanity doc absent
 * from the bundle is reported, not failed (the legacy purge has not run yet).
 *
 *   Run from apps/web:  pnpm parity-check   (or: pnpm tsx scripts/parity-check.ts)
 *
 * Managed-doc criterion (mirrors the sync's own marker, prune.ts SOURCE): a doc
 * of a managed type carrying `sync.source == "courses-academy"`, drafts excluded.
 * Unmarked/legacy docs of managed types are out of scope — the sync never owned
 * them, so the bundle is not expected to contain them.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// ── shared shapes ────────────────────────────────────────────────────────────

/** A minimal Sanity/bundle document: identified by `_id`/`_type`, open otherwise. */
export interface Doc {
  _id: string;
  _type: string;
  [field: string]: unknown;
}

export const MANAGED_TYPES = [
  "course",
  "lesson",
  "instructor",
  "learningPath",
  "achievement",
  "quest",
] as const;
export type ManagedType = (typeof MANAGED_TYPES)[number];

/** Managed-doc marker: mirrors content/compile/prune.ts `SOURCE`. */
export const MANAGED_SOURCE = "courses-academy";

/** _type → committed bundle filename under src/content/generated. */
const BUNDLE_FILE: Record<ManagedType, string> = {
  course: "courses.json",
  lesson: "lessons.json",
  instructor: "instructors.json",
  learningPath: "paths.json",
  achievement: "achievements.json",
  quest: "quests.json",
};

/**
 * Fields present only on the Sanity side that must not enter the comparison:
 * Sanity system metadata plus the sync/preserve overlays the bundle strips at
 * compile time (compile-content.ts `OVERLAY_MARKERS`). Applied at every depth —
 * these names are Sanity-reserved and never occur as content keys.
 */
const STRIP_FIELDS = new Set([
  "_rev",
  "_createdAt",
  "_updatedAt",
  "sync",
  "onChainStatus",
  "authoringStatus",
]);

// ── canonicalization ─────────────────────────────────────────────────────────

/** Matches a Sanity CDN image url or a committed `/content-assets/` path. */
const ASSET_URL =
  /(https?:\/\/cdn\.sanity\.io\/[^\s)"']+|\/content-assets\/[^\s)"']+)/g;

/**
 * Reduce every asset url in a string to its basename. The two sides host the same
 * image at different urls (Sanity `cdn.sanity.io/.../<hash>-<dims>.<ext>` vs the
 * bundle's `/content-assets/<slug>/<file>`), so only the filename is comparable.
 * Works inside larger strings (markdown prose embeds `![](url)`). With zero live
 * images today this is a no-op, but it is the seam that keeps parity honest once
 * content ships images.
 */
export function normalizeAssetUrls(value: string): string {
  return value.replace(ASSET_URL, (url) => {
    const noQuery = url.split("?")[0] ?? url;
    return noQuery.slice(noQuery.lastIndexOf("/") + 1);
  });
}

/**
 * Canonical form used on BOTH sides before comparison: drop STRIP_FIELDS and any
 * null/undefined value (Sanity persists an absent optional as null; the bundle
 * omits it — these must compare equal), sort object keys at every depth, and
 * normalize asset urls in strings. Arrays keep their order (both sides emit the
 * same order from the projector).
 */
export function canonicalize(value: unknown): unknown {
  if (typeof value === "string") return normalizeAssetUrls(value);
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(value as Record<string, unknown>).sort()) {
      if (STRIP_FIELDS.has(k)) continue;
      const v = (value as Record<string, unknown>)[k];
      if (v === null || v === undefined) continue;
      out[k] = canonicalize(v);
    }
    return out;
  }
  return value;
}

// ── deep diff (readable) ─────────────────────────────────────────────────────

const trunc = (v: unknown): string => {
  const s = JSON.stringify(v);
  return s === undefined
    ? "undefined"
    : s.length > 160
      ? `${s.slice(0, 160)}…`
      : s;
};

/** Collect readable path-level differences between two canonical values. */
function collectDiff(a: unknown, b: unknown, at: string, out: string[]): void {
  if (JSON.stringify(a) === JSON.stringify(b)) return;
  const aObj = a !== null && typeof a === "object";
  const bObj = b !== null && typeof b === "object";
  if (aObj && bObj && Array.isArray(a) === Array.isArray(b)) {
    const ra = a as Record<string, unknown>;
    const rb = b as Record<string, unknown>;
    const keys = [...new Set([...Object.keys(ra), ...Object.keys(rb)])].sort();
    for (const k of keys) {
      collectDiff(ra[k], rb[k], at ? `${at}.${k}` : k, out);
    }
    return;
  }
  out.push(`  ${at || "<root>"}: sanity=${trunc(a)} bundle=${trunc(b)}`);
}

/** A readable per-field diff between the canonicalized Sanity and bundle docs. */
export function readableDocDiff(sanity: Doc, bundle: Doc): string {
  const out: string[] = [];
  collectDiff(canonicalize(sanity), canonicalize(bundle), "", out);
  return out.join("\n");
}

// ── parity ───────────────────────────────────────────────────────────────────

export interface ParityInput {
  bundleDocs: Doc[];
  sanityDocs: Doc[];
}

export interface ParityReport {
  /** Docs in both sides whose canonical form differs — data corruption. FAILS. */
  mismatches: { _id: string; _type: string; diff: string }[];
  /** Bundle _ids Sanity no longer serves — data loss. FAILS. */
  missing: string[];
  /** Managed Sanity _ids absent from the bundle (pre-purge legacy). REPORT only. */
  extras: string[];
  bundleCounts: Record<string, number>;
  sanityCounts: Record<string, number>;
  ok: boolean;
}

const countByType = (docs: Doc[]): Record<string, number> => {
  const out: Record<string, number> = {};
  for (const d of docs) out[d._type] = (out[d._type] ?? 0) + 1;
  return out;
};

/**
 * Deep-diff the committed bundle against what Sanity serves. The bundle is the
 * set of _ids we must be able to reproduce; every one must exist in Sanity and
 * match. Sanity-side extras of managed types are reported (the legacy purge has
 * not run), never failed.
 */
export function diffParity(input: ParityInput): ParityReport {
  const sanityById = new Map(input.sanityDocs.map((d) => [d._id, d]));
  const bundleIds = new Set(input.bundleDocs.map((d) => d._id));

  const mismatches: ParityReport["mismatches"] = [];
  const missing: string[] = [];
  for (const b of input.bundleDocs) {
    const s = sanityById.get(b._id);
    if (!s) {
      missing.push(b._id);
      continue;
    }
    if (JSON.stringify(canonicalize(s)) !== JSON.stringify(canonicalize(b))) {
      mismatches.push({
        _id: b._id,
        _type: b._type,
        diff: readableDocDiff(s, b),
      });
    }
  }
  const extras = input.sanityDocs
    .filter((d) => !bundleIds.has(d._id))
    .map((d) => d._id)
    .sort();

  return {
    mismatches,
    missing: missing.sort(),
    extras,
    bundleCounts: countByType(input.bundleDocs),
    sanityCounts: countByType(input.sanityDocs),
    ok: mismatches.length === 0 && missing.length === 0,
  };
}

// ── Sanity fetch (thin, untested — like compile-content's GitHub fetch) ───────

const SANITY_PROJECT = "4e3i2wwc";
const SANITY_DATASET = "production";
const SANITY_API = `https://${SANITY_PROJECT}.api.sanity.io/v2024-01-01/data/query/${SANITY_DATASET}`;

interface Lock {
  repo: string;
  sha: string;
}

/** Small retry — the local DNS here is flaky; the dataset content is stable per sha. */
async function sanityQuery<T>(groq: string, attempts = 4): Promise<T> {
  const url = `${SANITY_API}?query=${encodeURIComponent(groq)}`;
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "superteam-academy-parity-check" },
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return (await res.json()).result as T;
    } catch (e) {
      lastErr = e;
      if (i < attempts - 1)
        await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    }
  }
  throw new Error(
    `Sanity query failed after ${attempts} attempts: ${String(lastErr)}`
  );
}

/** GROQ selecting every managed doc the sync owns (marker-scoped, drafts excluded). */
const MANAGED_QUERY = `*[_type in ${JSON.stringify([...MANAGED_TYPES])} && sync.source == "${MANAGED_SOURCE}" && !(_id in path("drafts.**"))]`;

function loadBundleDocs(generatedDir: string): Doc[] {
  const docs: Doc[] = [];
  for (const file of Object.values(BUNDLE_FILE)) {
    const raw = fs.readFileSync(path.join(generatedDir, file), "utf8");
    docs.push(...(JSON.parse(raw) as Doc[]));
  }
  return docs;
}

async function main(): Promise<void> {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const lock = JSON.parse(
    fs.readFileSync(path.resolve(here, "../content.lock"), "utf8")
  ) as Lock;

  const singleton = await sanityQuery<{ sha?: string } | null>(
    `*[_id=="contentSync"][0]{sha}`
  );
  const sanitySha = singleton?.sha;

  if (sanitySha !== lock.sha) {
    console.warn(
      "\n" +
        "════════════════════════════════════════════════════════════════════\n" +
        "  PARITY SKIPPED — Sanity is not at the pinned content SHA.\n" +
        `    content.lock sha : ${lock.sha}\n` +
        `    Sanity singleton : ${sanitySha ?? "(no contentSync doc)"}\n` +
        "  Someone synced Sanity ahead of the pin; the parity anchor only holds\n" +
        "  when the two are aligned. The freshness check still gates the bundle\n" +
        "  itself, so this is a skip (exit 0), not a failure.\n" +
        "════════════════════════════════════════════════════════════════════\n"
    );
    return;
  }

  const sanityDocs = await sanityQuery<Doc[]>(MANAGED_QUERY);
  const bundleDocs = loadBundleDocs(
    path.resolve(here, "../src/content/generated")
  );
  const report = diffParity({ bundleDocs, sanityDocs });

  console.log(`Parity @ ${lock.sha}`);
  console.log(`  bundle counts : ${JSON.stringify(report.bundleCounts)}`);
  console.log(`  sanity counts : ${JSON.stringify(report.sanityCounts)}`);
  console.log(
    `  ${bundleDocs.length} bundle docs, ${sanityDocs.length} managed Sanity docs`
  );

  if (report.extras.length > 0) {
    console.warn(
      `  NOTE: ${report.extras.length} managed Sanity doc(s) absent from the bundle ` +
        `(pre-purge legacy, reported not failed): ${report.extras.join(", ")}`
    );
  }

  if (report.ok) {
    console.log("Parity OK — the committed bundle matches what Sanity serves.");
    return;
  }

  if (report.missing.length > 0) {
    console.error(
      `\nDATA LOSS: ${report.missing.length} bundle doc(s) missing from Sanity:`
    );
    for (const id of report.missing) console.error(`  - ${id}`);
  }
  for (const m of report.mismatches) {
    console.error(`\nMISMATCH ${m._type} ${m._id}:`);
    console.error(m.diff);
  }
  console.error(
    `\nParity FAILED: ${report.mismatches.length} mismatch(es), ${report.missing.length} missing.`
  );
  process.exit(1);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
