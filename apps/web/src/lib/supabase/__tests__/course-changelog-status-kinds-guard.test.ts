import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

// #738: the status/recreate kinds migration widens course_changelog.kind's CHECK
// so deactivate/reactivate/recreate can record. RLS can't be exercised in unit
// tests, so pin the SQL invariants in BOTH the migration (what gets applied) and
// the schema.sql mirror (the snapshot new environments are built from).

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
    "supabase/migrations/20260726220000_course_changelog_status_kinds.sql"
  ),
  "utf8"
);
const schema = readFileSync(resolve(repoRoot, "supabase/schema.sql"), "utf8");

const NEW_KINDS = ["deactivated", "reactivated", "recreated"] as const;
const ALL_KINDS = [
  "deployed",
  "lessons_added",
  "lessons_removed",
  "xp_changed",
  "content_updated",
  "deactivated",
  "reactivated",
  "recreated",
] as const;

describe("#738 course_changelog status kinds — migration", () => {
  it("swaps the kind CHECK constraint idempotently (DROP IF EXISTS then ADD)", () => {
    expect(migration).toContain(
      "DROP CONSTRAINT IF EXISTS course_changelog_kind_check"
    );
    expect(migration).toContain(
      "ADD CONSTRAINT course_changelog_kind_check CHECK (kind IN ("
    );
  });

  it("lists all eight kinds in the new CHECK", () => {
    for (const kind of ALL_KINDS) {
      expect(migration).toContain(`'${kind}'`);
    }
  });

  it("runs in one explicit transaction", () => {
    expect(migration).toContain("BEGIN;");
    expect(migration).toContain("COMMIT;");
  });

  it("ships a rollback that restores the five-kind CHECK", () => {
    // The rollback block (commented) must re-add the constraint WITHOUT the new
    // kinds — i.e. it drops the same constraint and re-adds the #654 five.
    const rollback = migration.slice(migration.indexOf("-- ROLLBACK ("));
    expect(rollback).toContain("course_changelog_kind_check");
    for (const kind of NEW_KINDS) {
      // The new kinds must NOT appear in the rollback's re-added CHECK.
      expect(rollback).not.toContain(`'${kind}'`);
    }
  });
});

describe("#738 course_changelog status kinds — schema.sql mirror", () => {
  it("the inline kind CHECK lists all eight kinds", () => {
    // The snapshot table definition carries the final CHECK directly (no ALTER).
    const start = schema.indexOf(
      "CREATE TABLE IF NOT EXISTS public.course_changelog"
    );
    expect(start).toBeGreaterThan(-1);
    const table = schema.slice(start, schema.indexOf(");", start));
    for (const kind of ALL_KINDS) {
      expect(table).toContain(`'${kind}'`);
    }
  });
});
