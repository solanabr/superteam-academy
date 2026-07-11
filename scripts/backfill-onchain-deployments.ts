/**
 * SP2-B Task 2 — one-time backfill of every managed doc's `onChainStatus` from
 * prod Sanity into the Supabase `onchain_deployments` table, with a fail-closed
 * parity assertion.
 *
 * DRY-RUN by default: prints the exact rows it WOULD upsert and runs the parity
 * assertion (count + field-by-field) against those rows. `--live` performs the
 * upsert (requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY), then fetches the
 * rows back from Supabase and runs the SAME parity assertion against the DB —
 * any divergence prints the diff and exits non-zero.
 *
 * Standalone (Node built-in `fetch` only — no @sanity/client, no supabase-js, so
 * it resolves under strict pnpm without hoisting). Reads prod Sanity's PUBLIC
 * dataset with NO token (published perspective; drafts never returned). Writes
 * and reads Supabase via the PostgREST REST API with the service-role key.
 * NOT shipped in the app.
 *
 * Managed-doc criterion mirrors `apps/web/src/lib/content-sync/prune.ts`:
 * `sync.source == "courses-academy"`, drafts excluded. Of those, a row is
 * emitted per SYNCED course (`onChainStatus.status == "synced"`) and per
 * achievement that carries a PDA (`defined(onChainStatus.achievementPda)`).
 *
 * Run:
 *   npx tsx scripts/backfill-onchain-deployments.ts            # dry-run
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     npx tsx scripts/backfill-onchain-deployments.ts --live
 */

import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const SANITY_SOURCE = "courses-academy";
const SANITY_PROJECT_ID =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "4e3i2wwc";
const SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
const TABLE = "onchain_deployments";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Frozen `onChainStatus` union across course + achievement docs. */
export interface SanityOnChainStatus {
  status?: string | null;
  coursePda?: string | null;
  txSignature?: string | null;
  collectionAddress?: string | null;
  trackCollectionAddress?: string | null;
  achievementPda?: string | null;
  isActive?: boolean | null;
  lastSynced?: string | null;
}

export type ContentKind = "course" | "achievement";

export interface ManagedDoc {
  _id: string;
  _type: ContentKind;
  sync?: { source?: string | null } | null;
  onChainStatus?: SanityOnChainStatus | null;
}

/** One row of `onchain_deployments`, column-for-column. */
export interface DeploymentRow {
  content_id: string;
  kind: ContentKind;
  status: string | null;
  course_pda: string | null;
  tx_signature: string | null;
  collection_address: string | null;
  track_collection_address: string | null;
  achievement_pda: string | null;
  is_active: boolean | null;
  last_synced: string | null;
}

/** The columns compared field-by-field by the parity assertion. */
export const ROW_FIELDS: readonly (keyof DeploymentRow)[] = [
  "content_id",
  "kind",
  "status",
  "course_pda",
  "tx_signature",
  "collection_address",
  "track_collection_address",
  "achievement_pda",
  "is_active",
  "last_synced",
] as const;

// ---------------------------------------------------------------------------
// Pure functions (unit-tested)
// ---------------------------------------------------------------------------

/**
 * Copy a raw Sanity value, mapping only `undefined` (field absent) to null.
 * Preserves an explicit `false` / `null` faithfully — the reader coalesces
 * NULL -> true, so NULL vs `false` must not be flattened here.
 */
export function rawOrNull<T>(value: T | undefined): T | null {
  return value === undefined ? null : value;
}

/** prune.ts criterion: our sync marker, published (non-draft) doc. */
export function isManaged(doc: ManagedDoc): boolean {
  return doc.sync?.source === SANITY_SOURCE && !doc._id.startsWith("drafts.");
}

/**
 * The backfill set: managed courses that are synced + managed achievements
 * that carry a PDA. Everything else (unsynced course, PDA-less achievement)
 * has no on-chain deployment to record.
 */
export function selectBackfillDocs(docs: ManagedDoc[]): ManagedDoc[] {
  return docs.filter((d) => {
    if (!isManaged(d)) return false;
    const s = d.onChainStatus ?? {};
    if (d._type === "course") return s.status === "synced";
    return s.achievementPda != null;
  });
}

