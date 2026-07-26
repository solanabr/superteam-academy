import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

// #582 (LX-A6): the if-then plan adds a self-writable `prefs` JSONB to profiles.
// RLS/constraint invariants can't be exercised in unit tests, so — as with the
// #566 segment guard and #569 review spine — pin them in both the migration and
// the schema.sql mirror. The load-bearing property here is that the ONLY bound
// on this self-write is the shape+size CHECK (no profiles column is
// privilege-bearing), so the CHECK must exist in what applies AND in the
// snapshot new environments build from.

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
    "supabase/migrations/20260726160000_add_profiles_prefs.sql"
  ),
  "utf8"
);
const schema = readFileSync(resolve(repoRoot, "supabase/schema.sql"), "utf8");

// The bound must hold in the migration (what applies) AND in schema.sql (the
// snapshot new environments build from) — drift between them is the #449-class
// bug.
for (const [label, sql] of [
  ["migration", migration] as const,
  ["schema.sql", schema] as const,
]) {
  describe(`#582 prefs bound — ${label}`, () => {
    it("adds the prefs column", () => {
      expect(sql).toMatch(/\bprefs\b/);
    });

    it("bounds prefs on shape (must be a JSON object)", () => {
      expect(sql).toContain("chk_profiles_prefs_object");
      expect(sql).toMatch(/jsonb_typeof\(prefs\) = 'object'/);
    });

    it("bounds prefs on size (<= 2 KB)", () => {
      expect(sql).toContain("chk_profiles_prefs_size");
      expect(sql).toMatch(/pg_column_size\(prefs\) <= 2048/);
    });
  });
}

describe("#582 prefs bound — role lockdown undisturbed", () => {
  it("the migration issues NO DDL against the role column, trigger, or function", () => {
    // prefs is self-writable, so — like #566 — the migration must not redefine,
    // drop, or fire the role escalation-lockdown trigger, nor touch the role
    // column. Prose mentions (documenting that it is untouched) are fine.
    expect(migration).not.toMatch(
      /CREATE\s+(OR\s+REPLACE\s+)?FUNCTION[^;]*enforce_profile_role_write/i
    );
    expect(migration).not.toMatch(/(CREATE|DROP|ALTER)\s+TRIGGER/i);
    expect(migration).not.toMatch(/ALTER\s+COLUMN\s+role\b/i);
    expect(migration).not.toMatch(/DROP\s+COLUMN\s+(IF\s+EXISTS\s+)?role\b/i);
    expect(migration).not.toMatch(/UPDATE\s+profiles\s+SET\s+role/i);
  });

  it("adds NO new RLS policy — the existing own-row UPDATE governs prefs", () => {
    expect(migration).not.toMatch(/CREATE POLICY[\s\S]*ON profiles/);
  });
});

describe("#582 prefs bound — migration hygiene", () => {
  it("runs in one explicit transaction", () => {
    expect(migration).toContain("BEGIN;");
    expect(migration).toContain("COMMIT;");
  });

  it("is idempotent (ADD COLUMN IF NOT EXISTS + pg_constraint-guarded CHECKs)", () => {
    expect(migration).toMatch(/ADD COLUMN IF NOT EXISTS prefs JSONB/);
    // Each CHECK add is guarded by a pg_constraint existence probe.
    const guards = migration.match(/FROM pg_constraint/g);
    expect(guards).not.toBeNull();
    expect(guards!.length).toBe(2);
  });

  it("ships a rollback that drops the prefs column (and its CHECKs with it)", () => {
    expect(migration).toContain("DROP COLUMN IF EXISTS prefs");
  });
});
