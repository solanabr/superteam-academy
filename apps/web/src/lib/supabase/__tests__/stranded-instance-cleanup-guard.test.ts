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

  it("resets the four chain-mirrored tables with straight DELETEs", () => {
    for (const t of [
      "enrollments",
      "user_progress",
      "xp_transactions",
      "user_achievements",
    ]) {
      expect(migration).toContain(`DELETE FROM public.${t};`);
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

  it("scopes the UPDATE so it can only touch rows with state (idempotent)", () => {
    // WHERE must gate on the state columns so it hits exactly the 2 active rows
    // now and 0 rows on re-apply — never the 73 pristine zeros.
    expect(migration).toMatch(
      /WHERE\s+total_xp\s*>\s*0[\s\S]*last_activity_date\s+IS\s+NOT\s+NULL/
    );
  });

  it("preserves streak_freezes (not in the SET list)", () => {
    // Owner decision: streak_freezes is the earned freeze inventory (0 today),
    // preserved as-is. It must not appear on the left of an assignment.
    expect(code).not.toMatch(/streak_freezes\s*=/);
  });

  it("asserts user_xp row count is unchanged after the reset", () => {
    expect(migration).toMatch(/user_xp must be UPDATED to zero, NEVER deleted/);
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

  it("asserts profiles, auth.users and certificates are unchanged at COMMIT", () => {
    expect(migration).toMatch(/this migration must never touch profiles/);
    expect(migration).toMatch(/must never touch auth users/);
    expect(migration).toMatch(/certificates is EXCLUDED from this cleanup/);
  });

  it("pins the posted dry-run baseline so it fails on drift", () => {
    expect(migration).toContain("b.profiles <> 75");
    expect(migration).toContain("b.user_xp <> 75");
    expect(migration).toContain("b.certificates <> 4");
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
