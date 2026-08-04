// Recurring session plans: REAL SQL-execution tests for the multi-day claim
// and the one-shot conversion of the old single-day plans.
//
// The plan picker (#582) committed ONE weekday
// (`prefs.nextLesson = {day, time}`); the day-chips picker commits a LIST
// (`{days: [...], time}`, up to all seven = daily). This migration makes `days`
// the ONLY shape, in two halves:
//   1. converts every stored `{day: "tue"}` to `{days: ["tue"]}`;
//   2. narrows the claim to `(prefs -> 'nextLesson' -> 'days') ? weekday` —
//      the legacy `->> 'day'` comparison is GONE.
//
// Lineage replayed here (repo filename → applied prod ledger version):
//   20260728120000_email_subscriptions.sql      → 20260727200924
//   20260731120000_reminder_consent.sql         → 20260731120914
//   20260731150000_kind_scoped_unsubscribe.sql  → 20260731142948
//   20260731170000_reengagement_pipeline.sql    → (does not touch this RPC)
//   20260804120000_recurring_lesson_plan.sql    → THIS CHANGE (not yet applied)
//
// Fixtures are seeded in the PRE-migration shape and the migration runs OVER
// them, exactly as it will on prod — so the conversion is exercised, not
// simulated.
//
// RED-PROOF: the "pre-fix" block replays the identical fixtures against the
// lineage WITHOUT this migration, where a `days` learner is NOT claimed and a
// `{day}` learner IS — the exact inverse of the post-fix expectations. Reverting
// the migration turns every post-fix assertion into the pre-fix result.
//
// TIMEZONE (#956): every date anchor below is computed from
// `(now() AT TIME ZONE 'America/Sao_Paulo')::date`, never from
// `(now() - interval)::date` — the pglite session timezone is NOT São Paulo, so
// a UTC-anchored fixture drifts across the day boundary the RPC keys on.
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
const recurringMigration = readMigration(
  "20260804120000_recurring_lesson_plan.sql"
);
const schema = readFileSync(resolve(repoRoot, "supabase/schema.sql"), "utf8");

// Objects created outside these migrations (Supabase roles, auth schema,
// profiles). Same stub the #869/#896 suites use, plus the two `prefs` CHECKs
// from #582 — the conversion writes `prefs`, so its bounds must be real here.
const STUB_SETUP = `
  CREATE ROLE anon;
  CREATE ROLE authenticated;
  CREATE ROLE service_role;
  CREATE SCHEMA IF NOT EXISTS auth;
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS 'SELECT NULL::uuid';
  CREATE TABLE auth.users (id uuid PRIMARY KEY, email text);
  CREATE TABLE public.profiles (
    id uuid PRIMARY KEY,
    prefs jsonb NOT NULL DEFAULT '{}'
      CONSTRAINT chk_profiles_prefs_object CHECK (jsonb_typeof(prefs) = 'object')
      CONSTRAINT chk_profiles_prefs_size   CHECK (pg_column_size(prefs) <= 2048)
  );
`;

/** Seeded in the OLD shape — the migration must convert it. */
const CONVERTED = "11111111-1111-1111-1111-111111111111";
/** Old shape for another weekday — converted, and due on that day only. */
const CONVERTED_OTHER = "66666666-6666-6666-6666-666666666666";
/** New multi-day plan that INCLUDES today. */
const MULTI_TODAY = "22222222-2222-2222-2222-222222222222";
/** New multi-day plan that EXCLUDES today. */
const MULTI_OTHER = "33333333-3333-3333-3333-333333333333";
/** All seven days — "daily". */
const DAILY = "44444444-4444-4444-4444-444444444444";
/** Both keys on one row: the array wins, the stale `day` is dropped. */
const BOTH_KEYS = "55555555-5555-5555-5555-555555555555";

const WEEK = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

/** The weekday token the claim RPC computes for "today" in São Paulo. */
const TODAY = WEEK[
  new Date(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date()) + "T12:00:00Z"
  ).getUTCDay()
] as string;
const OTHERS = WEEK.filter((d) => d !== TODAY);
const [OTHER_A, OTHER_B] = OTHERS as unknown as [string, string];

