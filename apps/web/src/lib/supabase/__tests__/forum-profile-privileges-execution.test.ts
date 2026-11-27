// SQL-execution tests for 20261105120000_narrow_forum_and_profile_privileges,
// run in in-process Postgres (pglite) on the REAL migration chain rather than
// stub tables, so the triggers, policies and RPCs under test are the shipped
// ones. Only what Supabase provides outside the migrations is stubbed: the
// roles, the auth and storage schemas, the realtime publication and the default
// privileges.
//
// Writes are issued the way PostgREST issues them: one transaction with SET
// LOCAL ROLE and the JWT claims set. The columns named in the "keeps working"
// inserts are the ones the routes send, so narrowing a grant below what a route
// needs fails here.
//
// @vitest-environment node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

// Each database replays the whole migration chain, which is slow on a loaded runner.
vi.setConfig({ testTimeout: 60_000, hookTimeout: 120_000 });

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

const MIGRATIONS = resolve(findRepoRoot(), "supabase/migrations");
const TARGET = "20261105120000_narrow_forum_and_profile_privileges.sql";
const migration = readFileSync(resolve(MIGRATIONS, TARGET), "utf8");
const rollback = readFileSync(
  resolve(MIGRATIONS, `${TARGET}.rollback`),
  "utf8"
);
const verify = readFileSync(resolve(MIGRATIONS, `${TARGET}.verify`), "utf8");
const earlierMigrations = readdirSync(MIGRATIONS)
  .filter((f) => f.endsWith(".sql") && f < TARGET)
  .sort()
  .map((f) => readFileSync(resolve(MIGRATIONS, f), "utf8"));

const FORUM_TABLES = ["threads", "answers", "votes", "flags"] as const;

/**
 * The migration has to reach the same grants from any prior grant shape, so the
 * suite starts from what the migration chain leaves and from a broad grant of
 * everything.
 */
type GrantShape = "chain" | "broad";

