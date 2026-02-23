import { Connection } from "@solana/web3.js";
import { ACADEMY_PROGRAM_ID, SOLANA_RPC_URL } from "./constants";

export const connection = new Connection(SOLANA_RPC_URL, "confirmed");

export { ACADEMY_PROGRAM_ID, SOLANA_RPC_URL };
