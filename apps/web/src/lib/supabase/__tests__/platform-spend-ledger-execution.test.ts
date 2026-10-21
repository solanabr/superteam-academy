// REAL SQL-execution proof of the platform spend ledger migration, run in
// in-process Postgres (pglite).
//
// What has to hold:
//   1. Once per wallet and course: at most one live (pending or confirmed)
//      `enroll_sponsor` row per (cluster, wallet, course). A failed or expired
//      attempt frees the slot; a confirmed one holds it forever.
//   2. The signature is unique, and an ON CONFLICT DO NOTHING re-insert (the
//      app's idempotent write) leaves the first row alone.
//   3. Service-role only: anon and authenticated can neither read nor write
//      the ledger, nor call the alert throttle.
//   4. `claim_platform_alert` fires once per interval, atomically.
//   5. The migration is idempotent.
//
// @vitest-environment node
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";

function findRepoRoot(): string {
  let dir = dirname(fileURLToPath(import.meta.url));
  while (!existsSync(resolve(dir, "supabase/migrations"))) {
    const parent = dirname(dir);
    if (parent === dir) throw new Error("repo root not found");
    dir = parent;
  }
  return dir;
}

const migration = readFileSync(
  resolve(
    findRepoRoot(),
    "supabase/migrations/20261021120000_platform_spend_ledger.sql"
  ),
  "utf8"
);

const STUB_SETUP = `
  CREATE ROLE anon;
  CREATE ROLE authenticated;
  CREATE ROLE service_role BYPASSRLS;
  CREATE TABLE public.profiles (id uuid PRIMARY KEY);
  -- Supabase's default privileges: every role can reach public tables, and
  -- RLS plus explicit REVOKEs are what keep clients out.
  ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL ON TABLES TO anon, authenticated, service_role;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
  GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
`;

let db: PGlite;

async function as(role: "anon" | "authenticated" | "service_role") {
  await db.exec("RESET ROLE;");
  await db.exec(`SET ROLE ${role};`);
}

function enroll(
  signature: string,
  overrides: {
    status?: string;
    wallet?: string;
    course?: string;
    cluster?: string;
  } = {}
) {
  return db.query(
    `INSERT INTO public.platform_spend
       (signature, action, wallet, course_id, payer, payer_role, cluster, status)
     VALUES ($1, 'enroll_sponsor', $2, $3, 'SponsorKey', 'sponsor', $4, $5)`,
    [
      signature,
      overrides.wallet ?? "WalletA",
      overrides.course ?? "course-x",
      overrides.cluster ?? "devnet",
      overrides.status ?? "pending",
    ]
  );
}

async function setStatus(signature: string, status: string) {
  await db.query(
    `UPDATE public.platform_spend SET status = $2 WHERE signature = $1`,
    [signature, status]
  );
}

async function claim(key: string, seconds: number): Promise<boolean> {
  const { rows } = await db.query<{ claimed: boolean }>(
    `SELECT public.claim_platform_alert($1, $2) AS claimed`,
    [key, seconds]
  );
  return rows[0]!.claimed;
}

// One database for the file (pglite start-up dominates the run time); each
// test starts from empty tables.
beforeAll(async () => {
  db = new PGlite();
  await db.exec(STUB_SETUP);
  await db.exec(migration);
});

beforeEach(async () => {
  await db.exec("RESET ROLE;");
  await db.exec("TRUNCATE public.platform_spend, public.platform_alert_state;");
  await as("service_role");
});

