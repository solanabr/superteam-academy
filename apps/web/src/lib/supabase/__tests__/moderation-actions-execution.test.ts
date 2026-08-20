// REAL SQL-execution proof of the moderator soft-delete RPCs (#1131), run in
// in-process Postgres (pglite) against BOTH copies of the DDL: the migration
// that gets applied, and the supabase/schema.sql mirror fresh environments are
// built from.
//
// What has to hold, and why:
//   1. These functions delete content with NO ownership check — that is the
//      whole point of a moderator action — so the only thing standing between
//      "admin removes spam" and "any logged-in user removes anything" is the
//      REVOKE/GRANT. anon and authenticated must not be able to execute them.
//      That case is red-proofed in-suite: grant EXECUTE back and the call
//      succeeds, so the denial is provably the REVOKE and not an accident of
//      the stub.
//   2. The cascade semantics must match the author-gated originals (thread →
//      its answers; answer → answer_count decrement + un-accept), because
//      moderation removing content differently from an author deleting it is
//      how denormalized counters drift.
//   3. The removed target's creation XP is clawed back. Also red-proofed
//      in-suite: the same cascade WITHOUT the revoke leaves the XP behind.
//
// @vitest-environment node
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";

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
    "supabase/migrations/20260820160000_moderation_actions.sql"
  ),
  "utf8"
);
const schema = readFileSync(resolve(repoRoot, "supabase/schema.sql"), "utf8");

// Definitions name their parameter; grants use the bare argument type.
const THREAD_FN = "public.moderate_soft_delete_thread(p_thread_id UUID)";
const ANSWER_FN = "public.moderate_soft_delete_answer(p_answer_id UUID)";
const THREAD_SIG = "public.moderate_soft_delete_thread(UUID)";
const ANSWER_SIG = "public.moderate_soft_delete_answer(UUID)";

/** Pull one `CREATE OR REPLACE FUNCTION <sig> … $$;` block out of a SQL file. */
function extractFunction(sql: string, signature: string): string {
  const start = sql.indexOf(`CREATE OR REPLACE FUNCTION ${signature}`);
  if (start < 0) throw new Error(`function ${signature} not found`);
  const end = sql.indexOf("$$;", start);
  if (end < 0) throw new Error(`unterminated body for ${signature}`);
  return sql.slice(start, end + 3);
}

/** Pull one single-statement `<needle>…;` out of a SQL file. */
function extractStatement(sql: string, needle: string): string {
  const start = sql.indexOf(needle);
  if (start < 0) throw new Error(`statement not found: ${needle}`);
  const end = sql.indexOf(";", start);
  if (end < 0) throw new Error(`unterminated statement: ${needle}`);
  return sql.slice(start, end + 1);
}

// Both copies are assembled from their OWN file's statements, never from
// literals written here — a schema.sql that lost a REVOKE fails at extraction
// instead of quietly testing this file's idea of it.
function grants(sql: string, fn: string): string {
  return [
    extractStatement(sql, `REVOKE EXECUTE ON FUNCTION ${fn} FROM`),
    extractStatement(sql, `GRANT EXECUTE ON FUNCTION ${fn} TO`),
  ].join("\n");
}

/** Pull one `CREATE TABLE [IF NOT EXISTS] <name> ( … \n);` block out of a file. */
function extractTable(sql: string, name: string): string {
  const start = sql.search(
    new RegExp(`CREATE TABLE (IF NOT EXISTS )?${name} \\(`)
  );
  if (start < 0) throw new Error(`table ${name} not found`);
  const end = sql.indexOf("\n);", start);
  if (end < 0) throw new Error(`unterminated table ${name}`);
  return sql.slice(start, end + 3);
}

// The migration copy runs the file WHOLE — not a hand-picked set of statements
// — so a stray `GRANT … TO authenticated` anywhere in it would be applied too,
// and the denial cases below would catch it.
const copies = {
  migration,
  "schema.sql mirror": [
    extractTable(schema, "moderation_actions"),
    extractFunction(schema, THREAD_FN),
    extractFunction(schema, ANSWER_FN),
    grants(schema, THREAD_SIG),
    grants(schema, ANSWER_SIG),
  ].join("\n"),
};

