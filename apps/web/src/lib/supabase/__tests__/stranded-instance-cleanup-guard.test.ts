import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

// #607: reset the chain-mirrored learner state stranded by the program move
// (Dsro2Cd9 live; the DB still mirrors the superseded 7NeJa instance). This is a
// DATA-only migration (DML, no DDL) — it is NOT mirrored into schema.sql, so
// there is no snapshot to cross-check. Instead these tests pin the two
// invariants a careless edit could break and this issue exists to protect:
//   1. user_xp is UPDATED to zero, NEVER deleted (it is 1:1 with profiles; a
//      DELETE would blast the 73 pristine event-cohort rows).
//   2. profiles and auth.users are NEVER written (only read for assertions);
//      certificates is EXCLUDED from the reset.
// PL/pgSQL execution can't run in this repo (no DB harness — see the sibling
// *-guard tests), so we assert against the migration SQL text directly.

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
  resolve(
    repoRoot,
    "supabase/migrations/20260727140000_stranded_instance_state_cleanup.sql"
  ),
  "utf8"
);

// Executable SQL only: strip `--` line comments so the "never write X" checks
// test statements, not the header/ROLLBACK prose (which legitimately DISCUSSES
// `DELETE FROM user_xp` as the mistake to avoid). No string literal in this file
// contains `--`, so a line-level strip is sufficient.
const code = migration.replace(/--[^\n]*/g, "");

describe("#607 stranded-instance cleanup — transaction + shape", () => {
  it("runs in one explicit transaction", () => {
    expect(migration).toContain("BEGIN;");
    expect(migration).toContain("COMMIT;");
  });

  // The four reset tables are ERA-SCOPED, each on its own creation timestamp,
  // so live post-move rows (e.g. the #725 e2e completions, or any completion
  // written directly by lessons/complete) survive. A missing WHERE would make
  // the DELETE unbounded — the exact bug the review caught — so pin the shape.
  const ERA_DELETES: ReadonlyArray<[string, string]> = [
    ["enrollments", "enrolled_at"],
    ["user_progress", "completed_at"],
    ["xp_transactions", "created_at"],
    ["user_achievements", "unlocked_at"],
  ];

  it("era-scopes every DELETE (WHERE <ts> < '2026-07-21')", () => {
    for (const [table, ts] of ERA_DELETES) {
      expect(code).toMatch(
        new RegExp(
          `DELETE FROM public\\.${table}\\s+WHERE ${ts}\\s*<\\s*'2026-07-21'`
        )
      );
    }
  });

  it("never issues an UNBOUNDED delete against a reset table (mutation guard)", () => {
    // Removing the WHERE must fail this: a bare `DELETE FROM public.<t>;` would
    // destroy live post-move rows.
    for (const [table] of ERA_DELETES) {
      expect(code).not.toMatch(
        new RegExp(`DELETE FROM public\\.${table}\\s*;`)
      );
    }
  });

  it("guards the era counts before AND after deleting", () => {
    // Pre-DELETE: each era count must equal the posted value OR 0 (idempotent).
    expect(migration).toContain("b.enr_era NOT IN (0, 7)");
    expect(migration).toContain("b.up_era NOT IN (0, 63)");
    // Round-4 forensic correction: an authority login on 2026-07-27, BEFORE the
    // dry-run counts were posted, added one post-cutoff xp_transactions row, so
    // the posted total (16) inherited a one-off error — era truth is 15.
    expect(migration).toContain("b.xp_era NOT IN (0, 15)");
    expect(migration).toContain("b.ach_era NOT IN (0, 7)");
    // Post-DELETE: no pre-move row survives in any reset table.
    expect(migration).toMatch(/pre-move rows survived the reset/);
  });

  it("aborts on a NULL anchor in any reset table (invisible to the era filter)", () => {
    // A NULL timestamp is invisible to `< '2026-07-21'`, so a NULL-anchored row
    // would silently survive the wipe. None of the four columns is NOT NULL, so
    // each gets an explicit IS NULL count that must be 0. Mutation: removing any
    // one of these four asserts fails this test.
    expect(migration).toContain("b.enr_null <> 0");
    expect(migration).toContain("b.up_null <> 0");
    expect(migration).toContain("b.xp_null <> 0");
    expect(migration).toContain("b.ach_null <> 0");
    for (const [ts] of [
      ["enrolled_at"],
      ["completed_at"],
      ["created_at"],
      ["unlocked_at"],
    ] as const) {
      expect(code).toMatch(new RegExp(`WHERE ${ts}\\s+IS NULL`));
    }
  });
});

