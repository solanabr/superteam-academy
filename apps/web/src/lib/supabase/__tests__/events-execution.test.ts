// REAL SQL-execution proof of 20261112120000_events.sql, run in in-process
// Postgres (pglite) over the full migration lineage.
//
// The redeem code is a secret while its event runs, so neither learners nor
// anonymous visitors may read it, and attendance is written only by the
// service role. The public views must expose events and badges without the
// code and without private or deleted profiles.
//
// @vitest-environment node
import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildFullLineage, readMigration } from "./helpers/full-lineage";

const MIGRATION = "20261112120000_events.sql";

const LEARNER = "a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1";
const PRIVATE = "b2b2b2b2-b2b2-4b2b-8b2b-b2b2b2b2b2b2";
const EVENT = "c3c3c3c3-c3c3-4c3c-8c3c-c3c3c3c3c3c3";

async function as(
  db: PGlite,
  role: "anon" | "authenticated" | "service_role",
  sql: string,
  sub?: string
) {
  return db.transaction(async (tx) => {
    await tx.query(`SELECT set_config('request.jwt.claims', $1, true)`, [
      JSON.stringify(sub ? { sub, role } : { role }),
    ]);
    await tx.exec(`SET LOCAL ROLE ${role}`);
    return tx.query<Record<string, unknown>>(sql);
  });
}

describe("events migration", () => {
  let db: PGlite;

  beforeAll(async () => {
    // Supabase grants anon and authenticated everything on new public tables
    // by default; the lineage stub doesn't. Applying this migration after that
    // default makes its REVOKEs, not a missing grant, what the tests see.
    db = await buildFullLineage({ except: [MIGRATION] });
    await db.exec(
      "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;"
    );
    await db.exec(readMigration(MIGRATION));
    // The stub's auth.uid() is a constant NULL; own-row policies need the real
    // one.
    await db.exec(`
      CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
        SELECT (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')::uuid
      $$;
      ALTER ROLE service_role BYPASSRLS;
      GRANT USAGE ON SCHEMA public, auth TO anon, authenticated, service_role;
      INSERT INTO auth.users (id, email) VALUES
        ('${LEARNER}', 'learner@example.com'),
        ('${PRIVATE}', 'private@example.com');
      UPDATE public.profiles SET is_public = false WHERE id = '${PRIVATE}';
    `);
    await as(
      db,
      "service_role",
      `INSERT INTO public.events (id, achievement_id, name, xp_reward, code, starts_at, ends_at)
       VALUES ('${EVENT}', 'event-breakpoint-ab12c', 'Breakpoint', 100, 'ABCD-1234',
               now() - interval '1 hour', now() + interval '1 hour')`
    );
    await as(
      db,
      "service_role",
      `INSERT INTO public.event_attendances (event_id, user_id) VALUES
         ('${EVENT}', '${LEARNER}'), ('${EVENT}', '${PRIVATE}')`
    );
  }, 180_000);
  afterAll(async () => {
    await db.close();
  });

  it("keeps the events table, and its codes, away from learners and visitors", async () => {
    for (const role of ["anon", "authenticated"] as const) {
      await expect(
        as(db, role, "SELECT code FROM public.events", LEARNER)
      ).rejects.toThrow(/permission denied/);
    }
  });

  it("publishes events without their code", async () => {
    const { rows } = await as(db, "anon", "SELECT * FROM public.public_events");
    expect(rows).toHaveLength(1);
    expect(rows[0]).not.toHaveProperty("code");
    expect(rows[0]!.name).toBe("Breakpoint");
  });

  it("lets a learner read only their own attendance", async () => {
    const { rows } = await as(
      db,
      "authenticated",
      "SELECT user_id FROM public.event_attendances",
      LEARNER
    );
    expect(rows.map((r) => r.user_id)).toEqual([LEARNER]);
  });

  it("refuses a learner recording attendance themselves", async () => {
    await expect(
      as(
        db,
        "authenticated",
        `INSERT INTO public.event_attendances (event_id, user_id) VALUES ('${EVENT}', '${LEARNER}')`,
        LEARNER
      )
    ).rejects.toThrow(/permission denied/);
  });

  it("shows badges for public profiles only", async () => {
    const { rows } = await as(
      db,
      "anon",
      "SELECT user_id FROM public.public_event_badges"
    );
    expect(rows.map((r) => r.user_id)).toEqual([LEARNER]);
  });

  it("hides a deleted account's badges", async () => {
    await db.query("SELECT public.delete_account_data($1)", [LEARNER]);
    const { rows } = await as(
      db,
      "anon",
      "SELECT user_id FROM public.public_event_badges"
    );
    expect(rows).toEqual([]);
  });

  it("records each attendee once per event", async () => {
    await expect(
      as(
        db,
        "service_role",
        `INSERT INTO public.event_attendances (event_id, user_id) VALUES ('${EVENT}', '${PRIVATE}')`
      )
    ).rejects.toMatchObject({ code: "23505" });
  });

  it.each([
    [
      "an id that isn't an event id",
      "achievement-x",
      "ABCD-9999",
      100,
      "1 hour",
    ],
    ["a lower-case code", "event-ok-1", "abcd-9999", 100, "1 hour"],
    ["XP above the cap", "event-ok-2", "ABCD-9998", 501, "1 hour"],
    [
      "a window that closes before it opens",
      "event-ok-3",
      "ABCD-9997",
      100,
      "-1 hour",
    ],
  ])("refuses %s", async (_label, id, code, xp, length) => {
    await expect(
      as(
        db,
        "service_role",
        `INSERT INTO public.events (achievement_id, name, xp_reward, code, starts_at, ends_at)
         VALUES ('${id}', 'Bad', ${xp}, '${code}', now(), now() + interval '${length}')`
      )
    ).rejects.toMatchObject({ code: "23514" });
  });

  it("refuses a code another event already uses", async () => {
    await expect(
      as(
        db,
        "service_role",
        `INSERT INTO public.events (achievement_id, name, xp_reward, code, starts_at, ends_at)
         VALUES ('event-dupe-1', 'Dupe', 10, 'ABCD-1234', now(), now() + interval '1 hour')`
      )
    ).rejects.toMatchObject({ code: "23505" });
  });

  it("creates the public event-images bucket", async () => {
    const { rows } = await db.query<{ public: boolean }>(
      "SELECT public FROM storage.buckets WHERE id = 'event-images'"
    );
    expect(rows[0]?.public).toBe(true);
  });
});

