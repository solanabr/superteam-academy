/**
 * Solana network identity, resolved from `NEXT_PUBLIC_SOLANA_NETWORK`
 * (devnet default — mirrors the inline convention used across pages).
 */
export interface SolanaNetworkInfo {
  /** Raw env value, e.g. "devnet" | "mainnet". */
  network: string;
  /** Explorer `?cluster=` value — "mainnet" maps to "mainnet-beta". */
  cluster: string;
  /** Capitalized display label, e.g. "Devnet" | "Mainnet". */
  label: string;
}

/** Read at call time (not module scope) so tests and previews can override. */
export function resolveSolanaNetwork(): SolanaNetworkInfo {
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "devnet";
  return {
    network,
    cluster: network === "mainnet" ? "mainnet-beta" : network,
    label: network.charAt(0).toUpperCase() + network.slice(1),
  };
}
