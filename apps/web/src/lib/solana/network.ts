/**
 * The cluster a `NEXT_PUBLIC_SOLANA_NETWORK` label names, spelled the way the
 * explorer's `?cluster=` and the Irys/Helius switches expect it.
 */
export type SolanaCluster = "mainnet-beta" | "devnet" | "testnet";

/** The label trimmed and lowercased; unset or blank reads as "devnet". */
export function normalizeNetworkLabel(
  label: string | null | undefined
): string {
  const normalized = (label ?? "").trim().toLowerCase();
  return normalized === "" ? "devnet" : normalized;
}

/**
 * Whether a network label means mainnet. `mainnet` and `mainnet-beta` are both
 * in use, in any case and with stray whitespace from a dashboard paste, so the
 * label is compared only through here. Anything starting with "mainnet" counts:
 * over-claiming mainnet is the safe direction for every caller.
 */
export function isMainnetLabel(label: string | null | undefined): boolean {
  return normalizeNetworkLabel(label).startsWith("mainnet");
}

/** The cluster a label names. Unknown labels fall back to devnet, the default. */
export function clusterFromLabel(
  label: string | null | undefined
): SolanaCluster {
  if (isMainnetLabel(label)) return "mainnet-beta";
  return normalizeNetworkLabel(label) === "testnet" ? "testnet" : "devnet";
}

const CLUSTER_DISPLAY: Record<SolanaCluster, string> = {
  "mainnet-beta": "Mainnet",
  devnet: "Devnet",
  testnet: "Testnet",
};

/** The explorer's `?cluster=` suffix: none for mainnet, which is its default. */
export function explorerClusterQuery(cluster: SolanaCluster): string {
  return cluster === "mainnet-beta" ? "" : `?cluster=${cluster}`;
}

/**
 * A Solana Explorer link for a transaction or an address on `cluster`, which
 * defaults to the app's own cluster.
 */
export function explorerUrl(
  kind: "tx" | "address",
  id: string,
  cluster: SolanaCluster = clusterFromLabel(
    process.env.NEXT_PUBLIC_SOLANA_NETWORK
  )
): string {
  return `https://explorer.solana.com/${kind}/${id}${explorerClusterQuery(cluster)}`;
}

/**
 * Solana network identity, resolved from `NEXT_PUBLIC_SOLANA_NETWORK`
 * (devnet default).
 */
export interface SolanaNetworkInfo {
  /** The normalized label, e.g. "devnet" | "mainnet" | "mainnet-beta". */
  network: string;
  /** The cluster the label names (explorer `?cluster=` spelling). */
  cluster: SolanaCluster;
  /** Display label, e.g. "Devnet" | "Mainnet". */
  label: string;
}

/** Read at call time (not module scope) so tests and previews can override. */
export function resolveSolanaNetwork(): SolanaNetworkInfo {
  const network = normalizeNetworkLabel(process.env.NEXT_PUBLIC_SOLANA_NETWORK);
  const cluster = clusterFromLabel(network);
  return { network, cluster, label: CLUSTER_DISPLAY[cluster] };
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

/**
 * True when either signal says mainnet: the `NEXT_PUBLIC_SOLANA_NETWORK` label
 * or the RPC host. For guards that must hold on mainnet, over-claiming is the
 * safe direction, and trusting the label alone would let a "devnet" label in
 * front of a mainnet RPC through. A host that names no cluster (localnet, a
 * private endpoint) does not count, so devnet and localnet are unaffected.
 */
export function isMainnetCluster(rpcUrl: string): boolean {
  return (
    isMainnetLabel(process.env.NEXT_PUBLIC_SOLANA_NETWORK) ||
    networkFromRpcUrl(rpcUrl) === "mainnet"
  );
}

/**
 * For switches that must not land on devnet by mistake (Irys, the Helius
 * webhook): mainnet if either the label or the RPC host says so. `disagree`
 * is set when the label and a host that names a cluster point different ways,
 * which callers log.
 */
export function mainnetBySignals(
  label: string | null | undefined,
  rpcUrl: string | null | undefined
): { mainnet: boolean; disagree: boolean } {
  const byLabel = isMainnetLabel(label);
  const byRpc = rpcUrl ? networkFromRpcUrl(rpcUrl) : "unknown";
  return {
    mainnet: byLabel || byRpc === "mainnet",
    disagree: byRpc !== "unknown" && byLabel !== (byRpc === "mainnet"),
  };
}

/** Solana devnet's genesis hash (public, stable; devnet has never been re-genesised). */
export const DEVNET_GENESIS_HASH =
  "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG";

/** Solana mainnet-beta's genesis hash (public, stable). */
export const MAINNET_GENESIS_HASH =
  "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d";

/** True for an RPC on this machine (localnet / solana-test-validator). */
export function isLoopbackRpc(rpcUrl: string): boolean {
  let host: string;
  try {
    host = new URL(rpcUrl).hostname.toLowerCase();
  } catch {
    return false;
  }
  return (
    host === "localhost" ||
    host === "[::1]" ||
    /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)
  );
}

/** Client-facing text for {@link ClusterUnverifiedError}; the cause is logged. */
export const CLUSTER_UNVERIFIED_MESSAGE =
  "Refused: could not verify which cluster the RPC is on, so nothing was sent. Retry; the server log (COURSE_IDENTITY_002) has the cause.";

/** The RPC's genesis hash could not be read, so the cluster is unknown. */
export class ClusterUnverifiedError extends Error {
  constructor(cause: unknown) {
    super(
      `Could not verify the RPC's cluster: the genesis hash lookup failed (${cause instanceof Error ? cause.message : String(cause)})`
    );
    this.name = "ClusterUnverifiedError";
  }
}

/**
 * Fail-closed cluster check for writes that can never be undone. Mainnet
 * unless the RPC answers with devnet's genesis hash, or is loopback and answers
 * with a genesis that is neither devnet's nor mainnet's (localnet). A loopback
 * URL alone proves nothing: a tunnel or a forked validator can front mainnet.
 * A label or host saying mainnet counts without a lookup. Pass a lookup that
 * reads the RPC, not a per-process cache: a cached answer can outlive an RPC
 * or env change. Unlike {@link isMainnetCluster}, an RPC host that names no
 * cluster cannot read as "not mainnet" here.
 *
 * @throws {ClusterUnverifiedError} when the genesis lookup fails and nothing
 * else says mainnet. Callers refuse the write.
 */
export async function isMainnetFailClosed(
  rpcUrl: string,
  genesisHash: () => Promise<string>
): Promise<boolean> {
  if (isMainnetCluster(rpcUrl)) return true;
  let hash: string;
  try {
    hash = await genesisHash();
  } catch (err) {
    throw new ClusterUnverifiedError(err);
  }
  if (hash === DEVNET_GENESIS_HASH) return false;
  if (hash === MAINNET_GENESIS_HASH) return true;
  return !isLoopbackRpc(rpcUrl);
}
