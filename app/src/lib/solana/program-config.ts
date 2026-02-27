/**
 * Superteam Academy On-Chain Program Configuration
 * Based on the deployed devnet program
 */
import { PublicKey } from '@solana/web3.js';

const DEFAULT_PROGRAM_ID = 'ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf';
const DEFAULT_XP_MINT = 'xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3';

function getPublicKeyFromEnv(envValue: string | undefined, fallback: string, label: string): PublicKey {
  if (!envValue) {
    return new PublicKey(fallback);
  }

  try {
    return new PublicKey(envValue);
  } catch {
    console.warn(
      `[solana-config] Invalid ${label} env value "${envValue}", falling back to default ${fallback}`
    );
    return new PublicKey(fallback);
  }
}

// Program ID - env-first, fallback to devnet default
export const PROGRAM_ID = getPublicKeyFromEnv(
  process.env.NEXT_PUBLIC_PROGRAM_ID,
  DEFAULT_PROGRAM_ID,
  'NEXT_PUBLIC_PROGRAM_ID'
);

// XP Mint - env-first, fallback to current default
export const XP_MINT = getPublicKeyFromEnv(
  process.env.NEXT_PUBLIC_XP_MINT,
  DEFAULT_XP_MINT,
  'NEXT_PUBLIC_XP_MINT'
);

// Program Authority
export const PROGRAM_AUTHORITY = new PublicKey('ACAd3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn');

// Token-2022 Program ID
export const TOKEN_2022_PROGRAM_ID = new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb');

// Metaplex Core Program ID
export const MPL_CORE_PROGRAM_ID = new PublicKey('CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d');

// Network configuration
export const NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';

// RPC endpoints
export const RPC_ENDPOINTS = {
  devnet: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  mainnet: 'https://api.mainnet-beta.solana.com',
  testnet: 'https://api.testnet.solana.com',
};

// Helius RPC (for DAS API)
export const HELIUS_RPC_URL =
  process.env.NEXT_PUBLIC_HELIUS_RPC_URL ||
  `https://devnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`;

// Track IDs mapping
export const TRACK_IDS: Record<number, string> = {
  1: 'solana-core',
  2: 'anchor-development',
  3: 'defi',
  4: 'nfts',
  5: 'daos',
  6: 'web3-security',
};

// Difficulty levels
export const DIFFICULTY_LEVELS: Record<number, string> = {
  1: 'beginner',
  2: 'intermediate',
  3: 'advanced',
};
