// #1091: get_platform_stats() must return byte-for-byte the same numbers the
// landing page's old three queries produced — the unbounded select on
// public_user_xp summed in JS, plus head counts on profiles and certificates.
// This executes the real migration SQL (and the schema.sql mirror copy) in
// pglite and asserts new-vs-old parity against seeded rows, so a drift between
// the function body and the queries it replaces fails CI.
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
const migration = readFileSync(
  resolve(
    repoRoot,
    "supabase/migrations/20260819180000_get_platform_stats.sql"
  ),
  "utf8"
);
const schema = readFileSync(resolve(repoRoot, "supabase/schema.sql"), "utf8");

// Pull one `CREATE OR REPLACE FUNCTION <sig> … $$;` block out of a SQL file so
// the schema.sql mirror copy runs too, not just the migration's.
function extractFunction(sql: string, signature: string): string {
  const start = sql.indexOf(`CREATE OR REPLACE FUNCTION ${signature}`);
  if (start < 0) throw new Error(`function ${signature} not found`);
  const end = sql.indexOf("$$;", start);
  if (end < 0) throw new Error(`unterminated body for ${signature}`);
  return sql.slice(start, end + 3);
}

// The REAL public_user_xp view from schema.sql — the function sums over it, so
// its is_public filter is part of what's under test. Never a hand-written copy.
function extractView(sql: string, name: string): string {
  const start = sql.indexOf(`CREATE OR REPLACE VIEW ${name} AS`);
  if (start < 0) throw new Error(`view ${name} not found`);
  const end = sql.indexOf(";", start);
  if (end < 0) throw new Error(`unterminated view ${name}`);
  return sql.slice(start, end + 1);
}

// Minimal stub of objects the migration references but does not create: the
// three Supabase roles the GRANT/REVOKE statements target, and the base tables
// public_user_xp / the counts read from. Only the columns the function touches.
const STUB_SETUP = `
  CREATE ROLE anon;
  CREATE ROLE authenticated;
  CREATE ROLE service_role;
  CREATE TABLE public.profiles (
    id uuid PRIMARY KEY,
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
`;

const PUBLIC_A = "11111111-1111-1111-1111-111111111111";
const PUBLIC_B = "22222222-2222-2222-2222-222222222222";
const PRIVATE_C = "33333333-3333-3333-3333-333333333333";
const DELETED_D = "44444444-4444-4444-4444-444444444444";

interface StatsRow {
  total_xp: number;
  builders: number;
  credentials: number;
}

function firstRow<T>(rows: readonly T[]): T {
  expect(rows.length).toBeGreaterThan(0);
  return rows[0] as T;
}

async function newStats(db: PGlite): Promise<StatsRow> {
  const { rows } = await db.query<StatsRow>(
    "SELECT * FROM public.get_platform_stats()"
  );
  expect(rows.length).toBe(1);
  return firstRow(rows);
}

// The landing page's OLD computation, expressed over the same sources it
// queried: every public_user_xp row summed (the JS reduce), plus unfiltered
// counts on profiles and certificates.
async function oldStats(db: PGlite): Promise<StatsRow> {
  const xp = await db.query<{ total_xp: number | null }>(
    "SELECT total_xp FROM public.public_user_xp"
  );
  const profiles = await db.query<{ n: number }>(
    "SELECT count(*)::int AS n FROM public.profiles"
  );
  const certs = await db.query<{ n: number }>(
    "SELECT count(*)::int AS n FROM public.certificates"
  );
  return {
    total_xp: xp.rows.reduce((sum, r) => sum + (r.total_xp ?? 0), 0),
    builders: firstRow(profiles.rows).n,
    credentials: firstRow(certs.rows).n,
  };
}

const COPIES = ["migration", "schema.sql mirror"] as const;

for (const copy of COPIES) {
  describe(`#1091 get_platform_stats parity with the old queries — ${copy}`, () => {
    let db: PGlite;

    // One pglite instance per describe (creation is expensive); truncate the
    // seedable tables between tests instead.
    beforeAll(async () => {
      db = await PGlite.create();
      await db.exec(STUB_SETUP);
      await db.exec(extractView(schema, "public_user_xp"));
      await db.exec(migration);
      if (copy === "schema.sql mirror") {
        await db.exec(extractFunction(schema, "public.get_platform_stats()"));
      }
    }, 60_000);

    beforeEach(async () => {
      await db.exec(
        "TRUNCATE public.certificates, public.user_xp, public.profiles CASCADE"
      );
    });

    afterAll(async () => {
      await db.close();
    });

    it("empty database → all zeros (SUM over no rows must coalesce)", async () => {
      expect(await newStats(db)).toEqual(await oldStats(db));
      expect(await newStats(db)).toEqual({
        total_xp: 0,
        builders: 0,
        credentials: 0,
      });
    });

    it("matches the old three-query computation on seeded rows", async () => {
      await db.exec(`
        INSERT INTO public.profiles(id, is_public, deleted_at) VALUES
          ('${PUBLIC_A}', true, NULL),
          ('${PUBLIC_B}', true, NULL),
          ('${PRIVATE_C}', false, NULL),
          ('${DELETED_D}', true, now());
        INSERT INTO public.user_xp(user_id, total_xp, level) VALUES
          ('${PUBLIC_A}', 150, 1),
          ('${PUBLIC_B}', 275, 1),
          ('${PRIVATE_C}', 9999, 9),
          ('${DELETED_D}', 500, 2);
        INSERT INTO public.certificates(user_id) VALUES
          ('${PUBLIC_A}'), ('${PUBLIC_A}'), ('${PRIVATE_C}');
      `);

      const fresh = await newStats(db);
      expect(fresh).toEqual(await oldStats(db));
      // Pin the semantics, not just parity: private XP excluded (the view's
      // is_public filter), but private profiles/certs still counted — exactly
      // what the old unfiltered head counts did. The soft-deleted profile's XP
      // is INCLUDED today because schema.sql's public_user_xp is stale (#1105
      // — prod filters deleted_at IS NULL). When #1105 lands, total_xp here
      // must drop to 425; builders stays 4 (the head count never filtered).
      expect(fresh).toEqual({ total_xp: 925, builders: 4, credentials: 3 });
    });

    it("is not executable by anon or authenticated", async () => {
      for (const role of ["anon", "authenticated"]) {
        await db.exec(`SET ROLE ${role}`);
        await expect(
          db.query("SELECT * FROM public.get_platform_stats()")
        ).rejects.toThrow(/permission denied/);
        await db.exec("RESET ROLE");
      }
    });
  });
}