// A wallet shell that redeemed codes must still merge into the account its
// owner later signs in with: merge_wallet_shell_account's fail-closed sweep
// aborts on any row still pointing at the shell, so the function has to move
// event_attendances itself.
describe("merging a wallet shell that attended events", () => {
  const TARGET = "d4d4d4d4-d4d4-4d4d-8d4d-d4d4d4d4d4d4";
  const SHELL = "e5e5e5e5-e5e5-4e5e-8e5e-e5e5e5e5e5e5";
  const WALLET = "ShellWa11et1111111111111111111111111111111";
  const SHARED = "f6f6f6f6-f6f6-4f6f-8f6f-f6f6f6f6f6f6";
  const SHELL_ONLY = "a7a7a7a7-a7a7-4a7a-8a7a-a7a7a7a7a7a7";
  let db: PGlite;

  async function seedShell(target: string, shell: string, wallet: string) {
    await db.exec(`
      INSERT INTO auth.users (id, email) VALUES
        ('${target}', 'person-${target.slice(0, 4)}@example.com'),
        ('${shell}', '${wallet}@wallet.superteam-lms.local');
    `);
    await as(
      db,
      "service_role",
      `UPDATE public.profiles SET wallet_address = '${wallet}' WHERE id = '${shell}'`
    );
  }

  async function attendances(user: string): Promise<string[]> {
    const { rows } = await db.query<{ event_id: string }>(
      `SELECT event_id FROM public.event_attendances WHERE user_id = $1 ORDER BY event_id`,
      [user]
    );
    return rows.map((r) => r.event_id);
  }

  beforeAll(async () => {
    db = await buildFullLineage();
    await db.exec(`ALTER ROLE service_role BYPASSRLS;`);
    await seedShell(TARGET, SHELL, WALLET);
    for (const [id, aid, code] of [
      [SHARED, "event-shared-aaaaa", "SHARED-01"],
      [SHELL_ONLY, "event-shell-bbbbb", "SHELL-01"],
    ]) {
      await as(
        db,
        "service_role",
        `INSERT INTO public.events (id, achievement_id, name, xp_reward, code, starts_at, ends_at)
         VALUES ('${id}', '${aid}', 'Event', 10, '${code}', now(), now() + interval '1 hour')`
      );
    }
    await as(
      db,
      "service_role",
      `INSERT INTO public.event_attendances (event_id, user_id) VALUES
         ('${SHARED}', '${SHELL}'), ('${SHELL_ONLY}', '${SHELL}'),
         ('${SHARED}', '${TARGET}')`
    );
  }, 180_000);
  afterAll(async () => {
    await db.close();
  });

  it("moves the shell's attendance, keeping the target's where both attended", async () => {
    await db.query("SELECT public.merge_wallet_shell_account($1, $2, $3)", [
      TARGET,
      SHELL,
      WALLET,
    ]);
    expect(await attendances(SHELL)).toEqual([]);
    expect(await attendances(TARGET)).toEqual([SHELL_ONLY, SHARED].sort());
  });

  it("is what stands between a redeemed code and an aborted merge", async () => {
    // Red proof: the pre-events body of the function, against a fresh shell.
    await db.exec(
      readMigration("20260817180000_merge_wallet_shell_account.sql")
    );
    const target = "b8b8b8b8-b8b8-4b8b-8b8b-b8b8b8b8b8b8";
    const shell = "c9c9c9c9-c9c9-4c9c-8c9c-c9c9c9c9c9c9";
    const wallet = "ShellWa11et2222222222222222222222222222222";
    await seedShell(target, shell, wallet);
    await as(
      db,
      "service_role",
      `INSERT INTO public.event_attendances (event_id, user_id) VALUES ('${SHARED}', '${shell}')`
    );
    await expect(
      db.query("SELECT public.merge_wallet_shell_account($1, $2, $3)", [
        target,
        shell,
        wallet,
      ])
    ).rejects.toThrow(/event_attendances/);
  });
});
