// #899: REAL SQL-execution tests for the re-engagement claim RPCs + the
// frequency cap, replayed against the PROD migration lineage.
//
// Lineage replayed here (repo filename → applied prod ledger version):
//   20260728120000_email_subscriptions.sql      → 20260727200924
//   20260731120000_reminder_consent.sql         → 20260731120914
//   20260731150000_kind_scoped_unsubscribe.sql  → 20260731142948   ← last applied
//   20260731170000_reengagement_pipeline.sql    → THIS CHANGE (not yet applied)
//
// RED-PROOF: the "no cap" describe block replays the SAME scenario with the cap
// window collapsed to its degenerate minimum (p_cap_days = 1, i.e. the #869
// per-day PK and nothing more) and shows the learner being nudged on day 1, day
// 2, day 3 — the DAILY-nudge defect #898 warned about. The "cap enforced" block
// runs the identical scenario at the shipped N = 14 and shows one send per
// window. If the NOT EXISTS were removed from the RPC, the second block would
// fail exactly the way the first one passes.
//
// @vitest-environment node
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";

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
const readMigration = (name: string) =>
  readFileSync(resolve(repoRoot, "supabase/migrations", name), "utf8");

const LINEAGE = [
  "20260728120000_email_subscriptions.sql",
  "20260731120000_reminder_consent.sql",
  "20260731150000_kind_scoped_unsubscribe.sql",
].map(readMigration);
const pipelineMigration = readMigration(
  "20260731170000_reengagement_pipeline.sql"
);
const schema = readFileSync(resolve(repoRoot, "supabase/schema.sql"), "utf8");

// Objects created outside these migrations (Supabase roles, auth schema, and
// the baseline tables the claim reads). Same stub shape the #869/#896 suites
// use, extended with the activity/progress tables this RPC joins.
const STUB_SETUP = `
  CREATE ROLE anon;
  CREATE ROLE authenticated;
  CREATE ROLE service_role;
  CREATE SCHEMA IF NOT EXISTS auth;
  CREATE TABLE auth.users (id uuid PRIMARY KEY, email text);
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS 'SELECT NULL::uuid';
  CREATE TABLE public.profiles (
    id uuid PRIMARY KEY,
    prefs jsonb NOT NULL DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE TABLE public.enrollments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id text NOT NULL,
    enrolled_at timestamptz DEFAULT now(),
    completed_at timestamptz,
    UNIQUE(user_id, course_id)
  );
  CREATE TABLE public.user_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id text NOT NULL,
    lesson_id text NOT NULL,
    completed boolean DEFAULT false,
    completed_at timestamptz,
    UNIQUE(user_id, lesson_id)
  );
  CREATE TABLE public.user_xp (
    user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    longest_streak int DEFAULT 0,
    last_activity_date date
  );
  CREATE TABLE public.certificates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id text NOT NULL,
    UNIQUE(user_id, course_id)
  );
`;

const uid = (n: number): string => {
  const c = String(n % 10);
  return `${c.repeat(8)}-${c.repeat(4)}-${c.repeat(4)}-${c.repeat(4)}-${c.repeat(12)}`;
};

/** Lapsed 30 days, consenting, one lesson left in `course-a`. */
const LAPSED = uid(1);
/** Lapsed 30 days, consenting, NO nearly-done course. */
const LAPSED_NO_COURSE = uid(2);
/** Lapsed 30 days but never gave REMINDER consent. */
const NO_CONSENT = uid(3);
/** Lapsed 30 days, consenting, but authenticated by wallet (placeholder email). */
const WALLET = uid(4);
/** Consenting but active yesterday. */
const ACTIVE = uid(5);
/** Consenting, zero activity, but the account was created 2 days ago. */
const BRAND_NEW = uid(6);
/** Lapsed + consenting, but already holds `course-a`'s credential. */
const CERTIFIED = uid(7);

const COURSE_TOTALS = `'{"course-a": 3, "course-b": 5}'::jsonb`;

