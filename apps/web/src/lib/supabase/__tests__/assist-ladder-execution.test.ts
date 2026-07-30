// #864 assist ladder: REAL SQL-execution tests for the ladder RPCs, following
// the email-subscriptions-execution pattern (#779). The TS-side tests mock the
// RPCs, so only this file can catch a function body that parses but throws (or
// silently misbehaves) at runtime. It executes the migration's actual SQL in an
// in-process Postgres (pglite) and drives the ladder through every tier
// boundary plus both reset guards.
//
// Covered contracts (economics spec §4.2/§4.3, owner decisions D-4/D-5/D-8):
//   * turns 1–2 land in 'free', turn 3 flips to 'metered' (boundary 2→3);
//   * turn 11 flips to 'socratic' once the 10 free+metered turns are gone;
//   * turn 31 denies with 'exhausted' (community handoff) after 20 Socratic;
//   * refunds hand back exactly the spent tier;
//   * reset denies inside the 7-day cooldown, works once after it, then denies
//     forever ('already_used') — both guards INSIDE the SECURITY DEFINER RPC.
//
// @vitest-environment node
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  FREE_ASSIST_TURNS,
  METERED_ASSIST_TURNS,
  SOCRATIC_ASSIST_TURNS,
} from "@/lib/ai/partner-types";

function findRepoRoot(): string {
  let dir = dirname(fileURLToPath(import.meta.url));
  while (!existsSync(resolve(dir, "supabase/schema.sql"))) {
    const parent = dirname(dir);
    if (parent === dir)
      throw new Error("repo root (supabase/schema.sql) not found");
    dir = parent;
  }
  return dir;
}

const repoRoot = findRepoRoot();
const baseMigration = readFileSync(
  resolve(
    repoRoot,
    "supabase/migrations/20260707120000_challenge_assists_budget.sql"
  ),
  "utf8"
);
const chatLogMigration = readFileSync(
  resolve(
    repoRoot,
    "supabase/migrations/20260715160000_ai_partner_chat_log.sql"
  ),
  "utf8"
);
const billedMigration = readFileSync(
  resolve(
    repoRoot,
    "supabase/migrations/20260725120000_billed_assists_counter.sql"
  ),
  "utf8"
);
const ladderMigration = readFileSync(
  resolve(repoRoot, "supabase/migrations/20260730120000_assist_ladder.sql"),
  "utf8"
);

// Minimal, honest stub of the objects the migrations reference but that live
// outside them: the Supabase roles the GRANT/REVOKE statements target and the
// profiles table challenge_assists FKs to.
const STUB_SETUP = `
  CREATE ROLE anon;
  CREATE ROLE authenticated;
  CREATE ROLE service_role;
  CREATE TABLE public.profiles (id uuid PRIMARY KEY);
`;

const UID = "11111111-1111-1111-1111-111111111111";
const LESSON = "lesson-test-ladder";

interface SpendRow {
  allowed: boolean;
  tier: string;
  free_turns: number;
  metered_turns: number;
  socratic_turns: number;
}

interface ResetRow {
  allowed: boolean;
  reason: string;
  available_at: string | null;
}

function firstRow<T>(rows: readonly T[]): T {
  expect(rows.length).toBeGreaterThan(0);
  return rows[0] as T;
}

