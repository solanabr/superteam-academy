// REAL SQL-execution proof of the moderator action RPCs (#1131), run in
// in-process Postgres (pglite) against BOTH copies of the DDL: the migration
// that gets applied, and the supabase/schema.sql mirror fresh environments are
// built from.
//
// What has to hold, and why:
//   1. These functions change content with NO ownership check — that is the
//      whole point of a moderator action — so the only thing between "admin
//      removes spam" and "any logged-in user removes anything" is the
//      REVOKE/GRANT. anon and authenticated must not be able to execute them.
//      Red-proofed in-suite: grant EXECUTE back and the call succeeds.
//   2. ATOMICITY. Each RPC does the content change, the flag write, and the
//      audit INSERT in one transaction. If any step raises, ALL of it must roll
//      back — content must never be removed with no audit row. Red-proofed
//      in-suite: a trigger that raises on the audit INSERT leaves the content,
//      the XP, and the flag exactly as they were.
//   3. The removed target's creation XP is clawed back — and only that. Also
//      red-proofed: the same cascade WITHOUT the revoke leaves the XP behind.
//   4. Cascade semantics match the author-gated originals (thread → its answers;
//      answer → answer_count decrement + un-accept), so counters don't drift.
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
// and the denial cases below would catch it. The schema.sql mirror is assembled
// from schema.sql's OWN statements so a mirror that lost a REVOKE fails at
// extraction instead of testing this file's idea of it.
function extractFromSchema(name: string): string {
  const create = new RegExp(`CREATE OR REPLACE FUNCTION public\\.${name}\\(`);
  const start = schema.search(create);
  if (start < 0) throw new Error(`function ${name} not found in schema.sql`);
  const end = schema.indexOf("$$;", start);
  if (end < 0) throw new Error(`unterminated body for ${name}`);
  return schema.slice(start, end + 3);
}

function extractGrants(name: string, args: string): string {
  const revoke = schema.indexOf(
    `REVOKE EXECUTE ON FUNCTION public.${name}(${args}) FROM`
  );
  const grant = schema.indexOf(
    `GRANT EXECUTE ON FUNCTION public.${name}(${args}) TO`
  );
  if (revoke < 0 || grant < 0)
    throw new Error(`grants for ${name} not found in schema.sql`);
  return [
    schema.slice(revoke, schema.indexOf(";", revoke) + 1),
    schema.slice(grant, schema.indexOf(";", grant) + 1),
  ].join("\n");
}

const UUID3 = "UUID, UUID, UUID";
const mirror = [
  extractTable(schema, "moderation_actions"),
  extractFromSchema("moderate_soft_delete_thread"),
  extractFromSchema("moderate_soft_delete_answer"),
  extractFromSchema("moderate_lock_thread"),
  extractFromSchema("moderate_resolve_flag"),
  extractGrants("moderate_soft_delete_thread", UUID3),
  extractGrants("moderate_soft_delete_answer", UUID3),
  extractGrants("moderate_lock_thread", UUID3),
  extractGrants("moderate_resolve_flag", "UUID, BOOLEAN, UUID"),
].join("\n");

const copies = { migration, "schema.sql mirror": mirror };

// The real revoke_community_xp, lifted from schema.sql — the clawback is only
// as good as the function it delegates to, including its GREATEST(0, …) floor.
const REVOKE_XP = (() => {
  const start = schema.indexOf(
    `CREATE OR REPLACE FUNCTION revoke_community_xp(`
  );
  const end = schema.indexOf("$$;", start);
  return schema.slice(start, end + 3);
})();

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

  CREATE TABLE public.flags (
    id uuid PRIMARY KEY,
    thread_id uuid REFERENCES public.threads(id),
    answer_id uuid REFERENCES public.answers(id),
    status text NOT NULL DEFAULT 'pending',
    resolved_at timestamptz,
    resolved_by uuid REFERENCES public.profiles(id)
  );

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