const SEED = `
  INSERT INTO public.profiles(id, created_at) VALUES
    ('${LAPSED}',           now() - interval '200 days'),
    ('${LAPSED_NO_COURSE}', now() - interval '200 days'),
    ('${NO_CONSENT}',       now() - interval '200 days'),
    ('${WALLET}',           now() - interval '200 days'),
    ('${ACTIVE}',           now() - interval '200 days'),
    ('${BRAND_NEW}',        now() - interval '2 days'),
    ('${CERTIFIED}',        now() - interval '200 days');

  INSERT INTO auth.users(id, email) VALUES
    ('${LAPSED}',           'lapsed@example.com'),
    ('${LAPSED_NO_COURSE}', 'nocourse@example.com'),
    ('${NO_CONSENT}',       'noconsent@example.com'),
    ('${WALLET}',           'abc123@wallet.superteam-lms.local'),
    ('${ACTIVE}',           'active@example.com'),
    ('${BRAND_NEW}',        'new@example.com'),
    ('${CERTIFIED}',        'certified@example.com');

  INSERT INTO public.email_subscriptions(user_id, reminder_opt_in, reminder_consent_at, reminder_locale) VALUES
    ('${LAPSED}',           true,  now(), 'pt-BR'),
    ('${LAPSED_NO_COURSE}', true,  now(), NULL),
    ('${NO_CONSENT}',       false, NULL,  NULL),
    ('${WALLET}',           true,  now(), NULL),
    ('${ACTIVE}',           true,  now(), NULL),
    ('${BRAND_NEW}',        true,  now(), NULL),
    ('${CERTIFIED}',        true,  now(), NULL);

  INSERT INTO public.user_xp(user_id, longest_streak, last_activity_date) VALUES
    ('${LAPSED}',           9, (now() - interval '30 days')::date),
    ('${LAPSED_NO_COURSE}', 3, (now() - interval '30 days')::date),
    ('${NO_CONSENT}',       0, (now() - interval '30 days')::date),
    ('${WALLET}',           0, (now() - interval '30 days')::date),
    ('${ACTIVE}',           4, (now() - interval '1 day')::date),
    ('${CERTIFIED}',        7, (now() - interval '30 days')::date);

  INSERT INTO public.enrollments(user_id, course_id, enrolled_at) VALUES
    ('${LAPSED}',           'course-a', now() - interval '60 days'),
    ('${LAPSED_NO_COURSE}', 'course-b', now() - interval '60 days'),
    ('${NO_CONSENT}',       'course-a', now() - interval '60 days'),
    ('${WALLET}',           'course-a', now() - interval '60 days'),
    ('${ACTIVE}',           'course-a', now() - interval '60 days'),
    ('${CERTIFIED}',        'course-a', now() - interval '60 days');

  -- course-a has 3 lessons. Two done ⇒ exactly one remaining.
  INSERT INTO public.user_progress(user_id, course_id, lesson_id, completed, completed_at) VALUES
    ('${LAPSED}',     'course-a', 'a1', true, now() - interval '31 days'),
    ('${LAPSED}',     'course-a', 'a2', true, now() - interval '31 days'),
    ('${NO_CONSENT}', 'course-a', 'a1', true, now() - interval '31 days'),
    ('${NO_CONSENT}', 'course-a', 'a2', true, now() - interval '31 days'),
    ('${WALLET}',     'course-a', 'a1', true, now() - interval '31 days'),
    ('${WALLET}',     'course-a', 'a2', true, now() - interval '31 days'),
    ('${ACTIVE}',     'course-a', 'a1', true, now() - interval '1 day'),
    ('${ACTIVE}',     'course-a', 'a2', true, now() - interval '1 day'),
    ('${CERTIFIED}',  'course-a', 'a1', true, now() - interval '31 days'),
    ('${CERTIFIED}',  'course-a', 'a2', true, now() - interval '31 days');

  -- course-b has 5 lessons; LAPSED_NO_COURSE finished one ⇒ 4 remaining, not near.
  INSERT INTO public.user_progress(user_id, course_id, lesson_id, completed, completed_at) VALUES
    ('${LAPSED_NO_COURSE}', 'course-b', 'b1', true, now() - interval '31 days');

  INSERT INTO public.certificates(user_id, course_id) VALUES ('${CERTIFIED}', 'course-a');
`;

/**
 * Clear the ledger AND restore consent — one test exercises the unsubscribe
 * path, and a PGlite instance is shared across a describe block (spinning one
 * up per test makes every pglite suite in the runner contend and time out).
 */