// PROD-lineage guard (#887 gate finding B1/B3): prod's schema_migrations has
// NEVER received 20260715160000_ai_partner_chat_log.sql (absent from the #708
// ledger), so prod's challenge_assists has no chat_log column and no
// append_challenge_assist_log function. A ladder migration that assumes them
// errors at CREATE (LANGUAGE sql bodies are validated then) and rolls back the
// whole apply. This describe applies ONLY what prod actually has — base +
// billed_assists_counter + the ladder file, WITHOUT the chat-log migration —
// so the ladder file must be self-sufficient. Red-proven: at the pre-fix head
// this failed with `column ca.chat_log does not exist`.
describe("#864 ladder migration applies on the PROD lineage (no chat-log migration)", () => {
  let db: PGlite;

  beforeEach(async () => {
    db = await PGlite.create();
    await db.exec(STUB_SETUP);
    await db.exec(baseMigration);
    await db.exec(billedMigration);
    // Deliberately NOT chatLogMigration — prod never got it.
    await db.exec(ladderMigration);
    await db.exec(`INSERT INTO public.profiles(id) VALUES ('${UID}')`);
  });

  afterEach(async () => {
    await db.close();
  });

  it("applies cleanly and the full RPC surface works end-to-end", async () => {
    // Spend one turn, log a chat entry, read the widened state back.
    const { rows: spendRows } = await db.query<SpendRow>(
      "SELECT * FROM public.spend_assist_ladder_turn($1, $2, $3, $4, $5)",
      [
        UID,
        LESSON,
        FREE_ASSIST_TURNS,
        METERED_ASSIST_TURNS,
        SOCRATIC_ASSIST_TURNS,
      ]
    );
    expect(firstRow(spendRows)).toMatchObject({ allowed: true, tier: "free" });

    await db.query(
      "SELECT public.append_challenge_assist_log($1, $2, $3::jsonb)",
      [UID, LESSON, JSON.stringify([{ role: "user", text: "hi" }])]
    );

    const { rows: stateRows } = await db.query<{
      free_turns: number;
      reset_state: string;
      chat_log: unknown;
    }>("SELECT * FROM public.get_challenge_assist_state($1, $2)", [
      UID,
      LESSON,
    ]);
    const state = firstRow(stateRows);
    expect(state.free_turns).toBe(1);
    expect(state.reset_state).toBe("cooldown");
    expect(state.chat_log).toEqual([{ role: "user", text: "hi" }]);

    const { rows: resetRows } = await db.query<ResetRow>(
      "SELECT * FROM public.reset_challenge_assists($1, $2)",
      [UID, LESSON]
    );
    expect(firstRow(resetRows).reason).toBe("cooldown");
  });
});

