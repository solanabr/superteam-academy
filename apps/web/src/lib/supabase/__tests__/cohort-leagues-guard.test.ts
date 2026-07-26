import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

// #574 (LX-B9b): cohort leagues. RLS/SECURITY-DEFINER invariants cannot be
// exercised in unit tests, so — as with the #569 review guard — pin the
// security-critical SQL in BOTH the migration (what gets applied) AND the
// schema.sql mirror (what new environments build from). A drift between them is
// the #449-class bug this guard exists to catch.

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
  resolve(repoRoot, "supabase/migrations/20260726200000_cohort_leagues.sql"),
  "utf8"
);
const schema = readFileSync(resolve(repoRoot, "supabase/schema.sql"), "utf8");

// Every read RPC is SECURITY DEFINER + search_path-pinned + REVOKEd from clients
// + GRANTed only to service_role. The two write-ish helpers (assign + refresh)
// are the same. is_league_eligible_source / league_week_start are IMMUTABLE
// helpers, REVOKEd from clients (never PostgREST-exposed).
const SERVICE_ROLE_FNS: ReadonlyArray<[string, string]> = [
  ["ensure_league_membership", "(UUID)"],
  ["refresh_cohort_scores", "(UUID)"],
  ["get_cohort_leaderboard", "(UUID)"],
];

for (const [label, sql] of [
  ["migration", migration] as const,
  ["schema.sql", schema] as const,
]) {
  describe(`#574 cohort leagues — ${label}`, () => {
    it("enables RLS on all three league tables", () => {
      expect(sql).toContain(
        "ALTER TABLE league_tiers ENABLE ROW LEVEL SECURITY"
      );
      expect(sql).toContain(
        "ALTER TABLE league_cohorts ENABLE ROW LEVEL SECURITY"
      );
      expect(sql).toContain(
        "ALTER TABLE league_members ENABLE ROW LEVEL SECURITY"
      );
    });

    it("league_members: own-row SELECT only, NO write/cross-user policy", () => {
      expect(sql).toContain(
        `ON league_members FOR SELECT USING (auth.uid() = user_id)`
      );
      // Any other policy would open a client path around the RPCs or leak the
      // cohort (spec: cross-user exposure only via SECURITY DEFINER RPCs).
      expect(sql).not.toMatch(
        /ON league_members FOR (INSERT|UPDATE|DELETE|ALL)/
      );
      expect(sql).not.toMatch(/ON league_members FOR SELECT USING \(true\)/);
    });

    it("league_cohorts has NO policy at all — RPC-only exposure", () => {
      // A cohort row is only ever read through the SECURITY DEFINER RPCs. Any
      // policy here (even SELECT) would be a broad public read path the spec
      // forbids ("league tables themselves: no broad public SELECT policy").
      expect(sql).not.toMatch(/ON league_cohorts FOR /);
    });

    it("league_tiers is public-read reference data — NO client write path", () => {
      expect(sql).toContain(`ON league_tiers FOR SELECT USING (true)`);
      expect(sql).not.toMatch(/ON league_tiers FOR (INSERT|UPDATE|DELETE|ALL)/);
    });

    it("one membership per learner per week (UNIQUE guard)", () => {
      expect(sql).toContain("UNIQUE (user_id, week_start)");
    });

    it("cascades league rows on profile/cohort deletion", () => {
      expect(sql).toContain(
        "cohort_id  UUID NOT NULL REFERENCES league_cohorts(id) ON DELETE CASCADE"
      );
      expect(sql).toContain(
        "user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE"
      );
    });

    it("hardens every league function (SECURITY DEFINER path-pinned, service_role only)", () => {
      for (const [fn, args] of SERVICE_ROLE_FNS) {
        const start = sql.indexOf(`CREATE OR REPLACE FUNCTION public.${fn}(`);
        expect(start, `${fn} defined`).toBeGreaterThan(-1);
        // Whitespace-normalized so the assertions are insensitive to the
        // REVOKE/GRANT line wrapping.
        const grantIdx = sql.indexOf(
          `GRANT EXECUTE ON FUNCTION public.${fn}${args} TO service_role`,
          start
        );
        expect(grantIdx, `${fn} granted`).toBeGreaterThan(start);
        const body = sql.slice(start, grantIdx + 120).replace(/\s+/g, " ");
        expect(body).toContain("SECURITY DEFINER");
        expect(body).toContain("SET search_path = ''");
        expect(body).toContain(
          `REVOKE ALL ON FUNCTION public.${fn}${args} FROM PUBLIC, anon, authenticated`
        );
        expect(body).toContain(
          `GRANT EXECUTE ON FUNCTION public.${fn}${args} TO service_role`
        );
      }
    });

    it("IMMUTABLE helpers are REVOKEd from clients (never PostgREST-exposed)", () => {
      expect(sql).toContain(
        "REVOKE EXECUTE ON FUNCTION public.is_league_eligible_source(TEXT)"
      );
      expect(sql).toContain(
        "REVOKE EXECUTE ON FUNCTION public.league_week_start(DATE)"
      );
    });

    it("league score counts ONLY the learning-source allowlist", () => {
      // The server-written allowlist the #574 review notes required — creator/
      // community/platform (surprise_bonus + arbitrary memos) are EXCLUDED so
      // they never become competitive currency.
      expect(sql).toContain(
        "SELECT p_source IN ('lesson', 'course_completion', 'quest', 'achievement')"
      );
      // Scoring/assignment filter through the source allowlist, never free-text
      // reasons — the score/assignment SUMs gate on is_league_eligible_source,
      // not a reason LIKE (which is the excluded xp_source_for_reason path).
      expect(sql).toMatch(/is_league_eligible_source\(x\.source\)/);
      expect(sql).not.toMatch(/x\.reason LIKE/);
    });

    it("snapshot scoring: the board RPC never SUMs xp_transactions per call", () => {
      // The ONLY SUM over xp_transactions for scoring lives in
      // refresh_cohort_scores (throttled). The board RPC reads stored scores —
      // extending the SUM-per-call pattern is exactly what the spec forbids.
      const refreshStart = sql.indexOf(
        "CREATE OR REPLACE FUNCTION public.refresh_cohort_scores"
      );
      const boardStart = sql.indexOf(
        "CREATE OR REPLACE FUNCTION public.get_cohort_leaderboard"
      );
      const boardBody = sql.slice(boardStart, sql.indexOf("$$;", boardStart));
      expect(refreshStart).toBeGreaterThan(-1);
      expect(boardBody).not.toMatch(/SUM\(x\.amount\)/);
      expect(boardBody).toContain("public.refresh_cohort_scores");
    });

    it("refresh is throttled + row-locked so bursts collapse to one recompute", () => {
      expect(sql).toContain("LEAGUE_REFRESH_THROTTLE CONSTANT INTERVAL");
      expect(sql).toMatch(
        /FROM public\.league_cohorts\s+WHERE id = p_cohort_id\s+FOR UPDATE;/
      );
      expect(sql).toContain("now() - LEAGUE_REFRESH_THROTTLE");
    });

    it("private/deleted members are anonymized via LEFT JOIN, never dropped", () => {
      // public_profiles already filters is_public + not-deleted; the LEFT JOIN
      // keeps private members in the cohort with NULL identity (UI shows
      // "Anonymous learner"). An inner join would silently drop them and break
      // a ~30-person cohort.
      expect(sql).toContain(
        "LEFT JOIN public.public_profiles pp ON pp.id = m.user_id"
      );
      expect(sql).not.toMatch(/\n  JOIN public\.public_profiles/);
    });

    it("cohort capacity is the ~30 Duolingo shape", () => {
      expect(sql).toContain("LEAGUE_COHORT_CAPACITY CONSTANT INTEGER := 30");
    });

    it("assignment is engagement-matched on PRIOR-week league XP", () => {
      expect(sql).toContain("v_prior_start := v_week_start - 7");
      expect(sql).toContain("t.min_prior_week_xp <= v_prior_xp");
    });

    it("weekly reset is Monday-anchored", () => {
      expect(sql).toContain("date_trunc('week', p_date::timestamp)");
    });
  });
}

