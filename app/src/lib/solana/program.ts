import { Program, AnchorProvider, type Idl } from "@coral-xyz/anchor";
import { Connection } from "@solana/web3.js";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import { HELIUS_RPC_URL } from "@/lib/constants";
import IDL_JSON from "./idl/onchain_academy.json";

export function getConnection(): Connection {
  return new Connection(HELIUS_RPC_URL, "confirmed");
}

export function getProvider(wallet: AnchorWallet): AnchorProvider {
  const connection = getConnection();
  return new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
    preflightCommitment: "confirmed",
  });
}

export function getProgram(wallet: AnchorWallet): Program {
  const provider = getProvider(wallet);
  return new Program(IDL_JSON as Idl, provider);
}

export function getReadonlyProgram(connection?: Connection): Program {
  const conn = connection ?? getConnection();
  return new Program(IDL_JSON as Idl, { connection: conn } as AnchorProvider);
}

export { IDL_JSON };
