import { Connection } from "@solana/web3.js";
import { RPC_ENDPOINT } from "./constants";

let connection: Connection | null = null;

export function getConnection(): Connection {
  if (!connection) {
    connection = new Connection(RPC_ENDPOINT, "confirmed");
  }
  return connection;
}
