/**
 * Environment Configuration
 *
 * Backend settings for on-chain integration
 *
 * Required before deploying:
 * - SOLANA_RPC_URL: RPC endpoint (Helius, QuickNode, etc.)
 * - ANCHOR_PROGRAM_ID: Deployed program public key
 * - BACKEND_SIGNER_SECRET_KEY: Backend's Solana keypair (JSON array)
 * - XP_TOKEN_MINT: Public key of XP token mint
 * - NETWORK: "devnet" | "mainnet-beta"
 *
 * To get BACKEND_SIGNER_SECRET_KEY:
 * 1. solana-keygen new --outfile backend-signer.json
 * 2. cat backend-signer.json | jq '.' | jq -c '.' (to get array format)
 * 3. Paste in .env as BACKEND_SIGNER_SECRET_KEY
 */

export const SOLANA_CONFIG = {
  // RPC endpoint
  RPC_URL: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',

  // Network
  NETWORK: (process.env.NETWORK || 'devnet') as 'devnet' | 'mainnet-beta',

  // Program deployment
  ANCHOR_PROGRAM_ID: process.env.ANCHOR_PROGRAM_ID || '11111111111111111111111111111111',

  // XP Token mint (created during season initialization)
  XP_TOKEN_MINT: process.env.XP_TOKEN_MINT || '11111111111111111111111111111111',

  // Backend signer (loads from env)
  BACKEND_SIGNER_SECRET_KEY: process.env.BACKEND_SIGNER_SECRET_KEY,

  // TX settings
  COMMITMENT: 'confirmed' as const,
  TX_TIMEOUT_MS: 60000,
  BLOCKHASH_VALIDITY_S: 90,
}

/**
 * Validation: Check if all required Solana config is set
 */
export function validateSolanaConfig(): boolean {
  const required = ['SOLANA_RPC_URL', 'ANCHOR_PROGRAM_ID', 'BACKEND_SIGNER_SECRET_KEY', 'XP_TOKEN_MINT']

  const missing = required.filter((key) => !process.env[key])

  if (missing.length > 0) {
    console.warn(`⚠️ Solana config incomplete. Missing: ${missing.join(', ')}`)
    console.warn('   On-chain features will not work until these are set.')
    return false
  }

  return true
}

// Validate on module load
validateSolanaConfig()
