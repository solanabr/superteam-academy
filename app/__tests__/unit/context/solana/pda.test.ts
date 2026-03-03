import { describe, it, expect } from 'vitest';
import { PublicKey } from '@solana/web3.js';
import {
    deriveConfigPda,
    deriveCoursePda,
    deriveEnrollmentPda,
    deriveMinterRolePda,
    deriveAchievementTypePda,
    deriveAchievementReceiptPda,
} from '@/context/solana/pda';

const testWallet = new PublicKey('B2vesAWAqYqsQvR2yKDpPf9RaUBLNrnjsCzXrgPcVGwh');

describe('PDA derivation', () => {
    describe('deriveConfigPda', () => {
        it('returns a PublicKey and bump', () => {
            const [pda, bump] = deriveConfigPda();
            expect(pda).toBeInstanceOf(PublicKey);
            expect(typeof bump).toBe('number');
            expect(bump).toBeGreaterThanOrEqual(0);
            expect(bump).toBeLessThanOrEqual(255);
        });

        it('is deterministic', () => {
            const [a] = deriveConfigPda();
            const [b] = deriveConfigPda();
            expect(a.toBase58()).toBe(b.toBase58());
        });
    });

    describe('deriveCoursePda', () => {
        it('returns a PublicKey and bump', () => {
            const [pda, bump] = deriveCoursePda('course-1');
            expect(pda).toBeInstanceOf(PublicKey);
            expect(typeof bump).toBe('number');
        });

        it('different course IDs produce different PDAs', () => {
            const [a] = deriveCoursePda('course-1');
            const [b] = deriveCoursePda('course-2');
            expect(a.toBase58()).not.toBe(b.toBase58());
        });

        it('is deterministic for same course ID', () => {
            const [a] = deriveCoursePda('test-course');
            const [b] = deriveCoursePda('test-course');
            expect(a.toBase58()).toBe(b.toBase58());
        });
    });

    describe('deriveEnrollmentPda', () => {
        it('returns a PublicKey and bump', () => {
            const [pda, bump] = deriveEnrollmentPda('course-1', testWallet);
            expect(pda).toBeInstanceOf(PublicKey);
            expect(typeof bump).toBe('number');
        });

        it('different learners produce different PDAs', () => {
            const wallet2 = new PublicKey('11111111111111111111111111111111');
            const [a] = deriveEnrollmentPda('course-1', testWallet);
            const [b] = deriveEnrollmentPda('course-1', wallet2);
            expect(a.toBase58()).not.toBe(b.toBase58());
        });
    });

    describe('deriveMinterRolePda', () => {
        it('returns a PublicKey and bump', () => {
            const [pda, bump] = deriveMinterRolePda(testWallet);
            expect(pda).toBeInstanceOf(PublicKey);
            expect(typeof bump).toBe('number');
        });
    });

    describe('deriveAchievementTypePda', () => {
        it('returns a PublicKey and bump', () => {
            const [pda, bump] = deriveAchievementTypePda('first-steps');
            expect(pda).toBeInstanceOf(PublicKey);
            expect(typeof bump).toBe('number');
        });

        it('different achievement IDs produce different PDAs', () => {
            const [a] = deriveAchievementTypePda('first-steps');
            const [b] = deriveAchievementTypePda('course-completer');
            expect(a.toBase58()).not.toBe(b.toBase58());
        });
    });

    describe('deriveAchievementReceiptPda', () => {
        it('returns a PublicKey and bump', () => {
            const [pda, bump] = deriveAchievementReceiptPda('first-steps', testWallet);
            expect(pda).toBeInstanceOf(PublicKey);
            expect(typeof bump).toBe('number');
        });

        it('is deterministic', () => {
            const [a] = deriveAchievementReceiptPda('first-steps', testWallet);
            const [b] = deriveAchievementReceiptPda('first-steps', testWallet);
            expect(a.toBase58()).toBe(b.toBase58());
        });
    });
});
