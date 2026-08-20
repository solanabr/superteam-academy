// REAL SQL-execution proof of the profiles.deleted_at write lock (#1103), run
// in in-process Postgres (pglite) against BOTH copies of the DDL: the migration
// that gets applied, and the supabase/schema.sql mirror that fresh environments
// are built from.
//
// THE EXPLOIT. The self-service profiles policies are column-agnostic —
// `FOR UPDATE USING (auth.uid() = id)` says which ROW you may write, never which
// COLUMNS. deleted_at is the account tombstone every public read and every login
// chokepoint keys on, so a soft-deleted user still holding a valid access token
// could go straight to PostgREST with
//
//   UPDATE profiles SET deleted_at = NULL, is_public = true WHERE id = <self>
//
// and resurrect the account permanently — a single write inside the token's
// remaining lifetime, long after the deletion route revoked the session.
//
// The RLS policies are installed here for real (with a stub auth.uid() reading
// the JWT claim), so the "RLS alone does not stop it" case below is a live
// red-proof: drop the trigger and the exploit succeeds against exactly the same
// policies. That is what makes the rest of this suite a security test rather
// than a trigger test.
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
    "supabase/migrations/20260819200000_deleted_at_write_lock.sql"
  ),
  "utf8"
);
const schema = readFileSync(resolve(repoRoot, "supabase/schema.sql"), "utf8");

const FN = "public.enforce_profile_deleted_at_write()";
const TRIGGER = "trg_enforce_profile_deleted_at_write";

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

/** Pull one `CREATE TABLE <name> ( … \n);` block out of a SQL file. */
function extractTable(sql: string, name: string): string {
  const start = sql.indexOf(`CREATE TABLE ${name} (`);
  if (start < 0) throw new Error(`table ${name} not found`);
  const end = sql.indexOf("\n);", start);
  if (end < 0) throw new Error(`unterminated table ${name}`);
  return sql.slice(start, end + 3);
}

/** Pull one `CREATE OR REPLACE VIEW <name> AS … ;` block out of a SQL file. */
function extractView(sql: string, name: string): string {
  const start = sql.indexOf(`CREATE OR REPLACE VIEW ${name} AS`);
  if (start < 0) throw new Error(`view ${name} not found`);
  const end = sql.indexOf(";", start);
  if (end < 0) throw new Error(`unterminated view ${name}`);
  return sql.slice(start, end + 1);
}

/** The drop-then-create trigger install, taken from whichever file is under test. */
function triggerInstall(sql: string): string {
  return [
    extractStatement(
      sql,
      `DROP TRIGGER IF EXISTS ${TRIGGER} ON public.profiles`
    ),
    extractStatement(sql, `CREATE TRIGGER ${TRIGGER}`),
  ].join("\n");
}

// The mirror copy is assembled from schema.sql's OWN statements, never from
// literals written here — so a schema.sql that lost the REVOKE or the trigger
// install fails at extraction instead of quietly testing this file's idea of it.
const mirror = [
  extractFunction(schema, FN),
  extractStatement(schema, `REVOKE EXECUTE ON FUNCTION ${FN} FROM`),
  triggerInstall(schema),
].join("\n");

// Minimal stand-in for the real profiles surface: the three Supabase roles, a
// stub auth.uid() (the JWT `sub` claim, exactly what Supabase's does), the
// columns this trigger and the exploit touch, and the REAL column-agnostic
// self-service policies from schema.sql. service_role gets BYPASSRLS because
// that is how Supabase provisions it.
const STUB_SETUP = `
  CREATE ROLE anon;
  CREATE ROLE authenticated;
  CREATE ROLE service_role BYPASSRLS;

  CREATE SCHEMA IF NOT EXISTS auth;
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $fn$
    SELECT (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')::uuid;
  $fn$;

  CREATE TABLE public.profiles (
    id uuid PRIMARY KEY,
    username text UNIQUE,
    bio text,
    is_public boolean NOT NULL DEFAULT true,
    deleted_at timestamptz,
    deletion_requested_at timestamptz
  );

  ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT USING (auth.uid() = id);
  CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
  CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE USING (auth.uid() = id);

  GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
  GRANT ALL ON public.profiles TO service_role;
`;

const LIVE = "11111111-1111-1111-1111-111111111111";
const TOMBSTONED = "44444444-4444-4444-4444-444444444444";
const DENIED = /deleted_at may only be changed by service_role/;

interface ProfileRow {
  deleted_at: string | null;
  is_public: boolean;
}

/** Become `role`, with `sub` presented as the JWT subject (as PostgREST does). */
async function become(
  db: PGlite,
  role: "anon" | "authenticated" | "service_role",
  sub?: string
): Promise<void> {
  await db.exec("RESET ROLE;");
  await db.query(`SELECT set_config('request.jwt.claims', $1, false)`, [
    JSON.stringify(sub ? { sub, role } : { role }),
  ]);
  await db.exec(`SET ROLE ${role};`);
}

