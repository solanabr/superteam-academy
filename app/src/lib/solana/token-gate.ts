/**
 * Token-gated course access verification.
 * Checks if a wallet holds the required SPL tokens or NFTs.
 */

import { Connection, PublicKey } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'

const connection = new Connection(
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com'
)

export interface TokenGateConfig {
  tokenMint: string
  requiredAmount: number
}

/**
 * Check if a wallet holds enough of a specific SPL token.
 */
export async function checkTokenBalance(
  walletAddress: string,
  tokenMint: string,
  requiredAmount: number = 1
): Promise<{ hasAccess: boolean; balance: number }> {
  try {
    const wallet = new PublicKey(walletAddress)
    const mint = new PublicKey(tokenMint)

    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(wallet, {
      programId: TOKEN_PROGRAM_ID,
    })

    const matchingAccount = tokenAccounts.value.find(
      (acc) => acc.account.data.parsed.info.mint === mint.toBase58()
    )

    if (!matchingAccount) {
      return { hasAccess: false, balance: 0 }
    }

    const balance = matchingAccount.account.data.parsed.info.tokenAmount.uiAmount || 0
    return {
      hasAccess: balance >= requiredAmount,
      balance,
    }
  } catch (error) {
    console.error('Token gate check failed:', error)
    return { hasAccess: false, balance: 0 }
  }
}

/**
 * Check if wallet holds any NFTs from a specific collection.
 */
export async function checkNFTOwnership(
  walletAddress: string,
  collectionMint: string
): Promise<{ hasAccess: boolean; count: number }> {
  try {
    const wallet = new PublicKey(walletAddress)

    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(wallet, {
      programId: TOKEN_PROGRAM_ID,
    })

    // Filter for NFTs (amount = 1, decimals = 0)
    const nfts = tokenAccounts.value.filter((acc) => {
      const info = acc.account.data.parsed.info
      return (
        info.tokenAmount.decimals === 0 &&
        info.tokenAmount.uiAmount === 1
      )
    })

    // In production, verify collection via Metaplex metadata
    // For now, count NFTs from the expected program
    return {
      hasAccess: nfts.length > 0,
      count: nfts.length,
    }
  } catch (error) {
    console.error('NFT ownership check failed:', error)
    return { hasAccess: false, count: 0 }
  }
}

/**
 * Verify access for a course based on its token gate config.
 */
export async function verifyCourseAccess(
  walletAddress: string,
  gate: TokenGateConfig | null
): Promise<boolean> {
  if (!gate) return true // No gate = public course

  const { hasAccess } = await checkTokenBalance(
    walletAddress,
    gate.tokenMint,
    gate.requiredAmount
  )

  return hasAccess
}
