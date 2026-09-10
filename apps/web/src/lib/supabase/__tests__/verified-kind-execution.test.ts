// REAL SQL-execution proof of the profiles write lock as this migration leaves
// it (#1234), run in in-process Postgres (pglite).
//
// Two things are proved here that no string-matching test can reach:
//
// 1. THE MIGRATION APPLIES AS `postgres`. The backfill at the end of the file
//    runs AFTER the trigger it installs, and that trigger treats only
//    service_role as privileged. `supabase db push` and the Supabase SQL editor
//    both connect as `postgres`, so without the `SET ROLE service_role` around
//    the backfill the file aborts partway — DDL applied, badges not set, the
//    whole transaction rolled back. That failure is silent in review and loud
//    at 2am, so it gets a test.
//
// 2. ALL FIVE PRIVILEGED COLUMNS ACTUALLY REJECT A SELF-WRITE afterwards.
//    profile-write-lock-union.test.ts proves the guards are PRESENT in the SQL
//    text; this proves they FIRE. #1183 shipped a body that read correctly and
//    still left two columns open, so "the SQL says so" is not the standard.
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

const migration = readFileSync(
  resolve(
    findRepoRoot(),
    "supabase/migrations/20260910120000_verified_kind.sql"
  ),
  "utf8"
);

const DAVID = "11111111-1111-1111-1111-111111111111";
const DAVID_WALLET = "8kMziL5e3qEWhp1nQHEiYLRypymyBVTXNxgZXyQwhbSo";
/**
 * An ORDINARY learner, and deliberately not one of the backfilled authors: on a
 * row the migration already badged, `SET verified = true` is a no-op, IS
 * DISTINCT FROM is false and the trigger correctly stays quiet — which would
 * make the exploit cases below pass while proving nothing.
 */
const SELF = "33333333-3333-3333-3333-333333333333";

/**
 * Enough of the production shape for the migration to run against: the roles
 * it references, the profiles columns it guards, and auth.users for the
 * email-keyed half of the backfill. service_role gets the table grants real
 * Supabase gives it, or `SET ROLE service_role` would land on a role that
 * cannot touch the table.
 */
async function freshDb(): Promise<PGlite> {
  const db = new PGlite();
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
    CREATE SCHEMA IF NOT EXISTS auth;
    CREATE TABLE auth.users (id uuid primary key, email text);
    CREATE TABLE public.profiles (
      id uuid primary key,
      wallet_address text unique,
      wallet_kind text,
      username text,
      avatar_url text,
      bio text,
      social_links jsonb,
      created_at timestamptz default now(),
      display_name text,
      verified boolean not null default false,
      is_public boolean default true,
      deleted_at timestamptz
    );
    GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
    GRANT USAGE ON SCHEMA auth TO service_role;
    GRANT SELECT ON auth.users TO service_role;
    INSERT INTO auth.users VALUES ('${DAVID}', 'davidpotolskilafeta@gmail.com');
    INSERT INTO public.profiles (id, username, wallet_address)
      VALUES ('${DAVID}', 'david', '${DAVID_WALLET}');
    INSERT INTO public.profiles (id, username) VALUES ('${SELF}', 'learner');
  `);
  return db;
}

describe("#1234 verified_kind — the migration applies the way it will be run", () => {
  let db: PGlite;
  beforeAll(async () => {
    db = await freshDb();
  });
  afterAll(async () => {
    await db.close();
  });

  it("runs end to end as `postgres`, backfill included", async () => {
    // The connection `supabase db push` / the SQL editor actually gives you.
    expect(
      (await db.query<{ current_user: string }>("SELECT current_user")).rows[0]!
        .current_user
    ).toBe("postgres");
    await expect(db.exec(migration)).resolves.toBeDefined();
  });

  it("leaves the badge on the backfilled author", async () => {
    const r = await db.query<{ verified: boolean; verified_kind: string }>(
      `SELECT verified, verified_kind FROM public.profiles WHERE username = 'david'`
    );
    expect(r.rows[0]).toEqual({ verified: true, verified_kind: "superteam" });
  });

  it("hands the session's role back afterwards", async () => {
    // A migration that leaves the connection as service_role would silently
    // privilege whatever runs next in the same session.
    expect(
      (await db.query<{ current_user: string }>("SELECT current_user")).rows[0]!
        .current_user
    ).toBe("postgres");
  });
});

describe("#1234 — every privileged column rejects a non-service write", () => {
  let db: PGlite;
  beforeAll(async () => {
    db = await freshDb();
    await db.exec(migration);
  });
  afterAll(async () => {
    await db.close();
  });

  // wallet_address/wallet_kind (#408/#696/#1183), display_name/verified (#997),
  // verified_kind (#1234). verified_kind is set alongside verified because the
  // CHECK forbids a kind on an unverified row — so the raise must come from the
  // trigger, not from the constraint.
  const columns: readonly [string, string][] = [
    ["verified", "verified = true"],
    ["verified_kind", "verified = true, verified_kind = 'superteam'"],
    ["display_name", "display_name = 'Superteam Official'"],
    ["wallet_kind", "wallet_kind = 'external'"],
    ["wallet_address", "wallet_address = 'AAAA'"],
  ];

  it.each(columns)(
    "UPDATE of %s raises insufficient_privilege",
    async (col, set) => {
      await expect(
        db.exec(`UPDATE public.profiles SET ${set} WHERE id = '${SELF}';`)
      ).rejects.toMatchObject({ code: "42501" });
    }
  );

  it("an INSERT cannot pre-set them either — squatting is coerced away", async () => {
    // Guarding UPDATE alone would leave the row creatable with the values
    // already in place: nothing is ever "changed", so the UPDATE branch never
    // fires and the badge is self-awarded at signup.
    await db.exec(`
      INSERT INTO public.profiles
        (id, username, verified, verified_kind, wallet_kind, display_name, wallet_address)
      VALUES
        ('22222222-2222-2222-2222-222222222222', 'squatter',
         true, 'superteam', 'external', 'Superteam Official', 'BBBB');
    `);
    const r = await db.query(
      `SELECT verified, verified_kind, wallet_kind, display_name, wallet_address
         FROM public.profiles WHERE username = 'squatter'`
    );
    expect(r.rows[0]).toEqual({
      verified: false,
      verified_kind: null,
      wallet_kind: null,
      display_name: null,
      wallet_address: null,
    });
  });

  it("service_role is still able to grant the badge", async () => {
    // The lock must not also lock out the admin surface it exists to reserve.
    const before = await db.query<{ verified_kind: string | null }>(
      `SELECT verified_kind FROM public.profiles WHERE id = '${SELF}'`
    );
    expect(before.rows[0]!.verified_kind).toBeNull();
    await db.exec(`
      SET ROLE service_role;
      UPDATE public.profiles SET verified = true, verified_kind = 'partner'
       WHERE id = '${SELF}';
      RESET ROLE;
    `);
    const r = await db.query<{ verified_kind: string }>(
      `SELECT verified_kind FROM public.profiles WHERE id = '${SELF}'`
    );
    expect(r.rows[0]!.verified_kind).toBe("partner");
  });
});
