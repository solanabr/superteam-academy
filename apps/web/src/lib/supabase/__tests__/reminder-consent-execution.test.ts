// #869: REAL SQL-execution tests for the reminder-consent RPCs.
//
// The guard test (reminder-consent-guard.test.ts) only string-matches the SQL,
// which cannot catch a function body that PARSES but THROWS or returns the wrong
// rows — the #779 `GET DIAGNOSTICS v_matched BOOLEAN` class of bug. These tests
// execute the #779 + #869 migrations in an in-process Postgres (pglite) and
// invoke the RPCs for real, pinning the behaviours the feature turns on:
//   * consent gating   — no reminder consent ⇒ never a recipient
//   * consent SEPARATION — marketing consent alone never produces a reminder,
//                          and unsubscribing one never clears the other
//   * idempotency      — one claim per learner per São Paulo day, even on a
//                        second (or concurrent) run
//   * plan gating      — a plan for a different weekday is not due today
//
// @vitest-environment node
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { describe, it, expect, beforeEach, afterEach } from "vitest";

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

const marketingMigration = readMigration(
  "20260728120000_email_subscriptions.sql"
);
const reminderMigration = readMigration("20260731120000_reminder_consent.sql");

// Objects created OUTSIDE these migrations (Supabase roles, auth schema,
// profiles). Nothing here duplicates logic under test. `profiles.prefs` carries
// the committed plan the claim RPC reads (#582).
const STUB_SETUP = `
  CREATE ROLE anon;
  CREATE ROLE authenticated;
  CREATE ROLE service_role;
  CREATE SCHEMA IF NOT EXISTS auth;
  CREATE TABLE auth.users (id uuid PRIMARY KEY, email text);
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS 'SELECT NULL::uuid';
  CREATE TABLE public.profiles (id uuid PRIMARY KEY, prefs jsonb NOT NULL DEFAULT '{}');
`;

const PLANNER = "11111111-1111-1111-1111-111111111111";
const NO_CONSENT = "22222222-2222-2222-2222-222222222222";
const MARKETING_ONLY = "33333333-3333-3333-3333-333333333333";
const OTHER_DAY = "44444444-4444-4444-4444-444444444444";
const WALLET_ONLY = "55555555-5555-5555-5555-555555555555";

/** The weekday token the claim RPC will compute for "today" in São Paulo. */
const TODAY = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][
  new Date(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date()) + "T12:00:00Z"
  ).getUTCDay()
] as string;
const NOT_TODAY = TODAY === "mon" ? "tue" : "mon";

interface ClaimRow {
  user_id: string;
  email: string;
  unsubscribe_token: string;
  locale: string | null;
  plan_time: string;
}

async function claim(db: PGlite, weekday?: string): Promise<ClaimRow[]> {
  const { rows } = await db.query<ClaimRow>(
    "SELECT * FROM public.claim_due_session_reminders($1)",
    [weekday ?? null]
  );
  return rows;
}

let db: PGlite;

beforeEach(async () => {
  db = await PGlite.create();
  await db.exec(STUB_SETUP);
  await db.exec(marketingMigration);
  await db.exec(reminderMigration);

  await db.exec(`
    INSERT INTO public.profiles(id, prefs) VALUES
      ('${PLANNER}',        '{"nextLesson":{"day":"${TODAY}","time":"19:00"}}'),
      ('${NO_CONSENT}',     '{"nextLesson":{"day":"${TODAY}","time":"19:00"}}'),
      ('${MARKETING_ONLY}', '{"nextLesson":{"day":"${TODAY}","time":"19:00"}}'),
      ('${OTHER_DAY}',      '{"nextLesson":{"day":"${NOT_TODAY}","time":"19:00"}}'),
      ('${WALLET_ONLY}',    '{"nextLesson":{"day":"${TODAY}","time":"19:00"}}');

    INSERT INTO auth.users(id, email) VALUES
      ('${PLANNER}',        'planner@example.com'),
      ('${NO_CONSENT}',     'quiet@example.com'),
      ('${MARKETING_ONLY}', 'news@example.com'),
      ('${OTHER_DAY}',      'thursday@example.com'),
      ('${WALLET_ONLY}',    'So1111111111111111111111111111111111111111@wallet.superteam-lms.local');

    INSERT INTO public.email_subscriptions(user_id, opt_in, reminder_opt_in, reminder_consent_at, reminder_locale) VALUES
      ('${PLANNER}',        false, true,  now(), 'pt-BR'),
      ('${NO_CONSENT}',     false, false, NULL,  NULL),
      -- Marketing opt-in WITHOUT reminder consent: the separation case.
      ('${MARKETING_ONLY}', true,  false, NULL,  NULL),
      ('${OTHER_DAY}',      false, true,  now(), NULL),
      ('${WALLET_ONLY}',    false, true,  now(), NULL);
  `);
});

