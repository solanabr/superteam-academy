import { describe, it, expect } from 'vitest';
import { PublicKey } from '@solana/web3.js';
import {
    PROGRAM_ID,
    XP_MINT,
    TOKEN_2022_PROGRAM_ID,
    MPL_CORE_PROGRAM_ID,
} from '@/context/solana/constants';

describe('Solana constants', () => {
    it('PROGRAM_ID is a valid PublicKey', () => {
        expect(PROGRAM_ID).toBeInstanceOf(PublicKey);
        expect(PROGRAM_ID.toBase58().length).toBeGreaterThanOrEqual(32);
    });

    it('XP_MINT is a valid PublicKey', () => {
        expect(XP_MINT).toBeInstanceOf(PublicKey);
        expect(XP_MINT.toBase58().length).toBeGreaterThanOrEqual(32);
    });

    it('TOKEN_2022_PROGRAM_ID is a valid PublicKey', () => {
        expect(TOKEN_2022_PROGRAM_ID).toBeInstanceOf(PublicKey);
        expect(TOKEN_2022_PROGRAM_ID.toBase58()).toBe('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb');
    });

    it('MPL_CORE_PROGRAM_ID is a valid PublicKey', () => {
        expect(MPL_CORE_PROGRAM_ID).toBeInstanceOf(PublicKey);
        expect(MPL_CORE_PROGRAM_ID.toBase58()).toBe('CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d');
    });

    it('all constants are distinct', () => {
        const keys = [PROGRAM_ID, XP_MINT, TOKEN_2022_PROGRAM_ID, MPL_CORE_PROGRAM_ID];
        const base58 = keys.map(k => k.toBase58());
        const unique = new Set(base58);
        expect(unique.size).toBe(keys.length);
    });
});
