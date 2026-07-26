import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

// #654: the course_changelog table is learner-visible (public SELECT) but
// service_role-only for writes. RLS can't be exercised in unit tests, so — as
// with the #569 review-items guard — pin the security-critical SQL invariants
// in BOTH the migration (what gets applied) and the schema.sql mirror (what new
// environments are built from). A drift between the two is exactly the class of
// bug the #449 IDL memory warns about.

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
  resolve(repoRoot, "supabase/migrations/20260726210000_course_changelog.sql"),
  "utf8"
);
const schema = readFileSync(resolve(repoRoot, "supabase/schema.sql"), "utf8");

for (const [label, sql] of [
  ["migration", migration] as const,
  ["schema.sql", schema] as const,
]) {
  describe(`#654 course_changelog — ${label}`, () => {
    it("enables RLS on the table", () => {
      expect(sql).toContain(
        "ALTER TABLE public.course_changelog ENABLE ROW LEVEL SECURITY"
      );
    });

    it("grants a PUBLIC read policy and NO write policy", () => {
      expect(sql).toContain(
        "ON public.course_changelog FOR SELECT USING (true)"
      );
      // Any INSERT/UPDATE/DELETE/ALL policy would open a client forge path —
      // writes must stay service_role-only (bypasses RLS).
      expect(sql).not.toMatch(
        /ON public\.course_changelog FOR (INSERT|UPDATE|DELETE|ALL)/
      );
    });

    it("dedups on (course_id, kind, tx_signature) so a re-run never double-logs", () => {
      expect(sql).toContain("UNIQUE (course_id, kind, tx_signature)");
    });

    it("constrains kind to the five captured change types", () => {
      for (const kind of [
        "deployed",
        "lessons_added",
        "lessons_removed",
        "xp_changed",
        "content_updated",
      ]) {
        expect(sql).toContain(`'${kind}'`);
      }
    });

    it("uses course_id verbatim (TEXT, PDA-seed convention — never stripped)", () => {
      expect(sql).toMatch(/course_id\s+TEXT NOT NULL/);
    });
  });
}

describe("#654 course_changelog — migration-only guarantees", () => {
  it("runs in one explicit transaction", () => {
    expect(migration).toContain("BEGIN;");
    expect(migration).toContain("COMMIT;");
  });

  it("is idempotent (safe to re-apply)", () => {
    expect(migration).toContain(
      "CREATE TABLE IF NOT EXISTS public.course_changelog"
    );
    expect(migration).toContain(
      "CREATE INDEX IF NOT EXISTS idx_course_changelog_course_created"
    );
    expect(migration).toContain(
      'DROP POLICY IF EXISTS "Course changelog is viewable by everyone"'
    );
  });

  it("ships a rollback that drops what it created", () => {
    expect(migration).toContain("DROP TABLE IF EXISTS public.course_changelog");
  });
});
