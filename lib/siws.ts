import { PublicKey } from '@solana/web3.js'
import nacl from 'tweetnacl'
import bs58 from 'bs58'

/**
 * SIWS (Sign-In With Solana) utilities
 *
 * Creates a human-readable sign-in message and verifies ed25519 signatures
 * following the pattern of EIP-4361 (SIWE) adapted for Solana.
 */

const DOMAIN = process.env.NEXTAUTH_URL
  ? new URL(process.env.NEXTAUTH_URL).host
  : 'localhost:3000'

const STATEMENT = 'Sign in to Superteam Academy with your Solana wallet.'

/**
 * Build a deterministic SIWS message for the user to sign.
 *
 * @param walletAddress - Base58 public key
 * @param nonce - Random server-generated nonce
 * @param issuedAt - ISO timestamp
 * @returns Human-readable message string
 */
export function createSIWSMessage(
  walletAddress: string,
  nonce: string,
  issuedAt: string
): string {
  return [
    `${DOMAIN} wants you to sign in with your Solana account:`,
    walletAddress,
    '',
    STATEMENT,
    '',
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
  ].join('\n')
}

/**
 * Verify an ed25519 signature against the expected SIWS message.
 *
 * @returns `true` when the signature is valid for the given public key + message
 */
export function verifySIWSSignature(
  walletAddress: string,
  nonce: string,
  issuedAt: string,
  signatureBase58: string
): boolean {
  try {
    const message = createSIWSMessage(walletAddress, nonce, issuedAt)
    const messageBytes = new TextEncoder().encode(message)
    const signatureBytes = bs58.decode(signatureBase58)
    const publicKeyBytes = new PublicKey(walletAddress).toBytes()

    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes)
  } catch {
    return false
  }
}

/**
 * Generate a cryptographically random nonce (22-char base64url).
 */
export function generateNonce(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Buffer.from(bytes).toString('base64url')
}

/**
 * Validate that a nonce hasn't expired (5-minute window).
 */
export function isNonceValid(issuedAt: string, windowMs = 5 * 60 * 1000): boolean {
  const issued = new Date(issuedAt).getTime()
  if (Number.isNaN(issued)) return false
  return Date.now() - issued < windowMs
}