// The real revoke_community_xp, lifted from schema.sql — the clawback is only
// as good as the function it delegates to, including its GREATEST(0, …) floor.
const REVOKE_XP = extractFunction(
  schema,
  `revoke_community_xp(
  p_user_id UUID,
  p_idempotency_key TEXT
)`
);

// Minimal stand-in for the community surface these functions touch.
const STUB_SETUP = `
  CREATE ROLE anon;
  CREATE ROLE authenticated;
  CREATE ROLE service_role BYPASSRLS;

  CREATE TABLE public.profiles (id uuid PRIMARY KEY, username text);

  CREATE TABLE public.threads (
    id uuid PRIMARY KEY,
    author_id uuid NOT NULL REFERENCES public.profiles(id),
    is_solved boolean NOT NULL DEFAULT false,
    accepted_answer_id uuid,
    answer_count int NOT NULL DEFAULT 0,
    is_locked boolean NOT NULL DEFAULT false,
    deleted_at timestamptz
  );

  CREATE TABLE public.answers (
    id uuid PRIMARY KEY,
    thread_id uuid NOT NULL REFERENCES public.threads(id),
    author_id uuid NOT NULL REFERENCES public.profiles(id),
    is_accepted boolean NOT NULL DEFAULT false,
    deleted_at timestamptz
  );

  -- Only the columns the audit table's FK needs.
  CREATE TABLE public.flags (id uuid PRIMARY KEY, status text NOT NULL DEFAULT 'pending');

  CREATE TABLE public.user_xp (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid UNIQUE NOT NULL REFERENCES public.profiles(id),
    total_xp integer DEFAULT 0,
    level integer DEFAULT 0
  );

  CREATE TABLE public.xp_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id),
    amount integer NOT NULL,
    reason text NOT NULL,
    idempotency_key text,
    source text NOT NULL DEFAULT 'community'
  );
`;

const AUTHOR = "11111111-1111-1111-1111-111111111111";
const ANSWERER = "22222222-2222-2222-2222-222222222222";
const THREAD = "aaaaaaaa-0000-0000-0000-000000000001";
const ANSWER_A = "bbbbbbbb-0000-0000-0000-000000000001";
const ANSWER_B = "bbbbbbbb-0000-0000-0000-000000000002";

interface XpRow {
  total_xp: number;
  level: number;
}

async function become(
  db: PGlite,
  role: "anon" | "authenticated" | "service_role"
): Promise<void> {
  await db.exec("RESET ROLE;");
  await db.exec(`SET ROLE ${role};`);
}

async function xpOf(db: PGlite, userId: string): Promise<XpRow> {
  await db.exec("RESET ROLE;");
  const { rows } = await db.query<XpRow>(
    `SELECT total_xp, level FROM public.user_xp WHERE user_id = $1`,
    [userId]
  );
  return rows[0] as XpRow;
}

async function scalar<T>(db: PGlite, sql: string, args: unknown[]): Promise<T> {
  await db.exec("RESET ROLE;");
  const { rows } = await db.query<Record<string, T>>(sql, args);
  return Object.values(rows[0] as Record<string, T>)[0] as T;
}