/** Read a row with the trigger and RLS out of the way (superuser, no claims). */
async function readProfile(db: PGlite, id: string): Promise<ProfileRow> {
  await db.exec("RESET ROLE;");
  await db.query(`SELECT set_config('request.jwt.claims', '', false)`);
  const { rows } = await db.query<ProfileRow>(
    `SELECT deleted_at, is_public FROM public.profiles WHERE id = $1`,
    [id]
  );
  expect(rows.length).toBe(1);
  return rows[0] as ProfileRow;
}

/** The #1103 exploit verbatim, run as the account's own authenticated session. */
function resurrect(db: PGlite) {
  return db.query(
    `UPDATE public.profiles SET deleted_at = NULL, is_public = true WHERE id = $1`,
    [TOMBSTONED]
  );
}

for (const copy of ["migration", "schema.sql mirror"] as const) {
  describe(`#1103 deleted_at write lock — ${copy}`, () => {
    let db: PGlite;
    const sql = copy === "migration" ? migration : mirror;

    // One instance per describe — creating a PGlite is expensive enough that
    // doing it per test starves the other pglite suites when the whole file
    // set runs in parallel. State is reset in beforeEach instead.
    beforeAll(async () => {
      db = new PGlite();
      await db.exec(STUB_SETUP);
      await db.exec(sql);
    }, 60_000);

    beforeEach(async () => {
      await db.exec("RESET ROLE;");
      // Re-install the trigger before every case: the "RLS alone" test drops
      // it, and a failure partway through that test must not silently disarm
      // the rest of the suite.
      await db.exec(triggerInstall(sql));
      await db.exec("TRUNCATE public.profiles CASCADE;");
      // Seeding a tombstone is itself a privileged write, so seed as
      // service_role — under any other role the INSERT branch would coerce
      // deleted_at back to NULL and there would be nothing to test.
      await become(db, "service_role");
      await db.query(
        `INSERT INTO public.profiles(id, username, is_public, deleted_at, deletion_requested_at)
         VALUES ($1, 'real-learner', true, NULL, NULL),
                ($2, 'deleted-user-abc123', false, now(), now())`,
        [LIVE, TOMBSTONED]
      );
      await db.exec("RESET ROLE;");
    });

    afterAll(async () => {
      await db.close();
    });

    it("blocks the resurrection: own-row UPDATE cannot clear deleted_at", async () => {
      await become(db, "authenticated", TOMBSTONED);
      await expect(resurrect(db)).rejects.toThrow(DENIED);
      // Nothing partially applied — is_public rode along in the same statement.
      const row = await readProfile(db, TOMBSTONED);
      expect(row.deleted_at).not.toBeNull();
      expect(row.is_public).toBe(false);
    });

    it("blocks a self-tombstone too — deletion goes through the delete route", async () => {
      await become(db, "authenticated", LIVE);
      await expect(
        db.query(
          `UPDATE public.profiles SET deleted_at = now() WHERE id = $1`,
          [LIVE]
        )
      ).rejects.toThrow(DENIED);
      expect((await readProfile(db, LIVE)).deleted_at).toBeNull();
    });

    it("RLS alone does not stop it — the trigger is what blocks the write", async () => {
      // Red-proof against the same policies: without the trigger, the exact
      // exploit above succeeds and the account is permanently back.
      await db.exec(`DROP TRIGGER ${TRIGGER} ON public.profiles;`);
      await become(db, "authenticated", TOMBSTONED);
      await resurrect(db);
      const row = await readProfile(db, TOMBSTONED);
      expect(row.deleted_at).toBeNull();
      expect(row.is_public).toBe(true);
    });

    it("leaves ordinary self-service profile edits alone", async () => {
      await become(db, "authenticated", LIVE);
      await db.query(
        `UPDATE public.profiles SET bio = 'gm', is_public = false WHERE id = $1`,
        [LIVE]
      );
      const row = await readProfile(db, LIVE);
      expect(row.is_public).toBe(false);
      expect(row.deleted_at).toBeNull();
    });

    it("service_role still tombstones and still restores", async () => {
      await become(db, "service_role");
      await db.query(
        `UPDATE public.profiles SET deleted_at = now() WHERE id = $1`,
        [LIVE]
      );
      expect((await readProfile(db, LIVE)).deleted_at).not.toBeNull();

      await become(db, "service_role");
      await db.query(
        `UPDATE public.profiles SET deleted_at = NULL WHERE id = $1`,
        [TOMBSTONED]
      );
      expect((await readProfile(db, TOMBSTONED)).deleted_at).toBeNull();
    });

    it("accepts the PostgREST service-role claim, not just the DB role", async () => {
      // The channel merge_wallet_shell_account() uses: SET ROLE is forbidden
      // inside a SECURITY DEFINER function, so it sets the claim instead. If
      // this branch were dropped, the shell tombstone would start failing.
      await db.exec("RESET ROLE;");
      await db.query(`SELECT set_config('request.jwt.claims', $1, false)`, [
        JSON.stringify({ sub: TOMBSTONED, role: "service_role" }),
      ]);
      await db.exec("SET ROLE authenticated;");
      await resurrect(db);
      expect((await readProfile(db, TOMBSTONED)).deleted_at).toBeNull();
    });

    it("coerces a non-privileged INSERT's deleted_at to NULL", async () => {
      const born = "99999999-9999-9999-9999-999999999999";
      await become(db, "authenticated", born);
      await db.query(
        `INSERT INTO public.profiles(id, username, deleted_at) VALUES ($1, 'newcomer', now())`,
        [born]
      );
      // Coerced, not rejected: a hard failure here would block signup, and the
      // provisioning trigger never sets deleted_at anyway.
      expect((await readProfile(db, born)).deleted_at).toBeNull();
    });

    it("is not callable via PostgREST RPC", async () => {
      for (const role of ["anon", "authenticated"] as const) {
        await become(db, role);
        await expect(db.query(`SELECT ${FN}`)).rejects.toThrow(
          /permission denied/
        );
      }
      await db.exec("RESET ROLE;");
    });
  });
}

