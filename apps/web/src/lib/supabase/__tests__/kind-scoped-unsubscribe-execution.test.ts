// #896: REAL SQL-execution tests for kind-scoped unsubscribe tokens.
//
// The defect (F6 of #895's adversarial review): marketing consent and reminder
// consent shared ONE secret (`email_subscriptions.unsubscribe_token`), so the
// `kind` query param — chosen by whoever holds the link — decided which consent
// a token revoked. A token from a reminder email, with `&kind=reminders`
// stripped, killed MARKETING consent, and vice versa.
//
// These tests are RED-PROOF: the same cross-kind attack is executed twice —
// once against the PRE-FIX lineage (#779 + #869 only), where it SUCCEEDS and
// pins the vulnerability, and once against the POST-FIX lineage (+ #896), where
// it must fail. If #896's migration were reverted, the "post-fix" block would
// fail exactly the way the "pre-fix" block passes.
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

const marketingMigration = readMigration(
  "20260728120000_email_subscriptions.sql"
);
const reminderMigration = readMigration("20260731120000_reminder_consent.sql");
const kindScopedMigration = readMigration(
  "20260731150000_kind_scoped_unsubscribe.sql"
);
const schema = readFileSync(resolve(repoRoot, "supabase/schema.sql"), "utf8");

// Objects created outside these migrations (Supabase roles, auth schema,
// profiles). Same stub the #869 execution test uses.
const STUB_SETUP = `
  CREATE ROLE anon;
  CREATE ROLE authenticated;
  CREATE ROLE service_role;
  CREATE SCHEMA IF NOT EXISTS auth;
  CREATE TABLE auth.users (id uuid PRIMARY KEY, email text);
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS 'SELECT NULL::uuid';
  CREATE TABLE public.profiles (id uuid PRIMARY KEY, prefs jsonb NOT NULL DEFAULT '{}');
`;

/** A learner opted in to BOTH consents — the only case where a cross-kind flip is observable. */
const BOTH = "11111111-1111-1111-1111-111111111111";
/** A second both-consents learner, used for the uniqueness/backfill checks. */
const BOTH_2 = "22222222-2222-2222-2222-222222222222";

/** The weekday token the claim RPC computes for "today" in São Paulo. */
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

const SEED = `
  INSERT INTO public.profiles(id, prefs) VALUES
    ('${BOTH}',   '{"nextLesson":{"day":"${TODAY}","time":"19:00"}}'),
    ('${BOTH_2}', '{"nextLesson":{"day":"${TODAY}","time":"08:00"}}');
  INSERT INTO auth.users(id, email) VALUES
    ('${BOTH}',   'both@example.com'),
    ('${BOTH_2}', 'both2@example.com');
  INSERT INTO public.email_subscriptions(user_id, opt_in, consent_at, reminder_opt_in, reminder_consent_at)
  VALUES ('${BOTH}',   true, now(), true, now()),
         ('${BOTH_2}', true, now(), true, now());
`;

interface Consents {
  opt_in: boolean;
  reminder_opt_in: boolean;
}

async function consents(db: PGlite, userId: string): Promise<Consents> {
  const { rows } = await db.query<Consents>(
    "SELECT opt_in, reminder_opt_in FROM public.email_subscriptions WHERE user_id = $1",
    [userId]
  );
  return rows[0]!;
}

async function marketingToken(db: PGlite, userId: string): Promise<string> {
  const { rows } = await db.query<{ t: string }>(
    "SELECT unsubscribe_token AS t FROM public.email_subscriptions WHERE user_id = $1",
    [userId]
  );
  return rows[0]!.t;
}

async function reminderToken(db: PGlite, userId: string): Promise<string> {
  const { rows } = await db.query<{ t: string }>(
    "SELECT reminder_unsubscribe_token AS t FROM public.email_subscriptions WHERE user_id = $1",
    [userId]
  );
  return rows[0]!.t;
}

async function callRpc(
  db: PGlite,
  fn: "unsubscribe_by_token" | "unsubscribe_reminders_by_token",
  token: string
): Promise<boolean> {
  const { rows } = await db.query<{ matched: boolean }>(
    `SELECT public.${fn}($1) AS matched`,
    [token]
  );
  return rows[0]!.matched;
}

