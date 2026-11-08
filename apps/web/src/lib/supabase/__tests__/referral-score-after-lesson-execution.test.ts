// Referral scoring in pglite on the real schema (every migration in order). A
// referral claimed after the migration's cutoff is recorded at once but scores
// for the referrer only after the referred learner completes a dated lesson; one
// claimed before the cutoff scores as it did before. The board (get_referral_leaderboard)
// and the referrer's own totals (get_own_referral_totals, behind
// /api/referrals/me) must give the same numbers.
//
// The last describe builds the lineage without the new migration and shows the
// old board scoring a referral whose learner never completed a lesson.
//
// @vitest-environment node
import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { buildFullLineage, readMigration } from "./helpers/full-lineage";

const MIGRATION = "20261108130000_referral_score_after_lesson.sql";

const SERVICE_ON = `SELECT set_config('request.jwt.claims', '{"role":"service_role"}', false);`;

const REFERRER = "10000000-0000-4000-8000-000000000001";
const OTHER_REFERRER = "10000000-0000-4000-8000-000000000002";
const referred = (n: number): string =>
  `20000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

async function createAccount(
  pg: PGlite,
  id: string,
  username: string
): Promise<void> {
  await pg.exec(`
    INSERT INTO auth.users (id, email, raw_user_meta_data, raw_app_meta_data)
    VALUES ('${id}', '${username}@example.com', '{}', '{"provider":"google"}');
    UPDATE public.profiles SET username = '${username}', is_public = true WHERE id = '${id}';
  `);
}

async function codeOf(pg: PGlite, id: string): Promise<string> {
  const r = await pg.query<{ code: string }>(
    `SELECT public.get_or_create_referral_code($1) AS code`,
    [id]
  );
  return r.rows[0]!.code;
}

async function claim(
  pg: PGlite,
  referredId: string,
  referrerId: string
): Promise<string> {
  const code = await codeOf(pg, referrerId);
  const r = await pg.query<{ outcome: string }>(
    `SELECT public.claim_referral($1, $2) AS outcome`,
    [referredId, code]
  );
  return r.rows[0]!.outcome;
}

async function completeLesson(
  pg: PGlite,
  userId: string,
  lessonId: string,
  completedAt = "now()"
): Promise<void> {
  await pg.exec(`
    INSERT INTO public.user_progress (user_id, course_id, lesson_id, completed, completed_at)
    VALUES ('${userId}', 'course-1', '${lessonId}', true, ${completedAt});
  `);
}

/** Board points per referrer for a season (NULL = the current one). */
async function boardPoints(
  pg: PGlite,
  season: number | null = null
): Promise<Record<string, number>> {
  const r = await pg.query<{ user_id: string; points: string }>(
    `SELECT user_id, points FROM public.get_referral_leaderboard($1, 100)`,
    [season]
  );
  return Object.fromEntries(r.rows.map((x) => [x.user_id, Number(x.points)]));
}

async function seasonWindow(
  pg: PGlite,
  season: number
): Promise<{ starts: string; ends: string }> {
  const r = await pg.query<{ starts: string; ends: string }>(
    `SELECT starts_at::text AS starts, ends_at::text AS ends
     FROM public.referral_seasons WHERE number = $1`,
    [season]
  );
  return r.rows[0]!;
}

async function ownTotals(
  pg: PGlite,
  userId: string,
  season = 2
): Promise<{ seasonPoints: number; referredSignups: number }> {
  const w = await seasonWindow(pg, season);
  const r = await pg.query<{ season_points: string; referred_signups: string }>(
    `SELECT season_points, referred_signups
     FROM public.get_own_referral_totals($1, $2::timestamptz, $3::timestamptz)`,
    [userId, w.starts, w.ends]
  );
  const row = r.rows[0]!;
  return {
    seasonPoints: Number(row.season_points),
    referredSignups: Number(row.referred_signups),
  };
}

/** Season 1 closed, Season 2 open now. Seasons bucket points by scored_at. */
const SEASONS = `
  DELETE FROM public.referral_seasons;
  INSERT INTO public.referral_seasons (number, starts_at, ends_at) VALUES
    (1, now() - interval '60 days', now() - interval '10 days'),
    (2, now() - interval '10 days', now() + interval '80 days');