const json = (v: unknown) => JSON.stringify(v).replace(/'/g, "''");

/** Plans as they exist BEFORE the migration (old and new shapes side by side). */
const PLANS: Record<string, unknown> = {
  // Old shape, plus neighbours the conversion must preserve: another key inside
  // `nextLesson`, and another key beside it in `prefs`.
  [CONVERTED]: {
    theme: "dark",
    nextLesson: { day: TODAY, time: "19:00", notify: "email" },
  },
  [CONVERTED_OTHER]: { nextLesson: { day: OTHER_A, time: "08:00" } },
  [MULTI_TODAY]: { nextLesson: { days: [OTHER_A, TODAY], time: "07:30" } },
  [MULTI_OTHER]: { nextLesson: { days: [OTHER_A, OTHER_B], time: "21:00" } },
  [DAILY]: { nextLesson: { days: [...WEEK], time: "06:00" } },
  [BOTH_KEYS]: {
    nextLesson: { day: TODAY, days: [OTHER_A], time: "12:00" },
  },
};

const EMAILS: Record<string, string> = {
  [CONVERTED]: "converted@example.com",
  [CONVERTED_OTHER]: "converted-other@example.com",
  [MULTI_TODAY]: "multi-today@example.com",
  [MULTI_OTHER]: "multi-other@example.com",
  [DAILY]: "daily@example.com",
  [BOTH_KEYS]: "both-keys@example.com",
};

const SEED = `
  INSERT INTO public.profiles(id, prefs) VALUES
    ${Object.entries(PLANS)
      .map(([id, prefs]) => `('${id}', '${json(prefs)}')`)
      .join(",\n    ")};

  INSERT INTO auth.users(id, email) VALUES
    ${Object.entries(EMAILS)
      .map(([id, email]) => `('${id}', '${email}')`)
      .join(",\n    ")};

  INSERT INTO public.email_subscriptions(user_id, opt_in, reminder_opt_in, reminder_consent_at, reminder_locale) VALUES
    ${Object.keys(EMAILS)
      .map((id) => `('${id}', false, true, now(), 'pt-BR')`)
      .join(",\n    ")};
`;

/** Frees every claim slot again. */
const RESET = `DELETE FROM public.email_reminder_log;`;

/** Puts the seeded plans back, for tests that rewrite `prefs` in place. */
const RESTORE_PREFS = `
  UPDATE public.profiles SET prefs = v.prefs::jsonb
  FROM (VALUES
    ${Object.entries(PLANS)
      .map(([id, prefs]) => `('${id}', '${json(prefs)}')`)
      .join(",\n    ")}
  ) AS v(id, prefs)
  WHERE profiles.id = v.id::uuid;
`;

interface ClaimRow {
  user_id: string;
  email: string;
  unsubscribe_token: string;
  locale: string | null;
  plan_time: string;
}

/** Seeds the PRE-migration data, then (optionally) runs the migration over it. */
async function build(withRecurring: boolean): Promise<PGlite> {
  const pg = await PGlite.create();
  await pg.exec(STUB_SETUP);
  for (const sql of LINEAGE) await pg.exec(sql);
  await pg.exec(SEED);
  if (withRecurring) await pg.exec(recurringMigration);
  return pg;
}

async function claim(pg: PGlite, weekday?: string): Promise<ClaimRow[]> {
  const { rows } = await pg.query<ClaimRow>(
    "SELECT * FROM public.claim_due_session_reminders($1)",
    [weekday ?? null]
  );
  return rows;
}

const ids = (rows: ClaimRow[]) => rows.map((r) => r.user_id);

async function planOf(pg: PGlite, userId: string): Promise<unknown> {
  const { rows } = await pg.query<{ plan: unknown }>(
    "SELECT prefs -> 'nextLesson' AS plan FROM public.profiles WHERE id = $1",
    [userId]
  );
  return rows[0]!.plan;
}

let db: PGlite;

// ── RED: before the migration, only the single `day` is honoured ────────────
describe("recurring plans RED — pre-migration behaviour", () => {
  beforeAll(async () => {
    db = await build(false);
  }, 60_000);
  beforeEach(async () => {
    await db.exec(RESET);
  });
  afterAll(async () => {
    await db.close();
  });

  it("claims the OLD single-day shape", async () => {
    expect(ids(await claim(db))).toContain(CONVERTED);
  });

  it("does NOT claim a `days` plan containing today (the limitation)", async () => {
    const claimed = ids(await claim(db));
    expect(claimed).not.toContain(MULTI_TODAY);
    expect(claimed).not.toContain(DAILY);
  });

  it("stores the plans in the old shape (nothing converted them yet)", async () => {
    expect(await planOf(db, CONVERTED)).toMatchObject({ day: TODAY });
  });
});

// ── GREEN — the conversion ──────────────────────────────────────────────────
describe("recurring plans GREEN — one-shot `{day}` → `{days:[…]}` conversion", () => {
  beforeAll(async () => {
    db = await build(true);
  }, 60_000);
  beforeEach(async () => {
    await db.exec(RESET);
    await db.exec(RESTORE_PREFS);
    // RESTORE_PREFS re-introduces the pre-migration shapes, so re-run the
    // migration (idempotent) to put the table back in its post-migration state.
    await db.exec(recurringMigration);
  });
  afterAll(async () => {
    await db.close();
  });

  it("rewrites `{day}` to a one-element `days`, keeping every neighbour key", async () => {
    expect(await planOf(db, CONVERTED)).toEqual({
      days: [TODAY],
      time: "19:00",
      notify: "email", // sibling inside nextLesson survives
    });
    const { rows } = await db.query<{ theme: string }>(
      "SELECT prefs ->> 'theme' AS theme FROM public.profiles WHERE id = $1",
      [CONVERTED]
    );
    expect(rows[0]!.theme).toBe("dark"); // sibling of nextLesson survives
  });

  it("leaves no `day` key anywhere, and gives every plan a `days`", async () => {
    const { rows } = await db.query<{
      legacy_left: number;
      converted: number;
      plans: number;
    }>(`SELECT count(*) FILTER (WHERE prefs -> 'nextLesson' ? 'day')::int  AS legacy_left,
               count(*) FILTER (WHERE prefs -> 'nextLesson' ? 'days')::int AS converted,
               count(*) FILTER (WHERE prefs ? 'nextLesson')::int           AS plans
        FROM public.profiles`);
    expect(rows[0]).toEqual({
      legacy_left: 0,
      converted: Object.keys(PLANS).length,
      plans: Object.keys(PLANS).length,
    });
  });

  it("leaves already-converted `days` plans byte-identical", async () => {
    expect(await planOf(db, DAILY)).toEqual({ days: [...WEEK], time: "06:00" });
    expect(await planOf(db, MULTI_OTHER)).toEqual({
      days: [OTHER_A, OTHER_B],
      time: "21:00",
    });
  });

  it("a row carrying BOTH keys keeps its array and drops the stale `day`", async () => {
    expect(await planOf(db, BOTH_KEYS)).toEqual({
      days: [OTHER_A],
      time: "12:00",
    });
  });

  it("is idempotent: a second run of the whole migration changes nothing", async () => {
    const before = await planOf(db, CONVERTED);
    await db.exec(recurringMigration);
    await db.exec(recurringMigration);
    expect(await planOf(db, CONVERTED)).toEqual(before);
  });

  it("touches no profile without a plan, and no malformed plan", async () => {
    const NOPLAN = "77777777-7777-7777-7777-777777777777";
    await db.exec(
      `INSERT INTO public.profiles(id, prefs) VALUES ('${NOPLAN}', '{"theme":"light"}')
       ON CONFLICT (id) DO UPDATE SET prefs = '{"theme":"light"}'::jsonb`
    );
    const MALFORMED = "88888888-8888-8888-8888-888888888888";
    await db.exec(
      `INSERT INTO public.profiles(id, prefs) VALUES ('${MALFORMED}', '{"nextLesson":"day"}')
       ON CONFLICT (id) DO UPDATE SET prefs = '{"nextLesson":"day"}'::jsonb`
    );
    await db.exec(recurringMigration);
    const { rows } = await db.query<{ id: string; prefs: unknown }>(
      "SELECT id, prefs FROM public.profiles WHERE id = ANY($1)",
      [[NOPLAN, MALFORMED]]
    );
    expect(rows.find((r) => r.id === NOPLAN)!.prefs).toEqual({
      theme: "light",
    });
    expect(rows.find((r) => r.id === MALFORMED)!.prefs).toEqual({
      nextLesson: "day",
    });
  });
});

// ── GREEN — the claim, on `days[]` only ─────────────────────────────────────
describe("recurring plans GREEN — claim gates on `days[]` alone", () => {
  beforeAll(async () => {
    db = await build(true);
  }, 60_000);
  beforeEach(async () => {
    await db.exec(RESET);
    await db.exec(RESTORE_PREFS);
    await db.exec(recurringMigration);
  });
  afterAll(async () => {
    await db.close();
  });

  it("(a) a CONVERTED plan claims exactly as its `{day}` used to", async () => {
    const rows = await claim(db);
    expect(ids(rows)).toContain(CONVERTED);
    expect(rows.find((r) => r.user_id === CONVERTED)).toMatchObject({
      email: EMAILS[CONVERTED],
      locale: "pt-BR",
      plan_time: "19:00", // the time survived the rewrite
    });
    // …and one converted for another weekday is due on THAT day only.
    expect(ids(rows)).not.toContain(CONVERTED_OTHER);
    await db.exec(RESET);
    expect(ids(await claim(db, OTHER_A))).toContain(CONVERTED_OTHER);
  });

  it("(b) a `{day}` row appearing AFTER the migration does NOT claim", async () => {
    // Proves the legacy read is really gone: a stale writer's row is silently
    // ineligible (and therefore visible as a bug) rather than quietly honoured.
    await db.exec(
      `UPDATE public.profiles
       SET prefs = '{"nextLesson":{"day":"${TODAY}","time":"19:00"}}'::jsonb
       WHERE id = '${MULTI_TODAY}'`
    );
    expect(ids(await claim(db))).not.toContain(MULTI_TODAY);
  });

  it("(c) a `{days}` containing today is claimed, with its plan time", async () => {
    const rows = await claim(db);
    expect(ids(rows)).toContain(MULTI_TODAY);
    expect(rows.find((r) => r.user_id === MULTI_TODAY)).toMatchObject({
      email: EMAILS[MULTI_TODAY],
      plan_time: "07:30",
    });
  });

  it("(d) a `{days}` WITHOUT today is not claimed — and is on its own days", async () => {
    expect(ids(await claim(db))).not.toContain(MULTI_OTHER);

    await db.exec(RESET);
    expect(ids(await claim(db, OTHER_A))).toContain(MULTI_OTHER);
    await db.exec(RESET);
    expect(ids(await claim(db, OTHER_B))).toContain(MULTI_OTHER);
  });

  it("(e) all seven days ⇒ claimed on EVERY weekday", async () => {
    for (const day of WEEK) {
      await db.exec(RESET);
      expect(ids(await claim(db, day))).toContain(DAILY);
    }
  });

  it("(f) idempotency is unchanged: a second claim the same day is empty", async () => {
    const first = await claim(db);
    expect(ids(first).sort()).toEqual([CONVERTED, MULTI_TODAY, DAILY].sort());
    expect(await claim(db)).toEqual([]);
    expect(await claim(db)).toEqual([]);

    // …and a daily planner still gets exactly ONE ledger row for the day.
    const { rows } = await db.query<{ n: number }>(
      "SELECT count(*)::int AS n FROM public.email_reminder_log WHERE user_id = $1",
      [DAILY]
    );
    expect(rows[0]!.n).toBe(1);
  });

  it("a malformed or absent plan is never due (fail-closed)", async () => {
    const cases = [
      "{}",
      '{"nextLesson":{}}',
      '{"nextLesson":{"days":[],"time":"09:00"}}',
      // Non-string elements: `?` is FALSE rather than an error.
      '{"nextLesson":{"days":[1,2],"time":"09:00"}}',
    ];
    for (const prefs of cases) {
      await db.exec(RESET);
      await db.exec(
        `UPDATE public.profiles SET prefs = '${prefs}'::jsonb WHERE id = '${MULTI_TODAY}'`
      );
      expect(ids(await claim(db))).not.toContain(MULTI_TODAY);
    }
  });

  it("yesterday's ledger row does not block a daily planner today", async () => {
    // #956: anchored on the São Paulo date, NOT on (now() - interval)::date.
    await db.exec(
      `INSERT INTO public.email_reminder_log(user_id, kind, sent_on)
       VALUES ('${DAILY}', 'session_plan',
               ((now() AT TIME ZONE 'America/Sao_Paulo')::date - 1))`
    );
    expect(ids(await claim(db))).toContain(DAILY);
  });

  it("reminder consent is still required, whatever the plan", async () => {
    await db.exec(
      `UPDATE public.email_subscriptions SET reminder_opt_in = false, opt_in = true
       WHERE user_id IN ('${MULTI_TODAY}', '${DAILY}')`
    );
    const claimed = ids(await claim(db));
    expect(claimed).not.toContain(MULTI_TODAY);
    expect(claimed).not.toContain(DAILY);
  });

  it("still hands out the REMINDER-scoped unsubscribe token (#896)", async () => {
    const rows = await claim(db);
    const { rows: expected } = await db.query<{
      user_id: string;
      reminder_unsubscribe_token: string;
      unsubscribe_token: string;
    }>(
      "SELECT user_id, reminder_unsubscribe_token, unsubscribe_token FROM public.email_subscriptions"
    );
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) {
      const e = expected.find((x) => x.user_id === r.user_id)!;
      expect(r.unsubscribe_token).toBe(e.reminder_unsubscribe_token);
      expect(r.unsubscribe_token).not.toBe(e.unsubscribe_token);
    }
  });
});

