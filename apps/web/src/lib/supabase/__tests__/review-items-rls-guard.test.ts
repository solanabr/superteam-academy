import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

// #569 (LX-B3): the review spine substrate. RLS cannot be exercised in unit
// tests, so — as with the #493 profile guard — pin the security-critical SQL
// invariants in both the migration and the schema.sql mirror:
//   * review_items has RLS on, an own-row SELECT policy, and NO write policy
//     (writes only via SECURITY DEFINER RPCs) — the challenge_assists pattern.
//   * both write RPCs are SECURITY DEFINER, search_path-pinned, REVOKEd from
//     clients, GRANTed only to service_role.
//   * the 1/3/7/21 schedule lives as review_schedule ROWS, and the transition
//     RPCs read intervals from it (never a hardcoded day count in the body).

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
    "supabase/migrations/20260726140000_review_items_spaced_repetition.sql"
  ),
  "utf8"
);
const schema = readFileSync(resolve(repoRoot, "supabase/schema.sql"), "utf8");

const WRITE_RPCS: ReadonlyArray<[string, string]> = [
  ["schedule_review_item", "(UUID, TEXT)"],
  ["record_review_result", "(UUID, TEXT, BOOLEAN)"],
];

// The security invariants must hold in the migration (what gets applied) AND in
// schema.sql (the snapshot new environments are built from) — a drift between
// them is exactly the class of bug the #449 IDL memory warns about.
for (const [label, sql] of [
  ["migration", migration] as const,
  ["schema.sql", schema] as const,
]) {
  describe(`#569 review spine — ${label}`, () => {
    it("enables RLS on both review tables", () => {
      expect(sql).toContain(
        "ALTER TABLE review_items ENABLE ROW LEVEL SECURITY"
      );
      expect(sql).toContain(
        "ALTER TABLE review_schedule ENABLE ROW LEVEL SECURITY"
      );
    });

    it("gives review_items an own-row SELECT policy and NO write policy", () => {
      expect(sql).toContain(
        `ON review_items FOR SELECT USING (auth.uid() = user_id)`
      );
      // The only policy on review_items is the SELECT one. Any INSERT/UPDATE/
      // DELETE policy would open a client write path around the RPCs.
      expect(sql).not.toMatch(/ON review_items FOR (INSERT|UPDATE|DELETE|ALL)/);
    });

    it("gives review_schedule a read-only policy — NO client write path", () => {
      // Reference data: public read, but writes only via DDL / service_role.
      // A write policy here would let a client rewrite everyone's spacing.
      expect(sql).toContain(`ON review_schedule FOR SELECT USING (true)`);
      expect(sql).not.toMatch(
        /ON review_schedule FOR (INSERT|UPDATE|DELETE|ALL)/
      );
    });

    it("item_key is the raw lesson id — no skill column (bundle resolves skills)", () => {
      const start = sql.indexOf("CREATE TABLE IF NOT EXISTS review_items");
      expect(start).toBeGreaterThan(-1);
      // Column definitions only — strip `-- …` comments so the "no skill column"
      // prose doesn't read as a skill column.
      const table = sql
        .slice(start, sql.indexOf(");", start))
        .replace(/--[^\n]*/g, "");
      expect(table).toContain("item_key");
      expect(table).not.toMatch(/\bskill\b/i);
    });

    it("cascades review_items on profile deletion", () => {
      expect(sql).toContain(
        "user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE"
      );
    });

    it("stores the 1/3/7/21 schedule AS DATA rows", () => {
      expect(sql).toContain("CREATE TABLE IF NOT EXISTS review_schedule");
      for (const row of ["(1, 1)", "(2, 3)", "(3, 7)", "(4, 21)"]) {
        expect(sql).toContain(row);
      }
    });

    it("hardens every write RPC (SECURITY DEFINER, pinned path, service_role only)", () => {
      for (const [fn, args] of WRITE_RPCS) {
        const start = sql.indexOf(`CREATE OR REPLACE FUNCTION ${fn}(`);
        expect(start, `${fn} defined`).toBeGreaterThan(-1);
        const body = sql.slice(
          start,
          sql.indexOf("GRANT EXECUTE", start) + 200
        );
        expect(body).toContain("SECURITY DEFINER");
        expect(body).toContain("SET search_path = ''");
        expect(body).toContain(
          `REVOKE ALL ON FUNCTION ${fn}${args} FROM PUBLIC, anon, authenticated`
        );
        expect(body).toContain(
          `GRANT EXECUTE ON FUNCTION ${fn}${args} TO service_role`
        );
      }
    });

    it("computes intervals from the schedule, never a hardcoded day count", () => {
      // The transition bodies must read interval_days from review_schedule.
      expect(sql).toContain(
        "SELECT interval_days INTO v_interval\n    FROM public.review_schedule"
      );
      // No literal review interval baked into a make_interval/now() expression.
      expect(sql).not.toMatch(/make_interval\(days => (1|3|7|21)\b/);
      expect(sql).not.toMatch(/now\(\) \+ interval '(1|3|7|21) day/);
    });
  });
}

describe("#569 review spine — migration-only guarantees", () => {
  it("runs in one explicit transaction", () => {
    expect(migration).toContain("BEGIN;");
    expect(migration).toContain("COMMIT;");
  });

  it("seeds review items from completed lessons, idempotently", () => {
    expect(migration).toContain("FROM user_progress up");
    expect(migration).toContain("WHERE up.completed = true");
    expect(migration).toContain("ON CONFLICT (user_id, item_key) DO NOTHING");
  });

  it("documents the seed's FK-safety argument", () => {
    // The seed cannot abort on an orphan because user_progress.user_id is
    // itself FK'd to profiles(id) — the reasoning must stay recorded next to
    // the INSERT so a future edit doesn't drop the invariant unknowingly.
    expect(migration).toMatch(/FK-safety:[\s\S]*user_progress\.user_id/);
  });

  it("advances the box atomically — no separate current-box read", () => {
    // The transition must derive the new box from the row's own value inside a
    // single UPDATE (LEAST(ri.box + 1, …)), never a standalone SELECT of box
    // that a concurrent grade could double-read.
    expect(migration).toContain("LEAST(ri.box + 1, v_max_box)");
    expect(migration).not.toMatch(/v_new_box\s*:=\s*LEAST\(\s*\(SELECT/);
  });

  it("ships a rollback that drops exactly what it created", () => {
    expect(migration).toContain(
      "DROP FUNCTION IF EXISTS public.record_review_result(UUID, TEXT, BOOLEAN)"
    );
    expect(migration).toContain(
      "DROP FUNCTION IF EXISTS public.schedule_review_item(UUID, TEXT)"
    );
    expect(migration).toContain("DROP TABLE IF EXISTS public.review_items");
    expect(migration).toContain("DROP TABLE IF EXISTS public.review_schedule");
  });
});