// The cases above build profiles from STUB_SETUP, which is exactly why the
// review below found what it found: a hand-written stub always has the columns
// the test wants. These build it from schema.sql's OWN declaration instead, so
// the snapshot has to be internally consistent.
describe("#1103 schema.sql is coherent with itself", () => {
  let db: PGlite;

  beforeAll(async () => {
    db = new PGlite();
    await db.exec(`
      CREATE ROLE anon;
      CREATE ROLE authenticated;
      CREATE ROLE service_role BYPASSRLS;
      CREATE SCHEMA IF NOT EXISTS auth;
      CREATE TABLE auth.users (id uuid PRIMARY KEY);
    `);
    await db.exec(extractTable(schema, "profiles"));
    await db.exec(`
      CREATE TABLE user_xp (
        user_id uuid PRIMARY KEY REFERENCES profiles(id),
        total_xp integer NOT NULL DEFAULT 0,
        level integer NOT NULL DEFAULT 0
      );
      GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
      GRANT ALL ON profiles, user_xp TO service_role;
      INSERT INTO auth.users(id) VALUES ('${LIVE}'), ('${TOMBSTONED}');
    `);
    await db.exec(mirror);
  }, 60_000);

  beforeEach(async () => {
    await db.exec("RESET ROLE;");
    await db.exec(`
      DROP VIEW IF EXISTS public_user_xp;
      DROP VIEW IF EXISTS public_profiles;
      TRUNCATE user_xp, profiles CASCADE;
    `);
  });

  afterAll(async () => {
    await db.close();
  });

  // F1 of the #1115 adversarial review: the trigger reads NEW.deleted_at, but
  // the profiles declaration in the same file never had the column (nor
  // deletion_requested_at), so on a DB built from this snapshot EVERY write to
  // profiles died with `record "new" has no field "deleted_at"` — the trigger
  // turned a missing column into a total outage of the table.
  it("declares the columns the trigger and the public views read", async () => {
    await become(db, "service_role");
    await db.query(
      `INSERT INTO profiles(id, username, deleted_at, deletion_requested_at)
       VALUES ($1, 'real-learner', NULL, NULL), ($2, 'deleted-user-abc123', now(), now())`,
      [LIVE, TOMBSTONED]
    );

    // An ordinary self-service edit must not trip the trigger.
    await become(db, "authenticated", LIVE);
    await db.query(`UPDATE profiles SET bio = 'gm' WHERE id = $1`, [LIVE]);

    // …and the lock still holds on the real table shape.
    await expect(
      db.query(`UPDATE profiles SET deleted_at = NULL WHERE id = $1`, [
        TOMBSTONED,
      ])
    ).rejects.toThrow(DENIED);
  });

  it("creates the two public views that filter p.deleted_at", async () => {
    // #1105 restored `AND p.deleted_at IS NULL` to public_user_xp; both views
    // fail to create at all if the column is missing from the declaration.
    await db.exec(extractView(schema, "public_user_xp"));
    await db.exec(extractView(schema, "public_profiles"));

    await become(db, "service_role");
    await db.query(
      `INSERT INTO profiles(id, username, is_public, deleted_at)
       VALUES ($1, 'real-learner', true, NULL), ($2, 'deleted-user-abc123', true, now())`,
      [LIVE, TOMBSTONED]
    );
    await db.query(
      `INSERT INTO user_xp(user_id, total_xp, level) VALUES ($1, 150, 1), ($2, 500, 2)`,
      [LIVE, TOMBSTONED]
    );

    // The tombstoned row is public and carries XP, so only the deleted_at
    // filter can keep it out of either view.
    await db.exec("RESET ROLE;");
    const xp = await db.query<{ user_id: string }>(
      `SELECT user_id FROM public_user_xp`
    );
    const profiles = await db.query<{ id: string }>(
      `SELECT id FROM public_profiles`
    );
    expect(xp.rows.map((r) => r.user_id)).toEqual([LIVE]);
    expect(profiles.rows.map((r) => r.id)).toEqual([LIVE]);
  });
});