describe("platform_spend migration", () => {
  it("is idempotent", async () => {
    await db.exec("RESET ROLE;");
    await expect(db.exec(migration)).resolves.toBeDefined();
  });

  it("allows one live sponsored enrollment per wallet and course", async () => {
    await enroll("SIG1");
    await expect(enroll("SIG2")).rejects.toThrow(/duplicate key/);

    await setStatus("SIG1", "confirmed");
    await expect(enroll("SIG3")).rejects.toThrow(/duplicate key/);
  });

  it("frees the slot when the earlier attempt failed or expired", async () => {
    await enroll("SIG1");
    await setStatus("SIG1", "expired");
    await expect(enroll("SIG2")).resolves.toBeDefined();

    await setStatus("SIG2", "failed");
    await expect(enroll("SIG3")).resolves.toBeDefined();
  });

  it("refuses to move a second sponsorship to confirmed while one holds the slot", async () => {
    await enroll("SIG1", { status: "confirmed" });
    await enroll("SIG2", { status: "expired" });
    await expect(setStatus("SIG2", "confirmed")).rejects.toThrow(
      /duplicate key/
    );
  });

  it("scopes the slot to the course, the wallet and the cluster", async () => {
    await enroll("SIG1");
    await expect(enroll("SIG2", { course: "course-y" })).resolves.toBeDefined();
    await expect(enroll("SIG3", { wallet: "WalletB" })).resolves.toBeDefined();
    await expect(enroll("SIG4", { cluster: "mainnet" })).resolves.toBeDefined();
  });

  it("refuses a sponsored enrollment row without its wallet or course", async () => {
    await expect(
      db.query(
        `INSERT INTO public.platform_spend
           (signature, action, payer, payer_role, cluster)
         VALUES ('SIG1', 'enroll_sponsor', 'SponsorKey', 'sponsor', 'devnet')`
      )
    ).rejects.toThrow(/enroll_sponsor_keys_check/);
  });

  it("keeps the first row when the same signature is written again", async () => {
    const write = (action: string) =>
      db.query(
        `INSERT INTO public.platform_spend
           (signature, action, payer, payer_role, cluster)
         VALUES ('SIG1', $1, 'SponsorKey', 'sponsor', 'devnet')
         ON CONFLICT (signature) DO NOTHING`,
        [action]
      );
    await write("xp_mint");
    await write("finalize");

    const { rows } = await db.query<{ action: string }>(
      `SELECT action FROM public.platform_spend`
    );
    expect(rows).toEqual([{ action: "xp_mint" }]);
  });

  it("rejects an unknown payer role or status, and negative amounts", async () => {
    const insert = (role: string, status: string, fee: number) =>
      db.query(
        `INSERT INTO public.platform_spend
           (signature, action, payer, payer_role, cluster, status, fee_lamports)
         VALUES (gen_random_uuid()::text, 'xp_mint', 'K', $1, 'devnet', $2, $3)`,
        [role, status, fee]
      );
    await expect(insert("learner", "pending", 0)).rejects.toThrow();
    await expect(insert("sponsor", "settled", 0)).rejects.toThrow();
    await expect(insert("sponsor", "pending", -1)).rejects.toThrow();
    await expect(insert("sponsor", "pending", 5000)).resolves.toBeDefined();
  });

  it.each(["anon", "authenticated"] as const)(
    "keeps %s out of the ledger and the throttle",
    async (role) => {
      await as(role);
      await expect(
        db.query(`SELECT * FROM public.platform_spend`)
      ).rejects.toThrow(/permission denied/);
      await expect(enroll("SIG1")).rejects.toThrow(/permission denied/);
      await expect(
        db.query(`SELECT * FROM public.platform_alert_state`)
      ).rejects.toThrow(/permission denied/);
      await expect(claim("k", 60)).rejects.toThrow(/permission denied/);
    }
  );
});

describe("claim_platform_alert", () => {
  it("fires once per interval", async () => {
    expect(await claim("low_balance:devnet:sponsor", 3600)).toBe(true);
    expect(await claim("low_balance:devnet:sponsor", 3600)).toBe(false);
    // Another key is throttled on its own.
    expect(await claim("low_balance:devnet:backend", 3600)).toBe(true);

    await db.query(
      `UPDATE public.platform_alert_state
          SET last_fired_at = now() - interval '2 hours'
        WHERE key = 'low_balance:devnet:sponsor'`
    );
    expect(await claim("low_balance:devnet:sponsor", 3600)).toBe(true);
    expect(await claim("low_balance:devnet:sponsor", 3600)).toBe(false);
  });
});
