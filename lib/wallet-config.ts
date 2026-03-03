/**
 * Wallet Adapter Configuration
 *
 * Defines which wallets users can connect with and RPC endpoints
 */

import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { clusterApiUrl } from '@solana/web3.js'

export const NETWORK = (process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet') as WalletAdapterNetwork

export const RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC || clusterApiUrl(NETWORK)

/**
 * Supported wallets for the platform
 * Users will see these in the wallet selector modal
 */
export const SUPPORTED_WALLETS = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter({ network: NETWORK }),
]

/**
 * Wallet configuration object
 * Pass to WalletProvider autoConnect prop
 */
export const WALLET_CONFIG = {
  autoConnect: true, // Reconnect to the last selected wallet after refresh
  onError: (error: Error) => {
    console.error('Wallet error:', error)
  },
}
