import { clusterApiUrl, Connection } from '@solana/web3.js';

// Network configuration
export const NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';

// RPC endpoints
export const RPC_ENDPOINTS = {
  mainnet: process.env.NEXT_PUBLIC_RPC_MAINNET || clusterApiUrl('mainnet-beta'),
  devnet: process.env.NEXT_PUBLIC_RPC_DEVNET || clusterApiUrl('devnet'),
  testnet: clusterApiUrl('testnet'),
} as const;

// Get current RPC endpoint
export const getRpcEndpoint = () => {
  return RPC_ENDPOINTS[NETWORK as keyof typeof RPC_ENDPOINTS] || RPC_ENDPOINTS.devnet;
};

// Create connection
export const getConnection = () => {
  return new Connection(getRpcEndpoint(), 'confirmed');
};

// Program IDs (to be updated with actual deployed program)
export const PROGRAM_IDS = {
  academy: process.env.NEXT_PUBLIC_ACADEMY_PROGRAM_ID || 'AcadEMYxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  xpToken: process.env.NEXT_PUBLIC_XP_TOKEN_MINT || 'XPtokENxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
};

// Helius DAS API
export const HELIUS_API_KEY = process.env.HELIUS_API_KEY || '';
export const HELIUS_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

// Photon RPC (for ZK compressed credentials)
export const PHOTON_RPC_URL = process.env.PHOTON_RPC_URL || 'https://zk-compression.helius.dev';