// ── Static guards on the migration text (house pattern) ─────────────────────
describe("recurring plans — migration text", () => {
  it("gates on `days` and no longer on the legacy `day`", () => {
    expect(recurringMigration).toContain(
      "AND (p.prefs -> 'nextLesson' -> 'days') ? v_weekday"
    );
    expect(recurringMigration).not.toContain(
      "p.prefs -> 'nextLesson' ->> 'day' = v_weekday"
    );
  });

  it("converts the stored plans, guarded so a re-run is a no-op", () => {
    expect(recurringMigration).toMatch(/UPDATE public\.profiles/);
    expect(recurringMigration).toContain(
      "WHERE jsonb_typeof(prefs -> 'nextLesson') = 'object'\n  AND prefs -> 'nextLesson' ? 'day';"
    );
  });

  it("keeps the signature, so the app read and the #731 probe are untouched", () => {
    expect(recurringMigration).toContain(
      "CREATE OR REPLACE FUNCTION claim_due_session_reminders(p_weekday TEXT DEFAULT NULL)\n" +
        "RETURNS TABLE (user_id UUID, email TEXT, unsubscribe_token UUID, locale TEXT, plan_time TEXT)"
    );
  });

  it("keeps SECURITY DEFINER, a pinned search_path and service_role-ONLY grants", () => {
    expect(recurringMigration).toContain("SECURITY DEFINER");
    expect(recurringMigration).toContain("SET search_path = ''");
    expect(recurringMigration).toContain(
      "REVOKE ALL ON FUNCTION claim_due_session_reminders(TEXT) FROM PUBLIC, anon, authenticated;"
    );
    expect(recurringMigration).toContain(
      "GRANT EXECUTE ON FUNCTION claim_due_session_reminders(TEXT) TO service_role;"
    );
    expect(recurringMigration).not.toMatch(
      /GRANT EXECUTE[^\n]*TO (anon|authenticated)/
    );
  });

  it("schema.sql mirrors the days-only predicate", () => {
    expect(schema).toContain(
      "AND (p.prefs -> 'nextLesson' -> 'days') ? v_weekday"
    );
    expect(schema).not.toContain(
      "p.prefs -> 'nextLesson' ->> 'day' = v_weekday"
    );
  });
});