const ADMIN = "00000000-0000-0000-0000-0000000000ad";
const AUTHOR = "11111111-1111-1111-1111-111111111111";
const ANSWERER = "22222222-2222-2222-2222-222222222222";
const THREAD = "aaaaaaaa-0000-0000-0000-000000000001";
const ANSWER_A = "bbbbbbbb-0000-0000-0000-000000000001";
const ANSWER_B = "bbbbbbbb-0000-0000-0000-000000000002";
const FLAG_THREAD = "cccccccc-0000-0000-0000-000000000001";
const FLAG_ANSWER = "cccccccc-0000-0000-0000-000000000002";

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

async function auditCount(db: PGlite, flagId: string): Promise<number> {
  return scalar<number>(
    db,
    `SELECT count(*)::int FROM public.moderation_actions WHERE flag_id = $1`,
    [flagId]
  );
}

for (const [copy, ddl] of Object.entries(copies)) {
  describe(`#1131 moderator action RPCs — ${copy}`, () => {
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
      // silently disarm the rest of the suite. The audit table is dropped first
      // because schema.sql's copy is a plain CREATE TABLE.
      await db.exec("DROP TABLE IF EXISTS public.moderation_actions CASCADE;");
      await db.exec(ddl);
      await db.exec(
        "TRUNCATE public.flags, public.xp_transactions, public.user_xp, public.answers, public.threads, public.profiles CASCADE;"
      );
      await db.query(
        `INSERT INTO public.profiles(id, username)
         VALUES ($1,'admin'), ($2,'author'), ($3,'answerer')`,
        [ADMIN, AUTHOR, ANSWERER]
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
      await db.query(
        `INSERT INTO public.flags(id, thread_id, answer_id, status)
         VALUES ($1, $2, NULL, 'pending'), ($3, NULL, $4, 'pending')`,
        [FLAG_THREAD, THREAD, FLAG_ANSWER, ANSWER_A]
      );
      // XP as the community routes award it: 20 for the thread, 10/20 per
      // answer, plus an upvote award that v1 deliberately does NOT claw back.
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

    it("thread removal: cascade + XP clawback + flag resolved + one audit row, atomically", async () => {
      await become(db, "service_role");
      await db.query(`SELECT public.moderate_soft_delete_thread($1, $2, $3)`, [
        THREAD,
        FLAG_THREAD,
        ADMIN,
      ]);

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
      // 25 - 20 (thread:<id>) = 5; the 5 XP of upvote award stays (v1 scope).
      expect(await xpOf(db, AUTHOR)).toMatchObject({ total_xp: 5 });
      expect(await xpOf(db, ANSWERER)).toMatchObject({ total_xp: 30 });
      // Removal settles the report, and attributes it.
      expect(
        await scalar<string>(
          db,
          `SELECT status FROM public.flags WHERE id = $1`,
          [FLAG_THREAD]
        )
      ).toBe("resolved");
      expect(
        await scalar<string>(
          db,
          `SELECT resolved_by FROM public.flags WHERE id = $1`,
          [FLAG_THREAD]
        )
      ).toBe(ADMIN);
      const { rows } = await (async () => {
        await db.exec("RESET ROLE;");
        return db.query<{ action: string; actor_id: string }>(
          `SELECT action, actor_id FROM public.moderation_actions WHERE flag_id = $1`,
          [FLAG_THREAD]
        );
      })();
      expect(rows).toEqual([{ action: "removed_thread", actor_id: ADMIN }]);
    });

    it("RED-PROOF: a raise on the audit INSERT rolls the WHOLE action back", async () => {
      // Force the last step (the audit INSERT) to fail, and prove nothing else
      // survived: not the tombstone, not the XP clawback, not the flag resolve.
      // This is the atomicity guarantee the gate asked for.
      await db.exec("RESET ROLE;");
      await db.exec(`
        CREATE OR REPLACE FUNCTION public.boom_audit() RETURNS trigger
        LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'boom'; END; $$;
        CREATE TRIGGER trg_boom_audit BEFORE INSERT ON public.moderation_actions
          FOR EACH ROW EXECUTE FUNCTION public.boom_audit();
      `);

      await become(db, "service_role");
      await expect(
        db.query(`SELECT public.moderate_soft_delete_thread($1, $2, $3)`, [
          THREAD,
          FLAG_THREAD,
          ADMIN,
        ])
      ).rejects.toThrow(/boom/);

      await db.exec("RESET ROLE;");
      await db.exec(
        "DROP TRIGGER trg_boom_audit ON public.moderation_actions;"
      );

      expect(
        await scalar<string | null>(
          db,
          `SELECT deleted_at FROM public.threads WHERE id = $1`,
          [THREAD]
        )
      ).toBeNull();
      expect(await xpOf(db, AUTHOR)).toMatchObject({ total_xp: 25 });
      expect(
        await scalar<string>(
          db,
          `SELECT status FROM public.flags WHERE id = $1`,
          [FLAG_THREAD]
        )
      ).toBe("pending");
    });

    it("RED-PROOF: the same cascade without the clawback leaves the XP behind", async () => {
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

    it("answer removal: count decrement, un-accept, XP clawback, flag resolved, audit", async () => {
      await become(db, "service_role");
      await db.query(`SELECT public.moderate_soft_delete_answer($1, $2, $3)`, [
        ANSWER_A,
        FLAG_ANSWER,
        ADMIN,
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
      expect(
        await scalar<string>(
          db,
          `SELECT status FROM public.flags WHERE id = $1`,
          [FLAG_ANSWER]
        )
      ).toBe("resolved");
      expect(
        await scalar<string>(
          db,
          `SELECT action FROM public.moderation_actions WHERE flag_id = $1`,
          [FLAG_ANSWER]
        )
      ).toBe("removed_answer");
    });

    it("answer_count never goes negative", async () => {
      await db.exec("RESET ROLE;");
      await db.query(
        `UPDATE public.threads SET answer_count = 0 WHERE id = $1`,
        [THREAD]
      );
      // Re-point the flag at answer B so the un-accept path is not taken.
      await db.query(`UPDATE public.flags SET answer_id = $2 WHERE id = $1`, [
        FLAG_ANSWER,
        ANSWER_B,
      ]);

      await become(db, "service_role");
      await db.query(`SELECT public.moderate_soft_delete_answer($1, $2, $3)`, [
        ANSWER_B,
        FLAG_ANSWER,
        ADMIN,
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
      await db.query(
        `UPDATE public.user_xp SET total_xp = 4 WHERE user_id = $1`,
        [AUTHOR]
      );

      await become(db, "service_role");
      await db.query(`SELECT public.moderate_soft_delete_thread($1, $2, $3)`, [
        THREAD,
        FLAG_THREAD,
        ADMIN,
      ]);

      expect(await xpOf(db, AUTHOR)).toEqual({ total_xp: 0, level: 0 });
    });

    it("lock: locks the thread, LEAVES the flag pending, and audits the lock", async () => {
      await become(db, "service_role");
      await db.query(`SELECT public.moderate_lock_thread($1, $2, $3)`, [
        THREAD,
        FLAG_THREAD,
        ADMIN,
      ]);

      expect(
        await scalar<boolean>(
          db,
          `SELECT is_locked FROM public.threads WHERE id = $1`,
          [THREAD]
        )
      ).toBe(true);
      // A lock does NOT settle the report.
      expect(
        await scalar<string>(
          db,
          `SELECT status FROM public.flags WHERE id = $1`,
          [FLAG_THREAD]
        )
      ).toBe("pending");
      expect(
        await scalar<string>(
          db,
          `SELECT action FROM public.moderation_actions WHERE flag_id = $1`,
          [FLAG_THREAD]
        )
      ).toBe("locked_thread");
    });

    it("lock on an already-locked thread still audits (no-op tolerant)", async () => {
      await db.exec("RESET ROLE;");
      await db.query(
        `UPDATE public.threads SET is_locked = true WHERE id = $1`,
        [THREAD]
      );

      await become(db, "service_role");
      await db.query(`SELECT public.moderate_lock_thread($1, $2, $3)`, [
        THREAD,
        FLAG_THREAD,
        ADMIN,
      ]);

      expect(await auditCount(db, FLAG_THREAD)).toBe(1);
    });

    it("resolve: marks the flag resolved with an audit row, no content change", async () => {
      await become(db, "service_role");
      await db.query(`SELECT public.moderate_resolve_flag($1, false, $2)`, [
        FLAG_THREAD,
        ADMIN,
      ]);

      expect(
        await scalar<string>(
          db,
          `SELECT status FROM public.flags WHERE id = $1`,
          [FLAG_THREAD]
        )
      ).toBe("resolved");
      expect(
        await scalar<string | null>(
          db,
          `SELECT deleted_at FROM public.threads WHERE id = $1`,
          [THREAD]
        )
      ).toBeNull();
      expect(
        await scalar<string>(
          db,
          `SELECT action FROM public.moderation_actions WHERE flag_id = $1`,
          [FLAG_THREAD]
        )
      ).toBe("resolved");
    });

    it("dismiss: marks the flag dismissed with a matching audit row", async () => {
      await become(db, "service_role");
      await db.query(`SELECT public.moderate_resolve_flag($1, true, $2)`, [
        FLAG_THREAD,
        ADMIN,
      ]);

      expect(
        await scalar<string>(
          db,
          `SELECT status FROM public.flags WHERE id = $1`,
          [FLAG_THREAD]
        )
      ).toBe("dismissed");
      expect(
        await scalar<string>(
          db,
          `SELECT action FROM public.moderation_actions WHERE flag_id = $1`,
          [FLAG_THREAD]
        )
      ).toBe("dismissed");
    });

    it("refuses a second removal instead of double-revoking", async () => {
      await become(db, "service_role");
      await db.query(`SELECT public.moderate_soft_delete_thread($1, $2, $3)`, [
        THREAD,
        FLAG_THREAD,
        ADMIN,
      ]);

      await expect(
        db.query(`SELECT public.moderate_soft_delete_thread($1, $2, $3)`, [
          THREAD,
          FLAG_THREAD,
          ADMIN,
        ])
      ).rejects.toThrow(/already removed/i);
    });

    it("resolve refuses a non-pending flag", async () => {
      await db.exec("RESET ROLE;");
      await db.query(
        `UPDATE public.flags SET status = 'resolved' WHERE id = $1`,
        [FLAG_THREAD]
      );

      await become(db, "service_role");
      await expect(
        db.query(`SELECT public.moderate_resolve_flag($1, false, $2)`, [
          FLAG_THREAD,
          ADMIN,
        ])
      ).rejects.toThrow(/already resolved/i);
    });

    // The security assertion: these functions have no ownership check, so
    // execute privilege IS the authorization.
    for (const role of ["anon", "authenticated"] as const) {
      it(`${role} cannot execute any moderator RPC`, async () => {
        await become(db, role);

        await expect(
          db.query(`SELECT public.moderate_soft_delete_thread($1, $2, $3)`, [
            THREAD,
            FLAG_THREAD,
            ADMIN,
          ])
        ).rejects.toThrow(/permission denied/i);
        await expect(
          db.query(`SELECT public.moderate_soft_delete_answer($1, $2, $3)`, [
            ANSWER_A,
            FLAG_ANSWER,
            ADMIN,
          ])
        ).rejects.toThrow(/permission denied/i);
        await expect(
          db.query(`SELECT public.moderate_lock_thread($1, $2, $3)`, [
            THREAD,
            FLAG_THREAD,
            ADMIN,
          ])
        ).rejects.toThrow(/permission denied/i);
        await expect(
          db.query(`SELECT public.moderate_resolve_flag($1, false, $2)`, [
            FLAG_THREAD,
            ADMIN,
          ])
        ).rejects.toThrow(/permission denied/i);

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
      await db.exec("RESET ROLE;");
      await db.exec(
        `GRANT EXECUTE ON FUNCTION public.moderate_soft_delete_thread(UUID, UUID, UUID) TO authenticated;`
      );

      await become(db, "authenticated");
      await db.query(`SELECT public.moderate_soft_delete_thread($1, $2, $3)`, [
        THREAD,
        FLAG_THREAD,
        ADMIN,
      ]);

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
