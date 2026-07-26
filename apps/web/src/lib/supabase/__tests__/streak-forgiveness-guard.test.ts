import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

// #573 (LX-B8): streak forgiveness across ALL streak writers. RLS + PL/pgSQL
// behavior cannot be exercised in unit tests (no DB harness in this repo — see
// review-items-rls-guard / ai-spend-ledger-guard), so the security- and
// correctness-critical SQL invariants are pinned in BOTH the migration (what is
// applied) and schema.sql (the snapshot new environments are built from). A
// drift between the two is exactly the #449 IDL-drift class of bug.
//
// The behavioral acceptance criteria (streak continues across a forgiven gap;
// a second consecutive miss with no token resets; freeze refill/cap) are
// enforced by the shared next_streak_value / cover_missed_days_with_freezes /
// grant_streak_freeze functions; these tests pin that all three writers route
// through them (so the paths agree by construction, not by three copies) and
// that the consume/cap/log invariants hold.

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
    "supabase/migrations/20260726190000_streak_forgiveness.sql"
  ),
  "utf8"
);
const schema = readFileSync(resolve(repoRoot, "supabase/schema.sql"), "utf8");

const HELPER_RPCS: ReadonlyArray<[string, string]> = [
  ["cover_missed_days_with_freezes", "(UUID, DATE, DATE)"],
  ["next_streak_value", "(UUID, DATE, INTEGER, DATE)"],
  ["grant_streak_freeze", "(UUID)"],
];

