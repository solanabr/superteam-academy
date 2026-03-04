import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'

/**
 * Minimum lamports needed for a typical on-chain enrollment:
 * ~0.003 SOL rent for enrollment PDA + ~0.000005 SOL TX fee
 * Use 0.01 SOL as a safe threshold.
 */
const MIN_BALANCE_LAMPORTS = 0.01 * LAMPORTS_PER_SOL

/**
 * Check if a wallet has enough SOL and auto-airdrop on devnet if needed.
 *
 * @returns The current balance in lamports after any airdrop
 * @throws Only if not on devnet and balance is insufficient
 */
export async function ensureBalance(
  connection: Connection,
  wallet: PublicKey,
  network?: string
): Promise<number> {
  const balance = await connection.getBalance(wallet)

  if (balance >= MIN_BALANCE_LAMPORTS) {
    return balance
  }

  const isDevnet =
    network === 'devnet' ||
    connection.rpcEndpoint.includes('devnet') ||
    connection.rpcEndpoint.includes('localhost') ||
    connection.rpcEndpoint.includes('127.0.0.1')

  if (!isDevnet) {
    throw new Error(
      `Insufficient SOL balance (${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL). ` +
      `Please fund your wallet with at least 0.01 SOL to cover transaction fees.`
    )
  }

  // Devnet: try airdrop
  console.log(
    `[ensure-balance] Wallet ${wallet.toBase58().slice(0, 8)}... has ${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL — requesting devnet airdrop...`
  )

  try {
    const sig = await connection.requestAirdrop(wallet, 1 * LAMPORTS_PER_SOL)
    const latestBlockhash = await connection.getLatestBlockhash()
    await connection.confirmTransaction({ signature: sig, ...latestBlockhash }, 'confirmed')

    const newBalance = await connection.getBalance(wallet)
    console.log(
      `[ensure-balance] ✅ Airdrop confirmed! New balance: ${(newBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL`
    )
    return newBalance
  } catch (err) {
    console.warn('[ensure-balance] ⚠️ Airdrop failed (rate-limited?):', err)
    // Return current balance — caller can decide to proceed or not
    return balance
  }
}
