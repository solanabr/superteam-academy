import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(
  (process.env.NEXT_PUBLIC_PROGRAM_ID || "ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf").trim()
);

export const XP_MINT = new PublicKey(
  (process.env.NEXT_PUBLIC_XP_MINT || "xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3").trim()
);

export const TOKEN_2022_PROGRAM_ID = new PublicKey(
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
);

export const MPL_CORE_PROGRAM_ID = new PublicKey(
  "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d"
);

export const CLUSTER = (process.env.NEXT_PUBLIC_CLUSTER || "devnet") as "devnet" | "mainnet-beta";

export const HELIUS_URL =
  process.env.NEXT_PUBLIC_HELIUS_URL || "https://api.devnet.solana.com";

export const TRACK_COLLECTION = process.env.NEXT_PUBLIC_TRACK_COLLECTION
  ? new PublicKey(process.env.NEXT_PUBLIC_TRACK_COLLECTION.trim())
  : null;
