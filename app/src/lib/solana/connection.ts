import { Connection, clusterApiUrl } from "@solana/web3.js";
import { CLUSTER } from "@/types/academy";

const HELIUS_RPC = process.env.NEXT_PUBLIC_HELIUS_RPC_URL;
const RPC_URL = HELIUS_RPC || clusterApiUrl(CLUSTER);

let connection: Connection | null = null;

export function getConnection(): Connection {
  if (!connection) {
    connection = new Connection(RPC_URL, "confirmed");
  }
  return connection;
}

export function getRpcUrl(): string {
  return RPC_URL;
}
