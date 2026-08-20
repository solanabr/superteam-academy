// #1075: REAL SQL-execution tests for the claim RPCs' consent re-check and the
// case-insensitive wallet-placeholder exclusion, replayed against the PROD
// migration lineage.
//
// Lineage replayed here (repo filename → applied prod ledger version):
//   20260728120000_email_subscriptions.sql        → 20260727200924
//   20260731120000_reminder_consent.sql           → 20260731120914
//   20260731150000_kind_scoped_unsubscribe.sql    → 20260731142948
//   20260731170000_reengagement_pipeline.sql      → 20260731154032
//   20260804120000_recurring_lesson_plan.sql      → 20260804190632   ← last applied
//   20260819190000_email_claim_consent_recheck.sql → THIS CHANGE (not yet applied)
//
// RED-PROOF: the "pre-fix" block replays the identical fixtures WITHOUT this
// migration and shows a MIXED-CASE placeholder being claimed by BOTH RPCs —
// the byte-wise `NOT LIKE` only catches the lowercase spelling (#921 F5).
// Reverting the migration turns the GREEN placeholder assertions into exactly
// that failure.
//
// TIMEZONE (#956): date anchors are computed from
// `(now() AT TIME ZONE 'America/Sao_Paulo')::date`, never from
// `(now() - interval)::date`.
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
  "20260731170000_reengagement_pipeline.sql",
  "20260804120000_recurring_lesson_plan.sql",
].map(readMigration);
const recheckMigration = readMigration(
  "20260819190000_email_claim_consent_recheck.sql"
);
const schema = readFileSync(resolve(repoRoot, "supabase/schema.sql"), "utf8");

// Objects created outside these migrations (Supabase roles, auth schema, and
// the baseline tables both claim RPCs read). Same stub the #899 suite uses.
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

/** Ordinary consenting learner — must keep being claimed by both RPCs. */
const OK = uid(1);
/** Wallet placeholder in MIXED case — the #921 F5 gap. */
const MIXEDCASE = uid(2);
/** Consenting at seed; each test flips consent OFF before claiming. */
const FLIPPED = uid(3);
/** Wallet placeholder in lower case — already excluded pre-fix (control). */
const LOWERCASE = uid(4);

const ALL = [OK, MIXEDCASE, FLIPPED, LOWERCASE];

const WEEK = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

/** The weekday token the session claim computes for "today" in São Paulo. */
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

const EMAILS: Record<string, string> = {
  [OK]: "ok@example.com",
  [MIXEDCASE]: "AbC123@Wallet.Superteam-LMS.LOCAL",
  [FLIPPED]: "flipped@example.com",
  [LOWERCASE]: "def456@wallet.superteam-lms.local",
};

// Every learner has a plan for today (session-reminder due) AND is lapsed 30
// days (re-engagement due) — so ONLY the consent/placeholder gates decide.
const SEED = `
  INSERT INTO public.profiles(id, prefs, created_at)
  SELECT id::uuid,
         '{"nextLesson":{"days":["${TODAY}"],"time":"19:00"}}'::jsonb,
         now() - interval '200 days'
  FROM unnest(ARRAY[${ALL.map((id) => `'${id}'`).join(", ")}]) AS t(id);

  INSERT INTO auth.users(id, email) VALUES
    ${ALL.map((id) => `('${id}', '${EMAILS[id]}')`).join(",\n    ")};

  INSERT INTO public.email_subscriptions(user_id, reminder_opt_in, reminder_consent_at, reminder_locale)
  SELECT id::uuid, true, now(), 'pt-BR'
  FROM unnest(ARRAY[${ALL.map((id) => `'${id}'`).join(", ")}]) AS t(id);

  INSERT INTO public.user_xp(user_id, longest_streak, last_activity_date)
  SELECT id::uuid, 5, ((now() AT TIME ZONE 'America/Sao_Paulo')::date - 30)
  FROM unnest(ARRAY[${ALL.map((id) => `'${id}'`).join(", ")}]) AS t(id);
`;

/** Frees every claim slot and restores every seeded consent. */
const RESET = `
  DELETE FROM public.email_reminder_log;
  UPDATE public.email_subscriptions
  SET reminder_opt_in = true, reminder_unsubscribed_at = NULL;
`;

async function build(withRecheck: boolean): Promise<PGlite> {
  const pg = await PGlite.create();
  await pg.exec(STUB_SETUP);
  for (const sql of LINEAGE) await pg.exec(sql);
  if (withRecheck) await pg.exec(recheckMigration);
  await pg.exec(SEED);
  return pg;
}

async function claimSession(pg: PGlite): Promise<string[]> {
  const { rows } = await pg.query<{ user_id: string }>(
    "SELECT user_id FROM public.claim_due_session_reminders($1)",
    [TODAY]
  );
  return rows.map((r) => r.user_id).sort();
}

async function claimReengagement(pg: PGlite): Promise<string[]> {
  const { rows } = await pg.query<{ user_id: string }>(
    "SELECT user_id FROM public.claim_due_reengagement('reengagement_7d', 7, 14)"
  );
  return rows.map((r) => r.user_id).sort();
}

