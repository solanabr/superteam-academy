import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

// #572 (LX-B7): the 'review' quest kind. get_daily_quest_state runs on the
// login retry path, so an error in it bricks every learner's quest read. The
// branch cannot be exercised without a live DB, so — as with the #569 review
// spine guard — pin the correctness- and safety-critical SQL invariants in BOTH
// the migration (what gets applied) AND the schema.sql mirror (what new
// environments are built from); drift between them is the #449 IDL-drift class
// of bug. The load-bearing properties:
//   * an ADDITIVE 'review' ELSIF that only computes v_current and falls through
//     to the shared generic upsert — it must NOT carry its own CONTINUE or its
//     own pending_onchain_actions enqueue, or it would fork the xp_granted
//     atomicity invariant away from the single generic owner.
//   * "cleared today" counts the caller's OWN review_items passed today
//     (last_result = true AND last_reviewed_at::date = CURRENT_DATE) — a miss
//     resets to box 1 and must not count.
//   * the unknown-type ELSE skip (RAISE WARNING + CONTINUE, no RAISE/500) is
//     still present — the "unknown-type skip" the issue relies on so a review
//     quest YAML can stage BEFORE this SQL lands.

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
const migration = readFileSync(
  resolve(repoRoot, "supabase/migrations/20260726170000_review_quest_kind.sql"),
  "utf8"
);
const schema = readFileSync(resolve(repoRoot, "supabase/schema.sql"), "utf8");

// Only the FORWARD (applied) SQL — for the migration that means everything
// before the commented-out ROLLBACK block, so the rollback's restored body (by
// design free of the review branch) never counts against the forward asserts.
function forwardSql(sql: string): string {
  const rollbackAt = sql.indexOf("-- ROLLBACK (tested)");
  return rollbackAt === -1 ? sql : sql.slice(0, rollbackAt);
}

// The single get_daily_quest_state definition's 'review' branch: from the ELSIF
// to the next ELSE arm (the unknown-type handler).
function reviewBranch(sql: string): string {
  const fwd = forwardSql(sql);
  const start = fwd.indexOf("ELSIF v_type = 'review' THEN");
  expect(start, "'review' branch present").toBeGreaterThan(-1);
  const end = fwd.indexOf("\n    ELSE", start);
  expect(end, "'review' branch is followed by the ELSE arm").toBeGreaterThan(
    start
  );
  return fwd.slice(start, end);
}

for (const [label, sql] of [
  ["migration", migration] as const,
  ["schema.sql", schema] as const,
]) {
  describe(`#572 review quest kind — ${label}`, () => {
    it("adds a 'review' ELSIF branch to get_daily_quest_state", () => {
      expect(forwardSql(sql)).toContain("ELSIF v_type = 'review' THEN");
    });

    it("counts the caller's own review_items cleared TODAY (pass only)", () => {
      const branch = reviewBranch(sql);
      expect(branch).toContain("FROM public.review_items");
      expect(branch).toContain("WHERE user_id = p_user_id");
      // Cleared = passed. A miss (last_result = false) resets the box and must
      // not count toward the quest.
      expect(branch).toContain("AND last_result = true");
      expect(branch).toContain("AND last_reviewed_at::date = CURRENT_DATE");
    });

    it("is ADDITIVE — no own CONTINUE, no own pending_onchain_actions enqueue", () => {
      // The branch must fall through to the shared generic upsert (the single
      // owner of the xp_granted / pending_onchain_actions atomicity), exactly
      // like the lesson/challenge/module arms — unlike login_streak, which owns
      // its upsert and CONTINUEs. Strip `-- …` comments first so the branch's
      // own prose (which names both keywords) isn't read as code.
      const code = reviewBranch(sql).replace(/--[^\n]*/g, "");
      expect(code).not.toContain("CONTINUE");
      expect(code).not.toContain("pending_onchain_actions");
    });

    it("keeps the unknown-type skip (WARNING, not RAISE) for early YAML staging", () => {
      const fwd = forwardSql(sql);
      expect(fwd).toContain(
        "get_daily_quest_state: skipping unknown quest type:"
      );
      expect(fwd).toContain("RAISE WARNING");
    });

    it("re-issues the SECURITY DEFINER grants unchanged", () => {
      const fwd = forwardSql(sql);
      expect(fwd).toContain("SECURITY DEFINER");
      expect(fwd).toContain("SET search_path = ''");
      expect(fwd).toContain(
        "REVOKE EXECUTE ON FUNCTION get_daily_quest_state FROM authenticated, anon, public"
      );
      expect(fwd).toContain(
        "GRANT EXECUTE ON FUNCTION get_daily_quest_state TO service_role"
      );
    });
  });
}

describe("#572 review quest kind — migration-only guarantees", () => {
  it("runs in one explicit transaction", () => {
    expect(migration).toContain("BEGIN;");
    expect(migration).toContain("COMMIT;");
  });

  it("replaces the function additively — CREATE OR REPLACE, no DROP", () => {
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION get_daily_quest_state("
    );
    // Additive only: it must not drop the function, tables, or grants.
    expect(migration).not.toMatch(
      /DROP\s+FUNCTION[^\n]*get_daily_quest_state/i
    );
  });

  it("documents the merge-order requirement (apply before code deploy)", () => {
    expect(migration).toContain("APPLY THIS MIGRATION BEFORE");
  });

  it("ships a rollback that restores a body WITHOUT the review branch", () => {
    const rollbackAt = migration.indexOf("-- ROLLBACK (tested)");
    expect(rollbackAt).toBeGreaterThan(-1);
    const rollback = migration.slice(rollbackAt);
    expect(rollback).toContain(
      "-- CREATE OR REPLACE FUNCTION get_daily_quest_state("
    );
    // The restored (pre-migration) body has no review branch and never touches
    // review_items.
    expect(rollback).not.toContain("v_type = 'review'");
    expect(rollback).not.toContain("FROM public.review_items");
  });
});
