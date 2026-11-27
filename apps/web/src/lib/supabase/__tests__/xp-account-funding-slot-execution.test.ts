// REAL SQL-execution proof of 20261108140000_xp_account_funding_slot.sql, run
// in in-process Postgres (pglite) built from every migration.
//
// What has to hold:
//   1. At most one live (pending or confirmed) `xp_account_fund` row per
//      cluster, mint and wallet, whatever course or program it was for. A
//      failed or expired attempt frees the slot.
//   2. An `xp_account_fund` row carries its wallet and mint.
//   3. Deleting an account keeps a one-way key on its funding rows, so the
//      wallet still counts as funded, and the ledger's lookup finds it.
//   4. The migration is idempotent.
//
// @vitest-environment node
import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { sponsorshipWalletKeys } from "@/lib/platform-spend/wallet-keys";
import { buildFullLineage, readMigration } from "./helpers/full-lineage";

const MIGRATION = "20261108140000_xp_account_funding_slot.sql";
const SERVICE_ON = `SELECT set_config('request.jwt.claims', '{"role":"service_role"}', false);`;

let db: PGlite;

function fund(
  signature: string,
  overrides: {
    status?: string;
    wallet?: string | null;
    mint?: string | null;
    cluster?: string;
    course?: string | null;
  } = {}
) {
  return db.query(
    `INSERT INTO public.platform_spend
       (signature, action, wallet, token_mint, course_id, payer, payer_role,
        cluster, status)
     VALUES ($1, 'xp_account_fund', $2, $3, $4, 'SponsorKey', 'sponsor', $5, $6)`,
    [
      signature,
      overrides.wallet === undefined ? "WalletA" : overrides.wallet,
      overrides.mint === undefined ? "MintX" : overrides.mint,
      overrides.course === undefined ? null : overrides.course,
      overrides.cluster ?? "devnet",
      overrides.status ?? "pending",
    ]
  );
}

const uniqueViolation = { code: "23505" };

beforeAll(async () => {
  db = await buildFullLineage();
}, 180_000);

afterAll(async () => {
  await db.close();
});

describe("xp_account_fund once per cluster, mint and wallet", () => {
  beforeEach(async () => {
    await db.exec("DELETE FROM public.platform_spend;");
  });

  it("refuses a second live funding for the same wallet and mint", async () => {
    await fund("A", { status: "confirmed", course: "course-1" });
    await expect(fund("B", { course: "course-2" })).rejects.toMatchObject(
      uniqueViolation
    );
  });

  it("refuses a second pending funding while the first is in flight", async () => {
    await fund("A");
    await expect(fund("B")).rejects.toMatchObject(uniqueViolation);
  });

  it("frees the slot once the attempt failed, expired or was superseded", async () => {
    await fund("A", { status: "failed" });
    await fund("B", { status: "expired" });
    await fund("C", { status: "superseded" });
    await expect(fund("D")).resolves.toBeDefined();
  });

  it("keys on the mint and the cluster", async () => {
    await fund("A", { status: "confirmed" });
    await expect(fund("B", { mint: "MintY" })).resolves.toBeDefined();
    await expect(fund("C", { cluster: "mainnet-beta" })).resolves.toBeDefined();
    await expect(fund("D", { wallet: "WalletB" })).resolves.toBeDefined();
  });

  it("leaves other actions out of the index", async () => {
    await fund("A", { status: "confirmed" });
    await expect(
      db.query(
        `INSERT INTO public.platform_spend
           (signature, action, wallet, token_mint, payer, payer_role, cluster, status)
         VALUES ('E', 'complete_lesson', 'WalletA', 'MintX', 'SponsorKey', 'sponsor', 'devnet', 'confirmed')`
      )
    ).resolves.toBeDefined();
  });

  it("requires the wallet and the mint", async () => {
    await expect(fund("A", { wallet: null })).rejects.toMatchObject({
      code: "23514",
    });
    await expect(fund("B", { mint: null })).rejects.toMatchObject({
      code: "23514",
    });
  });

  it("is idempotent", async () => {
    await db.exec(readMigration(MIGRATION));
    await fund("A", { status: "confirmed" });
    await expect(fund("B")).rejects.toMatchObject(uniqueViolation);
  });
});

describe("delete_account_data on funding rows", () => {
  const USER = "11111111-1111-4111-8111-111111111111";
  const WALLET = "FundedWa11et1111111111111111111111111111111";

  it("keeps a one-way key the ledger lookup finds", async () => {
    await db.exec("DELETE FROM public.platform_spend;");
    await db.exec(`
      INSERT INTO auth.users (id, email, raw_user_meta_data, raw_app_meta_data)
      VALUES ('${USER}', 'funded@example.com', '{}'::jsonb, '{}'::jsonb);
      ${SERVICE_ON}
      UPDATE public.profiles SET wallet_address = '${WALLET}' WHERE id = '${USER}';
      INSERT INTO public.platform_spend
        (signature, action, user_id, wallet, token_mint, payer, payer_role, cluster, status)
      VALUES ('fund-1', 'xp_account_fund', '${USER}', '${WALLET}', 'MintX',
              'SponsorKey', 'sponsor', 'devnet', 'confirmed');
    `);

    await db.exec(`SELECT public.delete_account_data('${USER}');`);

    const { rows } = await db.query<{ wallet: string }>(
      "SELECT wallet FROM public.platform_spend WHERE signature = 'fund-1'"
    );
    expect(rows[0]!.wallet).not.toContain(WALLET);
    expect(sponsorshipWalletKeys(WALLET)).toContain(rows[0]!.wallet);
  });
});