/**
 * Restore both learners to "opted in to BOTH consents" and drop any row a test
 * added. Cheaper than rebuilding the database per test — spinning up a PGlite
 * per test makes this file (and every other pglite suite sharing the runner)
 * contend for CPU and time out its hooks.
 */
const RESET = `
  DELETE FROM public.email_reminder_log;
  DELETE FROM public.email_subscriptions WHERE user_id NOT IN ('${BOTH}', '${BOTH_2}');
  DELETE FROM public.profiles           WHERE id      NOT IN ('${BOTH}', '${BOTH_2}');
  UPDATE public.email_subscriptions
  SET opt_in = true, consent_at = now(), unsubscribed_at = NULL,
      reminder_opt_in = true, reminder_consent_at = now(), reminder_unsubscribed_at = NULL;
`;

let db: PGlite;

// ── RED: the vulnerability, executed against the PRE-FIX lineage ────────────
describe("#896 RED — pre-fix lineage (#779 + #869): one token kills either consent", () => {
  beforeAll(async () => {
    db = await PGlite.create();
    await db.exec(STUB_SETUP);
    await db.exec(marketingMigration);
    await db.exec(reminderMigration);
    await db.exec(SEED);
  }, 60_000);

  beforeEach(async () => {
    await db.exec(RESET);
  });

  afterAll(async () => {
    await db.close();
  });

  it("a token from a REMINDER email, kind stripped, KILLS marketing consent", async () => {
    // Pre-fix, the reminder email carried the very same `unsubscribe_token`.
    const tokenFromReminderEmail = await marketingToken(db, BOTH);
    expect(
      await callRpc(db, "unsubscribe_by_token", tokenFromReminderEmail)
    ).toBe(true);
    // Marketing consent the learner never revoked is now gone.
    expect((await consents(db, BOTH)).opt_in).toBe(false);
  });

  it("a token from a MARKETING email, `&kind=reminders` appended, KILLS reminder consent", async () => {
    const tokenFromMarketingEmail = await marketingToken(db, BOTH);
    expect(
      await callRpc(
        db,
        "unsubscribe_reminders_by_token",
        tokenFromMarketingEmail
      )
    ).toBe(true);
    expect((await consents(db, BOTH)).reminder_opt_in).toBe(false);
  });

  it("there is only ONE secret to steal (no reminder-scoped column exists)", async () => {
    await expect(reminderToken(db, BOTH)).rejects.toThrow(
      /reminder_unsubscribe_token/
    );
  });
});

