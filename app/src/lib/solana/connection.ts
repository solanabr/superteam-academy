import { Connection } from "@solana/web3.js";
import { HELIUS_RPC_URL } from "@/lib/constants";

export const connection = new Connection(HELIUS_RPC_URL, "confirmed");
