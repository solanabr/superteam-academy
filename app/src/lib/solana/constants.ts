import { PublicKey } from '@solana/web3.js';

export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID || 'ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf'
);

export const XP_MINT = new PublicKey(
  process.env.NEXT_PUBLIC_XP_MINT || 'xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3'
);

export const AUTHORITY = new PublicKey(
  process.env.NEXT_PUBLIC_AUTHORITY || 'ACAd3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn'
);

export const CLUSTER = (process.env.NEXT_PUBLIC_CLUSTER || 'devnet') as
  | 'devnet'
  | 'mainnet-beta'
  | 'testnet';

export const HELIUS_RPC =
  process.env.NEXT_PUBLIC_HELIUS_RPC_URL || `https://devnet.helius-rpc.com/?api-key=`;

export const TOKEN_2022_PROGRAM_ID = new PublicKey(
  'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'
);

export const MPL_CORE_PROGRAM_ID = new PublicKey(
  'CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d'
);
