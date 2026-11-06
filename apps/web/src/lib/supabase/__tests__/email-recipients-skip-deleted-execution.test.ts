// #1129 / #1118: real SQL-execution proof, in pglite, that a soft-deleted account
// is never a mail recipient, that list_marketing_recipients drops placeholders
// whatever their case, and that the migration's backfill opts out accounts that
// were deleted before this change.
//
// Each RPC body comes from the migration files, in apply order. The first
// describe replays the lineage WITHOUT the fix and shows the hole.
//
// @vitest-environment node
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

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
  "20260731170000_reengagement_pipeline.sql",
  "20260804120000_recurring_lesson_plan.sql",
  "20260819190000_email_claim_consent_recheck.sql",
].map(readMigration);
const FIX = readMigration("20261105120000_email_recipients_skip_deleted.sql");

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
    created_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
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
  const c = String(n);
  return `${c.repeat(8)}-${c.repeat(4)}-${c.repeat(4)}-${c.repeat(4)}-${c.repeat(12)}`;
};

const LIVE = uid(1);
const DELETED = uid(2);
const MIXED_CASE_PLACEHOLDER = uid(3);
const OPTED_OUT_THEN_DELETED = uid(4);

const WEEK = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
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

const EARLIER_OPT_OUT = "2026-01-02T03:04:05+00:00";

// Every account is due for all three pipelines, so only the gates under test
// decide who gets picked.
const SEED = `
  INSERT INTO public.profiles(id, prefs, created_at, deleted_at) VALUES
    ('${LIVE}', '{"nextLesson":{"days":["${TODAY}"],"time":"19:00"}}', now() - interval '200 days', NULL),
    ('${DELETED}', '{"nextLesson":{"days":["${TODAY}"],"time":"19:00"}}', now() - interval '200 days', now()),
    ('${MIXED_CASE_PLACEHOLDER}', '{"nextLesson":{"days":["${TODAY}"],"time":"19:00"}}', now() - interval '200 days', NULL),
    ('${OPTED_OUT_THEN_DELETED}', '{}', now() - interval '200 days', now());

  INSERT INTO auth.users(id, email) VALUES
    ('${LIVE}', 'live@example.com'),
    ('${DELETED}', 'deleted@example.com'),
    ('${MIXED_CASE_PLACEHOLDER}', 'AbC123@Wallet.Superteam-LMS.LOCAL'),
    ('${OPTED_OUT_THEN_DELETED}', 'gone@example.com');

  INSERT INTO public.email_subscriptions(
    user_id, opt_in, consent_at, reminder_opt_in, reminder_consent_at, reminder_locale
  ) VALUES
    ('${LIVE}', true, now(), true, now(), 'pt-BR'),
    ('${DELETED}', true, now(), true, now(), 'pt-BR'),
    ('${MIXED_CASE_PLACEHOLDER}', true, now(), true, now(), 'pt-BR');

  INSERT INTO public.email_subscriptions(
    user_id, opt_in, unsubscribed_at, reminder_opt_in, reminder_unsubscribed_at
  ) VALUES
    ('${OPTED_OUT_THEN_DELETED}', false, '${EARLIER_OPT_OUT}', false, '${EARLIER_OPT_OUT}');

  INSERT INTO public.user_xp(user_id, longest_streak, last_activity_date)
  SELECT id, 5, ((now() AT TIME ZONE 'America/Sao_Paulo')::date - 30)
  FROM public.profiles;
`;

async function build(): Promise<PGlite> {
  const pg = await PGlite.create();
  await pg.exec(STUB_SETUP);
  for (const sql of LINEAGE) await pg.exec(sql);
  await pg.exec(SEED);
  return pg;
}

const ids = (rows: { user_id: string }[]) => rows.map((r) => r.user_id).sort();

async function marketing(pg: PGlite): Promise<string[]> {
  const { rows } = await pg.query<{ user_id: string }>(
    "SELECT user_id FROM public.list_marketing_recipients()"
  );
  return ids(rows);
}
async function session(pg: PGlite): Promise<string[]> {
  const { rows } = await pg.query<{ user_id: string }>(
    "SELECT user_id FROM public.claim_due_session_reminders($1)",
    [TODAY]
  );
  return ids(rows);
}
async function reengagement(pg: PGlite): Promise<string[]> {
  const { rows } = await pg.query<{ user_id: string }>(
    "SELECT user_id FROM public.claim_due_reengagement('reengagement_7d', 7, 14)"
  );
  return ids(rows);
}

// Re-arm consent after the backfill, so the filter is proven on its own: an
// account that opts in again while tombstoned must still not be picked.
const REARM_DELETED = `
  UPDATE public.email_subscriptions
  SET opt_in = true, reminder_opt_in = true
  WHERE user_id = '${DELETED}';
`;

