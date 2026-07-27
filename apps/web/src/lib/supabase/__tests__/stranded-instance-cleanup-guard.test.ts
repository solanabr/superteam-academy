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
    expect(migration).toContain("b.xp_era NOT IN (0, 16)");
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

describe("#607 stranded-instance cleanup — user_xp is UPDATE, never DELETE", () => {
  it("UPDATEs user_xp to zero", () => {
    expect(migration).toMatch(/UPDATE\s+public\.user_xp\s+SET/);
    expect(migration).toContain("total_xp           = 0");
  });

  it("never issues a DELETE or TRUNCATE against user_xp", () => {
    // The whole point of the 🔴 note: a DELETE here would remove the 73 pristine
    // signup rows (37x the target). This must never regress. Checked against
    // executable SQL only (the header prose names the mistake on purpose).
    expect(code).not.toMatch(/DELETE\s+FROM\s+(public\.)?user_xp/i);
    expect(code).not.toMatch(/TRUNCATE\s+(TABLE\s+)?(public\.)?user_xp/i);
  });

  it("ERA-scopes the UPDATE so it can never zero a post-move learner", () => {
    // Round-3 gate catch: the WHERE must gate on the state columns AND carry the
    // era clause. The state chain alone matched EVERY active learner — including
    // valid post-move ones (e.g. the #725 test learner's 1070 XP). The era
    // clause (last_activity_date < 2026-07-21) confines it to stranded rows.
    expect(code).toMatch(/last_activity_date\s+IS\s+NOT\s+NULL/); // state chain
    expect(code).toMatch(
      /UPDATE public\.user_xp[\s\S]*?AND last_activity_date < '2026-07-21'/
    );
  });

  it("verifies no state-bearing row has a NULL activity date (era clause is NULL-blind)", () => {
    // award_xp always stamps last_activity_date, so total_xp>0 with a NULL date
    // is impossible by construction — but the era clause cannot see a NULL, so
    // the migration verifies the claim and aborts if ever violated (else a
    // silent survivor of an irreversible reset). Expect 0.
    expect(migration).toContain("uxp_null_state");
  });

  it("preserves streak_freezes (not in the SET list)", () => {
    // Owner decision: streak_freezes is the earned freeze inventory (0 today),
    // preserved as-is. It must not appear on the left of an assignment.
    expect(code).not.toMatch(/streak_freezes\s*=/);
  });

  it("asserts user_xp row count is unchanged after the reset", () => {
    expect(migration).toMatch(/user_xp must be UPDATED to zero, NEVER deleted/);
  });

  it("ERA-scopes the post-reset assert (live learners may keep state)", () => {
    // Round-3 gate catch: the post-assert must NOT demand universal zeroing (a
    // valid post-move learner would abort the txn). It asserts only that no
    // STRANDED-ERA row (last_activity_date < 2026-07-21) still carries state.
    expect(migration).toMatch(/stranded-era row\(s\) still carry state/);
    expect(migration).not.toMatch(
      /user_xp still has % row\(s\) with non-zero state/
    );
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