describe("#574 cohort leagues — migration-only guarantees", () => {
  it("runs in one explicit transaction", () => {
    expect(migration).toContain("BEGIN;");
    expect(migration).toContain("COMMIT;");
  });

  it("seeds the four engagement tiers idempotently", () => {
    expect(migration).toContain(
      "INSERT INTO league_tiers (tier, min_prior_week_xp) VALUES"
    );
    for (const row of ["(1, 0)", "(2, 100)", "(3, 500)", "(4, 2000)"]) {
      expect(migration).toContain(row);
    }
    expect(migration).toContain("ON CONFLICT (tier) DO NOTHING");
  });

  it("lazy assignment is race-safe: only a genuine insert bumps member_count", () => {
    // ON CONFLICT DO NOTHING RETURNING guards the double-count; a lost race
    // re-reads the winner's cohort without incrementing.
    expect(migration).toContain(
      "ON CONFLICT (user_id, week_start) DO NOTHING\n  RETURNING cohort_id INTO v_inserted_cohort"
    );
    expect(migration).toContain("IF v_inserted_cohort IS NOT NULL THEN");
    // A chosen cohort is locked with SKIP LOCKED so concurrent assigners never
    // overfill it.
    expect(migration).toContain("FOR UPDATE SKIP LOCKED");
  });

  it("ships a rollback that drops exactly what it created (FK order)", () => {
    expect(migration).toContain(
      "DROP FUNCTION IF EXISTS public.get_cohort_leaderboard(UUID)"
    );
    expect(migration).toContain("DROP TABLE IF EXISTS public.league_members");
    expect(migration).toContain("DROP TABLE IF EXISTS public.league_cohorts");
    expect(migration).toContain("DROP TABLE IF EXISTS public.league_tiers");
  });
});
