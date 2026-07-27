import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

// #566 (LX-A3): the /start intake adds segment/goal/daily_goal to profiles.
// RLS/trigger invariants can't be exercised in unit tests, so — as with the
// #493 profile guard and #569 review spine — pin them in both the migration and
// the schema.sql mirror. The load-bearing security property is NEGATIVE: the
// segment migration must not touch the profiles escalation lockdown.
//
// #699 CORRECTION: profiles.role was RETIRED by SP1 (migration 20260710120000);
// prod has no role column/trigger. The previous assertion here pinned the
// retired role trigger in schema.sql — green while guarding nothing. It now
// pins the DEPLOYED wallet lockdown and asserts the role machinery is ABSENT
// from the mirror (so the snapshot matches prod).

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
    "supabase/migrations/20260726150000_add_profiles_segment_state.sql"
  ),
  "utf8"
);
const schema = readFileSync(resolve(repoRoot, "supabase/schema.sql"), "utf8");

describe("#566 segment state — escalation lockdown mirror (role retired, wallet lock present)", () => {
  it("the migration issues NO DDL against role or any trigger", () => {
    // The segment migration must not emit a single statement that redefines,
    // drops, or fires a profiles trigger — nor touch the (now-retired) role
    // column. Prose mentions are fine; DDL/DML is not. Still a valid guard: the
    // migration applied cleanly against a DB where role was already gone.
    expect(migration).not.toMatch(
      /CREATE\s+(OR\s+REPLACE\s+)?FUNCTION[^;]*enforce_profile_role_write/i
    );
    expect(migration).not.toMatch(/(CREATE|DROP|ALTER)\s+TRIGGER/i);
    expect(migration).not.toMatch(/ALTER\s+COLUMN\s+role\b/i);
    expect(migration).not.toMatch(/DROP\s+COLUMN\s+(IF\s+EXISTS\s+)?role\b/i);
    expect(migration).not.toMatch(/UPDATE\s+profiles\s+SET\s+role/i);
  });

  it("schema.sql mirrors the DEPLOYED wallet lockdown and NOT the retired role machinery (#699)", () => {
    // The surviving profiles escalation guard is the wallet-write lock — pin it.
    const walletTriggers = schema.match(
      /CREATE TRIGGER trg_enforce_profile_wallet_write/g
    );
    expect(walletTriggers).toHaveLength(1);
    expect(schema).toContain(
      "CREATE OR REPLACE FUNCTION public.enforce_profile_wallet_write()"
    );
    expect(schema).toContain(
      "NEW.wallet_address IS DISTINCT FROM OLD.wallet_address"
    );
    // The retired role machinery must be ABSENT from the mirror (matches prod).
    // Check for the DDL, not the string — explanatory prose may name it.
    expect(schema).not.toContain(
      "CREATE OR REPLACE FUNCTION public.enforce_profile_role_write()"
    );
    expect(schema).not.toContain(
      "CREATE TRIGGER trg_enforce_profile_role_write"
    );
    expect(schema).not.toMatch(/ADD CONSTRAINT chk_profiles_role\b/);
    expect(schema).not.toMatch(/^\s*role TEXT NOT NULL DEFAULT/m);
  });
});

// The three columns and their bounds must hold in the migration (what applies)
// AND in schema.sql (the snapshot new environments build from) — drift between
// them is the #449-class bug.
for (const [label, sql] of [
  ["migration", migration] as const,
  ["schema.sql", schema] as const,
]) {
  describe(`#566 segment state — ${label}`, () => {
    it("adds exactly the three intake columns", () => {
      for (const col of ["segment", "goal", "daily_goal"]) {
        expect(sql).toMatch(new RegExp(`\\b${col}\\b`));
      }
    });

    it("bounds each column with a CHECK (1|2|3, closed goal set, positive goal)", () => {
      expect(sql).toContain("chk_profiles_segment");
      expect(sql).toMatch(/segment IN \(1, 2, 3\)/);
      expect(sql).toContain("chk_profiles_goal");
      expect(sql).toMatch(/goal IN \('job', 'build', 'explore'\)/);
      expect(sql).toContain("chk_profiles_daily_goal");
      // Bounded on both ends (F3): a positive floor and a sane cap.
      expect(sql).toMatch(/daily_goal BETWEEN 1 AND 20/);
    });

    it("adds NO new RLS policy — the existing own-row UPDATE governs the columns", () => {
      // A new UPDATE policy on profiles from this change would be a red flag:
      // RLS can't column-scope, and the existing own-row policy already applies.
      // (schema.sql has the pre-existing profiles policies; the migration must
      // introduce none.)
      if (label === "migration") {
        expect(sql).not.toMatch(/CREATE POLICY[\s\S]*ON profiles/);
      }
    });
  });
}

describe("#566 segment state — migration hygiene", () => {
  it("runs in one explicit transaction", () => {
    expect(migration).toContain("BEGIN;");
    expect(migration).toContain("COMMIT;");
  });

  it("is idempotent (ADD COLUMN IF NOT EXISTS + pg_constraint-guarded CHECKs)", () => {
    expect(migration).toMatch(/ADD COLUMN IF NOT EXISTS segment SMALLINT/);
    expect(migration).toMatch(/ADD COLUMN IF NOT EXISTS goal TEXT/);
    expect(migration).toMatch(/ADD COLUMN IF NOT EXISTS daily_goal SMALLINT/);
    // Each CHECK add is guarded by a pg_constraint existence probe.
    const guards = migration.match(/FROM pg_constraint/g);
    expect(guards).not.toBeNull();
    expect(guards!.length).toBe(3);
  });

  it("ships a rollback that drops exactly the three columns", () => {
    for (const col of ["segment", "goal", "daily_goal"]) {
      expect(migration).toContain(`DROP COLUMN IF EXISTS ${col}`);
    }
  });
});