let db: PGlite;

// ── RED: pre-fix, the byte-wise gate lets a MIXED-CASE placeholder through ───
describe("#1075 RED — pre-fix lineage claims a mixed-case placeholder", () => {
  beforeAll(async () => {
    db = await build(false);
  }, 60_000);
  beforeEach(async () => {
    await db.exec(RESET);
  });
  afterAll(async () => {
    await db.close();
  });

  it("session claim returns the mixed-case placeholder (the F5 defect)", async () => {
    const claimed = await claimSession(db);
    expect(claimed).toContain(MIXEDCASE);
    // …while the lowercase spelling was always excluded.
    expect(claimed).not.toContain(LOWERCASE);
  });

  it("re-engagement claim returns the mixed-case placeholder too", async () => {
    const claimed = await claimReengagement(db);
    expect(claimed).toContain(MIXEDCASE);
    expect(claimed).not.toContain(LOWERCASE);
  });
});

// ── GREEN: placeholder exclusion is case-insensitive ────────────────────────
describe("#1075 GREEN — no placeholder spelling is ever claimed", () => {
  beforeAll(async () => {
    db = await build(true);
  }, 60_000);
  beforeEach(async () => {
    await db.exec(RESET);
  });
  afterAll(async () => {
    await db.close();
  });

  it("session claim excludes mixed-case AND lowercase placeholders", async () => {
    const claimed = await claimSession(db);
    expect(claimed).not.toContain(MIXEDCASE);
    expect(claimed).not.toContain(LOWERCASE);
    // …and writes them no ledger row (they were never claimed, not released).
    const { rows } = await db.query<{ n: number }>(
      "SELECT count(*)::int AS n FROM public.email_reminder_log WHERE user_id = ANY($1)",
      [[MIXEDCASE, LOWERCASE]]
    );
    expect(rows[0]!.n).toBe(0);
  });

  it("re-engagement claim excludes both placeholder spellings", async () => {
    const claimed = await claimReengagement(db);
    expect(claimed).not.toContain(MIXEDCASE);
    expect(claimed).not.toContain(LOWERCASE);
  });

  it("an ordinary consenting learner is still claimed by both RPCs", async () => {
    expect(await claimSession(db)).toContain(OK);
    await db.exec(RESET);
    expect(await claimReengagement(db)).toContain(OK);
  });

  it("still hands the session claim the REMINDER-scoped token (#896)", async () => {
    const { rows } = await db.query<{
      user_id: string;
      unsubscribe_token: string;
    }>(
      "SELECT user_id, unsubscribe_token FROM public.claim_due_session_reminders($1)",
      [TODAY]
    );
    const ok = rows.find((r) => r.user_id === OK)!;
    const { rows: tokens } = await db.query<{
      marketing: string;
      reminder: string;
    }>(
      `SELECT unsubscribe_token AS marketing, reminder_unsubscribe_token AS reminder
       FROM public.email_subscriptions WHERE user_id = '${OK}'`
    );
    expect(ok.unsubscribe_token).toBe(tokens[0]!.reminder);
    expect(ok.unsubscribe_token).not.toBe(tokens[0]!.marketing);
  });
});

// ── GREEN: consent flipped off after scheduling excludes the row ────────────
describe("#1075 GREEN — consent is re-checked at claim time", () => {
  beforeAll(async () => {
    db = await build(true);
  }, 60_000);
  beforeEach(async () => {
    await db.exec(RESET);
  });
  afterAll(async () => {
    await db.close();
  });

  it("a learner who unsubscribed after scheduling is not session-claimed", async () => {
    // FLIPPED scheduled a plan for today while consenting; the flip lands
    // BEFORE the cron claims — the claim must exclude them.
    await db.exec(
      `UPDATE public.email_subscriptions
       SET reminder_opt_in = false, reminder_unsubscribed_at = now()
       WHERE user_id = '${FLIPPED}'`
    );
    const claimed = await claimSession(db);
    expect(claimed).not.toContain(FLIPPED);
    expect(claimed).toContain(OK);
    // No ledger row either — an excluded learner consumes no idempotency slot.
    const { rows } = await db.query<{ n: number }>(
      "SELECT count(*)::int AS n FROM public.email_reminder_log WHERE user_id = $1",
      [FLIPPED]
    );
    expect(rows[0]!.n).toBe(0);
  });

  it("the same flip excludes the learner from the re-engagement claim", async () => {
    await db.exec(
      `UPDATE public.email_subscriptions
       SET reminder_opt_in = false, reminder_unsubscribed_at = now()
       WHERE user_id = '${FLIPPED}'`
    );
    const claimed = await claimReengagement(db);
    expect(claimed).not.toContain(FLIPPED);
    expect(claimed).toContain(OK);
  });

  it("the marketing opt-in cannot stand in for reminder consent", async () => {
    await db.exec(
      `UPDATE public.email_subscriptions
       SET reminder_opt_in = false, opt_in = true
       WHERE user_id = '${FLIPPED}'`
    );
    expect(await claimSession(db)).not.toContain(FLIPPED);
    await db.exec(RESET);
    await db.exec(
      `UPDATE public.email_subscriptions
       SET reminder_opt_in = false, opt_in = true
       WHERE user_id = '${FLIPPED}'`
    );
    expect(await claimReengagement(db)).not.toContain(FLIPPED);
  });

  it("re-consenting makes the learner claimable again", async () => {
    await db.exec(
      `UPDATE public.email_subscriptions SET reminder_opt_in = false
       WHERE user_id = '${FLIPPED}'`
    );
    expect(await claimSession(db)).not.toContain(FLIPPED);
    await db.exec(RESET); // restores consent; frees the day's slots
    expect(await claimSession(db)).toContain(FLIPPED);
  });

  it("re-applying the migration is a no-op (idempotent replay)", async () => {
    await db.exec(recheckMigration);
    await db.exec(recheckMigration);
    const claimed = await claimSession(db);
    expect(claimed).toContain(OK);
    expect(claimed).not.toContain(MIXEDCASE);
  });
});