const RESET = `
  DELETE FROM public.email_reminder_log;
  UPDATE public.email_subscriptions
  SET reminder_opt_in = (user_id <> '${NO_CONSENT}'),
      reminder_unsubscribed_at = NULL;
`;

/** Everyone the generic pass should claim: lapsed + consenting + real inbox. */
const ALL_LAPSED = [LAPSED, LAPSED_NO_COURSE, CERTIFIED].sort();

interface ClaimRow {
  user_id: string;
  email: string;
  unsubscribe_token: string;
  locale: string | null;
  streak_days: number;
  days_inactive: number;
  course_id: string | null;
  completed_lesson_ids: string[];
}

async function claim(
  db: PGlite,
  kind: "reengagement_7d" | "course_nudge",
  opts: { inactiveDays?: number; capDays?: number } = {}
): Promise<ClaimRow[]> {
  const { rows } = await db.query<ClaimRow>(
    `SELECT * FROM public.claim_due_reengagement($1, $2, $3, 1, ${COURSE_TOTALS})`,
    [kind, opts.inactiveDays ?? 7, opts.capDays ?? 14]
  );
  return rows;
}

const ids = (rows: ClaimRow[]): string[] => rows.map((r) => r.user_id).sort();

/** Move every ledger row back `n` days, simulating the passage of time. */
async function advanceDays(db: PGlite, n: number): Promise<void> {
  await db.exec(
    `UPDATE public.email_reminder_log SET sent_on = sent_on - ${n}`
  );
}

let db: PGlite;

async function build(withPipeline: boolean): Promise<PGlite> {
  const next = await PGlite.create();
  await next.exec(STUB_SETUP);
  for (const m of LINEAGE) await next.exec(m);
  if (withPipeline) await next.exec(pipelineMigration);
  await next.exec(SEED);
  return next;
}

// ── RED: the ledger before this migration cannot even hold the new kinds ─────
describe("#899 RED — the PROD lineage (through kind_scoped_unsubscribe)", () => {
  beforeAll(async () => {
    db = await build(false);
  }, 60_000);
  afterAll(async () => {
    await db.close();
  });

  it("rejects a re-engagement ledger row outright (CHECK is session_plan-only)", async () => {
    await expect(
      db.exec(
        `INSERT INTO public.email_reminder_log(user_id, kind, sent_on)
         VALUES ('${LAPSED}', 'reengagement_7d', CURRENT_DATE)`
      )
    ).rejects.toThrow(/chk_email_reminder_log_kind/);
  });

  it("has no claim RPC at all", async () => {
    await expect(
      db.query(`SELECT public.claim_due_reengagement('reengagement_7d')`)
    ).rejects.toThrow(/claim_due_reengagement/);
  });
});

// ── RED: without a cap window, a lapsed learner is nudged EVERY DAY ──────────
describe("#899 RED — no frequency cap (p_cap_days = 1, i.e. the per-day PK alone)", () => {
  beforeAll(async () => {
    db = await build(true);
  }, 60_000);
  beforeEach(async () => {
    await db.exec(RESET);
  });
  afterAll(async () => {
    await db.close();
  });

  it("nudges the SAME permanently-lapsed learner on three consecutive days", async () => {
    const days: number[] = [];
    for (let d = 0; d < 3; d++) {
      days.push((await claim(db, "reengagement_7d", { capDays: 1 })).length);
      await advanceDays(db, 1);
    }
    // This is the defect #898 documented: the #869 per-day PK is satisfied
    // every day, so a permanent lapse means a permanent daily nudge.
    expect(days).toEqual([3, 3, 3]);
  });

  it("lets a learner get BOTH kinds in the same week", async () => {
    expect((await claim(db, "course_nudge", { capDays: 1 })).length).toBe(1);
    await advanceDays(db, 1);
    expect(ids(await claim(db, "reengagement_7d", { capDays: 1 }))).toContain(
      LAPSED
    );
  });
});

