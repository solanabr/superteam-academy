// Migration lint for 20260921120000_perf_completion_counts_leaderboard_nonces:
// executes the real file in pglite and asserts (a) it applies cleanly and is
// re-runnable, (b) every index it promises exists with the predicate it
// promises, (c) the three read RPCs it touches return exactly what they
// returned before — the only intended function-level change is PARALLEL SAFE,
// and get_leaderboard's body is meant to be byte-identical.
//
// @vitest-environment node
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

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
    "supabase/migrations/20260921120000_perf_completion_counts_leaderboard_nonces.sql"
  ),
  "utf8"
);
const schema = readFileSync(resolve(repoRoot, "supabase/schema.sql"), "utf8");

function extractView(sql: string, name: string): string {
  const start = sql.indexOf(`CREATE OR REPLACE VIEW ${name} AS`);
  if (start < 0) throw new Error(`view ${name} not found`);
  const end = sql.indexOf(";", start);
  return sql.slice(start, end + 1);
}

// Only the columns the migration's indexes and function bodies touch.
const STUB_SETUP = `
  CREATE ROLE anon;
  CREATE ROLE authenticated;
  CREATE ROLE service_role;
  CREATE TABLE public.profiles (
    id uuid PRIMARY KEY,
    username text,
    avatar_url text,
    is_public boolean NOT NULL DEFAULT true,
    deleted_at timestamptz
  );
  CREATE TABLE public.user_xp (
    user_id uuid PRIMARY KEY REFERENCES public.profiles(id),
    total_xp integer NOT NULL DEFAULT 0,
    level integer NOT NULL DEFAULT 0
  );
  CREATE TABLE public.certificates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id)
  );
  CREATE TABLE public.user_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id),
    course_id text NOT NULL,
    lesson_id text NOT NULL,
    completed boolean NOT NULL DEFAULT false,
    completed_at timestamptz
  );
  CREATE TABLE public.xp_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id),
    amount integer NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE TABLE public.siws_nonces (
    nonce text PRIMARY KEY,
    status text NOT NULL DEFAULT 'pending',
    ip_address text,
    created_at timestamptz NOT NULL DEFAULT now()
  );
  -- The index this migration drops, so the DROP is actually exercised.
  CREATE INDEX idx_siws_nonces_status ON public.siws_nonces (status);
`;

const A = "11111111-1111-1111-1111-111111111111";
const B = "22222222-2222-2222-2222-222222222222";
const PRIVATE_C = "33333333-3333-3333-3333-333333333333";

const SEED = `
  INSERT INTO public.profiles(id, username, is_public, deleted_at) VALUES
    ('${A}', 'ana', true, NULL),
    ('${B}', 'bruno', true, NULL),
    ('${PRIVATE_C}', 'carla', false, NULL);
  INSERT INTO public.user_xp(user_id, total_xp, level) VALUES
    ('${A}', 300, 1), ('${B}', 100, 1), ('${PRIVATE_C}', 9999, 9);
  INSERT INTO public.xp_transactions(user_id, amount) VALUES
    ('${A}', 300), ('${B}', 100), ('${PRIVATE_C}', 9999);
  INSERT INTO public.user_progress(user_id, course_id, lesson_id, completed) VALUES
    ('${A}', 'course-x', 'lesson-1', true),
    ('${B}', 'course-x', 'lesson-1', true),
    ('${A}', 'course-x', 'lesson-2', true),
    ('${A}', 'course-x', 'lesson-3', false),
    ('${A}', 'course-y', 'lesson-9', true);
  INSERT INTO public.siws_nonces(nonce, status, created_at) VALUES
    ('fresh-pending', 'pending', now()),
    ('stale-pending', 'pending', now() - interval '10 minutes'),
    ('old-consumed', 'consumed', now() - interval '2 hours');
`;

// The pre-migration get_leaderboard, so the post-migration one can be compared
// against it rather than against a hand-written expectation.
const LEADERBOARD_BEFORE = (() => {
  const start = schema.indexOf(
    "CREATE OR REPLACE FUNCTION public.get_leaderboard("
  );
  if (start < 0) throw new Error("get_leaderboard not found in schema.sql");
  const end = schema.indexOf("$$;", start);
  return schema
    .slice(start, end + 3)
    .replace("public.get_leaderboard(", "public.get_leaderboard_before(")
    .replace("PARALLEL SAFE\n", "");
})();