// ── The migration's own shape + the schema.sql mirror ───────────────────────
describe("#1075 migration shape + schema.sql mirror", () => {
  it("lowers the placeholder gate in BOTH bodies and leaves no byte-wise gate", () => {
    const lowered =
      recheckMigration.match(
        /AND lower\(u\.email\) NOT LIKE '%@wallet\.superteam-lms\.local'/g
      ) ?? [];
    expect(lowered.length).toBe(2);
    expect(recheckMigration).not.toContain(
      "AND u.email NOT LIKE '%@wallet.superteam-lms.local'"
    );
  });

  it("asserts consent inside both claim WHEREs", () => {
    const consent =
      recheckMigration.match(/^    WHERE es\.reminder_opt_in = true$/gm) ?? [];
    expect(consent.length).toBe(2);
  });

  it("keeps both signatures, so the app reads and the #731 probe are untouched", () => {
    expect(recheckMigration).toContain(
      "CREATE OR REPLACE FUNCTION claim_due_session_reminders(p_weekday TEXT DEFAULT NULL)\n" +
        "RETURNS TABLE (user_id UUID, email TEXT, unsubscribe_token UUID, locale TEXT, plan_time TEXT)"
    );
    expect(recheckMigration).toContain(
      "CREATE OR REPLACE FUNCTION claim_due_reengagement(\n" +
        "  p_kind          TEXT,\n" +
        "  p_inactive_days INTEGER DEFAULT 7,\n" +
        "  p_cap_days      INTEGER DEFAULT 14,\n" +
        "  p_max_remaining INTEGER DEFAULT 1,\n" +
        "  p_course_totals JSONB   DEFAULT '{}'::jsonb\n" +
        ")"
    );
  });

  it("keeps the #899 cap set and the #896 reminder token", () => {
    expect(recheckMigration).toContain(
      "v_capped_kinds TEXT[] := ARRAY['reengagement_7d', 'course_nudge']"
    );
    expect(
      (
        recheckMigration.match(
          /^ +es\.reminder_unsubscribe_token +AS tok,$/gm
        ) ?? []
      ).length
    ).toBe(2);
    expect(
      (recheckMigration.match(/^  ORDER BY d\.uid;$/gm) ?? []).length
    ).toBe(2);
  });

  it("keeps SECURITY DEFINER, a pinned search_path and service_role-ONLY grants", () => {
    expect((recheckMigration.match(/^SECURITY DEFINER$/gm) ?? []).length).toBe(
      2
    );
    expect(
      (recheckMigration.match(/^SET search_path = ''$/gm) ?? []).length
    ).toBe(2);
    expect(recheckMigration).toContain(
      "REVOKE ALL ON FUNCTION claim_due_session_reminders(TEXT) FROM PUBLIC, anon, authenticated;"
    );
    expect(recheckMigration).toContain(
      "GRANT EXECUTE ON FUNCTION claim_due_session_reminders(TEXT) TO service_role;"
    );
    expect(recheckMigration).toContain(
      "REVOKE ALL ON FUNCTION claim_due_reengagement(TEXT, INTEGER, INTEGER, INTEGER, JSONB)\n  FROM PUBLIC, anon, authenticated;"
    );
    expect(recheckMigration).toContain(
      "GRANT EXECUTE ON FUNCTION claim_due_reengagement(TEXT, INTEGER, INTEGER, INTEGER, JSONB)\n  TO service_role;"
    );
    expect(recheckMigration).not.toMatch(
      /GRANT EXECUTE[^\n]*TO (anon|authenticated)/
    );
  });

  it("schema.sql mirrors the lowered gate in both claim bodies", () => {
    const lowered =
      schema.match(
        /AND lower\(u\.email\) NOT LIKE '%@wallet\.superteam-lms\.local'/g
      ) ?? [];
    expect(lowered.length).toBe(2);
  });

  it("the TS predicate and the SQL gate share the one domain literal", () => {
    const ts = readFileSync(
      resolve(repoRoot, "apps/web/src/lib/auth/wallet-placeholder.ts"),
      "utf8"
    );
    expect(ts).toContain('"@wallet.superteam-lms.local"');
    expect(recheckMigration).toContain("'%@wallet.superteam-lms.local'");
  });
});
