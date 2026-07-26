import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

// #591 (AI tutor spend caps): the ai_spend_ledger substrate. RLS cannot be
// exercised in unit tests, so — as with the #569 review-spine guard — pin the
// security-critical SQL invariants in BOTH the migration and the schema.sql
// mirror:
//   * ai_spend_ledger has RLS on and NO policies (reached only via the
//     SECURITY DEFINER RPCs called by service_role) — the challenge_assists /
//     award_xp pattern, the money surface's fail-closed lock.
//   * all three RPCs are SECURITY DEFINER, search_path-pinned, REVOKEd from
//     clients, GRANTed only to service_role.
//   * daily windows are America/Sao_Paulo (AIE-21), and money is integer
//     micro-USD (BIGINT), never float dollars.

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
  resolve(repoRoot, "supabase/migrations/20260726180000_ai_spend_ledger.sql"),
  "utf8"
);
const schema = readFileSync(resolve(repoRoot, "supabase/schema.sql"), "utf8");

const RPCS: ReadonlyArray<[string, string]> = [
  ["record_ai_spend", "(UUID, TEXT, BIGINT)"],
  ["check_ai_spend", "(UUID, TEXT)"],
  ["get_ai_spend_today", "()"],
];

// The invariants must hold in the migration (what gets applied) AND in
// schema.sql (the snapshot fresh environments are built from) — a drift between
// them is the exact class of bug the #449 IDL memory warns about.
for (const [label, sql] of [
  ["migration", migration] as const,
  ["schema.sql", schema] as const,
]) {
  describe(`#591 ai_spend_ledger — ${label}`, () => {
    it("creates the ledger table with an integer micro-USD money column", () => {
      expect(sql).toContain("CREATE TABLE IF NOT EXISTS ai_spend_ledger");
      expect(sql).toContain("micro_usd     BIGINT NOT NULL DEFAULT 0");
    });

    it("constrains scope to the three known dimensions", () => {
      expect(sql).toContain("CHECK (scope IN ('account', 'ip', 'global'))");
    });

    it("enables RLS and defines NO policy (RPC-only write/read path)", () => {
      expect(sql).toContain(
        "ALTER TABLE ai_spend_ledger ENABLE ROW LEVEL SECURITY"
      );
      // Any policy on this table would open a path around the SECURITY DEFINER
      // RPCs — the money surface must be reachable only by service_role.
      expect(sql).not.toMatch(
        /ON ai_spend_ledger FOR (SELECT|INSERT|UPDATE|DELETE|ALL)/
      );
    });

    it("hardens every RPC (SECURITY DEFINER, pinned path, service_role only)", () => {
      for (const [fn, args] of RPCS) {
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

    it("windows all daily reads/writes on America/Sao_Paulo days (AIE-21)", () => {
      // No UTC/naive date bucket — every day boundary is the SP calendar day.
      expect(sql).toContain("(now() AT TIME ZONE 'America/Sao_Paulo')::date");
      expect(sql).not.toMatch(/spend_day\s*=\s*(CURRENT_DATE|now\(\)::date)/);
    });

    it("clamps recorded spend to non-negative (never credits)", () => {
      expect(sql).toContain("GREATEST(COALESCE(p_micro_usd, 0), 0)");
    });
  });
}

describe("#591 ai_spend_ledger — migration-only guarantees", () => {
  it("runs in one explicit transaction", () => {
    expect(migration).toContain("BEGIN;");
    expect(migration).toContain("COMMIT;");
  });

  it("ships a rollback that drops exactly what it created", () => {
    expect(migration).toContain(
      "DROP FUNCTION IF EXISTS public.get_ai_spend_today();"
    );
    expect(migration).toContain(
      "DROP FUNCTION IF EXISTS public.check_ai_spend(UUID, TEXT);"
    );
    expect(migration).toContain(
      "DROP FUNCTION IF EXISTS public.record_ai_spend(UUID, TEXT, BIGINT);"
    );
    expect(migration).toContain("DROP TABLE IF EXISTS public.ai_spend_ledger;");
  });
});