interface IndexRow {
  indexname: string;
  indexdef: string;
}

describe("perf migration: completion counts / leaderboard / siws_nonces", () => {
  let db: PGlite;

  beforeAll(async () => {
    db = await PGlite.create();
    await db.exec(STUB_SETUP);
    await db.exec(extractView(schema, "public_user_xp"));
    // Pre-migration state: the function bodies as they were.
    await db.exec(LEADERBOARD_BEFORE);
    await db.exec(migration);
    await db.exec(SEED);
  }, 60_000);

  afterAll(async () => {
    await db.close();
  });

  it("is re-runnable (every statement idempotent)", async () => {
    await expect(db.exec(migration)).resolves.toBeDefined();
  });

  it("creates the four indexes it promises, with their predicates", async () => {
    const { rows } = await db.query<IndexRow>(
      "SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public'"
    );
    const byName = new Map(rows.map((r) => [r.indexname, r.indexdef]));

    expect(byName.get("idx_user_progress_course_lesson_completed")).toMatch(
      /\(course_id, lesson_id\)[\s\S]*WHERE completed/
    );
    expect(byName.get("idx_profiles_public_ranked")).toMatch(
      /WHERE \(is_public AND \(deleted_at IS NULL\)/
    );
    expect(byName.get("idx_xp_transactions_user_created")).toMatch(
      /\(user_id, created_at DESC\)/
    );
    expect(byName.get("idx_siws_nonces_status_created_at")).toMatch(
      /\(status, created_at\)/
    );
    expect(byName.get("idx_siws_nonces_status_ip_created_at")).toMatch(
      /\(status, ip_address, created_at\)/
    );
    // Strict prefix of the two above — dropped, not kept.
    expect(byName.has("idx_siws_nonces_status")).toBe(false);
  });

  it("marks the three read RPCs PARALLEL SAFE and keeps them STABLE", async () => {
    const { rows } = await db.query<{
      proname: string;
      provolatile: string;
      proparallel: string;
    }>(
      `SELECT proname, provolatile, proparallel FROM pg_proc p
       JOIN pg_namespace n ON n.oid = p.pronamespace
       WHERE n.nspname = 'public'
         AND proname IN ('get_leaderboard','get_platform_stats','course_lesson_completion_counts')`
    );
    expect(rows).toHaveLength(3);
    for (const r of rows) {
      expect(r.provolatile).toBe("s");
      expect(r.proparallel).toBe("s");
    }
  });

  it("course_lesson_completion_counts still counts completed rows per lesson", async () => {
    const { rows } = await db.query<{ lesson_id: string; completed_by: number }>(
      "SELECT lesson_id, completed_by::int FROM public.course_lesson_completion_counts('course-x') ORDER BY lesson_id"
    );
    // lesson-3 is incomplete and course-y is a different course: neither appears.
    expect(rows).toEqual([
      { lesson_id: "lesson-1", completed_by: 2 },
      { lesson_id: "lesson-2", completed_by: 1 },
    ]);
  });

  it("get_leaderboard returns exactly what the pre-migration body returned", async () => {
    for (const timeframe of ["alltime", "weekly", "monthly"]) {
      const after = await db.query(
        "SELECT * FROM public.get_leaderboard($1, 20)",
        [timeframe]
      );
      const before = await db.query(
        "SELECT * FROM public.get_leaderboard_before($1, 20)",
        [timeframe]
      );
      expect(after.rows).toEqual(before.rows);
    }
    // And the private profile is still excluded, so "identical" isn't vacuous.
    const { rows } = await db.query<{ username: string }>(
      "SELECT username FROM public.get_leaderboard('alltime', 20) ORDER BY rank"
    );
    expect(rows.map((r) => r.username)).toEqual(["ana", "bruno"]);
  });

  it("keeps the service_role-only RPCs unexecutable by anon/authenticated", async () => {
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`SET ROLE ${role}`);
      await expect(
        db.query("SELECT * FROM public.get_platform_stats()")
      ).rejects.toThrow(/permission denied/);
      await expect(
        db.query(
          "SELECT * FROM public.course_lesson_completion_counts('course-x')"
        )
      ).rejects.toThrow(/permission denied/);
      // get_leaderboard stays public — grants unchanged.
      await expect(
        db.query("SELECT * FROM public.get_leaderboard('alltime', 5)")
      ).resolves.toBeDefined();
      await db.exec("RESET ROLE");
    }
  });
});
