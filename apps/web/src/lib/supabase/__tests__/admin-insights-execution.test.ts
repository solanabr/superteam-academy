// #1135: get_admin_insights() must return the same numbers the JS aggregation
// produced from raw rows — the path it replaces, and the path that still runs
// as a fallback when the function is absent. This executes the real migration
// SQL (and the schema.sql mirror copy) in pglite, seeds one fixture, and
// asserts RPC-vs-JS parity, so drift between the function body and
// `aggregateInsights` fails CI.
//
// Two behaviours are pinned beyond parity:
//   • soft-deleted learners are excluded from EVERY per-user aggregate;
//   • both day series are zero-filled across the full 30-day window.
//
// @vitest-environment node
/* eslint-disable import/order -- vi.mock('server-only') must be hoisted above
   the module imports so the `server-only` graph loads under vitest. */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterAll,
  vi,
} from "vitest";

vi.mock("server-only", () => ({}));

import {
  aggregateInsights,
  type PlatformInsights,
  type AssistRow,
  type SpendRow,
  type ProgressRow,
} from "@/lib/admin/insights";
import { fillDayWindow } from "@/components/admin/insights-chart";

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
    "supabase/migrations/20260820170000_get_admin_insights.sql"
  ),
  "utf8"
);
const schema = readFileSync(resolve(repoRoot, "supabase/schema.sql"), "utf8");

/** Pull one `CREATE OR REPLACE FUNCTION <sig> … $$;` block out of a SQL file. */
function extractFunction(sql: string, signature: string): string {
  const start = sql.indexOf(`CREATE OR REPLACE FUNCTION ${signature}`);
  if (start < 0) throw new Error(`function ${signature} not found`);
  const end = sql.indexOf("$$;", start);
  if (end < 0) throw new Error(`unterminated body for ${signature}`);
  return sql.slice(start, end + 3);
}

// The tables the function reads, with only the columns it touches. Column types
// and the deleted_at tombstone match schema.sql.
const STUB_SETUP = `
  CREATE ROLE anon;
  CREATE ROLE authenticated;
  CREATE ROLE service_role;
  CREATE TABLE public.profiles (
    id uuid PRIMARY KEY,
    deleted_at timestamptz
  );
  CREATE TABLE public.enrollments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id),
    course_id text NOT NULL
  );
  CREATE TABLE public.user_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id),
    course_id text NOT NULL,
    lesson_id text NOT NULL,
    completed boolean DEFAULT false,
    completed_at timestamptz
  );
  CREATE TABLE public.challenge_assists (
    user_id uuid NOT NULL REFERENCES public.profiles(id),
    lesson_id text NOT NULL,
    assists_used integer NOT NULL DEFAULT 0,
    billed_assists integer NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, lesson_id)
  );
  CREATE TABLE public.ai_spend_ledger (
    scope text NOT NULL,
    scope_key text NOT NULL,
    spend_day date NOT NULL,
    micro_usd bigint NOT NULL DEFAULT 0,
    request_count integer NOT NULL DEFAULT 0,
    PRIMARY KEY (scope, scope_key, spend_day)
  );
`;

const LIVE_A = "11111111-1111-1111-1111-111111111111";
const LIVE_B = "22222222-2222-2222-2222-222222222222";
const DELETED_C = "33333333-3333-3333-3333-333333333333";

const day = (offset: number): string => {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - offset);
  return d.toISOString();
};
const dayOnly = (offset: number): string => day(offset).slice(0, 10);

function firstRow<T>(rows: readonly T[]): T {
  expect(rows.length).toBeGreaterThan(0);
  return rows[0] as T;
}

async function rpcInsights(db: PGlite): Promise<PlatformInsights> {
  const { rows } = await db.query<{ get_admin_insights: PlatformInsights }>(
    "SELECT public.get_admin_insights()"
  );
  expect(rows.length).toBe(1);
  return firstRow(rows).get_admin_insights;
}