// ── GREEN: the shipped cap ───────────────────────────────────────────────────
describe("#899 GREEN — frequency cap enforced in SQL (N = 14)", () => {
  beforeAll(async () => {
    db = await build(true);
  }, 60_000);
  beforeEach(async () => {
    await db.exec(RESET);
  });
  afterAll(async () => {
    await db.close();
  });

  it("nudges once, then NOTHING for the rest of the window", async () => {
    expect(ids(await claim(db, "reengagement_7d"))).toEqual(ALL_LAPSED);
    for (let d = 1; d < 14; d++) {
      await advanceDays(db, 1);
      expect(
        (await claim(db, "reengagement_7d")).length,
        `day ${d} inside the window`
      ).toBe(0);
    }
    // Day 14 the window has passed and the learner is eligible again.
    await advanceDays(db, 1);
    expect(ids(await claim(db, "reengagement_7d"))).toEqual(ALL_LAPSED);
  });

  it("the cap is CROSS-KIND: a course nudge blocks the generic pass", async () => {
    expect(ids(await claim(db, "course_nudge"))).toEqual([LAPSED]);
    // Precedence for free — the generic pass no longer sees LAPSED at all.
    // CERTIFIED holds course-a's credential so it is never course-nudged, but a
    // lapsed learner is still a lapsed learner — the generic pass is right to
    // take them.
    expect(ids(await claim(db, "reengagement_7d"))).toEqual(
      [LAPSED_NO_COURSE, CERTIFIED].sort()
    );
  });

  it("a released claim frees the learner again (retry path)", async () => {
    expect(ids(await claim(db, "course_nudge"))).toEqual([LAPSED]);
    const { rows } = await db.query<{ freed: number }>(
      `SELECT public.release_reengagement_claims('course_nudge', ARRAY['${LAPSED}']::uuid[]) AS freed`
    );
    expect(rows[0]!.freed).toBe(1);
    expect(ids(await claim(db, "course_nudge"))).toEqual([LAPSED]);
  });

  it("release refuses to touch a session_plan claim", async () => {
    await db.exec(
      `INSERT INTO public.email_reminder_log(user_id, kind, sent_on)
       VALUES ('${LAPSED}', 'session_plan', (now() AT TIME ZONE 'America/Sao_Paulo')::date)`
    );
    await expect(
      db.query(
        `SELECT public.release_reengagement_claims('session_plan', ARRAY['${LAPSED}']::uuid[])`
      )
    ).rejects.toThrow(/unsupported re-engagement kind/);
    const { rows } = await db.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM public.email_reminder_log WHERE kind = 'session_plan'`
    );
    expect(rows[0]!.n).toBe(1);
  });
});

// ── GREEN: session-plan reminders are OUTSIDE the cap, both directions ───────
describe("#899 GREEN — session_plan does not interact with the cap", () => {
  beforeAll(async () => {
    db = await build(true);
  }, 60_000);
  beforeEach(async () => {
    await db.exec(RESET);
  });
  afterAll(async () => {
    await db.close();
  });

  it("a session reminder sent today does NOT consume the re-engagement budget", async () => {
    await db.exec(
      `INSERT INTO public.email_reminder_log(user_id, kind, sent_on)
       SELECT id, 'session_plan', (now() AT TIME ZONE 'America/Sao_Paulo')::date
       FROM public.profiles`
    );
    expect(ids(await claim(db, "reengagement_7d"))).toEqual(ALL_LAPSED);
  });

  it("a re-engagement send does NOT suppress the session-plan claim", async () => {
    await claim(db, "reengagement_7d");
    // The #869 RPC is untouched by this migration: it keys on its own kind, so
    // today's re-engagement rows are invisible to it. Give LAPSED a plan for
    // today and confirm the session reminder is still claimable.
    const { rows: wd } = await db.query<{ d: string }>(
      `SELECT trim(to_char((now() AT TIME ZONE 'America/Sao_Paulo'), 'dy')) AS d`
    );
    await db.exec(
      `UPDATE public.profiles
       SET prefs = '{"nextLesson":{"day":"${wd[0]!.d}","time":"19:00"}}'::jsonb
       WHERE id = '${LAPSED}'`
    );
    const { rows } = await db.query<{ user_id: string }>(
      `SELECT user_id FROM public.claim_due_session_reminders(NULL)`
    );
    expect(rows.map((r) => r.user_id)).toContain(LAPSED);
  });
});

// ── GREEN: the gates on who may be claimed at all ───────────────────────────
describe("#899 GREEN — recipient gates", () => {
  beforeAll(async () => {
    db = await build(true);
  }, 60_000);
  beforeEach(async () => {
    await db.exec(RESET);
  });
  afterAll(async () => {
    await db.close();
  });

  it("never claims a learner without REMINDER consent", async () => {
    const claimed = ids(await claim(db, "reengagement_7d"));
    expect(claimed).not.toContain(NO_CONSENT);
    // …and the marketing opt-in cannot stand in for it.
    await db.exec(
      `UPDATE public.email_subscriptions SET opt_in = true WHERE user_id = '${NO_CONSENT}'`
    );
    await db.exec(RESET);
    expect(ids(await claim(db, "reengagement_7d"))).not.toContain(NO_CONSENT);
  });

  it("never claims a wallet-placeholder address", async () => {
    expect(ids(await claim(db, "reengagement_7d"))).not.toContain(WALLET);
    await db.exec(RESET);
    expect(ids(await claim(db, "course_nudge"))).not.toContain(WALLET);
  });

  it("never claims an ACTIVE learner", async () => {
    expect(ids(await claim(db, "reengagement_7d"))).not.toContain(ACTIVE);
  });

  it("never claims a brand-new account with no activity (created_at floor)", async () => {
    // Without the profiles.created_at floor, GREATEST() over the other three
    // signals is NULL for this learner and a naive `last_seen IS NULL ⇒ lapsed`
    // reading would email them on day one.
    expect(ids(await claim(db, "reengagement_7d"))).not.toContain(BRAND_NEW);
  });

  it("never course-nudges a course the learner already has a credential for", async () => {
    expect(ids(await claim(db, "course_nudge"))).not.toContain(CERTIFIED);
  });

  it("only course-nudges a course within one lesson of done", async () => {
    // LAPSED_NO_COURSE has 4 of 5 lessons left in course-b.
    expect(ids(await claim(db, "course_nudge"))).toEqual([LAPSED]);
  });

  it("never course-nudges a course missing from the caller's totals map", async () => {
    const { rows } = await db.query<ClaimRow>(
      `SELECT * FROM public.claim_due_reengagement('course_nudge', 7, 14, 1, '{}'::jsonb)`
    );
    expect(rows).toEqual([]);
  });
});

// ── GREEN: claim atomicity + returned payload ───────────────────────────────
describe("#899 GREEN — claim payload and atomicity", () => {
  beforeAll(async () => {
    db = await build(true);
  }, 60_000);
  beforeEach(async () => {
    await db.exec(RESET);
  });
  afterAll(async () => {
    await db.close();
  });

  it("a second claim in the same day returns NOTHING (double-send impossible)", async () => {
    expect((await claim(db, "course_nudge")).length).toBe(1);
    expect(await claim(db, "course_nudge")).toEqual([]);
    const { rows } = await db.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM public.email_reminder_log WHERE kind = 'course_nudge'`
    );
    expect(rows[0]!.n).toBe(1);
  });

  it("hands out the REMINDER token, never the marketing one (#896)", async () => {
    const [row] = await claim(db, "course_nudge");
    const { rows } = await db.query<{ marketing: string; reminder: string }>(
      `SELECT unsubscribe_token AS marketing, reminder_unsubscribe_token AS reminder
       FROM public.email_subscriptions WHERE user_id = '${LAPSED}'`
    );
    expect(row!.unsubscribe_token).toBe(rows[0]!.reminder);
    expect(row!.unsubscribe_token).not.toBe(rows[0]!.marketing);
    // And it actually unsubscribes reminder consent only.
    const { rows: r2 } = await db.query<{ ok: boolean }>(
      `SELECT public.unsubscribe_reminders_by_token($1) AS ok`,
      [row!.unsubscribe_token]
    );
    expect(r2[0]!.ok).toBe(true);
  });

  it("returns the course context for course_nudge and NONE for the generic kind", async () => {
    const [nudge] = await claim(db, "course_nudge");
    expect(nudge!.course_id).toBe("course-a");
    expect([...nudge!.completed_lesson_ids].sort()).toEqual(["a1", "a2"]);
    expect(nudge!.locale).toBe("pt-BR");
    expect(nudge!.streak_days).toBe(9);
    expect(nudge!.days_inactive).toBeGreaterThanOrEqual(30);

    await db.exec(RESET);
    const generic = await claim(db, "reengagement_7d");
    // Even the learner WITH a nearly-done course carries no course context under
    // the generic kind — otherwise the caller could render a course nudge while
    // logging `reengagement_7d`, corrupting the R17 attribution.
    const lapsed = generic.find((r) => r.user_id === LAPSED);
    expect(lapsed!.course_id).toBeNull();
    expect(lapsed!.completed_lesson_ids).toEqual([]);
  });

  it("orders deterministically by user_id (reproducible idempotency keys)", async () => {
    const rows = await claim(db, "reengagement_7d");
    expect(rows.map((r) => r.user_id)).toEqual(
      [...rows.map((r) => r.user_id)].sort()
    );
  });

  it("rejects a kind outside the re-engagement family", async () => {
    for (const bad of ["session_plan", "marketing", ""]) {
      await expect(
        db.query(`SELECT public.claim_due_reengagement($1)`, [bad])
      ).rejects.toThrow(/unsupported re-engagement kind/);
    }
  });

  it("rejects a degenerate window rather than nudging everyone", async () => {
    await expect(
      db.query(`SELECT public.claim_due_reengagement('reengagement_7d', 0, 14)`)
    ).rejects.toThrow(/p_inactive_days must be >= 1/);
    await expect(
      db.query(`SELECT public.claim_due_reengagement('reengagement_7d', 7, 0)`)
    ).rejects.toThrow(/p_cap_days must be >= 1/);
  });

  it("re-applying the migration is a no-op (idempotent replay)", async () => {
    await claim(db, "course_nudge");
    await db.exec(pipelineMigration);
    const { rows } = await db.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM public.email_reminder_log`
    );
    expect(rows[0]!.n).toBe(1);
    // Still capped after the replay.
    expect(await claim(db, "course_nudge")).toEqual([]);
  });

  it("keeps the ledger CHECK to exactly the three known kinds", async () => {
    await expect(
      db.exec(
        `INSERT INTO public.email_reminder_log(user_id, kind, sent_on)
         VALUES ('${LAPSED}', 'marketing', CURRENT_DATE)`
      )
    ).rejects.toThrow(/chk_email_reminder_log_kind/);
  });
});

// ── The migration's own shape + the schema.sql mirror ───────────────────────
describe("#899 migration shape + schema.sql mirror", () => {
  it("every function is SECURITY DEFINER + search_path-pinned", () => {
    const defs = pipelineMigration.match(/^CREATE OR REPLACE FUNCTION/gm) ?? [];
    expect(defs.length).toBe(2);
    expect((pipelineMigration.match(/^SECURITY DEFINER$/gm) ?? []).length).toBe(
      2
    );
    expect(
      (pipelineMigration.match(/^SET search_path = ''$/gm) ?? []).length
    ).toBe(2);
  });

  it("grants both RPCs to service_role ALONE", () => {
    for (const fn of [
      "claim_due_reengagement(TEXT, INTEGER, INTEGER, INTEGER, JSONB)",
      "release_reengagement_claims(TEXT, UUID[])",
    ]) {
      expect(pipelineMigration).toContain(
        `REVOKE ALL ON FUNCTION ${fn}\n  FROM PUBLIC, anon, authenticated`
      );
      expect(pipelineMigration).toContain(`GRANT EXECUTE ON FUNCTION ${fn}`);
    }
    expect(pipelineMigration).not.toMatch(
      /GRANT EXECUTE[^\n]*TO (anon|authenticated)/
    );
  });

  it("caps ONLY the two re-engagement kinds", () => {
    expect(pipelineMigration).toContain(
      "v_capped_kinds TEXT[] := ARRAY['reengagement_7d', 'course_nudge']"
    );
  });

  it("does not redefine the session-plan claim", () => {
    expect(pipelineMigration).not.toContain(
      "CREATE OR REPLACE FUNCTION claim_due_session_reminders"
    );
  });

  it("schema.sql mirrors the widened CHECK and both RPCs", () => {
    expect(schema).toContain(
      "CHECK (kind IN ('session_plan', 'reengagement_7d', 'course_nudge'))"
    );
    expect(schema).toContain(
      "CREATE OR REPLACE FUNCTION claim_due_reengagement("
    );
    expect(schema).toContain(
      "CREATE OR REPLACE FUNCTION release_reengagement_claims("
    );
    expect(schema).toContain("idx_email_reminder_log_user_sent_on");
    expect(schema).toContain("idx_user_progress_user_course_completed");
  });
});
