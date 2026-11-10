// REAL SQL-execution proof of 20261110120000_profiles_x_account.sql, run in
// in-process Postgres (pglite) over the full migration lineage.
//
// The linked X handle is shown publicly next to an author's name as an account
// they proved they own, so a learner must not be able to write it themselves:
// the own-row UPDATE policy on profiles does not limit WHICH columns a learner
// writes, and only enforce_profile_x_account_write stands between a PostgREST
// PATCH and a forged handle.
//
// @vitest-environment node
import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildFullLineage } from "./helpers/full-lineage";

const ME = "a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1";
const OTHER = "b2b2b2b2-b2b2-4b2b-8b2b-b2b2b2b2b2b2";
const X_ID = "1450000000000000000";

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

/** What /api/auth/x-account does, through createAdminClient(). */
async function asService(db: PGlite, sql: string) {
  return db.transaction(async (tx) => {
    await tx.query(
      `SELECT set_config('request.jwt.claims', '{"role":"service_role"}', true)`
    );
    await tx.exec("SET LOCAL ROLE service_role");
    return tx.query(sql);
  });
}

async function xColumns(db: PGlite, id: string) {
  const { rows } = await db.query<{
    x_id: string | null;
    x_username: string | null;
  }>(`SELECT x_id, x_username FROM public.profiles WHERE id = $1`, [id]);
  return rows[0];
}

describe("profiles X account", () => {
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
        ('${ME}', 'me@example.com'),
        ('${OTHER}', 'other@example.com');
    `);
  }, 180_000);
  afterAll(async () => {
    await db.close();
  });

  it("lets a learner save the rest of their profile", async () => {
    await asUser(
      db,
      ME,
      `UPDATE public.profiles SET bio = 'gm', social_links = '{"github":"me"}' WHERE id = '${ME}'`
    );
    const { rows } = await db.query<{ bio: string }>(
      `SELECT bio FROM public.profiles WHERE id = '${ME}'`
    );
    expect(rows[0]!.bio).toBe("gm");
  });

  it("refuses a learner setting their own X handle", async () => {
    await expect(
      asUser(
        db,
        ME,
        `UPDATE public.profiles SET x_id = '1', x_username = 'elonmusk' WHERE id = '${ME}'`
      )
    ).rejects.toThrow(/may only be changed by service_role/);
    expect(await xColumns(db, ME)).toEqual({ x_id: null, x_username: null });
  });

  it("links through the service role, and only the handle is public", async () => {
    await asService(
      db,
      `UPDATE public.profiles SET x_id = '${X_ID}', x_username = 'me_on_x' WHERE id = '${ME}'`
    );
    expect(await xColumns(db, ME)).toEqual({
      x_id: X_ID,
      x_username: "me_on_x",
    });

    const view = await db.query<{ x_username: string }>(
      `SELECT x_username FROM public.public_profiles WHERE id = '${ME}'`
    );
    expect(view.rows[0]!.x_username).toBe("me_on_x");
    const cols = await db.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'public_profiles'`
    );
    expect(cols.rows.map((r) => r.column_name)).not.toContain("x_id");
  });

  it("refuses a learner swapping or clearing a linked handle", async () => {
    await expect(
      asUser(
        db,
        ME,
        `UPDATE public.profiles SET x_username = 'someone_else' WHERE id = '${ME}'`
      )
    ).rejects.toThrow(/x_username may only be changed by service_role/);
    await expect(
      asUser(
        db,
        ME,
        `UPDATE public.profiles SET x_id = NULL, x_username = NULL WHERE id = '${ME}'`
      )
    ).rejects.toThrow(/x_id may only be changed by service_role/);
    expect((await xColumns(db, ME))!.x_username).toBe("me_on_x");
  });

  it("keeps one X account on one profile", async () => {
    await expect(
      asService(
        db,
        `UPDATE public.profiles SET x_id = '${X_ID}', x_username = 'me_on_x' WHERE id = '${OTHER}'`
      )
    ).rejects.toMatchObject({ code: "23505" });
  });

  it("only stores a handle X would issue, always with its id", async () => {
    await expect(
      asService(
        db,
        `UPDATE public.profiles SET x_id = '2', x_username = 'bad/handle' WHERE id = '${OTHER}'`
      )
    ).rejects.toMatchObject({ code: "23514" });
    await expect(
      asService(
        db,
        `UPDATE public.profiles SET x_username = 'no_id' WHERE id = '${OTHER}'`
      )
    ).rejects.toMatchObject({ code: "23514" });
  });

  it("scrubs the X account when the account is deleted", async () => {
    await db.query("SELECT public.delete_account_data($1)", [ME]);
    expect(await xColumns(db, ME)).toEqual({ x_id: null, x_username: null });
  });
});