/** The pre-#1135 path: fetch the raw rows, subtract the deleted set, fold in JS. */
async function jsInsights(db: PGlite): Promise<PlatformInsights> {
  const deleted = await db.query<{ id: string }>(
    "SELECT id FROM public.profiles WHERE deleted_at IS NOT NULL"
  );
  const live = await db.query<{ n: number }>(
    "SELECT count(*)::int AS n FROM public.profiles WHERE deleted_at IS NULL"
  );
  const enrollments = await db.query<{ user_id: string }>(
    "SELECT user_id FROM public.enrollments"
  );
  const progress = await db.query<ProgressRow>(
    "SELECT user_id, course_id, completed_at FROM public.user_progress WHERE completed = true"
  );
  const assists = await db.query<AssistRow>(
    "SELECT user_id, lesson_id, assists_used, billed_assists FROM public.challenge_assists"
  );
  const spend = await db.query<SpendRow>(
    `SELECT to_char(spend_day, 'YYYY-MM-DD') AS spend_day, micro_usd::int AS micro_usd,
            request_count
     FROM public.ai_spend_ledger
     WHERE scope = 'global' AND scope_key = '' AND spend_day >= current_date - 29`
  );

  return aggregateInsights({
    now: new Date(),
    totalLearners: firstRow(live.rows).n,
    deletedUserIds: new Set(deleted.rows.map((r) => r.id)),
    enrollments: enrollments.rows,
    progress: progress.rows.map((r) => ({
      ...r,
      completed_at: r.completed_at
        ? new Date(r.completed_at).toISOString()
        : null,
    })),
    assists: assists.rows,
    spend: spend.rows,
  });
}

/**
 * The JS path emits only days that HAVE data; the SQL path zero-fills. Compare
 * them through the same padding the UI applies, so the assertion is about the
 * numbers and not about which layer inserted the zeros.
 */
function normalize(
  insights: PlatformInsights,
  endDay: string
): PlatformInsights {
  return {
    ...insights,
    ai: {
      ...insights.ai,
      spendByDay: fillDayWindow(insights.ai.spendByDay, endDay, (d) => ({
        day: d,
        usd: 0,
        requests: 0,
      })),
    },
    learning: {
      ...insights.learning,
      completionsByDay: fillDayWindow(
        insights.learning.completionsByDay,
        endDay,
        (d) => ({ day: d, count: 0 })
      ),
    },
  };
}

const COPIES = ["migration", "schema.sql mirror"] as const;

for (const copy of COPIES) {
  describe(`#1135 get_admin_insights parity with the JS aggregation — ${copy}`, () => {
    let db: PGlite;

    beforeAll(async () => {
      db = await PGlite.create();
      await db.exec(STUB_SETUP);
      await db.exec(migration);
      if (copy === "schema.sql mirror") {
        await db.exec(extractFunction(schema, "public.get_admin_insights()"));
      }
    }, 60_000);

    beforeEach(async () => {
      await db.exec(`TRUNCATE public.ai_spend_ledger, public.challenge_assists,
                              public.user_progress, public.enrollments,
                              public.profiles CASCADE`);
    });

    afterAll(async () => {
      await db.close();
    });

    it("empty database → zeros, and 30 zero-filled days in both series", async () => {
      const out = await rpcInsights(db);

      expect(out.learning.totalLearners).toBe(0);
      expect(out.learning.totalEnrollments).toBe(0);
      expect(out.ai.learnersUsingAi).toBe(0);
      expect(out.ai.spend30dUsd).toBe(0);
      expect(out.learning.perCourse).toEqual([]);
      expect(out.ai.topLessons).toEqual([]);

      // The trap this issue names: an omitted day is not a zero day.
      expect(out.learning.completionsByDay).toHaveLength(30);
      expect(out.ai.spendByDay).toHaveLength(30);
      expect(out.learning.completionsByDay.every((d) => d.count === 0)).toBe(
        true
      );
      expect(firstRow(out.learning.completionsByDay).day).toBe(dayOnly(29));
      expect(out.learning.completionsByDay.at(-1)?.day).toBe(dayOnly(0));
    });

    it("matches the JS aggregation on seeded rows", async () => {
      await seedFixture(db);

      const rpc = await rpcInsights(db);
      const js = await jsInsights(db);
      const endDay = rpc.generatedAt.slice(0, 10);

      expect(normalize(rpc, endDay)).toEqual({
        ...normalize(js, endDay),
        // now() inside the function and `new Date()` in the JS path are
        // milliseconds apart by construction — everything else must match.
        generatedAt: rpc.generatedAt,
      });
    });

    it("excludes the soft-deleted learner from every per-user aggregate", async () => {
      await seedFixture(db);
      const out = await rpcInsights(db);

      // DELETED_C carries one enrollment, one completed lesson in its own
      // course, and 9 assists. None of it may surface.
      expect(out.learning.totalLearners).toBe(2);
      expect(out.learning.totalEnrollments).toBe(2);
      // Only LIVE_A completed inside 7d; LIVE_B's completion is 10 days back.
      expect(out.learning.activeLearners7d).toBe(1);
      expect(out.learning.activeLearners30d).toBe(2);
      expect(out.learning.perCourse).toEqual([
        { courseId: "c1", completions: 3, learners: 2 },
      ]);
      expect(out.ai.learnersUsingAi).toBe(1);
      expect(out.ai.totalAssists).toBe(4);
      expect(out.ai.billedAssists).toBe(3);
      expect(out.ai.topLessons).toEqual([
        { lessonId: "l1", assists: 4, learners: 1 },
      ]);
      // …and not from the day series either: 3 live completions, not 4.
      expect(
        out.learning.completionsByDay.reduce((sum, d) => sum + d.count, 0)
      ).toBe(3);
    });

    it("zero-fills the gaps between days that do have data", async () => {
      await seedFixture(db);
      const out = await rpcInsights(db);

      const byDay = new Map(
        out.learning.completionsByDay.map((d) => [d.day, d.count])
      );
      expect(byDay.get(dayOnly(1))).toBe(2);
      expect(byDay.get(dayOnly(10))).toBe(1);
      expect(byDay.get(dayOnly(5))).toBe(0);

      const spendByDay = new Map(out.ai.spendByDay.map((s) => [s.day, s.usd]));
      expect(spendByDay.get(dayOnly(2))).toBe(1.23);
      expect(spendByDay.get(dayOnly(3))).toBe(0);
      // The stray scope_key='stray' global row is $8.89 — if the join were
      // keyed on `scope` alone it would fan day -2 out and inflate the total.
      expect(
        out.ai.spendByDay.filter((s) => s.day === dayOnly(2))
      ).toHaveLength(1);
      expect(out.ai.spend30dUsd).toBe(1.73);
      expect(out.ai.requests30d).toBe(6);
    });

    it("is not executable by anon or authenticated", async () => {
      for (const role of ["anon", "authenticated"]) {
        await db.exec(`SET ROLE ${role}`);
        await expect(
          db.query("SELECT public.get_admin_insights()")
        ).rejects.toThrow(/permission denied/);
        await db.exec("RESET ROLE");
      }
    });
  });
}

