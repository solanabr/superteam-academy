import { AnchorProvider, Program, setProvider } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { IDL } from "./idl";

export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID ??
    "ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf",
);

export const XP_MINT = new PublicKey(
  process.env.NEXT_PUBLIC_XP_MINT ??
    "xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3",
);

export const TOKEN_2022_PROGRAM_ID = new PublicKey(
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
);

export function getConnection(): Connection {
  const rpcUrl =
    process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com";
  return new Connection(rpcUrl, "confirmed");
}

export function getProgram(provider: AnchorProvider) {
  setProvider(provider);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Program(IDL as any, provider);
}
