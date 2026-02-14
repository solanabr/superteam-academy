import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";

export const network = "devnet";

export function getSolanaEndpoint(): string {
  return process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? clusterApiUrl(network);
}

export function getWalletAdapters() {
  return [new PhantomWalletAdapter(), new SolflareWalletAdapter()];
}

export function isWalletAuthEnabled(): boolean {
  return true;
}
