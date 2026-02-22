import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { config } from "./config.js";
import idl from "./idl.json" with { type: "json" };

export const PROGRAM_ID = new PublicKey("GuBhF6hk5yKhnvU5712LZwUPaoAmoxtJf9GTh4CHTxsF");
export const XP_MINT = new PublicKey("F1PbQKRkn3UXnhCJErDSAtNmiScKPdMpwJxLLR7F3JQM");
export const TRACK_COLLECTION = new PublicKey("GyTUPBnidX3fWPwAJq7VpQRx5tMhQe3TXk5hbRo8wZS7");
export const MPL_CORE_PROGRAM_ID = new PublicKey("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
export const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");

export const connection = new Connection(config.rpcUrl, "confirmed");
export const backendSigner = config.backendSigner;

const wallet = new Wallet(backendSigner);
const provider = new AnchorProvider(connection, wallet, {
  commitment: "confirmed",
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const program = new Program(idl as any, provider) as any;