describe("#607 stranded-instance cleanup — user_xp RECONCILE, never DELETE", () => {
  it("never issues a DELETE or TRUNCATE against user_xp", () => {
    // The whole point of the 🔴 note: a DELETE here would remove the 73 pristine
    // signup rows (37x the target). This must never regress. Checked against
    // executable SQL only (the header prose names the mistake on purpose).
    expect(code).not.toMatch(/DELETE\s+FROM\s+(public\.)?user_xp/i);
    expect(code).not.toMatch(/TRUNCATE\s+(TABLE\s+)?(public\.)?user_xp/i);
  });

  it("RECONCILEs total_xp from surviving xp_transactions (not a blind era-zero)", () => {
    // Round-4 gate redesign: a stranded user who logged in post-cutoff (the
    // authority, 4350 XP) escapes an era-scoped zero-UPDATE but its total is
    // still era-tainted. Reconcile recomputes total_xp = SUM(surviving amounts)
    // AFTER the era-DELETEs, so every row is consistent-by-construction. The old
    // single era-scoped zero-UPDATE must be GONE.
    expect(code).toMatch(/SUM\(amount\)/);
    expect(code).toMatch(/FROM public\.xp_transactions\s+GROUP BY user_id/);
    // level recomputed with award_xp's exact formula (schema.sql:697).
    expect(code).toMatch(/floor\(sqrt\(/);
    // Touch-minimal + idempotent: only rows whose total disagrees.
    expect(code).toMatch(/u\.total_xp <> /);
    // The pre-round-4 blind era-zero UPDATE (SET total_xp = 0 gated only by the
    // era clause) must no longer be the user_xp mutation.
    expect(code).not.toMatch(
      /UPDATE public\.user_xp[\s\S]*?AND last_activity_date < '2026-07-21'/
    );
  });

  it("zeroes users with state but NO surviving xp_transactions rows", () => {
    // The reconcile UPDATE...FROM only covers users WITH surviving rows; a fully
    // stranded user (467e7e23, all rows deleted) needs an explicit zero incl.
    // streak/last_activity. Gate design, statement 2.
    expect(code).toMatch(
      /NOT EXISTS\s*\(\s*SELECT 1 FROM public\.xp_transactions/
    );
  });

  it("bounds Statement B's blast radius with a pre-flight that names the user (round-5/6 gate)", () => {
    // Statement B is deliberately era-UNBOUNDED (the reconcile post-invariant
    // needs it), so a live/resync user with state but no post-cutoff XP could be
    // silently full-zeroed. A pre-flight counts B's would-be targets using the
    // PRE-DELETE survivor view (created_at >= cutoff — NOT the current-rows view)
    // and ABORTS NAMING the user_id(s) if ever more than the expected ONE.
    expect(migration).toContain("uxp_b_blast");
    expect(migration).toContain("b.uxp_b_blast NOT IN (0, 1)");
    // The pre-delete survivor view: at-or-after the cutoff, not "current rows".
    expect(code).toMatch(/created_at >= '2026-07-21'/);
    // Names the offending row(s) in the abort message.
    expect(code).toMatch(/string_agg/);
  });

  it("verifies no state-bearing row has a NULL activity date (defensive)", () => {
    // Not "impossible": award_xp stamps last_activity_date, but admin/resync
    // upserts user_xp directly and can leave total_xp>0 with a NULL date. Hence
    // the pre-flight uxp_null_state assert ABORTS for inspection rather than
    // assuming. Expect 0.
    expect(migration).toContain("uxp_null_state");
  });

  it("corrects the stranded-active pre-pin to the round-4 truth (1, not 2)", () => {
    // The authority's post-cutoff login bumped its last_activity_date past the
    // cutoff, so only 1 user_xp row (467e7e23) is truly stranded-active.
    expect(migration).toContain("b.uxp_active_era NOT IN (0, 1)");
  });

  it("preserves streak_freezes (not in any SET list)", () => {
    // Owner decision: streak_freezes is the earned freeze inventory (0 today),
    // preserved as-is. It must not appear on the left of an assignment.
    expect(code).not.toMatch(/streak_freezes\s*=/);
  });

  it("asserts user_xp row count is unchanged (reconciled, never deleted)", () => {
    expect(migration).toMatch(/user_xp row count changed/);
    expect(migration).toMatch(/NEVER deleted/);
  });

  it("post-assert is the RECONCILE invariant (total_xp == sum of survivors)", () => {
    // Round-4 gate: replace the era-scoped "no stranded row carries state" check
    // with the drift-proof invariant — no row's total_xp disagrees with the sum
    // of its surviving xp_transactions. The old era-scoped reset assert is gone.
    expect(migration).toMatch(/total_xp.*(disagrees|!= sum|<> )/i);
    expect(migration).not.toMatch(/stranded-era row\(s\) still carry state/);
  });
});

describe("#607 stranded-instance cleanup — never-touch + excluded tables", () => {
  it("never writes profiles or auth.users (reads for assertions only)", () => {
    for (const t of ["profiles", "auth\\.users"]) {
      expect(code).not.toMatch(
        new RegExp(`DELETE\\s+FROM\\s+(public\\.)?${t}`, "i")
      );
      expect(code).not.toMatch(
        new RegExp(`UPDATE\\s+(public\\.)?${t}\\s+SET`, "i")
      );
      expect(code).not.toMatch(
        new RegExp(`INSERT\\s+INTO\\s+(public\\.)?${t}`, "i")
      );
      expect(code).not.toMatch(
        new RegExp(`TRUNCATE\\s+(TABLE\\s+)?(public\\.)?${t}`, "i")
      );
    }
  });

  it("never writes the EXCLUDED certificates table", () => {
    expect(code).not.toMatch(/DELETE\s+FROM\s+(public\.)?certificates/i);
    expect(code).not.toMatch(/UPDATE\s+(public\.)?certificates\s+SET/i);
    expect(code).not.toMatch(/TRUNCATE\s+(TABLE\s+)?(public\.)?certificates/i);
  });

  it("never writes deployed_programs (holds the #725 proof row) and asserts it unchanged", () => {
    // Gate ask: deployed_programs now has its first real row; assert untouched.
    expect(code).not.toMatch(/DELETE\s+FROM\s+(public\.)?deployed_programs/i);
    expect(code).not.toMatch(/UPDATE\s+(public\.)?deployed_programs\s+SET/i);
    expect(migration).toMatch(/must never touch deployed_programs/);
  });

  it("asserts profiles, auth.users, certificates and deployed_programs unchanged at COMMIT", () => {
    expect(migration).toMatch(/this migration must never touch profiles/);
    expect(migration).toMatch(/must never touch auth users/);
    expect(migration).toMatch(/certificates is EXCLUDED from this cleanup/);
    expect(migration).toMatch(/must never touch deployed_programs/);
  });

  it("drops the absolute live-count pins (drift-immune before==after only)", () => {
    // Round-3 gate catch: absolute pins on LIVE counts go stale the moment
    // anyone signs up (profiles/user_xp were already 76/76). They reintroduce
    // the race era-scoping removes. Only the frozen ERA counts deserve pins; the
    // never-touch tables are guarded by before==after (see the asserts above).
    expect(migration).not.toContain("b.profiles <> 75");
    expect(migration).not.toContain("b.user_xp <> 75");
    expect(migration).not.toContain("b.certificates <> 4");
  });
});

describe("#607 stranded-instance cleanup — honesty about reversibility", () => {
  it("declares itself NOT rollback-able rather than shipping a fake rollback", () => {
    expect(migration).toMatch(/ROLLBACK — NONE/);
    expect(migration).toMatch(/DESTRUCTIVE and NOT reversible/);
    // #750 lesson: must not tell the operator to "re-apply" anything to recover.
    expect(migration).not.toMatch(/re-apply the migration/i);
  });
});
