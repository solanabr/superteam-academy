// #779 adversarial fix: a REAL SQL-execution test for the email-consent RPCs.
//
// The RLS-guard test (email-subscriptions-rls-guard.test.ts) only string-matches
// the SQL, and the unsubscribe route test mocks the RPC — neither can catch a
// function body that PARSES but THROWS at runtime. `unsubscribe_by_token` did
// exactly that: `v_matched BOOLEAN` + `GET DIAGNOSTICS v_matched = ROW_COUNT;
// RETURN v_matched > 0` raised `operator does not exist: boolean > integer` on
// every call, silently failing one-click unsubscribe. This test executes the
// migration's actual SQL in an in-process Postgres (pglite) and invokes the RPCs
// so a runtime regression fails CI.
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
const migration = readFileSync(
  resolve(
    repoRoot,
    "supabase/migrations/20260728120000_email_subscriptions.sql"
  ),
  "utf8"
);
const schema = readFileSync(resolve(repoRoot, "supabase/schema.sql"), "utf8");

// Pull one `CREATE OR REPLACE FUNCTION <sig> … $$;` block out of a SQL file so we
// can execute the schema.sql copy of a function, not just the migration's.
function extractFunction(sql: string, signature: string): string {
  const start = sql.indexOf(`CREATE OR REPLACE FUNCTION ${signature}`);
  if (start < 0) throw new Error(`function ${signature} not found`);
  const end = sql.indexOf("$$;", start);
  if (end < 0) throw new Error(`unterminated body for ${signature}`);
  return sql.slice(start, end + 3);
}

// Minimal, honest stub of the objects the migration references but that live
// OUTSIDE it (created by Supabase / earlier migrations). Nothing here duplicates
// logic under test — it only satisfies references so the real migration can run:
//   * the three Supabase roles targeted by the GRANT/REVOKE statements,
//   * the `auth` schema + `auth.users(id, email)` that list_marketing_recipients
//     JOINs and that the RLS policy's auth.uid() belongs to,
//   * `public.profiles(id)` that email_subscriptions.user_id FKs to.
const STUB_SETUP = `
  CREATE ROLE anon;
  CREATE ROLE authenticated;
  CREATE ROLE service_role;
  CREATE SCHEMA IF NOT EXISTS auth;
  CREATE TABLE auth.users (id uuid PRIMARY KEY, email text);
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS 'SELECT NULL::uuid';
  CREATE TABLE public.profiles (id uuid PRIMARY KEY);
`;

const UID_A = "11111111-1111-1111-1111-111111111111";
const UID_B = "22222222-2222-2222-2222-222222222222";
const BOGUS_TOKEN = "99999999-9999-9999-9999-999999999999";

// The RPCs under test always return exactly one row; assert that rather than
// let an empty result silently read as `undefined` (noUncheckedIndexedAccess).
function firstRow<T>(rows: readonly T[]): T {
  expect(rows.length).toBeGreaterThan(0);
  return rows[0] as T;
}

async function tokenFor(db: PGlite, userId: string): Promise<string> {
  const { rows } = await db.query<{ unsubscribe_token: string }>(
    "SELECT unsubscribe_token FROM public.email_subscriptions WHERE user_id = $1",
    [userId]
  );
  return firstRow(rows).unsubscribe_token;
}

// The unsubscribe contract is identical in the migration and the schema.sql
// mirror, but each ships its OWN copy of the function body — run BOTH so a drift
// or a runtime bug in either surfaces. "migration" uses the body the migration
// installs; "schema.sql mirror" replaces it with the copy dumped in schema.sql.
const COPIES = ["migration", "schema.sql mirror"] as const;

