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
  {
    kind: "column",
    table: "email_subscriptions",
    column: "reminder_opt_in",
    migration: "20260731120000_reminder_consent.sql",
    description:
      "reminder consent flag (#869) — its absence 400s the settings email panel",
  },
  {
    kind: "column",
    table: "email_subscriptions",
    column: "reminder_unsubscribe_token",
    migration: "20260731150000_kind_scoped_unsubscribe.sql",
    description:
      "kind-scoped unsubscribe secret (#896) — its absence means reminder links still carry the MARKETING token, so one token revokes either consent",
  },
  {
    kind: "rpc",
    // ⚠️ SIDE-EFFECTFUL IF EVER CALLABLE. Unlike the other probes, this
    // function's body WRITES: it claims (and thereby consumes) today's reminder
    // slot for every learner it returns. The probe is safe ONLY because
    // claim_due_session_reminders is REVOKEd from anon/authenticated and this
    // check runs on the ANON client — PostgREST answers 42501 without executing
    // the body. NEVER grant this function to anon or authenticated: doing so
    // turns every health check into a silent "already sent" for the planners of
    // whatever weekday is hardcoded below.
    rpc: "claim_due_session_reminders",
    args: { p_weekday: "mon" },
    // Attribution = the LAST migration to define this function (#869 created it,
    // #896 re-scoped its token, recurring_lesson_plan made it gate on `days[]`).
    // A health-check failure should point at the definition to re-apply.
    migration: "20260804120000_recurring_lesson_plan.sql",
    description:
      "session-plan reminder claim (#869) — a missing fn silently sends nothing",
  },
  {
    kind: "rpc",
    // ⚠️ SIDE-EFFECTFUL IF EVER CALLABLE, same as the probe above — and safe for
    // the same reason (REVOKEd from anon/authenticated, so PostgREST answers
    // 42501 without executing the body). Belt AND braces here: the args below
    // ask for learners inactive for ~274 years, so even a body that somehow ran
    // would claim zero rows and consume nobody's cap window.
    rpc: "claim_due_reengagement",
    args: { p_kind: "reengagement_7d", p_inactive_days: 100000 },
    migration: "20260731170000_reengagement_pipeline.sql",
    description:
      "re-engagement claim + frequency cap (#899) — a missing fn silently sends nothing",
  },
  {
    kind: "rpc",
    // ⚠️ SIDE-EFFECTFUL IF EVER CALLABLE (it upserts the (user, lesson) row and
    // bumps a tier counter) — safe here for the same reason as the two probes
    // above: REVOKEd from PUBLIC/anon/authenticated, so the ANON client gets
    // 42501 and the body never runs. Belt AND braces: every tier max below is
    // 0, so a body that somehow ran would fall straight through to the
    // 'exhausted' branch, which increments nothing and (deliberately) does not
    // even touch updated_at.
    rpc: "spend_assist_ladder_turn",
    args: {
      p_user_id: NIL_UUID,
      p_lesson_id: "",
      p_free_max: 0,
      p_metered_max: 0,
      p_socratic_max: 0,
    },
    migration: "20260730120000_assist_ladder.sql",
    description:
      "AI assist ladder spend (#864) — spendAssistTurn fails CLOSED on any RPC error, so a missing fn denies EVERY AI tutor turn while /api/health/schema still returns 200 (the #945 class of prod-down)",
  },
  {
    kind: "rpc",
    // Read-only (LANGUAGE sql STABLE) — no side effect even if it ran, which it
    // does not (REVOKEd from anon, same as above).
    rpc: "get_challenge_assist_state",
    args: { p_user_id: NIL_UUID, p_lesson_id: "" },
    migration: "20260730120000_assist_ladder.sql",
    description:
      "assist-pane rehydration (#864) — the same migration DROPs the old signature, so a stale prod has NEITHER version and the pane loads with empty counts",
  },
  {
    kind: "column",
    table: "challenge_assists",
    column: "chat_log",
    migration: "20260730120000_assist_ladder.sql",
    description:
      "persisted AI Partner chat log — folded into the ladder migration because 20260715160000_ai_partner_chat_log.sql was never applied to prod (#708 ledger); its absence silently drops every learner's chat history",
  },
  {
    kind: "rpc",
    // ⚠️ SIDE-EFFECTFUL IF EVER CALLABLE (advances/resets a Leitner box) — safe
    // for the usual reason (REVOKEd from anon → 42501, body never runs), and
    // the item key below matches no row, so a body that ran would return zero
    // rows and mutate nothing.
    rpc: "record_review_result",
    args: { p_user_id: NIL_UUID, p_item_key: "", p_passed: false },
    migration: "20260726140000_review_items_spaced_repetition.sql",
    description:
      "spaced-repetition grading (#569) — /api/review/grade rethrows the RPC error, so a missing fn 500s every review submission",
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
