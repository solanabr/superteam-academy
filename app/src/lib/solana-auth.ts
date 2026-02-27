import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

/**
 * Generate a sign-in message for Solana wallet authentication
 */
export function generateSignInMessage(nonce: string): string {
  const domain = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const issuedAt = new Date().toISOString();

  return `Sign in to CapySolBuild LMS

Domain: ${domain}
Nonce: ${nonce}
Issued At: ${issuedAt}

This request will not trigger a blockchain transaction or cost any gas fees.`;
}

/**
 * Verify a signature from a Solana wallet
 */
export async function verifySignature(
  walletAddress: string,
  signature: string,
  message: string
): Promise<boolean> {
  try {
    const publicKey = new PublicKey(walletAddress);
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = bs58.decode(signature);

    const verified = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKey.toBytes());

    return verified;
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

/**
 * Generate a random nonce for sign-in
 */
export function generateNonce(): string {
  const array = new Uint8Array(32);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Fallback for Node.js environment
    const { randomBytes } = require('crypto');
    const bytes = randomBytes(32);
    array.set(bytes);
  }
  return bs58.encode(array);
}
