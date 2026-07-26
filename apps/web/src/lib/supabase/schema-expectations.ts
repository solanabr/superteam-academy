import type { SupabaseClient } from "@supabase/supabase-js";
import { logError } from "@/lib/logging";

// ============================================================================
// Schema-expectation health check (#731, option 2)
//
// Vercel auto-deploys from `main` the instant a migration-bearing PR merges, but
// migrations are applied by hand afterwards. In that window production runs code
// against schema that does not exist yet — the exact gap that (via #720/#727)
// took the AI tutor down and silently zeroed every learner's streak.
//
// This module lists the DB objects THIS release depends on and probes prod for
// them cheaply, so the merge→apply gap surfaces at deploy time (hit
// /api/health/schema) instead of at the first user request.
//
// ── HOW PROBING STAYS CHEAP AND SIDE-EFFECT-FREE ──
//   * table  → `select * limit 1`      — a missing table errors (PGRST205 /
//              42P01); RLS just filters rows, it never errors on existence.
//   * column → `select <col> limit 1`  — a missing column errors (42703).
//   * rpc    → call with inert args via the ANON server client. That client
//              lacks EXECUTE on the service_role-only functions we probe, so a
//              PRESENT function returns permission-denied (42501) WITHOUT running
//              its body, and a MISSING one returns "not found in schema cache"
//              (PGRST202). We therefore never execute a function's body.
//
// ── MIGRATION AUTHORS: EXTEND THIS LIST ──
// When a migration adds an object the shipping code will read on the hot path,
// add an entry below naming the object AND the migration file that creates it.
// Existence-only: this cannot detect a STALE function body (CREATE OR REPLACE
// keeps the object present), so it catches "never applied", not "applied an old
// version". Keep entries to objects a fresh deploy genuinely cannot run without.
// ============================================================================

const NIL_UUID = "00000000-0000-0000-0000-000000000000";

export type SchemaExpectation =
  | { kind: "table"; table: string; migration: string; description: string }
  | {
      kind: "column";
      table: string;
      column: string;
      migration: string;
      description: string;
    }
  | {
      kind: "rpc";
      rpc: string;
      args: Record<string, unknown>;
      migration: string;
      description: string;
    };

export const SCHEMA_EXPECTATIONS: readonly SchemaExpectation[] = [
  {
    kind: "column",
    table: "user_xp",
    column: "streak_freezes",
    migration: "20260726190000_streak_forgiveness.sql",
    description:
      "streak-freeze inventory column (#727) — its absence 400s the streak read",
  },
  {
    kind: "table",
    table: "streak_freezes_used",
    migration: "20260726190000_streak_forgiveness.sql",
    description: "consumed-freeze log (#727) — drives calendar snowflakes",
  },
  {
    kind: "rpc",
    rpc: "check_ai_spend",
    args: { p_user_id: NIL_UUID, p_ip: "" },
    migration: "20260726180000_ai_spend_ledger.sql",
    description:
      "AI-tutor spend ceiling (#720) — a missing fn fails the tutor closed",
  },
];

// PostgREST "not found in schema cache" + Postgres undefined-object SQLSTATEs.
// Anything NOT in this set (permission denied 42501, a validation error, or no
// error at all) proves the object EXISTS — it is only the "missing" signal.
const MISSING_CODES = new Set([
  "PGRST202", // rpc: function not found in schema cache
  "PGRST205", // table: relation not found in schema cache
  "42P01", // undefined_table
  "42703", // undefined_column
  "42883", // undefined_function
]);

interface ProbeError {
  code?: string;
  message?: string;
}

function isMissing(error: ProbeError | null): boolean {
  if (!error) return false;
  if (error.code && MISSING_CODES.has(error.code)) return true;
  return /does not exist|could not find|schema cache/i.test(
    error.message ?? ""
  );
}

export function describeObject(exp: SchemaExpectation): string {
  switch (exp.kind) {
    case "table":
      return `table ${exp.table}`;
    case "column":
      return `column ${exp.table}.${exp.column}`;
    case "rpc":
      return `function ${exp.rpc}`;
  }
}

async function probe(
  client: SupabaseClient,
  exp: SchemaExpectation
): Promise<ProbeError | null> {
  if (exp.kind === "rpc") {
    const { error } = await client.rpc(exp.rpc, exp.args);
    return error;
  }
  const columns = exp.kind === "column" ? exp.column : "*";
  const { error } = await client.from(exp.table).select(columns).limit(1);
  return error;
}

export interface MissingObject {
  object: string;
  migration: string;
  description: string;
  detail: string;
}

export interface SchemaCheckResult {
  ok: boolean;
  checked: number;
  missing: MissingObject[];
}

/**
 * Probe every release-critical object. Pass the ANON server client (see the
 * side-effect note above). Returns which objects are missing and the migration
 * that creates each; also logs each miss with a structured errorId so a bad
 * deploy is visible in logs even if nothing reads the JSON response.
 */
export async function checkSchemaExpectations(
  client: SupabaseClient
): Promise<SchemaCheckResult> {
  const missing: MissingObject[] = [];

  for (const exp of SCHEMA_EXPECTATIONS) {
    const error = await probe(client, exp);
    if (!isMissing(error)) continue;

    const object = describeObject(exp);
    missing.push({
      object,
      migration: exp.migration,
      description: exp.description,
      detail: error?.message ?? "not found",
    });
    logError({
      errorId: "schema-expectation.missing",
      error: new Error(
        `Missing ${object} — expected by migration ${exp.migration}`
      ),
      context: { object, migration: exp.migration, code: error?.code },
    });
  }

  return {
    ok: missing.length === 0,
    checked: SCHEMA_EXPECTATIONS.length,
    missing,
  };
}
