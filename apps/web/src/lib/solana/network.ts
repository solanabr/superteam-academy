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

/**
 * The chain an RPC endpoint points at, as far as its host can tell. `unknown`
 * is an answer, not a fallback: a private or proxied endpoint that names no
 * cluster must read as unknown rather than be assumed to be devnet.
 */
export type RpcNetwork = "devnet" | "mainnet" | "unknown";

/**
 * Derive the network from the RPC URL instead of `NEXT_PUBLIC_SOLANA_NETWORK`,
 * which is optional, unvalidated, and free to disagree with the endpoint the
 * server actually reads through (#1140). The URL is where the reads go, so it
 * is the one source that cannot quietly lie about which chain an operator is
 * looking at.
 *
 * Matched on the host only — a path or query segment is not evidence of a
 * cluster, and matching the whole URL would let an api-key param pick the
 * label. A host naming both resolves to mainnet: over-claiming makes an
 * operator more careful, under-claiming is the trap this fixes.
 */
export function networkFromRpcUrl(rpcUrl: string): RpcNetwork {
  let host: string;
  try {
    host = new URL(rpcUrl).host.toLowerCase();
  } catch {
    return "unknown";
  }
  // "mainnet" is a substring of "mainnet-beta", so this covers both spellings.
  if (host.includes("mainnet")) return "mainnet";
  if (host.includes("devnet")) return "devnet";
  return "unknown";
}