afterEach(async () => {
  await db.close();
});

describe("#869 claim_due_session_reminders — consent gating", () => {
  it("returns ONLY the consenting learner planned for today", async () => {
    const rows = await claim(db);
    expect(rows.map((r) => r.email)).toEqual(["planner@example.com"]);
    expect(rows[0]).toMatchObject({ locale: "pt-BR", plan_time: "19:00" });
  });

  it("a MARKETING opt-in alone never produces a reminder recipient", async () => {
    const rows = await claim(db);
    expect(rows.map((r) => r.user_id)).not.toContain(MARKETING_ONLY);
  });

  it("no reminder consent ⇒ no recipient, even with a plan for today", async () => {
    const rows = await claim(db);
    expect(rows.map((r) => r.user_id)).not.toContain(NO_CONSENT);
  });

  it("a plan for another weekday is not due today", async () => {
    expect((await claim(db)).map((r) => r.user_id)).not.toContain(OTHER_DAY);
    // …and IS due when that weekday comes around.
    await db.exec("DELETE FROM public.email_reminder_log");
    expect((await claim(db, NOT_TODAY)).map((r) => r.user_id)).toContain(
      OTHER_DAY
    );
  });

  it("never returns a synthetic wallet-auth address", async () => {
    const rows = await claim(db);
    expect(rows.map((r) => r.user_id)).not.toContain(WALLET_ONLY);
  });

  it("skips a consenting learner who has committed no plan at all", async () => {
    await db.exec(
      `UPDATE public.profiles SET prefs = '{}' WHERE id = '${PLANNER}'`
    );
    expect(await claim(db)).toEqual([]);
  });
});

describe("#869 claim_due_session_reminders — idempotency", () => {
  it("claims a learner ONCE per day: a second run returns nothing", async () => {
    expect((await claim(db)).length).toBe(1);
    expect(await claim(db)).toEqual([]);
    expect(await claim(db)).toEqual([]);
  });

  it("writes exactly one ledger row for the day", async () => {
    await claim(db);
    await claim(db);
    const { rows } = await db.query<{ n: number }>(
      "SELECT count(*)::int AS n FROM public.email_reminder_log WHERE user_id = $1",
      [PLANNER]
    );
    expect(rows[0]!.n).toBe(1);
  });

  it("a released claim can be re-sent the same day (failed-batch retry)", async () => {
    expect((await claim(db)).length).toBe(1);
    const { rows } = await db.query<{ freed: number }>(
      "SELECT public.release_session_reminder_claims($1) AS freed",
      [[PLANNER]]
    );
    expect(rows[0]!.freed).toBe(1);
    expect((await claim(db)).length).toBe(1);
  });

  it("yesterday's ledger row does not block today", async () => {
    await db.exec(
      `INSERT INTO public.email_reminder_log(user_id, kind, sent_on)
       VALUES ('${PLANNER}', 'session_plan',
               ((now() AT TIME ZONE 'America/Sao_Paulo')::date - 1))`
    );
    expect((await claim(db)).length).toBe(1);
  });
});

describe("#869 unsubscribe_reminders_by_token — clears reminder consent ONLY", () => {
  async function tokenFor(userId: string): Promise<string> {
    const { rows } = await db.query<{ unsubscribe_token: string }>(
      "SELECT unsubscribe_token FROM public.email_subscriptions WHERE user_id = $1",
      [userId]
    );
    return rows[0]!.unsubscribe_token;
  }

  it("flips reminder_opt_in and leaves marketing opt_in untouched", async () => {
    await db.exec(
      `UPDATE public.email_subscriptions SET opt_in = true WHERE user_id = '${PLANNER}'`
    );
    const { rows } = await db.query<{ matched: boolean }>(
      "SELECT public.unsubscribe_reminders_by_token($1) AS matched",
      [await tokenFor(PLANNER)]
    );
    expect(rows[0]!.matched).toBe(true);

    const { rows: after } = await db.query<{
      opt_in: boolean;
      reminder_opt_in: boolean;
      reminder_unsubscribed_at: string | null;
    }>(
      "SELECT opt_in, reminder_opt_in, reminder_unsubscribed_at FROM public.email_subscriptions WHERE user_id = $1",
      [PLANNER]
    );
    expect(after[0]!.reminder_opt_in).toBe(false);
    expect(after[0]!.reminder_unsubscribed_at).not.toBeNull();
    expect(after[0]!.opt_in).toBe(true); // product news survives
  });

  it("the MARKETING unsubscribe leaves reminder consent untouched", async () => {
    await db.query("SELECT public.unsubscribe_by_token($1)", [
      await tokenFor(PLANNER),
    ]);
    const { rows } = await db.query<{ reminder_opt_in: boolean }>(
      "SELECT reminder_opt_in FROM public.email_subscriptions WHERE user_id = $1",
      [PLANNER]
    );
    expect(rows[0]!.reminder_opt_in).toBe(true);
  });

  it("an unsubscribed learner is no longer claimed", async () => {
    await db.query("SELECT public.unsubscribe_reminders_by_token($1)", [
      await tokenFor(PLANNER),
    ]);
    expect(await claim(db)).toEqual([]);
  });

  it("a bogus token returns false and changes nothing", async () => {
    const { rows } = await db.query<{ matched: boolean }>(
      "SELECT public.unsubscribe_reminders_by_token($1) AS matched",
      ["99999999-9999-9999-9999-999999999999"]
    );
    expect(rows[0]!.matched).toBe(false);
    expect((await claim(db)).length).toBe(1);
  });
});