/**
 * Two live learners plus one tombstoned account whose rows survived the soft
 * delete, spread over the window so the zero-fill has gaps to fill.
 */
async function seedFixture(db: PGlite): Promise<void> {
  await db.exec(`
    INSERT INTO public.profiles(id, deleted_at) VALUES
      ('${LIVE_A}', NULL),
      ('${LIVE_B}', NULL),
      ('${DELETED_C}', now());

    INSERT INTO public.enrollments(user_id, course_id) VALUES
      ('${LIVE_A}', 'c1'), ('${LIVE_B}', 'c1'), ('${DELETED_C}', 'c1');

    INSERT INTO public.user_progress(user_id, course_id, lesson_id, completed, completed_at) VALUES
      ('${LIVE_A}',    'c1', 'l1', true,  '${day(1)}'),
      ('${LIVE_A}',    'c1', 'l2', true,  '${day(1)}'),
      ('${LIVE_B}',    'c1', 'l1', true,  '${day(10)}'),
      ('${DELETED_C}', 'c1', 'l1', true,  '${day(1)}'),
      -- Not completed: never counted anywhere.
      ('${LIVE_B}',    'c1', 'l3', false, NULL);

    INSERT INTO public.challenge_assists(user_id, lesson_id, assists_used, billed_assists) VALUES
      ('${LIVE_A}',    'l1', 4, 3),
      -- Refunded to zero: a row, but not evidence anyone used the tutor.
      ('${LIVE_B}',    'l2', 0, 0),
      ('${DELETED_C}', 'l1', 9, 9);

    INSERT INTO public.ai_spend_ledger(scope, scope_key, spend_day, micro_usd, request_count) VALUES
      ('global',  '', current_date - 2, 1234567, 4),
      ('global',  '', current_date - 4,  500000, 2),
      -- Neither a per-account row nor a stray 'global' row under another
      -- scope_key may leak into the series.
      ('account', '${LIVE_A}', current_date - 2, 9999999, 99),
      ('global',  'stray',     current_date - 2, 8888888, 88);
  `);
}
