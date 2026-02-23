import { clusterApiUrl, type Cluster } from "@solana/web3.js";

const cluster = (process.env.NEXT_PUBLIC_SOLANA_CLUSTER ??
  process.env.NEXT_PUBLIC_CLUSTER) as Cluster | undefined;
export const SOLANA_RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_SOLANA_RPC ?? clusterApiUrl(cluster ?? "devnet");
