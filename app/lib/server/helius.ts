type SolanaCluster = "devnet" | "mainnet-beta";

const HELIUS_RPC = (process.env.NEXT_PUBLIC_HELIUS_RPC ?? "").trim();
const HELIUS_API_KEY = (process.env.HELIUS_API_KEY ?? "").trim();

function normalizeCluster(raw: string | undefined): SolanaCluster {
  const value = (raw ?? "").trim().toLowerCase();
  if (value === "mainnet" || value === "mainnet-beta") return "mainnet-beta";
  return "devnet";
}

function getConfiguredCluster(): SolanaCluster {
  return normalizeCluster(
    process.env.NEXT_PUBLIC_SOLANA_CLUSTER ?? process.env.NEXT_PUBLIC_CLUSTER
  );
}

function detectHeliusCluster(url: string): SolanaCluster | null {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes("mainnet.helius-rpc.com")) return "mainnet-beta";
    if (host.includes("devnet.helius-rpc.com")) return "devnet";
    return null;
  } catch {
    return null;
  }
}

function buildHeliusUrl(cluster: SolanaCluster, apiKey: string): string {
  const base =
    cluster === "mainnet-beta"
      ? "https://mainnet.helius-rpc.com"
      : "https://devnet.helius-rpc.com";
  return `${base}/?api-key=${apiKey}`;
}

export function getHeliusRpcConfig(): {
  url: string | null;
  cluster: SolanaCluster;
  warning?: string;
} {
  const cluster = getConfiguredCluster();

  if (HELIUS_RPC) {
    const rpcCluster = detectHeliusCluster(HELIUS_RPC);
    if (rpcCluster && rpcCluster !== cluster && HELIUS_API_KEY) {
      return {
        url: buildHeliusUrl(cluster, HELIUS_API_KEY),
        cluster,
        warning: `NEXT_PUBLIC_HELIUS_RPC is ${rpcCluster} but app cluster is ${cluster}; using cluster-matched Helius URL.`,
      };
    }
    return { url: HELIUS_RPC, cluster };
  }

  if (HELIUS_API_KEY) {
    return { url: buildHeliusUrl(cluster, HELIUS_API_KEY), cluster };
  }

  return { url: null, cluster };
}

