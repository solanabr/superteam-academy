import { PublicKey } from '@solana/web3.js';

/**
 * Validate that a string is a valid Solana base58 public key address.
 * Checks length, character set, and PublicKey constructor validity.
 */
export function isValidSolanaAddress(address: string): boolean {
    if (!address || address.length < 32 || address.length > 44) return false;
    if (!/^[1-9A-HJ-NP-Za-km-z]+$/.test(address)) return false;
    try {
        new PublicKey(address);
        return true;
    } catch {
        return false;
    }
}