for (const copy of COPIES) {
  describe(`#779 unsubscribe_by_token executes correctly — ${copy}`, () => {
    let db: PGlite;

    beforeEach(async () => {
      db = await PGlite.create();
      await db.exec(STUB_SETUP);
      await db.exec(migration);
      if (copy === "schema.sql mirror") {
        // Overwrite the migration's function with the schema.sql copy and prove
        // THAT body runs too.
        await db.exec(
          extractFunction(schema, "unsubscribe_by_token(p_token UUID)")
        );
      }
      await db.exec(
        `INSERT INTO public.profiles(id) VALUES ('${UID_A}'), ('${UID_B}')`
      );
      // Two opted-in subscribers so a bogus-token call can't accidentally look
      // "correct" by touching the only row.
      await db.exec(
        `INSERT INTO public.email_subscriptions(user_id, opt_in, consent_at)
         VALUES ('${UID_A}', true, now()), ('${UID_B}', true, now())`
      );
    });

    afterEach(async () => {
      await db.close();
    });

    it("a valid token returns true and flips opt_in → false", async () => {
      const token = await tokenFor(db, UID_A);
      const { rows } = await db.query<{ matched: boolean }>(
        "SELECT public.unsubscribe_by_token($1) AS matched",
        [token]
      );
      expect(firstRow(rows).matched).toBe(true);

      const { rows: after } = await db.query<{
        opt_in: boolean;
        unsubscribed_at: string | null;
      }>(
        "SELECT opt_in, unsubscribed_at FROM public.email_subscriptions WHERE user_id = $1",
        [UID_A]
      );
      expect(firstRow(after).opt_in).toBe(false);
      expect(firstRow(after).unsubscribed_at).not.toBeNull();
    });

    it("a bogus token returns false and changes no rows", async () => {
      const { rows } = await db.query<{ matched: boolean }>(
        "SELECT public.unsubscribe_by_token($1) AS matched",
        [BOGUS_TOKEN]
      );
      expect(firstRow(rows).matched).toBe(false);

      const { rows: still } = await db.query<{ opted_in: number }>(
        "SELECT count(*)::int AS opted_in FROM public.email_subscriptions WHERE opt_in = true"
      );
      expect(firstRow(still).opted_in).toBe(2);
    });

    it("is idempotent: unsubscribing an already-off row still returns true", async () => {
      const token = await tokenFor(db, UID_A);
      await db.query("SELECT public.unsubscribe_by_token($1)", [token]);
      const { rows } = await db.query<{ matched: boolean }>(
        "SELECT public.unsubscribe_by_token($1) AS matched",
        [token]
      );
      expect(firstRow(rows).matched).toBe(true);
    });
  });
}

// Bonus runtime coverage: the recipient gate — including the synthetic-wallet
// exclusion this PR added — evaluated against real rows, not string-matching.
describe("#779 list_marketing_recipients filters at runtime", () => {
  let db: PGlite;

  beforeEach(async () => {
    db = await PGlite.create();
    await db.exec(STUB_SETUP);
    await db.exec(migration);
  });

  afterEach(async () => {
    await db.close();
  });

  it("returns opted-in real-email users, never wallet placeholders or opt-outs", async () => {
    const REAL = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const WALLET = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const OPTED_OUT = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    await db.exec(
      `INSERT INTO public.profiles(id) VALUES ('${REAL}'), ('${WALLET}'), ('${OPTED_OUT}')`
    );
    await db.exec(
      `INSERT INTO auth.users(id, email) VALUES
         ('${REAL}', 'learner@example.com'),
         ('${WALLET}', 'So11111111111111111111111111111111111111112@wallet.superteam-lms.local'),
         ('${OPTED_OUT}', 'quiet@example.com')`
    );
    await db.exec(
      `INSERT INTO public.email_subscriptions(user_id, opt_in, consent_at) VALUES
         ('${REAL}', true, now()),
         ('${WALLET}', true, now()),
         ('${OPTED_OUT}', false, NULL)`
    );

    const { rows } = await db.query<{ email: string }>(
      "SELECT email FROM public.list_marketing_recipients()"
    );
    expect(rows.map((r) => r.email)).toEqual(["learner@example.com"]);
  });
});