describe("before the fix (red proof)", () => {
  let db: PGlite;
  beforeAll(async () => {
    db = await build();
  }, 60_000);
  afterAll(async () => {
    await db.close();
  });
  beforeEach(async () => {
    await db.exec("DELETE FROM public.email_reminder_log;");
  });

  it("all three RPCs pick a deleted account with live consent", async () => {
    expect(await marketing(db)).toContain(DELETED);
    expect(await session(db)).toContain(DELETED);
    expect(await reengagement(db)).toContain(DELETED);
  });

  it("list_marketing_recipients returns a mixed-case placeholder", async () => {
    expect(await marketing(db)).toContain(MIXED_CASE_PLACEHOLDER);
  });
});

describe("after the fix", () => {
  let db: PGlite;
  beforeAll(async () => {
    db = await build();
    await db.exec(FIX);
  }, 60_000);
  afterAll(async () => {
    await db.close();
  });
  beforeEach(async () => {
    await db.exec("DELETE FROM public.email_reminder_log;");
  });

  describe("the backfill", () => {
    const row = async (id: string) => {
      const { rows } = await db.query<{
        opt_in: boolean;
        reminder_opt_in: boolean;
        unsubscribed_at: Date | null;
        reminder_unsubscribed_at: Date | null;
      }>(
        `SELECT opt_in, reminder_opt_in, unsubscribed_at, reminder_unsubscribed_at
         FROM public.email_subscriptions WHERE user_id = $1`,
        [id]
      );
      return rows[0]!;
    };

    it("opts out a deleted account and stamps when", async () => {
      const r = await row(DELETED);
      expect(r.opt_in).toBe(false);
      expect(r.reminder_opt_in).toBe(false);
      expect(r.unsubscribed_at).not.toBeNull();
      expect(r.reminder_unsubscribed_at).not.toBeNull();
    });

    it("keeps the date of an opt-out that happened earlier", async () => {
      const r = await row(OPTED_OUT_THEN_DELETED);
      expect(r.unsubscribed_at?.toISOString()).toBe(
        new Date(EARLIER_OPT_OUT).toISOString()
      );
      expect(r.reminder_unsubscribed_at?.toISOString()).toBe(
        new Date(EARLIER_OPT_OUT).toISOString()
      );
    });

    it("leaves a live account's consent alone", async () => {
      const r = await row(LIVE);
      expect(r.opt_in).toBe(true);
      expect(r.reminder_opt_in).toBe(true);
      expect(r.unsubscribed_at).toBeNull();
    });

    it("is safe to re-run", async () => {
      const before = await row(DELETED);
      await db.exec(FIX);
      const after = await row(DELETED);
      expect(after.unsubscribed_at?.toISOString()).toBe(
        before.unsubscribed_at?.toISOString()
      );
    });
  });

  describe("with consent re-armed on the deleted account", () => {
    beforeEach(async () => {
      await db.exec(REARM_DELETED);
    });

    it("list_marketing_recipients skips it", async () => {
      expect(await marketing(db)).not.toContain(DELETED);
    });

    it("claim_due_session_reminders skips it and writes no ledger row", async () => {
      expect(await session(db)).not.toContain(DELETED);
      const { rows } = await db.query(
        "SELECT 1 FROM public.email_reminder_log WHERE user_id = $1",
        [DELETED]
      );
      expect(rows).toHaveLength(0);
    });

    it("claim_due_reengagement skips it and writes no ledger row", async () => {
      expect(await reengagement(db)).not.toContain(DELETED);
      const { rows } = await db.query(
        "SELECT 1 FROM public.email_reminder_log WHERE user_id = $1",
        [DELETED]
      );
      expect(rows).toHaveLength(0);
    });
  });

  it("list_marketing_recipients drops a placeholder whatever its case", async () => {
    expect(await marketing(db)).not.toContain(MIXED_CASE_PLACEHOLDER);
  });

  it("a live account with consent still gets all three", async () => {
    expect(await marketing(db)).toContain(LIVE);
    expect(await session(db)).toContain(LIVE);
    expect(await reengagement(db)).toContain(LIVE);
  });

  it("keeps every RPC service-role only", async () => {
    const { rows } = await db.query<{
      proname: string;
      anon: boolean;
      authed: boolean;
      service: boolean;
    }>(
      `SELECT proname,
              has_function_privilege('anon', oid, 'EXECUTE') AS anon,
              has_function_privilege('authenticated', oid, 'EXECUTE') AS authed,
              has_function_privilege('service_role', oid, 'EXECUTE') AS service
       FROM pg_proc
       WHERE proname IN ('list_marketing_recipients',
                         'claim_due_session_reminders',
                         'claim_due_reengagement')`
    );
    expect(rows).toHaveLength(3);
    for (const r of rows) {
      expect(r).toMatchObject({ anon: false, authed: false, service: true });
    }
  });
});