`;

/**
 * Move a referred learner's referral rows back in time. The cutoff was set
 * when the lineage was built, so a claim backdated by a day is pre-cutoff.
 */
const backdateClaim = (referredId: string, interval: string): string => `
  UPDATE public.referral_events SET created_at = now() - interval '${interval}'
  WHERE referred_id = '${referredId}';
`;

const RESET = `
  DELETE FROM public.referral_events;
  DELETE FROM public.user_progress;
  UPDATE public.profiles SET referred_by = NULL, deleted_at = NULL;
  ${SEASONS}
`;

async function readCutoff(pg: PGlite): Promise<string | undefined> {
  const r = await pg.query<{ at: string }>(
    `SELECT lesson_required_from::text AS at FROM public.referral_scoring_cutoff`
  );
  return r.rows[0]?.at;
}

/** Move the cutoff, e.g. to put a backdated claim after it. */
const setCutoff = (interval: string): string => `
  UPDATE public.referral_scoring_cutoff
  SET lesson_required_from = now() - interval '${interval}';
`;

describe("referral scoring waits for the referred learner's first lesson", () => {
  let pg: PGlite;
  let appliedCutoff: string;

  beforeAll(async () => {
    pg = await buildFullLineage();
    appliedCutoff = (await readCutoff(pg))!;
    await pg.exec(SERVICE_ON);
    await createAccount(pg, REFERRER, "referrer_one");
    await createAccount(pg, OTHER_REFERRER, "referrer_two");
    for (let n = 1; n <= 5; n++) {
      await createAccount(pg, referred(n), `learner_${n}`);
    }
  }, 120_000);

  afterAll(async () => {
    await pg?.close();
  });

  beforeEach(async () => {
    await pg.exec(RESET);
    await pg.query(
      `INSERT INTO public.referral_scoring_cutoff (id, lesson_required_from)
       VALUES (true, $1::timestamptz)
       ON CONFLICT (id) DO UPDATE SET lesson_required_from = EXCLUDED.lesson_required_from`,
      [appliedCutoff]
    );
  });

  it("records the claim but scores 0 before any completed lesson", async () => {
    expect(await claim(pg, referred(1), REFERRER)).toBe("claimed");

    const recorded = await pg.query(
      `SELECT 1 FROM public.referral_events WHERE referred_id = $1 AND kind = 'signup'`,
      [referred(1)]
    );
    expect(recorded.rows).toHaveLength(1);

    expect(await boardPoints(pg)).toEqual({});
    expect(await ownTotals(pg, REFERRER)).toEqual({
      seasonPoints: 0,
      referredSignups: 0,
    });
  });

  it("an incomplete progress row does not count as a completed lesson", async () => {
    await claim(pg, referred(1), REFERRER);
    await pg.exec(`
      INSERT INTO public.user_progress (user_id, course_id, lesson_id, completed)
      VALUES ('${referred(1)}', 'course-1', 'lesson-1', false);
    `);

    expect(await boardPoints(pg)).toEqual({});
    expect((await ownTotals(pg, REFERRER)).seasonPoints).toBe(0);
  });

  it("a completed row with no completed_at does not count; a dated one does", async () => {
    await claim(pg, referred(1), REFERRER);
    await claim(pg, referred(2), REFERRER);
    await completeLesson(pg, referred(1), "lesson-1", "NULL");
    await completeLesson(pg, referred(2), "lesson-1");

    // Only referred(2) scores.
    expect(await boardPoints(pg)).toEqual({ [REFERRER]: 1 });
    expect(await ownTotals(pg, REFERRER)).toEqual({
      seasonPoints: 1,
      referredSignups: 1,
    });
  });

  it("scores 1 once the referred learner completes one lesson", async () => {
    await claim(pg, referred(1), REFERRER);
    await completeLesson(pg, referred(1), "lesson-1");

    expect(await boardPoints(pg)).toEqual({ [REFERRER]: 1 });
    expect(await ownTotals(pg, REFERRER)).toEqual({
      seasonPoints: 1,
      referredSignups: 1,
    });
  });

  it("more lessons from the same learner do not add signup points", async () => {
    await claim(pg, referred(1), REFERRER);
    await completeLesson(pg, referred(1), "lesson-1");
    await completeLesson(pg, referred(1), "lesson-2");
    await completeLesson(pg, referred(1), "lesson-3");

    expect(await boardPoints(pg)).toEqual({ [REFERRER]: 1 });
  });

  it("counts every referral of one referrer once each has completed a lesson", async () => {
    for (const n of [1, 2, 3, 4]) {
      expect(await claim(pg, referred(n), REFERRER)).toBe("claimed");
    }
    await completeLesson(pg, referred(1), "lesson-1");
    await completeLesson(pg, referred(2), "lesson-1");
    await completeLesson(pg, referred(3), "lesson-1");

    expect(await boardPoints(pg)).toEqual({ [REFERRER]: 3 });
    expect(await ownTotals(pg, REFERRER)).toEqual({
      seasonPoints: 3,
      referredSignups: 3,
    });

    await completeLesson(pg, referred(4), "lesson-1");
    expect(await boardPoints(pg)).toEqual({ [REFERRER]: 4 });
  });

  it("course-completion points follow the same rule", async () => {
    await claim(pg, referred(1), REFERRER);
    await pg.query(`SELECT public.record_referral_course_completion($1, $2)`, [
      referred(1),
      "course-1",
    ]);
    expect(await boardPoints(pg)).toEqual({});

    await completeLesson(pg, referred(1), "lesson-1");
    expect(await boardPoints(pg)).toEqual({ [REFERRER]: 2 });
    expect(await ownTotals(pg, REFERRER)).toEqual({
      seasonPoints: 2,
      referredSignups: 1,
    });
  });

  it("a referred learner who completed a lesson and later deleted still counts", async () => {
    await claim(pg, referred(1), REFERRER);
    await claim(pg, referred(2), REFERRER);
    await completeLesson(pg, referred(1), "lesson-1");
    await pg.exec(
      `UPDATE public.profiles SET deleted_at = now() WHERE id IN ('${referred(1)}', '${referred(2)}')`
    );

    // referred(1) keeps scoring; referred(2) never completed a lesson.
    expect(await boardPoints(pg)).toEqual({ [REFERRER]: 1 });
    expect(await ownTotals(pg, REFERRER)).toEqual({
      seasonPoints: 1,
      referredSignups: 1,
    });
  });

  it("a tombstoned referrer stays off the board", async () => {
    await claim(pg, referred(1), REFERRER);
    await completeLesson(pg, referred(1), "lesson-1");
    await pg.exec(
      `UPDATE public.profiles SET deleted_at = now() WHERE id = '${REFERRER}'`
    );

    expect(await boardPoints(pg)).toEqual({});
  });

  it("the board and the referrer's own totals agree for every referrer", async () => {
    for (const n of [1, 2, 3]) await claim(pg, referred(n), REFERRER);
    for (const n of [4, 5]) await claim(pg, referred(n), OTHER_REFERRER);
    await completeLesson(pg, referred(1), "lesson-1");
    await completeLesson(pg, referred(3), "lesson-1");
    await completeLesson(pg, referred(5), "lesson-1");
    await pg.query(`SELECT public.record_referral_course_completion($1, $2)`, [
      referred(3),
      "course-1",
    ]);
    await pg.query(`SELECT public.record_referral_course_completion($1, $2)`, [
      referred(4),
      "course-1",
    ]);

    const board = await boardPoints(pg);
    expect(board).toEqual({ [REFERRER]: 3, [OTHER_REFERRER]: 1 });
    for (const id of [REFERRER, OTHER_REFERRER]) {
      expect((await ownTotals(pg, id)).seasonPoints).toBe(board[id]);
    }
  });

  describe("cutoff", () => {
    it("the migration records a cutoff", () => {
      expect(appliedCutoff).toBeTruthy();
    });

    it("a referral created before the cutoff scores 1 with no lesson", async () => {
      await claim(pg, referred(1), REFERRER);
      await pg.exec(backdateClaim(referred(1), "1 day"));

      expect(await boardPoints(pg, 2)).toEqual({ [REFERRER]: 1 });
      expect(await ownTotals(pg, REFERRER)).toEqual({
        seasonPoints: 1,
        referredSignups: 1,
      });
    });

    it("a referral created after the cutoff scores 0 without a lesson and 1 with a dated one", async () => {
      await claim(pg, referred(1), REFERRER);
      expect(await boardPoints(pg, 2)).toEqual({});
      expect((await ownTotals(pg, REFERRER)).seasonPoints).toBe(0);

      await completeLesson(pg, referred(1), "lesson-1");
      expect(await boardPoints(pg, 2)).toEqual({ [REFERRER]: 1 });
      expect((await ownTotals(pg, REFERRER)).seasonPoints).toBe(1);
    });

    it("a pre-cutoff referral whose first lesson comes after the cutoff is counted once, at claim time", async () => {
      await claim(pg, referred(1), REFERRER);
      await pg.exec(backdateClaim(referred(1), "20 days"));
      await completeLesson(pg, referred(1), "lesson-1");

      expect(await boardPoints(pg, 1)).toEqual({ [REFERRER]: 1 });
      expect(await boardPoints(pg, 2)).toEqual({});
      expect((await ownTotals(pg, REFERRER, 1)).seasonPoints).toBe(1);
      expect((await ownTotals(pg, REFERRER, 2)).seasonPoints).toBe(0);
      expect((await ownTotals(pg, REFERRER, 2)).referredSignups).toBe(1);
    });

    it("re-running the migration keeps the original cutoff", async () => {
      await claim(pg, referred(1), REFERRER);
      await pg.exec(backdateClaim(referred(1), "1 day"));

      await pg.exec(readMigration(MIGRATION));

      expect(await readCutoff(pg)).toBe(appliedCutoff);
      const rows = await pg.query(
        `SELECT 1 FROM public.referral_scoring_cutoff`
      );
      expect(rows.rows).toHaveLength(1);
      expect(await boardPoints(pg, 2)).toEqual({ [REFERRER]: 1 });
    });

    it("with no cutoff row, every referral needs a lesson", async () => {
      await pg.exec(`DELETE FROM public.referral_scoring_cutoff`);
      await claim(pg, referred(1), REFERRER);
      await pg.exec(backdateClaim(referred(1), "20 days"));

      expect(await boardPoints(pg, 1)).toEqual({});
      expect(await ownTotals(pg, REFERRER, 1)).toEqual({
        seasonPoints: 0,
        referredSignups: 0,
      });

      await completeLesson(pg, referred(1), "lesson-1");
      expect(await boardPoints(pg, 2)).toEqual({ [REFERRER]: 1 });
    });
  });

  describe("seasons bucket points by scored_at", () => {
    it("a post-cutoff claim in a closed season scores in the season its first lesson lands", async () => {
      await pg.exec(setCutoff("90 days"));
      await claim(pg, referred(1), REFERRER);
      await pg.exec(backdateClaim(referred(1), "20 days"));
      await completeLesson(pg, referred(1), "lesson-1");

      expect(await boardPoints(pg, 1)).toEqual({});
      expect(await boardPoints(pg, 2)).toEqual({ [REFERRER]: 1 });
      expect(await boardPoints(pg)).toEqual({ [REFERRER]: 1 });
      expect((await ownTotals(pg, REFERRER, 1)).seasonPoints).toBe(0);
      expect((await ownTotals(pg, REFERRER, 2)).seasonPoints).toBe(1);
    });

    it("a lesson completed before a claim scores at claim time", async () => {
      await completeLesson(
        pg,
        referred(1),
        "lesson-1",
        "now() - interval '30 days'"
      );
      await claim(pg, referred(1), REFERRER);

      expect(await boardPoints(pg, 1)).toEqual({});
      expect(await boardPoints(pg, 2)).toEqual({ [REFERRER]: 1 });
    });

    it("a point that qualified inside a closed season stays in it", async () => {
      await pg.exec(setCutoff("90 days"));
      await claim(pg, referred(1), REFERRER);
      await pg.exec(backdateClaim(referred(1), "40 days"));
      await completeLesson(
        pg,
        referred(1),
        "lesson-1",
        "now() - interval '35 days'"
      );
      await completeLesson(pg, referred(1), "lesson-2");

      expect(await boardPoints(pg, 1)).toEqual({ [REFERRER]: 1 });
      expect(await boardPoints(pg, 2)).toEqual({});
      expect((await ownTotals(pg, REFERRER, 1)).seasonPoints).toBe(1);
    });
  });

  it("the cutoff table has no client access", async () => {
    const r = await pg.query<{ rls: boolean; anon: boolean; auth: boolean }>(`
      SELECT c.relrowsecurity AS rls,
        has_table_privilege('anon', 'public.referral_scoring_cutoff', 'SELECT') AS anon,
        has_table_privilege('authenticated', 'public.referral_scoring_cutoff', 'SELECT') AS auth
      FROM pg_class c WHERE c.oid = 'public.referral_scoring_cutoff'::regclass
    `);
    expect(r.rows[0]).toEqual({ rls: true, anon: false, auth: false });
    const policies = await pg.query(
      `SELECT 1 FROM pg_policies WHERE tablename = 'referral_scoring_cutoff'`
    );
    expect(policies.rows).toHaveLength(0);
  });

  it("with no season window, own totals give 0 season points but keep the signup count", async () => {
    await claim(pg, referred(1), REFERRER);
    await completeLesson(pg, referred(1), "lesson-1");
    const r = await pg.query<{
      season_points: number;
      referred_signups: number;
    }>(
      `SELECT season_points, referred_signups
       FROM public.get_own_referral_totals($1, NULL, NULL)`,
      [REFERRER]
    );
    expect(r.rows[0]).toEqual({ season_points: 0, referred_signups: 1 });
  });

  it("keeps grants: the board is public, the scoring reads are service_role only", async () => {
    const r = await pg.query<{
      role: string;
      board: boolean;
      own: boolean;
      scored: boolean;
    }>(`
      SELECT r AS role,
        has_function_privilege(r, 'public.get_referral_leaderboard(integer, integer)', 'EXECUTE') AS board,
        has_function_privilege(r, 'public.get_own_referral_totals(uuid, timestamptz, timestamptz)', 'EXECUTE') AS own,
        has_function_privilege(r, 'public.referral_scored_events(uuid)', 'EXECUTE') AS scored
      FROM unnest(ARRAY['anon', 'authenticated', 'service_role']) AS r
    `);
    expect(r.rows).toEqual([
      { role: "anon", board: true, own: false, scored: false },
      { role: "authenticated", board: true, own: false, scored: false },
      { role: "service_role", board: true, own: true, scored: true },
    ]);
  });

  it("anon can still read the board", async () => {
    await claim(pg, referred(1), REFERRER);
    await completeLesson(pg, referred(1), "lesson-1");
    await pg.exec(`SET ROLE anon`);
    try {
      expect(await boardPoints(pg)).toEqual({ [REFERRER]: 1 });
    } finally {
      await pg.exec(`RESET ROLE`);
    }
  });

  it("re-applying the migration is a no-op", async () => {
    await claim(pg, referred(1), REFERRER);
    await completeLesson(pg, referred(1), "lesson-1");
    await pg.exec(readMigration(MIGRATION));
    expect(await boardPoints(pg)).toEqual({ [REFERRER]: 1 });
  });
});

describe("before the migration (red proof)", () => {
  let pg: PGlite;

  beforeAll(async () => {
    pg = await buildFullLineage({ except: [MIGRATION] });
    await pg.exec(SERVICE_ON);
    await createAccount(pg, REFERRER, "referrer_one");
    await createAccount(pg, referred(1), "learner_1");
    await pg.exec(SEASONS);
  }, 120_000);

  afterAll(async () => {
    await pg?.close();
  });

  it("the old board scores a referral whose learner never completed a lesson", async () => {
    expect(await claim(pg, referred(1), REFERRER)).toBe("claimed");
    expect(await boardPoints(pg, 2)).toEqual({ [REFERRER]: 1 });
  });
});
