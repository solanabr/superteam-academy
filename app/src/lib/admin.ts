/**
 * Admin wallet whitelist.
 *
 * Set NEXT_PUBLIC_ADMIN_WALLETS in .env.local as a comma-separated list
 * of base-58 Solana wallet addresses:
 *
 *   NEXT_PUBLIC_ADMIN_WALLETS=Abc123...,Def456...
 */

const raw = process.env.NEXT_PUBLIC_ADMIN_WALLETS ?? "";

export const ADMIN_WALLETS: string[] = raw
  .split(",")
  .map((w) => w.trim())
  .filter(Boolean);

export function isAdminWallet(wallet: string | null | undefined): boolean {
  if (!wallet) return false;
  return ADMIN_WALLETS.includes(wallet);
}
