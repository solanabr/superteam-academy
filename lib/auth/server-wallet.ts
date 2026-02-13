import bs58 from 'bs58';
import { ed25519 } from '@noble/curves/ed25519';
import { PublicKey } from '@solana/web3.js';

interface WalletChallengePayload {
  walletAddress: string;
  nonce: string;
  intent: 'signin' | 'link';
  callbackUrl?: string;
}

export function buildWalletChallengeMessage(payload: WalletChallengePayload): string {
  const lines = [
    'Superteam Academy Brazil',
    payload.intent === 'link' ? 'Link wallet to account' : 'Sign in with wallet',
    `Wallet: ${payload.walletAddress}`,
    `Nonce: ${payload.nonce}`,
    `Issued At: ${new Date().toISOString()}`
  ];

  return lines.join('\n');
}

export function validateWalletAddress(walletAddress: string): string {
  const normalized = walletAddress.trim();
  const key = new PublicKey(normalized);
  return key.toBase58();
}

export function verifyWalletSignature(input: {
  walletAddress: string;
  message: string;
  signatureBase58: string;
}): boolean {
  try {
    const publicKey = new PublicKey(input.walletAddress);
    const messageBytes = new TextEncoder().encode(input.message);
    const signatureBytes = bs58.decode(input.signatureBase58);
    return ed25519.verify(signatureBytes, messageBytes, publicKey.toBytes());
  } catch {
    return false;
  }
}

export function parseChallengeMessage(input: string): {
  walletAddress: string | null;
  nonce: string | null;
} {
  const walletMatch = input.match(/^Wallet:\s*(.+)$/m);
  const nonceMatch = input.match(/^Nonce:\s*(.+)$/m);

  return {
    walletAddress: walletMatch?.[1]?.trim() ?? null,
    nonce: nonceMatch?.[1]?.trim() ?? null
  };
}
