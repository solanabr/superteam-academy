import { labRpcUrlOrDefault } from "@/lib/solana/lab-rpc.mjs";
import { explorerUrl, type SolanaCluster } from "@/lib/solana/network";

/**
 * The lab is where a learner deploys and calls a program from inside a
 * lesson. It runs on devnet through its own RPC, whatever chain the Academy
 * program is on, so its links and labels come from here and not from
 * `NEXT_PUBLIC_SOLANA_NETWORK`.
 */
export const LAB_CLUSTER: SolanaCluster = "devnet";

/** The browser's lab RPC URL: public devnet unless one is configured. */
export function labRpcUrl(): string {
  return labRpcUrlOrDefault(process.env.NEXT_PUBLIC_LAB_RPC_URL);
}

/** A Solana Explorer link for a lab transaction or address. */
export function labExplorerUrl(kind: "tx" | "address", id: string): string {
  return explorerUrl(kind, id, LAB_CLUSTER);
}