/** Project one managed doc into its `onchain_deployments` row (faithful copy). */
export function toRow(doc: ManagedDoc): DeploymentRow {
  const s = doc.onChainStatus ?? {};
  return {
    content_id: doc._id,
    kind: doc._type,
    status: rawOrNull(s.status),
    course_pda: rawOrNull(s.coursePda),
    tx_signature: rawOrNull(s.txSignature),
    collection_address: rawOrNull(s.collectionAddress),
    track_collection_address: rawOrNull(s.trackCollectionAddress),
    achievement_pda: rawOrNull(s.achievementPda),
    is_active: rawOrNull(s.isActive),
    last_synced: rawOrNull(s.lastSynced),
  };
}

/** All backfill rows, sorted by content_id for stable, diffable output. */
export function buildRows(docs: ManagedDoc[]): DeploymentRow[] {
  return selectBackfillDocs(docs)
    .map(toRow)
    .sort((a, b) => a.content_id.localeCompare(b.content_id));
}

export interface FieldDiff {
  content_id: string;
  field: keyof DeploymentRow;
  expected: unknown;
  actual: unknown;
}

export interface ParityResult {
  expectedCount: number;
  actualCount: number;
  countMatch: boolean;
  /** content_ids present in expected but missing from actual. */
  missing: string[];
  /** content_ids present in actual but not expected. */
  extra: string[];
  fieldDiffs: FieldDiff[];
  ok: boolean;
}

/**
 * Null-safe field equality. `last_synced` is compared as an instant (Postgres
 * timestamptz round-trips into a different textual form than Sanity's ISO
 * string, e.g. `+00:00` vs `Z`), so an identical instant is not a divergence.
 */
export function fieldsEqual(
  field: keyof DeploymentRow,
  a: unknown,
  b: unknown
): boolean {
  if (field === "last_synced") {
    if (a == null || b == null) return a == null && b == null;
    return new Date(a as string).getTime() === new Date(b as string).getTime();
  }
  return Object.is(a, b);
}

/**
 * Fail-closed parity: expected (Sanity-derived) vs actual (DB read-back, or the
 * same rows in dry-run). Count must match, no missing/extra content_ids, and
 * every field of every row must be equal.
 */
export function checkParity(
  expected: DeploymentRow[],
  actual: DeploymentRow[]
): ParityResult {
  const expById = new Map(expected.map((r) => [r.content_id, r]));
  const actById = new Map(actual.map((r) => [r.content_id, r]));

  const missing = expected
    .filter((r) => !actById.has(r.content_id))
    .map((r) => r.content_id);
  const extra = actual
    .filter((r) => !expById.has(r.content_id))
    .map((r) => r.content_id);

  const fieldDiffs: FieldDiff[] = [];
  for (const exp of expected) {
    const act = actById.get(exp.content_id);
    if (!act) continue;
    for (const field of ROW_FIELDS) {
      if (!fieldsEqual(field, exp[field], act[field])) {
        fieldDiffs.push({
          content_id: exp.content_id,
          field,
          expected: exp[field],
          actual: act[field],
        });
      }
    }
  }

  const countMatch = expected.length === actual.length;
  return {
    expectedCount: expected.length,
    actualCount: actual.length,
    countMatch,
    missing,
    extra,
    fieldDiffs,
    ok:
      countMatch &&
      missing.length === 0 &&
      extra.length === 0 &&
      fieldDiffs.length === 0,
  };
}

/** Map a PostgREST JSON row (unknown shape) into a typed DeploymentRow. */
export function parseDbRow(u: unknown): DeploymentRow {
  const r = u as Record<string, unknown>;
  const str = (v: unknown): string | null => (v == null ? null : String(v));
  const kind = r.kind === "achievement" ? "achievement" : "course";
  return {
    content_id: String(r.content_id),
    kind,
    status: str(r.status),
    course_pda: str(r.course_pda),
    tx_signature: str(r.tx_signature),
    collection_address: str(r.collection_address),
    track_collection_address: str(r.track_collection_address),
    achievement_pda: str(r.achievement_pda),
    is_active: r.is_active == null ? null : Boolean(r.is_active),
    last_synced: str(r.last_synced),
  };
}