// ── GREEN: the same attacks against the POST-FIX lineage ────────────────────
describe("#896 GREEN — post-fix lineage (+ kind_scoped_unsubscribe)", () => {
  beforeAll(async () => {
    db = await PGlite.create();
    await db.exec(STUB_SETUP);
    await db.exec(marketingMigration);
    await db.exec(reminderMigration);
    await db.exec(SEED);
    // The migration must replay on a lineage that ALREADY has rows — the prod
    // shape (backfill path), not just an empty table.
    await db.exec(kindScopedMigration);
  }, 60_000);

  beforeEach(async () => {
    await db.exec(RESET);
  });

  afterAll(async () => {
    await db.close();
  });

  it("the MARKETING token can no longer touch reminder consent", async () => {
    const marketing = await marketingToken(db, BOTH);
    expect(await callRpc(db, "unsubscribe_reminders_by_token", marketing)).toBe(
      false
    );
    expect(await consents(db, BOTH)).toEqual({
      opt_in: true,
      reminder_opt_in: true,
    });
  });

  it("the REMINDER token can no longer touch marketing consent", async () => {
    const reminder = await reminderToken(db, BOTH);
    expect(await callRpc(db, "unsubscribe_by_token", reminder)).toBe(false);
    expect(await consents(db, BOTH)).toEqual({
      opt_in: true,
      reminder_opt_in: true,
    });
  });

  it("each token still works for ITS OWN kind, and only that kind", async () => {
    expect(
      await callRpc(
        db,
        "unsubscribe_reminders_by_token",
        await reminderToken(db, BOTH)
      )
    ).toBe(true);
    expect(await consents(db, BOTH)).toEqual({
      opt_in: true, // product news survives
      reminder_opt_in: false,
    });

    expect(
      await callRpc(
        db,
        "unsubscribe_by_token",
        await marketingToken(db, BOTH_2)
      )
    ).toBe(true);
    expect(await consents(db, BOTH_2)).toEqual({
      opt_in: false,
      reminder_opt_in: true, // reminders survive
    });
  });

  it("a token of one kind never belongs to ANOTHER learner's other kind", async () => {
    // Cross-user × cross-kind: no accidental collision path.
    expect(
      await callRpc(
        db,
        "unsubscribe_reminders_by_token",
        await marketingToken(db, BOTH_2)
      )
    ).toBe(false);
    expect(
      await callRpc(db, "unsubscribe_by_token", await reminderToken(db, BOTH_2))
    ).toBe(false);
    expect(await consents(db, BOTH)).toEqual({
      opt_in: true,
      reminder_opt_in: true,
    });
    expect(await consents(db, BOTH_2)).toEqual({
      opt_in: true,
      reminder_opt_in: true,
    });
  });

  it("backfills EXISTING rows with a fresh, distinct, unique token", async () => {
    const { rows } = await db.query<{
      nulls: number;
      shared: number;
      distinct_tokens: number;
      total: number;
    }>(`
      SELECT count(*) FILTER (WHERE reminder_unsubscribe_token IS NULL)::int          AS nulls,
             count(*) FILTER (WHERE reminder_unsubscribe_token = unsubscribe_token)::int AS shared,
             count(DISTINCT reminder_unsubscribe_token)::int                          AS distinct_tokens,
             count(*)::int                                                            AS total
      FROM public.email_subscriptions
    `);
    expect(rows[0]).toEqual({
      nulls: 0,
      shared: 0,
      distinct_tokens: 2,
      total: 2,
    });
  });

  it("makes 'the two secrets are never equal' a TABLE invariant", async () => {
    await expect(
      db.exec(
        `UPDATE public.email_subscriptions
         SET reminder_unsubscribe_token = unsubscribe_token WHERE user_id = '${BOTH}'`
      )
    ).rejects.toThrow(/chk_email_subscriptions_distinct_tokens/);
  });

  it("keeps the reminder token unique across learners", async () => {
    await expect(
      db.exec(
        `UPDATE public.email_subscriptions
         SET reminder_unsubscribe_token =
           (SELECT reminder_unsubscribe_token FROM public.email_subscriptions WHERE user_id = '${BOTH}')
         WHERE user_id = '${BOTH_2}'`
      )
    ).rejects.toThrow(/email_subscriptions_reminder_token_unique/);
  });

  it("a NEW row gets its own reminder token by DEFAULT", async () => {
    const FRESH = "33333333-3333-3333-3333-333333333333";
    await db.exec(`
      INSERT INTO public.profiles(id) VALUES ('${FRESH}');
      INSERT INTO public.email_subscriptions(user_id) VALUES ('${FRESH}');
    `);
    const marketing = await marketingToken(db, FRESH);
    const reminder = await reminderToken(db, FRESH);
    expect(reminder).toMatch(/^[0-9a-f-]{36}$/);
    expect(reminder).not.toBe(marketing);
  });

  it("the send pipeline is handed the REMINDER token, never the marketing one", async () => {
    const { rows } = await db.query<{ unsubscribe_token: string }>(
      "SELECT unsubscribe_token FROM public.claim_due_session_reminders(NULL)"
    );
    const handedOut = rows.map((r) => r.unsubscribe_token).sort();
    expect(handedOut).toEqual(
      [await reminderToken(db, BOTH), await reminderToken(db, BOTH_2)].sort()
    );
    // And a link built from what the pipeline hands out actually unsubscribes.
    expect(
      await callRpc(db, "unsubscribe_reminders_by_token", handedOut[0]!)
    ).toBe(true);
  });

  it("re-applying the migration is a no-op (idempotent replay)", async () => {
    const before = await reminderToken(db, BOTH);
    await db.exec(kindScopedMigration);
    expect(await reminderToken(db, BOTH)).toBe(before);
    expect(
      await callRpc(
        db,
        "unsubscribe_reminders_by_token",
        await marketingToken(db, BOTH)
      )
    ).toBe(false);
  });

  it("BACKWARD COMPAT: a legacy kind-less MARKETING link still works", async () => {
    // Grandfathered: `unsubscribe_token` keeps its value and its meaning, so
    // every marketing link ever minted (all kind-less) is unaffected.
    expect(
      await callRpc(db, "unsubscribe_by_token", await marketingToken(db, BOTH))
    ).toBe(true);
    expect((await consents(db, BOTH)).opt_in).toBe(false);
  });

  it("BACKWARD COMPAT: a pre-#896 REMINDER link is expired, not honoured", async () => {
    // Those links carried the MARKETING token with `&kind=reminders`; honouring
    // them would BE the vulnerability. They now return false → the route's
    // "Link not recognized" page, which points at Settings.
    expect(
      await callRpc(
        db,
        "unsubscribe_reminders_by_token",
        await marketingToken(db, BOTH)
      )
    ).toBe(false);
    expect((await consents(db, BOTH)).reminder_opt_in).toBe(true);
  });
});

