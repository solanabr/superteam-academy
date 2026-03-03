import { describe, it, expect } from 'vitest';
import { isValidSolanaAddress } from '@/backend/auth/validation';

describe('isValidSolanaAddress', () => {
    it('returns true for a valid Solana address', () => {
        // System program address
        expect(isValidSolanaAddress('11111111111111111111111111111111')).toBe(true);
    });

    it('returns true for another valid address', () => {
        expect(isValidSolanaAddress('B2vesAWAqYqsQvR2yKDpPf9RaUBLNrnjsCzXrgPcVGwh')).toBe(true);
    });

    it('returns false for empty string', () => {
        expect(isValidSolanaAddress('')).toBe(false);
    });

    it('returns false for too short strings', () => {
        expect(isValidSolanaAddress('abc')).toBe(false);
    });

    it('returns false for too long strings', () => {
        expect(isValidSolanaAddress('A'.repeat(50))).toBe(false);
    });

    it('returns false for strings with invalid characters', () => {
        expect(isValidSolanaAddress('OOOO0000OOOO0000OOOO0000OOOO0000')).toBe(false); // 'O' is not in base58
    });

    it('returns false for strings with spaces', () => {
        expect(isValidSolanaAddress('B2ves AWAqYqsQvR2yKDpPf9RaUBLNrnjs')).toBe(false);
    });

    it('returns false for strings with lowercase l (not in base58)', () => {
        expect(isValidSolanaAddress('llllllllllllllllllllllllllllllll')).toBe(false);
    });
});
