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

    it("scopes SELECT to synced+active courses — NOT a blanket USING (true)", () => {
      // MINOR-1: a blanket public read would let any anon PostgREST caller
      // enumerate title history for a hidden/deactivated course. The policy must
      // fail closed, gating on the catalog's own visibility state (isSynced).
      expect(sql).toContain("ON public.course_changelog FOR SELECT");
      // Mutation: reverting to `USING (true)` must break this guard.
      expect(sql).not.toMatch(/course_changelog FOR SELECT USING \(true\)/);
      // The EXISTS gates on the anon-readable deployments VIEW with the exact
      // isSynced predicate (status = 'synced' AND coalesce(is_active, true)).
      expect(sql).toContain("FROM public.public_onchain_deployments d");
      expect(sql).toContain("d.content_id = course_changelog.course_id");
      expect(sql).toMatch(/d\.status\s*=\s*'synced'/);
      expect(sql).toMatch(/COALESCE\(d\.is_active,\s*true\)/);
    });

    it("keeps writes service_role-only — NO write policy", () => {
      // Any INSERT/UPDATE/DELETE/ALL policy would open a client forge path.
      expect(sql).not.toMatch(
        /ON public\.course_changelog FOR (INSERT|UPDATE|DELETE|ALL)/
      );
    });

    it("dedups on (course_id, kind, tx_signature) with a NOT NULL signature", () => {
      expect(sql).toContain("UNIQUE (course_id, kind, tx_signature)");
      // MINOR-2: a nullable tx_signature would silently defeat the UNIQUE
      // (Postgres treats NULLs as distinct), so it must be NOT NULL.
      expect(sql).toMatch(/tx_signature\s+TEXT NOT NULL/);
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
      'DROP POLICY IF EXISTS "Course changelog visible for synced-active courses"'
    );
  });

  it("ships a rollback that drops what it created", () => {
    expect(migration).toContain("DROP TABLE IF EXISTS public.course_changelog");
  });
});
