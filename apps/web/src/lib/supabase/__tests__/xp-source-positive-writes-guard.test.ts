import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

// #736: xp_transactions.source must be written POSITIVELY by award_xp's callers,
// not reverse-derived from the memo prefix (an authority-supplied XpRewarded memo
// shaped as "Completed lesson: …" would otherwise launder into a league-eligible
// source). PL/pgSQL can't run in unit tests, so pin the SQL invariants in both
// the migration (what applies) and the schema.sql mirror.

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
    "supabase/migrations/20260727120000_xp_source_positive_writes.sql"
  ),
  "utf8"
);
const schema = readFileSync(resolve(repoRoot, "supabase/schema.sql"), "utf8");

function awardXpDef(sql: string): string {
  const start = sql.indexOf("CREATE OR REPLACE FUNCTION award_xp(");
  expect(start, "award_xp defined").toBeGreaterThan(-1);
  return sql.slice(start, sql.indexOf("$$;", start));
}

for (const [label, sql] of [
  ["migration", migration] as const,
  ["schema.sql", schema] as const,
]) {
  describe(`#736 positive source — ${label}`, () => {
    it("award_xp takes an explicit p_source parameter (defaulting to NULL)", () => {
      const def = awardXpDef(sql);
      expect(def).toMatch(/p_source TEXT DEFAULT NULL/);
    });

    it("source is positive-with-fallback: COALESCE(p_source, derivation)", () => {
      const def = awardXpDef(sql);
      expect(def).toContain(
        "COALESCE(p_source, public.xp_source_for_reason(p_reason))"
      );
      // The bare reverse-derivation must be gone from the go-forward body.
      expect(def).not.toMatch(
        /v_source\s*:=\s*public\.xp_source_for_reason\(p_reason\)\s*;/
      );
    });
  });
}

describe("#736 positive source — migration hygiene", () => {
  it("runs in one explicit transaction", () => {
    expect(migration).toContain("BEGIN;");
    expect(migration).toContain("COMMIT;");
  });

  it("drops the 5-arg signature before creating the 6-arg one (no overload)", () => {
    expect(migration).toContain(
      "DROP FUNCTION IF EXISTS award_xp(UUID, INTEGER, TEXT, TEXT, TEXT);"
    );
    // The applied CREATE carries the new 6th parameter.
    const applied = migration.slice(0, migration.indexOf("COMMIT;"));
    expect(applied).toMatch(/p_source TEXT DEFAULT NULL/);
  });

  it("documents the HARD dependency on 190000's bodies (next_streak_value)", () => {
    // award_xp's body calls next_streak_value (added by 190000); applying this
    // before those bodies breaks every award. The header must say so.
    expect(migration).toMatch(/APPLY AFTER 20260726190000_streak_forgiveness/);
    expect(migration).toContain("next_streak_value");
  });

  it("ships a SELF-CONTAINED rollback (inline body, no cross-file re-apply)", () => {
    expect(migration).toContain(
      "DROP FUNCTION IF EXISTS award_xp(UUID, INTEGER, TEXT, TEXT, TEXT, TEXT);"
    );
    // The rollback restores the prior 5-arg body inline (commented), with the
    // bare reverse-derivation — proof it is the pre-#736 body, not a reference.
    expect(migration).toMatch(
      /--\s+v_source := public\.xp_source_for_reason\(p_reason\);/
    );
    expect(migration).not.toMatch(/re-apply .*migration/i);
  });

  it("re-hardens grants on the recreated function", () => {
    expect(migration).toContain(
      "REVOKE EXECUTE ON FUNCTION award_xp FROM authenticated, anon, public;"
    );
    expect(migration).toContain(
      "GRANT EXECUTE ON FUNCTION award_xp TO service_role;"
    );
  });
});
