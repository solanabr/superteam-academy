import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';

/**
 * Verify a Solana wallet signature for authentication.
 * The message should include a nonce to prevent replay attacks.
 */
export function verifySignature(
  walletAddress: string,
  signatureBase64: string,
  message: string
): boolean {
  try {
    const publicKey = new PublicKey(walletAddress);
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = Buffer.from(signatureBase64, 'base64');

    return nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKey.toBytes()
    );
  } catch {
    return false;
  }
}

/**
 * Generate a sign-in message with nonce for wallet authentication.
 */
export function createSignInMessage(walletAddress: string, nonce: string): string {
  return [
    'Superteam Academy Sign In',
    '',
    `Wallet: ${walletAddress}`,
    `Nonce: ${nonce}`,
    `Issued At: ${new Date().toISOString()}`,
  ].join('\n');
}
