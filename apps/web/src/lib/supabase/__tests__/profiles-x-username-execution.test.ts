// REAL SQL-execution proof of 20261110120000_profiles_x_username.sql, run in
// in-process Postgres (pglite) over the full migration lineage.
//
// A verified author's X handle sits next to their badge, and like the badge it
// is admin-set. The own-row UPDATE policy on profiles does not limit WHICH
// columns a learner writes, so enforce_profile_x_username_write is what stands
// between a PostgREST PATCH and a self-awarded handle.
//
// @vitest-environment node
import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildFullLineage } from "./helpers/full-lineage";

const AUTHOR = "a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1";
const LEARNER = "b2b2b2b2-b2b2-4b2b-8b2b-b2b2b2b2b2b2";

/** A PostgREST request from the signed-in learner `userId`. */
async function asUser(db: PGlite, userId: string, sql: string) {
  return db.transaction(async (tx) => {
    await tx.query(`SELECT set_config('request.jwt.claims', $1, true)`, [
      JSON.stringify({ sub: userId, role: "authenticated" }),
    ]);
    await tx.exec("SET LOCAL ROLE authenticated");
    return tx.query(sql);
  });
}

/** What /api/admin/authors does, through createAdminClient(). */
async function asService(db: PGlite, sql: string) {
  return db.transaction(async (tx) => {
    await tx.query(
      `SELECT set_config('request.jwt.claims', '{"role":"service_role"}', true)`
    );
    await tx.exec("SET LOCAL ROLE service_role");
    return tx.query(sql);
  });
}

async function xUsername(db: PGlite, id: string): Promise<string | null> {
  const { rows } = await db.query<{ x_username: string | null }>(
    `SELECT x_username FROM public.profiles WHERE id = $1`,
    [id]
  );
  return rows[0]!.x_username;
}

describe("profiles.x_username", () => {
  let db: PGlite;

  beforeAll(async () => {
    db = await buildFullLineage();
    // The lineage stub's auth.uid() is a constant NULL; the own-row policies
    // need the real one. The grants and BYPASSRLS are what Supabase gives these
    // roles, so a refusal below comes from the guard, not a missing privilege.
    await db.exec(`
      CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
        SELECT (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')::uuid
      $$;
      ALTER ROLE service_role BYPASSRLS;
      GRANT USAGE ON SCHEMA public, auth TO authenticated, service_role;
      GRANT SELECT, UPDATE ON public.profiles TO authenticated;
      INSERT INTO auth.users (id, email) VALUES
        ('${AUTHOR}', 'author@example.com'),
        ('${LEARNER}', 'learner@example.com');
    `);
    await asService(
      db,
      `UPDATE public.profiles SET verified = true, verified_kind = 'superteam' WHERE id = '${AUTHOR}'`
    );
  }, 180_000);
  afterAll(async () => {
    await db.close();
  });

  it("lets a learner save the rest of their profile", async () => {
    await asUser(
      db,
      LEARNER,
      `UPDATE public.profiles SET bio = 'gm', social_links = '{"github":"me"}' WHERE id = '${LEARNER}'`
    );
    const { rows } = await db.query<{ bio: string }>(
      `SELECT bio FROM public.profiles WHERE id = '${LEARNER}'`
    );
    expect(rows[0]!.bio).toBe("gm");
  });

  it("refuses a verified author setting their own handle", async () => {
    await expect(
      asUser(
        db,
        AUTHOR,
        `UPDATE public.profiles SET x_username = 'elonmusk' WHERE id = '${AUTHOR}'`
      )
    ).rejects.toThrow(/x_username may only be changed by service_role/);
    expect(await xUsername(db, AUTHOR)).toBeNull();
  });

  it("takes an admin-set handle and publishes it", async () => {
    await asService(
      db,
      `UPDATE public.profiles SET x_username = 'author_on_x' WHERE id = '${AUTHOR}'`
    );
    const view = await db.query<{ x_username: string }>(
      `SELECT x_username FROM public.public_profiles WHERE id = '${AUTHOR}'`
    );
    expect(view.rows[0]!.x_username).toBe("author_on_x");
  });

  it("refuses the author changing or clearing it afterwards", async () => {
    await expect(
      asUser(
        db,
        AUTHOR,
        `UPDATE public.profiles SET x_username = NULL WHERE id = '${AUTHOR}'`
      )
    ).rejects.toThrow(/x_username may only be changed by service_role/);
    expect(await xUsername(db, AUTHOR)).toBe("author_on_x");
  });

  it("refuses a handle on an unverified profile, even from the service role", async () => {
    await expect(
      asService(
        db,
        `UPDATE public.profiles SET x_username = 'learner_x' WHERE id = '${LEARNER}'`
      )
    ).rejects.toMatchObject({ code: "23514" });
  });

  it("only stores a handle X would issue", async () => {
    await expect(
      asService(
        db,
        `UPDATE public.profiles SET x_username = 'bad/handle' WHERE id = '${AUTHOR}'`
      )
    ).rejects.toMatchObject({ code: "23514" });
  });

  it("scrubs the handle when the account is deleted", async () => {
    await db.query("SELECT public.delete_account_data($1)", [AUTHOR]);
    expect(await xUsername(db, AUTHOR)).toBeNull();
  });
});