// ── The schema.sql mirror must carry the same scoping ───────────────────────
describe("#896 schema.sql mirror", () => {
  it("declares the reminder token column plus both constraints", () => {
    expect(schema).toContain(
      "reminder_unsubscribe_token UUID NOT NULL DEFAULT gen_random_uuid()"
    );
    expect(schema).toContain("email_subscriptions_reminder_token_unique");
    expect(schema).toContain("chk_email_subscriptions_distinct_tokens");
  });

  it("scopes each unsubscribe RPC to its own token column", () => {
    const body = (fn: string): string => {
      const start = schema.indexOf(`CREATE OR REPLACE FUNCTION ${fn}(`);
      expect(start, `${fn} defined in schema.sql`).toBeGreaterThan(-1);
      return schema.slice(start, schema.indexOf("$$;", start));
    };
    expect(body("unsubscribe_reminders_by_token")).toContain(
      "WHERE reminder_unsubscribe_token = p_token"
    );
    // The reminder RPC must not fall back to the shared secret.
    expect(body("unsubscribe_reminders_by_token")).not.toMatch(
      /(?<!reminder_)unsubscribe_token\s*=\s*p_token/
    );
    expect(body("unsubscribe_by_token")).toMatch(
      /(?<!reminder_)unsubscribe_token\s*=\s*p_token/
    );
    expect(body("unsubscribe_by_token")).not.toContain(
      "reminder_unsubscribe_token"
    );
    // And the claim RPC hands out the reminder-scoped one.
    expect(body("claim_due_session_reminders")).toContain(
      "es.reminder_unsubscribe_token"
    );
  });

  it("keeps the RPCs service_role-only (no grant widened by #896)", () => {
    for (const fn of [
      "unsubscribe_by_token(UUID)",
      "unsubscribe_reminders_by_token(UUID)",
      "claim_due_session_reminders(TEXT)",
    ]) {
      expect(kindScopedMigration).toContain(
        `REVOKE ALL ON FUNCTION ${fn} FROM PUBLIC, anon, authenticated`
      );
      expect(kindScopedMigration).toContain(
        `GRANT EXECUTE ON FUNCTION ${fn} TO service_role`
      );
    }
    expect(kindScopedMigration).not.toMatch(
      /GRANT EXECUTE[^\n]*TO (anon|authenticated)/
    );
  });

  it("every function in the migration is SECURITY DEFINER + search_path-pinned", () => {
    // Line-anchored: the header prose mentions the phrase too.
    const defs =
      kindScopedMigration.match(/^CREATE OR REPLACE FUNCTION/gm) ?? [];
    expect(defs.length).toBe(3);
    expect(
      (kindScopedMigration.match(/^SECURITY DEFINER$/gm) ?? []).length
    ).toBe(3);
    expect(
      (kindScopedMigration.match(/^SET search_path = ''$/gm) ?? []).length
    ).toBe(3);
  });
});