for (const [label, sql] of [
  ["migration", migration] as const,
  ["schema.sql", schema] as const,
]) {
  describe(`#573 streak forgiveness — ${label}`, () => {
    it("adds a capped freeze inventory column to user_xp", () => {
      // Column exists (either as ADD COLUMN in the migration or in the table def
      // in schema.sql) and is bounded 0..2 by a CHECK in both files.
      expect(sql).toMatch(/streak_freezes\s+INTEGER\s+NOT NULL\s+DEFAULT 0/);
      expect(sql).toContain("CHECK (streak_freezes BETWEEN 0 AND 2)");
    });

    it("logs consumed freezes in an own-row-readable, write-locked table", () => {
      expect(sql).toContain(
        "ALTER TABLE streak_freezes_used ENABLE ROW LEVEL SECURITY"
      );
      expect(sql).toContain(
        "ON streak_freezes_used FOR SELECT USING (auth.uid() = user_id)"
      );
      // No client write path — writes go only through the SECURITY DEFINER
      // helpers. A write policy would let a learner forge frozen days.
      expect(sql).not.toMatch(
        /ON streak_freezes_used FOR (INSERT|UPDATE|DELETE|ALL)/
      );
    });

    it("cascades the freeze log on profile deletion", () => {
      expect(sql).toContain(
        "user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE"
      );
    });

    it("hardens every new helper (SECURITY DEFINER, pinned path, service_role only)", () => {
      for (const [fn, args] of HELPER_RPCS) {
        const start = sql.indexOf(`CREATE OR REPLACE FUNCTION ${fn}(`);
        expect(start, `${fn} defined`).toBeGreaterThan(-1);
        const body = sql.slice(
          start,
          sql.indexOf("GRANT EXECUTE", start) + 120
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

    it("consumes freezes atomically — guarded decrement, never negative", () => {
      // The whole concurrency story: one guarded UPDATE. No separate SELECT of
      // the count that a concurrent path could double-read into an over-consume.
      expect(sql).toContain("SET streak_freezes = streak_freezes - v_needed");
      expect(sql).toContain(
        "WHERE user_id = p_user_id AND streak_freezes >= v_needed"
      );
    });

    it("serializes the freeze decision across writers with ONE shared lock", () => {
      // award_xp / award_community_xp hold DIFFERENT per-writer locks, so the
      // freeze decision must take a SHARED 'streak:<uid>' advisory lock (inside
      // cover_missed_days_with_freezes, before the count) or a concurrent pair
      // races the unlocked count and the loser spuriously resets. Pin the exact
      // key so a future edit cannot silently split it back into per-writer keys.
      const cover = sliceFn(
        sql,
        "CREATE OR REPLACE FUNCTION cover_missed_days_with_freezes("
      );
      expect(cover).toContain(
        "pg_advisory_xact_lock(hashtext('streak:' || p_user_id::text)::bigint)"
      );
      // The lock must precede the missed-day count (lock-then-read, not after).
      expect(cover.indexOf("pg_advisory_xact_lock")).toBeLessThan(
        cover.indexOf("SELECT COUNT(*) INTO v_needed")
      );
    });

    it("only charges a freeze for a day not already frozen (idempotent log)", () => {
      // Cross-writer idempotency: a day one path froze is not re-charged by
      // another. Missed-day count excludes already-logged days; the log insert
      // is ON CONFLICT DO NOTHING.
      expect(sql).toContain("FROM public.streak_freezes_used sfu");
      expect(sql).toContain("ON CONFLICT (user_id, frozen_date) DO NOTHING");
    });

    it("caps the freeze inventory at 2 in the grant path", () => {
      expect(sql).toContain("LEAST(user_xp.streak_freezes + 1, 2)");
    });

    it("routes BOTH XP writers through the shared streak decision (no inline reset)", () => {
      // award_xp and award_community_xp must both defer to next_streak_value so
      // a frozen streak survives regardless of which path writes first. The old
      // inline `ELSE ... := 1` / `ELSE 1` resets must be gone from both bodies.
      const awardXp = sliceFn(sql, "CREATE OR REPLACE FUNCTION award_xp(");
      expect(awardXp).toContain("public.next_streak_value(p_user_id");
      expect(awardXp).not.toMatch(/Gap > 1 day, reset streak/);

      const community = sliceFn(
        sql,
        "CREATE OR REPLACE FUNCTION award_community_xp("
      );
      expect(community).toContain("public.next_streak_value(p_user_id");
      // The prior community body reset via `ELSE 1` inside the streak CASE.
      expect(community).not.toMatch(
        /WHEN user_xp\.last_activity_date = CURRENT_DATE - INTERVAL '1 day' THEN user_xp\.current_streak \+ 1/
      );
    });

    it("forgives the quest login-streak gap and funds forgiveness on completion", () => {
      const quest = sliceFn(
        sql,
        "CREATE OR REPLACE FUNCTION get_daily_quest_state("
      );
      // Case 3 consults the shared freeze cover before breaking the quest streak.
      expect(quest).toContain("public.cover_missed_days_with_freezes(");
      // Completing the login_streak quest banks a freeze (the quest reward).
      expect(quest).toContain("PERFORM public.grant_streak_freeze(p_user_id)");
    });
  });
}

function sliceFn(sql: string, header: string): string {
  const start = sql.indexOf(header);
  expect(start, `${header} present`).toBeGreaterThan(-1);
  // Function bodies end at the `$$;` terminator.
  const end = sql.indexOf("$$;", start);
  return sql.slice(start, end === -1 ? undefined : end);
}

describe("#573 streak forgiveness — migration-only guarantees", () => {
  it("runs in one explicit transaction", () => {
    expect(migration).toContain("BEGIN;");
    expect(migration).toContain("COMMIT;");
  });

  it("adds the column idempotently (safe to re-apply)", () => {
    expect(migration).toContain(
      "ALTER TABLE user_xp ADD COLUMN IF NOT EXISTS streak_freezes"
    );
    expect(migration).toContain(
      "CREATE TABLE IF NOT EXISTS streak_freezes_used"
    );
  });

  it("ships a rollback that drops the new objects AND restores the writers", () => {
    // Function-modifying migration: the rollback must both drop what it created
    // and restore the two rewritten writers' prior bodies (get_daily_quest_state
    // is restored by re-applying its prior migration).
    expect(migration).toContain(
      "DROP FUNCTION IF EXISTS public.grant_streak_freeze(UUID)"
    );
    expect(migration).toContain(
      "DROP FUNCTION IF EXISTS public.next_streak_value(UUID, DATE, INTEGER, DATE)"
    );
    expect(migration).toContain(
      "DROP FUNCTION IF EXISTS public.cover_missed_days_with_freezes(UUID, DATE, DATE)"
    );
    expect(migration).toContain(
      "DROP TABLE IF EXISTS public.streak_freezes_used"
    );
    expect(migration).toContain(
      "ALTER TABLE public.user_xp DROP COLUMN IF EXISTS streak_freezes"
    );
    // Restores the two rewritten XP writers, and points at the quest migration.
    expect(migration).toMatch(/Restore award_xp to its pre-forgiveness body/);
    expect(migration).toMatch(
      /Restore award_community_xp to its pre-forgiveness body/
    );
    expect(migration).toContain("20260726170000_review_quest_kind.sql");
  });
});