// ---------------------------------------------------------------------------
// I/O (thin wrappers over fetch; not unit-tested)
// ---------------------------------------------------------------------------

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  attempts = 5
): Promise<Response> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, init);
      if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText}: ${await res.text()}`);
      }
      return res;
    } catch (e) {
      lastErr = e;
      if (i < attempts - 1) {
        await new Promise((r) => setTimeout(r, 500 * (i + 1)));
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

async function fetchManagedDocs(): Promise<ManagedDoc[]> {
  const groq = `*[_type in ["course","achievement"] && sync.source == "${SANITY_SOURCE}"]{ _id, _type, sync, onChainStatus }`;
  const url = `https://${SANITY_PROJECT_ID}.apicdn.sanity.io/v2021-10-21/data/query/${SANITY_DATASET}?query=${encodeURIComponent(groq)}`;
  const res = await fetchWithRetry(url, { method: "GET" });
  const body = (await res.json()) as { result?: ManagedDoc[] };
  return body.result ?? [];
}

interface SupabaseEnv {
  url: string;
  key: string;
}

function readSupabaseEnv(): SupabaseEnv {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "--live requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment"
    );
  }
  return { url: url.replace(/\/+$/, ""), key };
}

async function upsertRows(
  rows: DeploymentRow[],
  env: SupabaseEnv
): Promise<void> {
  const withTimestamp = rows.map((r) => ({
    ...r,
    updated_at: new Date().toISOString(),
  }));
  await fetchWithRetry(`${env.url}/rest/v1/${TABLE}?on_conflict=content_id`, {
    method: "POST",
    headers: {
      apikey: env.key,
      Authorization: `Bearer ${env.key}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(withTimestamp),
  });
}

async function fetchBackRows(env: SupabaseEnv): Promise<DeploymentRow[]> {
  const select = ROW_FIELDS.join(",");
  const res = await fetchWithRetry(
    `${env.url}/rest/v1/${TABLE}?select=${select}`,
    {
      method: "GET",
      headers: { apikey: env.key, Authorization: `Bearer ${env.key}` },
    }
  );
  const body = (await res.json()) as unknown[];
  return body.map(parseDbRow);
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

function printRows(rows: DeploymentRow[], live: boolean): void {
  const verb = live ? "UPSERTING" : "WOULD UPSERT";
  const courses = rows.filter((r) => r.kind === "course").length;
  const achievements = rows.filter((r) => r.kind === "achievement").length;
  console.log(
    `\n${verb} ${rows.length} row(s) into ${TABLE} (${courses} course, ${achievements} achievement):\n`
  );
  for (const r of rows) {
    console.log(`  ${r.content_id.padEnd(34)} ${r.kind}`);
  }
  console.log("\nFull rows:");
  console.log(JSON.stringify(rows, null, 2));
}

function printParity(p: ParityResult): void {
  console.log("\n── parity assertion ──");
  console.log(
    `expected=${p.expectedCount} actual=${p.actualCount} countMatch=${p.countMatch}`
  );
  if (p.missing.length) console.log(`missing in DB: ${p.missing.join(", ")}`);
  if (p.extra.length) console.log(`extra in DB:   ${p.extra.join(", ")}`);
  for (const d of p.fieldDiffs) {
    console.log(
      `  DIFF ${d.content_id}.${String(d.field)}: expected=${JSON.stringify(d.expected)} actual=${JSON.stringify(d.actual)}`
    );
  }
  console.log(p.ok ? "PARITY OK — zero divergence" : "PARITY FAILED");
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export async function main(argv: string[]): Promise<number> {
  const live = argv.includes("--live");

  const docs = await fetchManagedDocs();
  const expected = buildRows(docs);
  printRows(expected, live);

  let actual: DeploymentRow[];
  if (live) {
    const env = readSupabaseEnv();
    await upsertRows(expected, env);
    actual = await fetchBackRows(env);
  } else {
    console.log(
      "\n(dry-run: no DB writes; parity runs against the rows above. Re-run with --live to apply.)"
    );
    actual = expected;
  }

  const parity = checkParity(expected, actual);
  printParity(parity);
  return parity.ok ? 0 : 1;
}

const invokedDirectly = (() => {
  try {
    return (
      realpathSync(fileURLToPath(import.meta.url)) ===
      realpathSync(process.argv[1] ?? "")
    );
  } catch {
    return false;
  }
})();

if (invokedDirectly) {
  main(process.argv.slice(2))
    .then((code) => process.exit(code))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
