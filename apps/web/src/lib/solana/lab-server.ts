import "server-only";
import { Connection } from "@solana/web3.js";
import { serverEnv } from "@/lib/env.server";

let _labConnection: Connection | null = null;

/**
 * The server's connection to the lab RPC (`LAB_RPC_URL`, public devnet by
 * default). Learner deploys are verified through it, never through the Academy
 * connection, which can be on another chain.
 */
export function getLabConnection(): Connection {
  if (_labConnection) return _labConnection;
  _labConnection = new Connection(serverEnv.LAB_RPC_URL, "confirmed");
  return _labConnection;
}
