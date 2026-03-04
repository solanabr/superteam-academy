import { PublicKey } from "@solana/web3.js";

export const DEFAULT_ACADEMY_PROGRAM_ID =
  "ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf";
export const DEFAULT_TOKEN_2022_PROGRAM_ID =
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
export const DEFAULT_MPL_CORE_PROGRAM_ID =
  "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d";

export const ACADEMY_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_ACADEMY_PROGRAM_ID || DEFAULT_ACADEMY_PROGRAM_ID
);

export const TOKEN_2022_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_TOKEN_2022_PROGRAM_ID ||
    DEFAULT_TOKEN_2022_PROGRAM_ID
);

export const MPL_CORE_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_MPL_CORE_PROGRAM_ID || DEFAULT_MPL_CORE_PROGRAM_ID
);

export function onChainWriteBridgeEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_ONCHAIN_BRIDGE === "true";
}

export function onChainBridgeStrictMode(): boolean {
  return process.env.NEXT_PUBLIC_ONCHAIN_STRICT_WRITES === "true";
}