describe("#869 set_reminder_opt_in — self-service consent write", () => {
  it("refuses an unauthenticated caller (auth.uid() IS NULL)", async () => {
    await expect(
      db.query("SELECT public.set_reminder_opt_in(true, 'en')")
    ).rejects.toThrow(/not authenticated/);
  });

  it("stamps consent server-side and never touches marketing consent", async () => {
    await db.exec(
      `CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE
         AS 'SELECT ''${MARKETING_ONLY}''::uuid'`
    );
    await db.query("SELECT public.set_reminder_opt_in(true, 'es')");
    const { rows } = await db.query<{
      opt_in: boolean;
      reminder_opt_in: boolean;
      reminder_consent_at: string | null;
      reminder_locale: string | null;
    }>(
      "SELECT opt_in, reminder_opt_in, reminder_consent_at, reminder_locale FROM public.email_subscriptions WHERE user_id = $1",
      [MARKETING_ONLY]
    );
    expect(rows[0]).toMatchObject({
      opt_in: true, // untouched
      reminder_opt_in: true,
      reminder_locale: "es",
    });
    expect(rows[0]!.reminder_consent_at).not.toBeNull();
  });

  it("creates the row lazily for a learner who has none", async () => {
    const FRESH = "66666666-6666-6666-6666-666666666666";
    await db.exec(`INSERT INTO public.profiles(id) VALUES ('${FRESH}')`);
    await db.exec(
      `CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE
         AS 'SELECT ''${FRESH}''::uuid'`
    );
    await db.query("SELECT public.set_reminder_opt_in(true, 'en')");
    const { rows } = await db.query<{
      opt_in: boolean;
      reminder_opt_in: boolean;
    }>(
      "SELECT opt_in, reminder_opt_in FROM public.email_subscriptions WHERE user_id = $1",
      [FRESH]
    );
    // Lazily created with marketing still OPT-OUT — consent is purpose-bound.
    expect(rows[0]).toMatchObject({ opt_in: false, reminder_opt_in: true });
  });

  it("an unknown locale is dropped, not stored (CHECK never trips)", async () => {
    await db.exec(
      `CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE
         AS 'SELECT ''${NO_CONSENT}''::uuid'`
    );
    await db.query("SELECT public.set_reminder_opt_in(true, 'zz-ZZ')");
    const { rows } = await db.query<{ reminder_locale: string | null }>(
      "SELECT reminder_locale FROM public.email_subscriptions WHERE user_id = $1",
      [NO_CONSENT]
    );
    expect(rows[0]!.reminder_locale).toBeNull();
  });

  it("opting out stamps reminder_unsubscribed_at and stops the claim", async () => {
    await db.exec(
      `CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE
         AS 'SELECT ''${PLANNER}''::uuid'`
    );
    await db.query("SELECT public.set_reminder_opt_in(false, NULL)");
    const { rows } = await db.query<{
      reminder_opt_in: boolean;
      reminder_unsubscribed_at: string | null;
      reminder_locale: string | null;
    }>(
      "SELECT reminder_opt_in, reminder_unsubscribed_at, reminder_locale FROM public.email_subscriptions WHERE user_id = $1",
      [PLANNER]
    );
    expect(rows[0]!.reminder_opt_in).toBe(false);
    expect(rows[0]!.reminder_unsubscribed_at).not.toBeNull();
    // A NULL locale keeps the last known one rather than erasing it.
    expect(rows[0]!.reminder_locale).toBe("pt-BR");
    expect(await claim(db)).toEqual([]);
  });
});
