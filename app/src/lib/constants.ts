// app/src/lib/constants.ts
import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID ?? ""
);

export const ACHIEVEMENTS_COLLECTION = new PublicKey(process.env.NEXT_PUBLIC_ACHIEVEMENTS_COLLECTION ?? "");

export const XP_MINT = new PublicKey(
  process.env.NEXT_PUBLIC_XP_MINT ?? ""
);

// Адрес бэкенда (для проверок на клиенте, если нужно)
export const BACKEND_SIGNER = new PublicKey(
  process.env.NEXT_PUBLIC_BACKEND_SIGNER ?? ""
);

// IDL требует явного указания devnet/mainnet
export const CLUSTER = process.env.NEXT_PUBLIC_CLUSTER === "mainnet" 
  ? "mainnet-beta" 
  : "devnet";