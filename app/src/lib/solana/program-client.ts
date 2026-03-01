import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import { ACADEMY_PROGRAM_ID, SOLANA_RPC_URL } from "./constants";
import type { OnchainAcademy } from "./idl/onchain_academy";
import idlJson from "./idl/onchain_academy.json";

export const connection = new Connection(SOLANA_RPC_URL, "confirmed");

const readonlyWallet: AnchorWallet = {
  publicKey: PublicKey.default,
  signTransaction: () => Promise.reject(new Error("Read-only")),
  signAllTransactions: () => Promise.reject(new Error("Read-only")),
};

export function getReadonlyProvider(): AnchorProvider {
  return new AnchorProvider(connection, readonlyWallet, {
    commitment: "confirmed",
  });
}

export function getProgram(
  provider?: AnchorProvider,
): Program<OnchainAcademy> {
  const p = provider ?? getReadonlyProvider();
  return new Program(idlJson as unknown as OnchainAcademy, p);
}

export function getSignerProgram(
  wallet: AnchorWallet,
): Program<OnchainAcademy> {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  return new Program(idlJson as unknown as OnchainAcademy, provider);
}