for (const [copy, ddl] of Object.entries(copies)) {
  describe(`#1131 moderator soft-delete RPCs — ${copy}`, () => {
    let db: PGlite;

    beforeAll(async () => {
      db = new PGlite();
      await db.exec(STUB_SETUP);
      await db.exec(REVOKE_XP);
      await db.exec(ddl);
    }, 60_000);

    beforeEach(async () => {
      await db.exec("RESET ROLE;");
      // Re-apply the whole DDL every time: the red-proof below hands EXECUTE
      // back to `authenticated`, and a failure partway through it must not
      // silently disarm the rest of the suite. The audit table is dropped
      // first because schema.sql's copy is a plain CREATE TABLE.
      await db.exec("DROP TABLE IF EXISTS public.moderation_actions CASCADE;");
      await db.exec(ddl);
      await db.exec(
        "TRUNCATE public.xp_transactions, public.user_xp, public.answers, public.threads, public.profiles CASCADE;"
      );
      await db.query(
        `INSERT INTO public.profiles(id, username) VALUES ($1,'author'), ($2,'answerer')`,
        [AUTHOR, ANSWERER]
      );
      await db.query(
        `INSERT INTO public.threads(id, author_id, answer_count, is_solved, accepted_answer_id)
         VALUES ($1, $2, 2, true, $3)`,
        [THREAD, AUTHOR, ANSWER_A]
      );
      await db.query(
        `INSERT INTO public.answers(id, thread_id, author_id, is_accepted)
         VALUES ($1, $2, $3, true), ($4, $2, $3, false)`,
        [ANSWER_A, THREAD, ANSWERER, ANSWER_B]
      );
      // XP as the community routes award it: 20 for the thread, 10 per answer,
      // plus an upvote award that v1 deliberately does NOT claw back.
      await db.query(
        `INSERT INTO public.user_xp(user_id, total_xp, level) VALUES ($1, 25, 0), ($2, 30, 0)`,
        [AUTHOR, ANSWERER]
      );
      await db.query(
        `INSERT INTO public.xp_transactions(user_id, amount, reason, idempotency_key)
         VALUES ($1, 20, 'community:thread_created', $3),
                ($1, 5,  'community:upvote_received', 'vote:up:' || $3),
                ($2, 10, 'community:answer_posted', $4),
                ($2, 20, 'community:answer_posted', $5)`,
        [
          AUTHOR,
          ANSWERER,
          `thread:${THREAD}`,
          `answer:${ANSWER_A}`,
          `answer:${ANSWER_B}`,
        ]
      );
    });

    it("thread removal tombstones the thread and cascades to its live answers", async () => {
      await become(db, "service_role");
      await db.query(`SELECT public.moderate_soft_delete_thread($1)`, [THREAD]);

      expect(
        await scalar<string | null>(
          db,
          `SELECT deleted_at FROM public.threads WHERE id = $1`,
          [THREAD]
        )
      ).not.toBeNull();
      expect(
        await scalar<number>(
          db,
          `SELECT count(*)::int FROM public.answers WHERE thread_id = $1 AND deleted_at IS NULL`,
          [THREAD]
        )
      ).toBe(0);
    });

    it("thread removal claws back the thread's own creation XP — and only that", async () => {
      await become(db, "service_role");
      await db.query(`SELECT public.moderate_soft_delete_thread($1)`, [THREAD]);

      // 25 - 20 (thread:<id>) = 5. The 5 XP of upvote award stays: v1 does not
      // reverse vote XP, and this test is what pins that scope.
      expect(await xpOf(db, AUTHOR)).toMatchObject({ total_xp: 5 });
      expect(
        await scalar<number>(
          db,
          `SELECT count(*)::int FROM public.xp_transactions WHERE idempotency_key = $1`,
          [`thread:${THREAD}`]
        )
      ).toBe(0);
      // The cascaded answers' XP is likewise NOT reversed in v1.
      expect(await xpOf(db, ANSWERER)).toMatchObject({ total_xp: 30 });
    });

    it("RED-PROOF: the same cascade without the clawback leaves the XP behind", async () => {
      // The literal body of the author-gated original — cascade, no revoke. If
      // the assertion above could pass without the PERFORM line, this would
      // show 5 as well.
      await db.exec("RESET ROLE;");
      await db.query(
        `UPDATE public.threads SET deleted_at = NOW() WHERE id = $1`,
        [THREAD]
      );
      await db.query(
        `UPDATE public.answers SET deleted_at = NOW() WHERE thread_id = $1 AND deleted_at IS NULL`,
        [THREAD]
      );

      expect(await xpOf(db, AUTHOR)).toMatchObject({ total_xp: 25 });
    });

    it("answer removal decrements answer_count, un-accepts, and revokes its XP", async () => {
      await become(db, "service_role");
      await db.query(`SELECT public.moderate_soft_delete_answer($1)`, [
        ANSWER_A,
      ]);

      expect(
        await scalar<number>(
          db,
          `SELECT answer_count FROM public.threads WHERE id = $1`,
          [THREAD]
        )
      ).toBe(1);
      expect(
        await scalar<boolean>(
          db,
          `SELECT is_solved FROM public.threads WHERE id = $1`,
          [THREAD]
        )
      ).toBe(false);
      expect(
        await scalar<string | null>(
          db,
          `SELECT accepted_answer_id FROM public.threads WHERE id = $1`,
          [THREAD]
        )
      ).toBeNull();
      // 30 - 10 (answer:<id>); the second answer's 20 is untouched.
      expect(await xpOf(db, ANSWERER)).toMatchObject({ total_xp: 20 });
    });

    it("answer_count never goes negative", async () => {
      await db.exec("RESET ROLE;");
      await db.query(
        `UPDATE public.threads SET answer_count = 0 WHERE id = $1`,
        [THREAD]
      );

      await become(db, "service_role");
      await db.query(`SELECT public.moderate_soft_delete_answer($1)`, [
        ANSWER_B,
      ]);

      expect(
        await scalar<number>(
          db,
          `SELECT answer_count FROM public.threads WHERE id = $1`,
          [THREAD]
        )
      ).toBe(0);
    });

    it("user_xp floors at 0 when the clawback exceeds the balance", async () => {
      await db.exec("RESET ROLE;");
      // A learner who has since spent/lost XP: 20 owed back, 4 on hand.
      await db.query(
        `UPDATE public.user_xp SET total_xp = 4 WHERE user_id = $1`,
        [AUTHOR]
      );

      await become(db, "service_role");
      await db.query(`SELECT public.moderate_soft_delete_thread($1)`, [THREAD]);

      expect(await xpOf(db, AUTHOR)).toEqual({ total_xp: 0, level: 0 });
    });

    it("refuses a second removal instead of double-revoking", async () => {
      await become(db, "service_role");
      await db.query(`SELECT public.moderate_soft_delete_thread($1)`, [THREAD]);

      await expect(
        db.query(`SELECT public.moderate_soft_delete_thread($1)`, [THREAD])
      ).rejects.toThrow(/already removed/i);

      await expect(
        db.query(`SELECT public.moderate_soft_delete_answer($1)`, [ANSWER_A])
      ).rejects.toThrow(/already removed/i);
    });

    // The security assertion: these functions have no ownership check, so
    // execute privilege IS the authorization.
    for (const role of ["anon", "authenticated"] as const) {
      it(`${role} cannot execute either moderator RPC`, async () => {
        await become(db, role);

        await expect(
          db.query(`SELECT public.moderate_soft_delete_thread($1)`, [THREAD])
        ).rejects.toThrow(/permission denied/i);
        await expect(
          db.query(`SELECT public.moderate_soft_delete_answer($1)`, [ANSWER_A])
        ).rejects.toThrow(/permission denied/i);

        // Nothing was removed by the attempt.
        expect(
          await scalar<string | null>(
            db,
            `SELECT deleted_at FROM public.threads WHERE id = $1`,
            [THREAD]
          )
        ).toBeNull();
      });
    }

    it("RED-PROOF: granting EXECUTE back lets authenticated delete anything", async () => {
      // Proves the denial above comes from the REVOKE in the DDL under test —
      // not from the stub, the search_path, or a missing table grant. With the
      // grant restored, a plain logged-in user removes someone else's thread.
      await db.exec("RESET ROLE;");
      await db.exec(
        `GRANT EXECUTE ON FUNCTION public.moderate_soft_delete_thread(UUID) TO authenticated;`
      );

      await become(db, "authenticated");
      await db.query(`SELECT public.moderate_soft_delete_thread($1)`, [THREAD]);

      expect(
        await scalar<string | null>(
          db,
          `SELECT deleted_at FROM public.threads WHERE id = $1`,
          [THREAD]
        )
      ).not.toBeNull();
    });
  });
}