describe("#864 assist-ladder RPCs execute correctly", () => {
  let db: PGlite;

  async function spend(): Promise<SpendRow> {
    const { rows } = await db.query<SpendRow>(
      "SELECT * FROM public.spend_assist_ladder_turn($1, $2, $3, $4, $5)",
      [
        UID,
        LESSON,
        FREE_ASSIST_TURNS,
        METERED_ASSIST_TURNS,
        SOCRATIC_ASSIST_TURNS,
      ]
    );
    return firstRow(rows);
  }

  async function reset(): Promise<ResetRow> {
    const { rows } = await db.query<ResetRow>(
      "SELECT * FROM public.reset_challenge_assists($1, $2)",
      [UID, LESSON]
    );
    return firstRow(rows);
  }

  /** Backdate the cooldown anchor so the reset window is open/closed on demand. */
  async function backdateActivity(days: number): Promise<void> {
    await db.query(
      `UPDATE public.challenge_assists
         SET updated_at = now() - ($3 || ' days')::interval
       WHERE user_id = $1 AND lesson_id = $2`,
      [UID, LESSON, String(days)]
    );
  }

  beforeEach(async () => {
    db = await PGlite.create();
    await db.exec(STUB_SETUP);
    // Apply the lineage in order, exactly as a fresh DB would receive it.
    await db.exec(baseMigration);
    await db.exec(chatLogMigration);
    await db.exec(billedMigration);
    await db.exec(ladderMigration);
    await db.exec(`INSERT INTO public.profiles(id) VALUES ('${UID}')`);
  });

  afterEach(async () => {
    await db.close();
  });

  it("walks the full ladder: 2 free, metered at turn 3, Socratic at turn 11, handoff at turn 31", async () => {
    // Turns 1–2: free tier.
    for (let turn = 1; turn <= FREE_ASSIST_TURNS; turn++) {
      const row = await spend();
      expect(row).toMatchObject({ allowed: true, tier: "free" });
      expect(row.free_turns).toBe(turn);
    }

    // Turn 3 crosses the free→metered boundary.
    const third = await spend();
    expect(third).toMatchObject({ allowed: true, tier: "metered" });
    expect(third.free_turns).toBe(FREE_ASSIST_TURNS);
    expect(third.metered_turns).toBe(1);

    // Turns 4–10 stay metered.
    for (let i = 2; i <= METERED_ASSIST_TURNS; i++) {
      const row = await spend();
      expect(row).toMatchObject({ allowed: true, tier: "metered" });
      expect(row.metered_turns).toBe(i);
    }

    // Turn 11 crosses metered→Socratic.
    const eleventh = await spend();
    expect(eleventh).toMatchObject({ allowed: true, tier: "socratic" });
    expect(eleventh.metered_turns).toBe(METERED_ASSIST_TURNS);
    expect(eleventh.socratic_turns).toBe(1);

    // Turns 12–30 stay Socratic.
    for (let i = 2; i <= SOCRATIC_ASSIST_TURNS; i++) {
      const row = await spend();
      expect(row).toMatchObject({ allowed: true, tier: "socratic" });
      expect(row.socratic_turns).toBe(i);
    }

    // Turn 31: the ladder is spent — deny as 'exhausted' (community handoff),
    // and the counts are truthful, not inflated by the denied attempt.
    const thirtyFirst = await spend();
    expect(thirtyFirst).toEqual({
      allowed: false,
      tier: "exhausted",
      free_turns: FREE_ASSIST_TURNS,
      metered_turns: METERED_ASSIST_TURNS,
      socratic_turns: SOCRATIC_ASSIST_TURNS,
    });

    // Denials stay denials.
    expect((await spend()).allowed).toBe(false);
  });

  it("refunds exactly the spent tier (and floors at zero)", async () => {
    await spend(); // free: 1
    await db.query("SELECT public.refund_assist_ladder_turn($1, $2, $3)", [
      UID,
      LESSON,
      "free",
    ]);
    const afterFreeRefund = await spend();
    // The refund handed the free turn back, so this spend lands in free again.
    expect(afterFreeRefund).toMatchObject({ allowed: true, tier: "free" });
    expect(afterFreeRefund.free_turns).toBe(1);

    // Refunding a tier with a zero counter must not go negative.
    await db.query("SELECT public.refund_assist_ladder_turn($1, $2, $3)", [
      UID,
      LESSON,
      "socratic",
    ]);
    const { rows } = await db.query<{ socratic_used: number }>(
      "SELECT socratic_used FROM public.challenge_assists WHERE user_id = $1 AND lesson_id = $2",
      [UID, LESSON]
    );
    expect(firstRow(rows).socratic_used).toBe(0);
  });

  it("reset guard 1 (cooldown): denies inside the 7-day window and reports when it opens", async () => {
    await spend();
    const denied = await reset();
    expect(denied.allowed).toBe(false);
    expect(denied.reason).toBe("cooldown");
    expect(denied.available_at).not.toBeNull();

    // Nothing was reset.
    const { rows } = await db.query<{ free_used: number }>(
      "SELECT free_used FROM public.challenge_assists WHERE user_id = $1 AND lesson_id = $2",
      [UID, LESSON]
    );
    expect(firstRow(rows).free_used).toBe(1);
  });

  it("reset guard 2 (once): works once after the cooldown, then denies forever", async () => {
    // Spend a few turns, then age the activity past the 7-day cooldown.
    await spend();
    await spend();
    await spend();
    await backdateActivity(8);

    const granted = await reset();
    expect(granted).toMatchObject({ allowed: true, reason: "reset" });

    // Counters zeroed; the ladder restarts from the free tier.
    const fresh = await spend();
    expect(fresh).toMatchObject({ allowed: true, tier: "free" });
    expect(fresh.free_turns).toBe(1);

    // Second reset: denied by the once-flag even after another long cooldown.
    await backdateActivity(30);
    const secondDenied = await reset();
    expect(secondDenied.allowed).toBe(false);
    expect(secondDenied.reason).toBe("already_used");
  });

  it("reset preserves the chat log and the billed-spend audit counter", async () => {
    await spend();
    await db.query("SELECT public.record_billed_assist($1, $2)", [UID, LESSON]);
    await db.query(
      "SELECT public.append_challenge_assist_log($1, $2, $3::jsonb)",
      [UID, LESSON, JSON.stringify([{ role: "user", text: "hi" }])]
    );
    await backdateActivity(8);

    expect((await reset()).allowed).toBe(true);

    const { rows } = await db.query<{
      billed_assists: number;
      chat_log: unknown;
    }>(
      "SELECT billed_assists, chat_log FROM public.challenge_assists WHERE user_id = $1 AND lesson_id = $2",
      [UID, LESSON]
    );
    const row = firstRow(rows);
    expect(row.billed_assists).toBe(1);
    expect(row.chat_log).toEqual([{ role: "user", text: "hi" }]);
  });

  it("resetting a lesson with no assist row denies with nothing_to_reset", async () => {
    const denied = await reset();
    expect(denied.allowed).toBe(false);
    expect(denied.reason).toBe("nothing_to_reset");
  });

  it("denied spends do not restart the reset cooldown (updated_at frozen)", async () => {
    // Exhaust the whole ladder.
    const total =
      FREE_ASSIST_TURNS + METERED_ASSIST_TURNS + SOCRATIC_ASSIST_TURNS;
    for (let i = 0; i < total; i++) await spend();
    await backdateActivity(8);

    // A denied retry must not bump updated_at back into the cooldown window.
    expect((await spend()).allowed).toBe(false);
    const granted = await reset();
    expect(granted.allowed).toBe(true);
  });
});