async function buildDb(shape: GrantShape): Promise<PGlite> {
  const db = new PGlite();
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public
      GRANT ALL ON TABLES TO anon, authenticated, service_role;
    GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

    CREATE SCHEMA auth;
    CREATE TABLE auth.users (
      id uuid primary key, email text,
      raw_user_meta_data jsonb, raw_app_meta_data jsonb,
      created_at timestamptz default now()
    );
    CREATE TABLE auth.identities (
      id uuid primary key default gen_random_uuid(), user_id uuid,
      provider text, provider_id text, identity_data jsonb, email text
    );
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
      SELECT (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')::uuid
    $$;
    GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;

    CREATE SCHEMA storage;
    CREATE TABLE storage.buckets (
      id text primary key, name text, public boolean,
      file_size_limit bigint, allowed_mime_types text[]
    );
    CREATE TABLE storage.objects (
      id uuid primary key default gen_random_uuid(),
      bucket_id text, name text, owner uuid
    );
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    CREATE FUNCTION storage.foldername(text) RETURNS text[]
      LANGUAGE sql IMMUTABLE AS $$ SELECT string_to_array($1, '/') $$;

    CREATE PUBLICATION supabase_realtime;
  `);
  for (const sql of earlierMigrations) await db.exec(sql);
  if (shape === "broad") {
    await db.exec(
      `GRANT ALL ON ${FORUM_TABLES.map((t) => `public.${t}`).join(", ")}
         TO anon, authenticated, service_role;`
    );
  }
  return db;
}

/** A PostgREST request from a signed-in learner. */
async function asUser<T = Record<string, unknown>>(
  db: PGlite,
  userId: string,
  sql: string,
  params: unknown[] = []
) {
  return db.transaction(async (tx) => {
    await tx.query(`SELECT set_config('request.jwt.claims', $1, true)`, [
      JSON.stringify({ sub: userId, role: "authenticated" }),
    ]);
    await tx.exec("SET LOCAL ROLE authenticated");
    return tx.query<T>(sql, params);
  });
}

/** A PostgREST request with no session. */
async function asAnon(db: PGlite, sql: string, params: unknown[] = []) {
  return db.transaction(async (tx) => {
    await tx.query(`SELECT set_config('request.jwt.claims', $1, true)`, [
      JSON.stringify({ role: "anon" }),
    ]);
    await tx.exec("SET LOCAL ROLE anon");
    return tx.query(sql, params);
  });
}

/** createAdminClient(): the service_role key. */
async function asService<T = Record<string, unknown>>(
  db: PGlite,
  sql: string,
  params: unknown[] = []
) {
  return db.transaction(async (tx) => {
    await tx.query(`SELECT set_config('request.jwt.claims', $1, true)`, [
      JSON.stringify({ role: "service_role" }),
    ]);
    await tx.exec("SET LOCAL ROLE service_role");
    return tx.query<T>(sql, params);
  });
}

let userCounter = 0;
/** Signs up through the real auth.users trigger, not a direct profiles row. */
async function signUp(db: PGlite): Promise<string> {
  userCounter += 1;
  // handle_new_user derives the unique placeholder username from the first 8.
  const id = `${String(userCounter).padStart(8, "0")}-0000-4000-8000-000000000000`;
  await db.query(`INSERT INTO auth.users (id, email) VALUES ($1, $2)`, [
    id,
    `learner${userCounter}@example.com`,
  ]);
  return id;
}

async function createThread(db: PGlite, authorId: string): Promise<string> {
  const category = await db.query<{ id: string }>(
    `SELECT id FROM public.forum_categories WHERE slug = 'general'`
  );
  const r = await asService<{ id: string }>(
    db,
    `SELECT id FROM public.create_thread($1, $2, $3, $4, $5, NULL, NULL, $6)`,
    [
      authorId,
      "A thread title",
      "A thread body long enough",
      "question",
      category.rows[0]!.id,
      "a-thread-title",
    ]
  );
  return r.rows[0]!.id;
}

/** The exact insert POST /api/community/answers sends through the user client. */
async function postAnswer(
  db: PGlite,
  userId: string,
  threadId: string
): Promise<string> {
  const r = await asUser<{ id: string }>(
    db,
    userId,
    `INSERT INTO public.answers (thread_id, author_id, body) VALUES ($1, $2, $3) RETURNING id`,
    [threadId, userId, "An answer"]
  );
  return r.rows[0]!.id;
}

/** Grants, policies and triggers on the tables this migration touches. */
async function snapshot(db: PGlite): Promise<string[]> {
  const r = await db.query<{ line: string }>(`
    SELECT 'table ' || c.relname || ' ' || a.grantee::regrole::text || ' ' || a.privilege_type AS line
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace, aclexplode(c.relacl) a
     WHERE n.nspname = 'public'
       AND c.relname IN ('threads', 'answers', 'votes', 'flags', 'profiles')
    UNION ALL
    SELECT 'column ' || c.relname || '.' || att.attname || ' ' || a.grantee::regrole::text || ' ' || a.privilege_type
      FROM pg_attribute att
      JOIN pg_class c ON c.oid = att.attrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace, aclexplode(att.attacl) a
     WHERE n.nspname = 'public'
       AND c.relname IN ('threads', 'answers', 'votes', 'flags', 'profiles')
    UNION ALL
    SELECT 'policy ' || tablename || ' "' || policyname || '" ' || cmd || ' ' || roles::text
           || ' using ' || COALESCE(qual, '-') || ' check ' || COALESCE(with_check, '-')
      FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename IN ('threads', 'answers', 'votes', 'flags', 'profiles')
    UNION ALL
    SELECT 'trigger ' || pg_get_triggerdef(t.oid)
      FROM pg_trigger t
      JOIN pg_class c ON c.oid = t.tgrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND NOT t.tgisinternal
       AND c.relname IN ('threads', 'answers', 'votes', 'flags', 'profiles')
    ORDER BY 1
  `);
  return r.rows.map((row) => row.line);
}

async function hasColumn(
  db: PGlite,
  role: string,
  table: string,
  column: string,
  privilege: string
): Promise<boolean> {
  const r = await db.query<{ ok: boolean }>(
    `SELECT has_column_privilege($1, $2, $3, $4) AS ok`,
    [role, `public.${table}`, column, privilege]
  );
  return r.rows[0]!.ok;
}

async function columnsOf(db: PGlite, table: string): Promise<string[]> {
  const r = await db.query<{ column_name: string }>(
    `SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1`,
    [table]
  );
  return r.rows.map((row) => row.column_name);
}

const INSUFFICIENT_PRIVILEGE = { code: "42501" };
const THREAD_CLOSED = "AC001";

describe.each<GrantShape>(["chain", "broad"])(
  "forum and profile privileges from the %s grant shape",
  (shape) => {
    let db: PGlite;
    let author: string;
    let learner: string;
    let thread: string;

    beforeAll(async () => {
      db = await buildDb(shape);
      await db.exec(migration);
      author = await signUp(db);
      learner = await signUp(db);
      thread = await createThread(db, author);
    });
    afterAll(async () => {
      await db.close();
    });

    describe("column privileges", () => {
      // Every column, so a column added to the grant later fails here too.
      it.each([
        ["answers", "INSERT", ["thread_id", "author_id", "body"]],
        ["answers", "UPDATE", []],
        ["threads", "INSERT", []],
        ["threads", "UPDATE", []],
        ["votes", "INSERT", []],
        ["votes", "UPDATE", []],
        [
          "flags",
          "INSERT",
          ["reporter_id", "thread_id", "answer_id", "reason", "details"],
        ],
        ["flags", "UPDATE", []],
      ] as const)(
        "authenticated: %s %s is exactly the listed columns",
        async (table, privilege, allowed) => {
          const granted: string[] = [];
          for (const column of await columnsOf(db, table)) {
            if (await hasColumn(db, "authenticated", table, column, privilege))
              granted.push(column);
          }
          expect(granted.sort()).toEqual([...allowed].sort());
        }
      );

      it.each(FORUM_TABLES)("anon holds no write on %s", async (table) => {
        for (const column of await columnsOf(db, table)) {
          for (const privilege of ["INSERT", "UPDATE"]) {
            expect(await hasColumn(db, "anon", table, column, privilege)).toBe(
              false
            );
          }
        }
      });

      it.each(FORUM_TABLES)(
        "no client role holds DELETE, TRUNCATE, REFERENCES or TRIGGER on %s, service_role does",
        async (table) => {
          for (const privilege of [
            "DELETE",
            "TRUNCATE",
            "REFERENCES",
            "TRIGGER",
          ]) {
            const r = await db.query<{
              anon: boolean;
              authed: boolean;
              service: boolean;
            }>(
              `SELECT has_table_privilege('anon', $1, $2) AS anon,
                      has_table_privilege('authenticated', $1, $2) AS authed,
                      has_table_privilege('service_role', $1, $2) AS service`,
              [`public.${table}`, privilege]
            );
            expect(r.rows[0]).toEqual({
              anon: false,
              authed: false,
              service: true,
            });
          }
        }
      );

      it.each(FORUM_TABLES)("reads on %s are untouched", async (table) => {
        const r = await db.query<{ anon: boolean; authed: boolean }>(
          `SELECT has_table_privilege('anon', $1, 'SELECT') AS anon,
                  has_table_privilege('authenticated', $1, 'SELECT') AS authed`,
          [`public.${table}`]
        );
        expect(r.rows[0]).toEqual({ anon: true, authed: true });
      });

      it.each(FORUM_TABLES)(
        "service_role keeps full write on every %s column",
        async (table) => {
          for (const column of await columnsOf(db, table)) {
            for (const privilege of ["INSERT", "UPDATE"]) {
              // Generated columns report the privilege like any other column.
              expect(
                await hasColumn(db, "service_role", table, column, privilege)
              ).toBe(true);
            }
          }
        }
      );
    });

    describe("policies", () => {
      it("keeps only the read policies on threads and votes", async () => {
        const r = await db.query<{ tablename: string; cmd: string }>(
          `SELECT tablename, cmd FROM pg_policies
            WHERE schemaname = 'public' AND tablename IN ('threads', 'votes')
            ORDER BY 1, 2`
        );
        expect(r.rows).toEqual([
          { tablename: "threads", cmd: "SELECT" },
          { tablename: "votes", cmd: "SELECT" },
        ]);
      });

      it("keeps only the INSERT policies the routes use on answers and flags, bound to the caller", async () => {
        const r = await db.query<{
          policyname: string;
          cmd: string;
          with_check: string;
        }>(
          `SELECT policyname, cmd, with_check FROM pg_policies
            WHERE schemaname = 'public' AND tablename IN ('answers', 'flags')
              AND cmd <> 'SELECT' ORDER BY 1`
        );
        expect(r.rows).toEqual([
          {
            policyname: "Authenticated users can create answers",
            cmd: "INSERT",
            with_check: "(author_id = auth.uid())",
          },
          {
            policyname: "Authenticated users can create flags",
            cmd: "INSERT",
            with_check: "(reporter_id = auth.uid())",
          },
        ]);
      });
    });

    describe("client writes outside the grants are refused", () => {
      it.each([
        ["is_accepted", "true"],
        ["vote_score", "9999"],
        ["created_at", "'2020-01-01'"],
        ["deleted_at", "now()"],
      ])("answers insert naming %s", async (column, value) => {
        await expect(
          asUser(
            db,
            learner,
            `INSERT INTO public.answers (thread_id, author_id, body, ${column})
             VALUES ($1, $2, 'x', ${value})`,
            [thread, learner]
          )
        ).rejects.toMatchObject(INSUFFICIENT_PRIVILEGE);
      });

      it.each([
        ["is_accepted", "true"],
        ["vote_score", "9999"],
        ["thread_id", "NULL"],
        ["author_id", "NULL"],
        ["body", "'Edited'"],
      ])("answers update of %s", async (column, value) => {
        const answer = await postAnswer(db, learner, thread);
        await expect(
          asUser(
            db,
            learner,
            `UPDATE public.answers SET ${column} = ${value} WHERE id = $1`,
            [answer]
          )
        ).rejects.toMatchObject(INSUFFICIENT_PRIVILEGE);
      });

      it("threads insert", async () => {
        await expect(
          asUser(
            db,
            learner,
            `INSERT INTO public.threads (author_id, title, slug, body, type, course_id)
             VALUES ($1, 'A title', 'slug', 'A long enough body', 'question', 'c')`,
            [learner]
          )
        ).rejects.toMatchObject(INSUFFICIENT_PRIVILEGE);
      });

      it.each([
        ["is_pinned", "true"],
        ["is_locked", "false"],
        ["vote_score", "9999"],
        ["last_activity_at", "'2099-01-01'"],
        ["title", "'A new title'"],
      ])("threads update of %s by the author", async (column, value) => {
        await expect(
          asUser(
            db,
            author,
            `UPDATE public.threads SET ${column} = ${value} WHERE id = $1`,
            [thread]
          )
        ).rejects.toMatchObject(INSUFFICIENT_PRIVILEGE);
      });

      it("votes insert, update and delete", async () => {
        await expect(
          asUser(
            db,
            learner,
            `INSERT INTO public.votes (user_id, thread_id, value) VALUES ($1, $2, 1)`,
            [learner, thread]
          )
        ).rejects.toMatchObject(INSUFFICIENT_PRIVILEGE);

        const other = await createThread(db, author);
        const vote = await asService<{ id: string }>(
          db,
          `INSERT INTO public.votes (user_id, thread_id, value)
           VALUES ($1, $2, 1) RETURNING id`,
          [learner, other]
        );
        const id = vote.rows[0]!.id;
        await expect(
          asUser(
            db,
            learner,
            `UPDATE public.votes SET thread_id = $1 WHERE id = $2`,
            [thread, id]
          )
        ).rejects.toMatchObject(INSUFFICIENT_PRIVILEGE);
        await expect(
          asUser(db, learner, `DELETE FROM public.votes WHERE id = $1`, [id])
        ).rejects.toMatchObject(INSUFFICIENT_PRIVILEGE);
      });

      it.each([
        ["status", "'resolved'"],
        ["resolved_at", "now()"],
        ["resolved_by", "NULL"],
        ["created_at", "'2020-01-01'"],
      ])("flags insert naming %s", async (column, value) => {
        await expect(
          asUser(
            db,
            learner,
            `INSERT INTO public.flags (reporter_id, thread_id, reason, ${column})
             VALUES ($1, $2, 'spam', ${value})`,
            [learner, thread]
          )
        ).rejects.toMatchObject(INSUFFICIENT_PRIVILEGE);
      });

      it("anon cannot post an answer", async () => {
        await expect(
          asAnon(
            db,
            `INSERT INTO public.answers (thread_id, author_id, body) VALUES ($1, $2, 'x')`,
            [thread, learner]
          )
        ).rejects.toMatchObject(INSUFFICIENT_PRIVILEGE);
      });
    });

    describe("forum writes the app makes keep working", () => {
      it("POST /api/community/answers: insert, counters, activity", async () => {
        const t = await createThread(db, author);
        await db.query(
          `UPDATE public.threads SET last_activity_at = '2020-01-01' WHERE id = $1`,
          [t]
        );
        const id = await postAnswer(db, learner, t);
        expect(id).toMatch(/^[0-9a-f-]{36}$/);

        const after = await db.query<{
          answer_count: number;
          last_activity_at: Date;
        }>(
          `SELECT answer_count, last_activity_at FROM public.threads WHERE id = $1`,
          [t]
        );
        expect(after.rows[0]!.answer_count).toBe(1);
        expect(
          after.rows[0]!.last_activity_at.getUTCFullYear()
        ).toBeGreaterThan(2020);

        const row = await db.query<{
          is_accepted: boolean;
          vote_score: number;
        }>(`SELECT is_accepted, vote_score FROM public.answers WHERE id = $1`, [
          id,
        ]);
        expect(row.rows[0]).toEqual({ is_accepted: false, vote_score: 0 });
      });

      it("POST /api/community/answers: another author's id is still refused by RLS", async () => {
        await expect(
          asUser(
            db,
            learner,
            `INSERT INTO public.answers (thread_id, author_id, body) VALUES ($1, $2, 'x')`,
            [thread, author]
          )
        ).rejects.toMatchObject(INSUFFICIENT_PRIVILEGE);
      });

      it("POST /api/community/flags: insert, 23505 on a repeat, own-content message", async () => {
        const t = await createThread(db, author);
        const flag = `INSERT INTO public.flags (reporter_id, thread_id, answer_id, reason, details)
                      VALUES ($1, $2, NULL, 'other', 'A detailed reason')`;
        await asUser(db, learner, flag, [learner, t]);

        // The route maps both of these to specific responses.
        await expect(
          asUser(db, learner, flag, [learner, t])
        ).rejects.toMatchObject({ code: "23505" });
        await expect(asUser(db, author, flag, [author, t])).rejects.toThrow(
          /Cannot flag your own content/
        );

        const row = await db.query<{ status: string }>(
          `SELECT status FROM public.flags WHERE thread_id = $1`,
          [t]
        );
        expect(row.rows).toEqual([{ status: "pending" }]);
      });

      it("POST /api/community/flags on an answer", async () => {
        const answer = await postAnswer(db, author, thread);
        await asUser(
          db,
          learner,
          `INSERT INTO public.flags (reporter_id, thread_id, answer_id, reason, details)
           VALUES ($1, NULL, $2, 'spam', NULL)`,
          [learner, answer]
        );
      });

      it("POST /api/community/threads: create_thread through the admin client", async () => {
        const t = await createThread(db, author);
        const row = await db.query<{ slug: string; author_id: string }>(
          `SELECT slug, author_id FROM public.threads WHERE id = $1`,
          [t]
        );
        expect(row.rows[0]!.author_id).toBe(author);
        expect(row.rows[0]!.slug).toMatch(/^a-thread-title-/);
      });

      it("POST /api/community/votes: insert, flip and clear through the admin client", async () => {
        const t = await createThread(db, author);
        const score = async () =>
          (
            await db.query<{ vote_score: number }>(
              `SELECT vote_score FROM public.threads WHERE id = $1`,
              [t]
            )
          ).rows[0]!.vote_score;

        const vote = await asService<{ id: string }>(
          db,
          `INSERT INTO public.votes (user_id, thread_id, value)
           VALUES ($1, $2, 1) RETURNING id`,
          [learner, t]
        );
        const id = vote.rows[0]!.id;
        expect(await score()).toBe(1);

        await asService(
          db,
          `UPDATE public.votes SET value = -1 WHERE id = $1`,
          [id]
        );
        expect(await score()).toBe(-1);

        await asService(db, `DELETE FROM public.votes WHERE id = $1`, [id]);
        expect(await score()).toBe(0);
      });

      it("POST /api/community/votes: self-vote is still refused", async () => {
        const t = await createThread(db, author);
        await expect(
          asService(
            db,
            `INSERT INTO public.votes (user_id, thread_id, value) VALUES ($1, $2, 1)`,
            [author, t]
          )
        ).rejects.toThrow(/Cannot vote on your own content/);
      });

      it("accept route: is_accepted and is_solved through the admin client", async () => {
        const t = await createThread(db, author);
        const answer = await postAnswer(db, learner, t);
        await asService(
          db,
          `UPDATE public.answers SET is_accepted = true WHERE id = $1`,
          [answer]
        );
        await asService(
          db,
          `UPDATE public.threads SET is_solved = true, accepted_answer_id = $1 WHERE id = $2`,
          [answer, t]
        );
        const row = await db.query<{ is_solved: boolean }>(
          `SELECT is_solved FROM public.threads WHERE id = $1`,
          [t]
        );
        expect(row.rows[0]!.is_solved).toBe(true);
      });

      it("delete routes: soft delete RPCs through the admin client", async () => {
        const t = await createThread(db, author);
        const answer = await postAnswer(db, learner, t);
        await asService(db, `SELECT public.soft_delete_answer($1, $2)`, [
          answer,
          learner,
        ]);
        await asService(db, `SELECT public.soft_delete_thread($1, $2)`, [
          t,
          author,
        ]);
        const row = await db.query<{ deleted_at: Date | null }>(
          `SELECT deleted_at FROM public.threads WHERE id = $1`,
          [t]
        );
        expect(row.rows[0]!.deleted_at).not.toBeNull();
      });

      it("the accept route can still write answers through the admin client", async () => {
        const answer = await postAnswer(db, learner, thread);
        await asService(
          db,
          `UPDATE public.answers SET body = 'Edited by the service' WHERE id = $1`,
          [answer]
        );
        const row = await db.query<{ body: string }>(
          `SELECT body FROM public.answers WHERE id = $1`,
          [answer]
        );
        expect(row.rows[0]!.body).toBe("Edited by the service");
      });

      it("signed-in and anonymous reads of threads, answers and votes", async () => {
        const reads = [
          `SELECT id, is_locked FROM public.threads`,
          `SELECT id, vote_score, is_accepted FROM public.answers`,
          `SELECT user_id, value FROM public.votes`,
        ];
        for (const sql of reads) {
          await expect(asUser(db, learner, sql)).resolves.toBeDefined();
          await expect(asAnon(db, sql)).resolves.toBeDefined();
        }
      });
    });

    describe("answers on closed threads", () => {
      it("a moderator lock stops new answers, for every role", async () => {
        const t = await createThread(db, author);
        await postAnswer(db, learner, t);
        await asService(
          db,
          `SELECT public.moderate_lock_thread($1, NULL, $2)`,
          [t, author]
        );

        // The route turns this code into a 403.
        await expect(postAnswer(db, learner, t)).rejects.toMatchObject({
          code: THREAD_CLOSED,
          message: "Thread is locked",
        });
        await expect(postAnswer(db, author, t)).rejects.toThrow(
          /Thread is locked/
        );
        await expect(
          asService(
            db,
            `INSERT INTO public.answers (thread_id, author_id, body) VALUES ($1, $2, 'x')`,
            [t, learner]
          )
        ).rejects.toThrow(/Thread is locked/);

        const row = await db.query<{ answer_count: number }>(
          `SELECT answer_count FROM public.threads WHERE id = $1`,
          [t]
        );
        expect(row.rows[0]!.answer_count).toBe(1);
      });

      it("unlocking reopens the thread", async () => {
        const t = await createThread(db, author);
        await asService(
          db,
          `SELECT public.moderate_lock_thread($1, NULL, $2)`,
          [t, author]
        );
        await expect(postAnswer(db, learner, t)).rejects.toThrow(
          /Thread is locked/
        );
        await asService(
          db,
          `UPDATE public.threads SET is_locked = false WHERE id = $1`,
          [t]
        );
        await expect(postAnswer(db, learner, t)).resolves.toBeDefined();
      });

      it("answers already on a locked thread stay removable, and nobody can edit them", async () => {
        const t = await createThread(db, author);
        const answer = await postAnswer(db, learner, t);
        await asService(
          db,
          `SELECT public.moderate_lock_thread($1, NULL, $2)`,
          [t, author]
        );
        await expect(
          asUser(
            db,
            learner,
            `UPDATE public.answers SET body = 'Edited after lock' WHERE id = $1`,
            [answer]
          )
        ).rejects.toMatchObject(INSUFFICIENT_PRIVILEGE);
        await asService(db, `SELECT public.soft_delete_answer($1, $2)`, [
          answer,
          learner,
        ]);
      });

      it.each([
        ["its author", "soft_delete_thread($1, $2)"],
        ["a moderator", "moderate_soft_delete_thread($1, NULL, $2)"],
      ])(
        "a thread removed by %s takes no new answers, for every role",
        async (_who, call) => {
          const t = await createThread(db, author);
          await asService(db, `SELECT public.${call}`, [t, author]);

          for (const poster of [learner, author]) {
            await expect(postAnswer(db, poster, t)).rejects.toMatchObject({
              code: THREAD_CLOSED,
              message: "Thread is removed",
            });
          }
          await expect(
            asService(
              db,
              `INSERT INTO public.answers (thread_id, author_id, body) VALUES ($1, $2, 'x')`,
              [t, learner]
            )
          ).rejects.toThrow(/Thread is removed/);
        }
      );

      it("an unknown thread still fails on the foreign key, not the lock check", async () => {
        await expect(
          postAnswer(db, learner, "99999999-9999-4999-8999-999999999999")
        ).rejects.toMatchObject({ code: "23503" });
      });
    });

    describe("profile columns", () => {
      const profileRow = async (id: string) =>
        (
          await db.query<{
            created_at: Date;
            name_rerolls_used: number | null;
            wallet_xp_synced_at: Date | null;
            username: string;
          }>(
            `SELECT created_at, name_rerolls_used, wallet_xp_synced_at, username
               FROM public.profiles WHERE id = $1`,
            [id]
          )
        ).rows[0]!;

      it("created_at and wallet_xp_synced_at refuse a self-write", async () => {
        const me = await signUp(db);
        for (const set of [
          `created_at = now() + interval '1 day'`,
          `created_at = '2020-01-01'`,
          `wallet_xp_synced_at = now()`,
        ]) {
          await expect(
            asUser(db, me, `UPDATE public.profiles SET ${set} WHERE id = $1`, [
              me,
            ])
          ).rejects.toMatchObject(INSUFFICIENT_PRIVILEGE);
        }
      });

      it("wallet_xp_synced_at cannot be cleared by its owner once stamped", async () => {
        const me = await signUp(db);
        await asService(
          db,
          `UPDATE public.profiles SET wallet_xp_synced_at = now() WHERE id = $1`,
          [me]
        );
        await expect(
          asUser(
            db,
            me,
            `UPDATE public.profiles SET wallet_xp_synced_at = NULL WHERE id = $1`,
            [me]
          )
        ).rejects.toMatchObject(INSUFFICIENT_PRIVILEGE);
      });

      it("name_rerolls_used refuses a reset, a decrement and a jump", async () => {
        const me = await signUp(db);
        await asUser(
          db,
          me,
          `UPDATE public.profiles SET name_rerolls_used = 2 - 1 WHERE id = $1`,
          [me]
        );
        await asUser(
          db,
          me,
          `UPDATE public.profiles SET name_rerolls_used = 2 WHERE id = $1`,
          [me]
        );
        for (const value of ["0", "1", "NULL"]) {
          await expect(
            asUser(
              db,
              me,
              `UPDATE public.profiles SET name_rerolls_used = ${value} WHERE id = $1`,
              [me]
            )
          ).rejects.toMatchObject(INSUFFICIENT_PRIVILEGE);
        }
        const fresh = await signUp(db);
        await expect(
          asUser(
            db,
            fresh,
            `UPDATE public.profiles SET name_rerolls_used = 3 WHERE id = $1`,
            [fresh]
          )
        ).rejects.toMatchObject(INSUFFICIENT_PRIVILEGE);
        expect((await profileRow(me)).name_rerolls_used).toBe(2);
      });

      it("settings name reroll: the real write works three times, then the cap holds", async () => {
        const me = await signUp(db);
        const reroll = (name: string, count: number) =>
          asUser(
            db,
            me,
            `UPDATE public.profiles SET username = $1, name_rerolls_used = $2 WHERE id = $3`,
            [`${name}${userCounter}`, count, me]
          );
        await reroll("StakedValidator", 1);
        await reroll("FrozenAccount", 2);
        await reroll("DerivedSeed", 3);
        const row = await profileRow(me);
        expect(row.name_rerolls_used).toBe(3);
        expect(row.username).toBe(`DerivedSeed${userCounter}`);

        await expect(reroll("OneTooMany", 4)).rejects.toMatchObject({
          code: "23514",
        });
      });

      it("settings save: username, bio, links and visibility", async () => {
        const me = await signUp(db);
        await asUser(
          db,
          me,
          `UPDATE public.profiles
              SET username = $1, bio = $2, social_links = $3, is_public = false
            WHERE id = $4`,
          [`typed_name_${userCounter}`, "Bio", { twitter: "x" }, me]
        );
        const row = await db.query<{ bio: string; is_public: boolean }>(
          `SELECT bio, is_public FROM public.profiles WHERE id = $1`,
          [me]
        );
        expect(row.rows[0]).toEqual({ bio: "Bio", is_public: false });
      });

      it("the other client writes on profiles", async () => {
        const me = await signUp(db);
        const self = (set: string, params: unknown[]) =>
          asUser(
            db,
            me,
            `UPDATE public.profiles SET ${set} WHERE id = $${params.length + 1}`,
            [...params, me]
          );
        await self(`avatar_url = $1`, ["https://example.com/a.jpg"]);
        await self(`avatar_url = NULL`, []);
        await self(`google_id = $1`, [`google-${userCounter}`]);
        await self(`is_public = false`, []);
        await self(`segment = 1, goal = NULL, daily_goal = NULL`, []);
        await self(`prefs = $1`, [
          { nextLesson: { days: [1], time: "09:00" } },
        ]);
      });

      it("a client write repeating the current values passes", async () => {
        const me = await signUp(db);
        await asUser(
          db,
          me,
          `UPDATE public.profiles
              SET created_at = created_at,
                  wallet_xp_synced_at = wallet_xp_synced_at,
                  name_rerolls_used = name_rerolls_used
            WHERE id = $1`,
          [me]
        );
      });

      it("OAuth callback: placeholder username replaced through the user session", async () => {
        const me = await signUp(db);
        expect((await profileRow(me)).username).toMatch(/^user_/);
        await asUser(
          db,
          me,
          `UPDATE public.profiles SET username = $1 WHERE id = $2`,
          [`GeneratedName${userCounter}`, me]
        );
      });

      it("link-wallet route: wallet_xp_synced_at through the admin client", async () => {
        const me = await signUp(db);
        await asService(
          db,
          `UPDATE public.profiles SET wallet_xp_synced_at = now() WHERE id = $1`,
          [me]
        );
        expect((await profileRow(me)).wallet_xp_synced_at).not.toBeNull();
      });

      it("service_role may set all three, including a counter reset", async () => {
        const me = await signUp(db);
        await asService(
          db,
          `UPDATE public.profiles
              SET created_at = '2024-01-01', name_rerolls_used = 3,
                  wallet_xp_synced_at = now()
            WHERE id = $1`,
          [me]
        );
        await asService(
          db,
          `UPDATE public.profiles SET name_rerolls_used = 0 WHERE id = $1`,
          [me]
        );
        const row = await profileRow(me);
        expect(row.created_at.getUTCFullYear()).toBe(2024);
        expect(row.name_rerolls_used).toBe(0);
      });

      it("a SECURITY DEFINER caller holding the service_role JWT is privileged", async () => {
        const me = await signUp(db);
        await db.transaction(async (tx) => {
          await tx.query(`SELECT set_config('request.jwt.claims', $1, true)`, [
            JSON.stringify({ role: "service_role" }),
          ]);
          await tx.query(
            `UPDATE public.profiles SET wallet_xp_synced_at = now() WHERE id = $1`,
            [me]
          );
        });
      });

      it("a bare postgres session is refused, matching the sibling guards", async () => {
        const me = await signUp(db);
        await expect(
          db.query(
            `UPDATE public.profiles SET created_at = '2020-01-01' WHERE id = $1`,
            [me]
          )
        ).rejects.toMatchObject(INSUFFICIENT_PRIVILEGE);
      });

      it("a self-insert has the three columns coerced to their defaults", async () => {
        const id = "77777777-0000-4000-8000-000000000001";
        await db.query(`SET session_replication_role = replica`);
        await db.query(`INSERT INTO auth.users (id, email) VALUES ($1, $2)`, [
          id,
          "self-insert@example.com",
        ]);
        await db.query(`SET session_replication_role = origin`);

        await asUser(
          db,
          id,
          `INSERT INTO public.profiles
             (id, username, created_at, name_rerolls_used, wallet_xp_synced_at)
           VALUES ($1, 'self_inserted', '2020-01-01', 3, now())`,
          [id]
        );
        const row = await profileRow(id);
        expect(row.created_at.getUTCFullYear()).toBeGreaterThan(2020);
        expect(row.name_rerolls_used).toBe(0);
        expect(row.wallet_xp_synced_at).toBeNull();
      });

      it("signup through auth.users still produces a clean row", async () => {
        const me = await signUp(db);
        const row = await profileRow(me);
        expect(row.username).toMatch(/^user_/);
        expect(row.name_rerolls_used).toBe(0);
        expect(row.wallet_xp_synced_at).toBeNull();
        expect(Date.now() - row.created_at.getTime()).toBeLessThan(60_000);
      });

      it("referral claim works in the window and closes after it", async () => {
        const referrer = await signUp(db);
        const code = await asService<{ code: string }>(
          db,
          `SELECT public.get_or_create_referral_code($1) AS code`,
          [referrer]
        );
        const referralCode = code.rows[0]!.code;

        const newcomer = await signUp(db);
        const claimed = await asService<{ outcome: string }>(
          db,
          `SELECT public.claim_referral($1, $2) AS outcome`,
          [newcomer, referralCode]
        );
        expect(claimed.rows[0]!.outcome).toBe("claimed");

        const veteran = await signUp(db);
        await asService(
          db,
          `UPDATE public.profiles SET created_at = now() - interval '30 days' WHERE id = $1`,
          [veteran]
        );
        // The account's age is not the account's to change.
        await expect(
          asUser(
            db,
            veteran,
            `UPDATE public.profiles SET created_at = now() WHERE id = $1`,
            [veteran]
          )
        ).rejects.toMatchObject(INSUFFICIENT_PRIVILEGE);
        const closed = await asService<{ outcome: string }>(
          db,
          `SELECT public.claim_referral($1, $2) AS outcome`,
          [veteran, referralCode]
        );
        expect(closed.rows[0]!.outcome).toBe("claimWindowClosed");
      });

      it("the earlier profile guards still fire", async () => {
        const me = await signUp(db);
        for (const set of [
          `wallet_address = 'x'`,
          `wallet_kind = 'embedded'`,
          `display_name = 'x'`,
          `verified = true`,
          `verified_kind = 'partner'`,
          `deleted_at = now()`,
          `referral_code = 'x'`,
          `referred_by = id`,
        ]) {
          await expect(
            asUser(db, me, `UPDATE public.profiles SET ${set} WHERE id = $1`, [
              me,
            ])
          ).rejects.toMatchObject(INSUFFICIENT_PRIVILEGE);
        }
      });

      it("account deletion anonymizes through the admin client", async () => {
        const me = await signUp(db);
        await asService(
          db,
          `UPDATE public.profiles
              SET username = $1, bio = NULL, is_public = false,
                  wallet_address = NULL, deleted_at = now(),
                  deletion_requested_at = now()
            WHERE id = $2`,
          [`deleted_${userCounter}`, me]
        );
      });
    });

    describe("the new functions", () => {
      it.each([
        ["reject_answer_on_locked_thread", true],
        ["enforce_profile_bookkeeping_write", false],
      ])(
        "%s has a fixed search_path, the expected definer mode and no client EXECUTE",
        async (name, definer) => {
          const r = await db.query<{
            prosecdef: boolean;
            proconfig: string[] | null;
            anon: boolean;
            authed: boolean;
          }>(
            `SELECT prosecdef, proconfig,
                    has_function_privilege('anon', oid, 'EXECUTE') AS anon,
                    has_function_privilege('authenticated', oid, 'EXECUTE') AS authed
               FROM pg_proc
              WHERE pronamespace = 'public'::regnamespace AND proname = $1`,
            [name]
          );
          expect(r.rows).toHaveLength(1);
          expect(r.rows[0]!.prosecdef).toBe(definer);
          expect(r.rows[0]!.proconfig).toContain('search_path=""');
          expect(r.rows[0]!.anon).toBe(false);
          expect(r.rows[0]!.authed).toBe(false);
        }
      );
    });

    it("applying the migration a second time changes nothing", async () => {
      const before = await snapshot(db);
      await db.exec(migration);
      expect(await snapshot(db)).toEqual(before);
    });
  }
);

describe("migration properties", () => {
  it("reaches the same grants from any prior grant shape", async () => {
    const chain = await buildDb("chain");
    const broad = await buildDb("broad");
    await chain.exec(migration);
    await broad.exec(migration);
    const onForumTables = (lines: string[]) =>
      lines.filter((l) => !/^(table|column) profiles/.test(l));
    expect(onForumTables(await snapshot(broad))).toEqual(
      onForumTables(await snapshot(chain))
    );
    await chain.close();
    await broad.close();
  });

  it("rollback returns to the migration chain's state exactly, and can be re-applied", async () => {
    const db = await buildDb("chain");
    const before = await snapshot(db);

    await db.exec(migration);
    expect(await snapshot(db)).not.toEqual(before);

    await db.exec(rollback);
    expect(await snapshot(db)).toEqual(before);

    const functions = await db.query<{ proname: string }>(
      `SELECT proname FROM pg_proc WHERE proname IN
         ('reject_answer_on_locked_thread', 'enforce_profile_bookkeeping_write')`
    );
    expect(functions.rows).toEqual([]);

    // Rollback is safe to run twice, and the migration goes back on after it.
    await db.exec(rollback);
    expect(await snapshot(db)).toEqual(before);
    await db.exec(migration);
    await db.close();
  });

  it("rollback keeps client UPDATE on threads and answers column-scoped", async () => {
    const db = await buildDb("chain");
    await db.exec(migration);
    await db.exec(rollback);
    for (const role of ["anon", "authenticated"]) {
      for (const table of ["threads", "answers"]) {
        const r = await db.query<{ ok: boolean }>(
          `SELECT has_table_privilege($1, $2, 'UPDATE') AS ok`,
          [role, `public.${table}`]
        );
        expect(r.rows[0]!.ok).toBe(false);
      }
    }
    expect(
      await hasColumn(db, "authenticated", "answers", "is_accepted", "UPDATE")
    ).toBe(false);
    expect(
      await hasColumn(db, "authenticated", "threads", "is_pinned", "UPDATE")
    ).toBe(false);
    await db.close();
  });

  it("leaves the session as postgres", async () => {
    const db = await buildDb("chain");
    await db.exec(migration);
    const r = await db.query<{ current_user: string }>(`SELECT current_user`);
    expect(r.rows[0]!.current_user).toBe("postgres");
    await db.close();
  });

  it("applies and works when the table owner is not a superuser", async () => {
    // Supabase's postgres role owns the tables but is not a superuser. pglite's
    // is, which would hide anything that only works by bypassing privileges.
    const db = await buildDb("chain");
    await db.exec(`
      CREATE ROLE table_owner NOSUPERUSER;
      GRANT ALL ON SCHEMA public TO table_owner;
      GRANT USAGE ON SCHEMA auth TO table_owner;
      ALTER TABLE public.threads OWNER TO table_owner;
      ALTER TABLE public.answers OWNER TO table_owner;
      ALTER TABLE public.votes OWNER TO table_owner;
      ALTER TABLE public.flags OWNER TO table_owner;
      ALTER TABLE public.profiles OWNER TO table_owner;
      SET ROLE table_owner;
    `);
    await db.exec(migration);
    await db.exec("RESET ROLE");

    const owner = await signUp(db);
    const member = await signUp(db);
    const t = await createThread(db, owner);
    await expect(postAnswer(db, member, t)).resolves.toBeDefined();
    await asService(
      db,
      `UPDATE public.threads SET is_locked = true WHERE id = $1`,
      [t]
    );
    await expect(postAnswer(db, member, t)).rejects.toThrow(/Thread is locked/);
    await db.close();
  });

  it("the verify script passes only once the migration is in", async () => {
    const db = await buildDb("chain");
    const before = await db.query<{ pass: boolean }>(verify);
    expect(before.rows.some((r) => !r.pass)).toBe(true);

    await db.exec(migration);
    const after = await db.query<{ check_name: string; pass: boolean }>(verify);
    expect(after.rows.length).toBeGreaterThan(30);
    expect(after.rows.filter((r) => !r.pass)).toEqual([]);
    await db.close();
  });

  it("the answers route recognises the trigger's error code", () => {
    const route = readFileSync(
      resolve(
        findRepoRoot(),
        "apps/web/src/app/api/community/answers/route.ts"
      ),
      "utf8"
    );
    expect(route).toContain(`"${THREAD_CLOSED}"`);
    expect(migration).toContain(`ERRCODE = '${THREAD_CLOSED}'`);
  });

  it("takes the row lock the counter triggers take, so answers cannot deadlock", () => {
    // pglite has one connection, so this cannot be exercised here.
    expect(migration).toMatch(/FOR NO KEY UPDATE;/);
  });

  it("does not replace the wallet guard or any other trigger function body", () => {
    expect(migration).not.toMatch(
      /FUNCTION\s+public\.enforce_profile_wallet_write/
    );
    expect(migration).not.toMatch(/FUNCTION\s+public\.enforce_referral_write/);
    expect(migration).not.toMatch(
      /FUNCTION\s+public\.enforce_profile_deleted_at_write/
    );
  });
});
