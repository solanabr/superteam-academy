import { createHash } from "node:crypto";

/**
 * The values a wallet can appear under on a sponsored `platform_spend` row: as
 * itself, or as the one-way key `delete_account_data` leaves when its account is
 * deleted. Keeps a wallet to one sponsorship across accounts. Must match the SQL in
 * 20261105130000_delete_account_data.sql.
 */
export function sponsorshipWalletKeys(wallet: string): string[] {
  const hash = createHash("sha256").update(wallet).digest("hex");
  return [wallet, `deleted:${hash}`];
}
