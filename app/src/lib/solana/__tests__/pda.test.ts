// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { Keypair, PublicKey } from '@solana/web3.js';
import {
  configPda,
  coursePda,
  enrollmentPda,
  minterRolePda,
  achievementTypePda,
  achievementReceiptPda,
} from '../pda';
import { PROGRAM_ID } from '../constants';

describe('PDA derivation helpers', () => {
  // Use a deterministic seed for the alt program ID so tests are reproducible
  const testProgramId = Keypair.fromSeed(
    Uint8Array.from({ length: 32 }, (_, i) => i),
  ).publicKey;
  const learnerA = Keypair.fromSeed(
    Uint8Array.from({ length: 32 }, () => 1),
  ).publicKey;
  const learnerB = Keypair.fromSeed(
    Uint8Array.from({ length: 32 }, () => 2),
  ).publicKey;

  describe('configPda', () => {
    it('returns a tuple of [PublicKey, number]', () => {
      const [pda, bump] = configPda();
      expect(pda).toBeInstanceOf(PublicKey);
      expect(typeof bump).toBe('number');
      expect(bump).toBeGreaterThanOrEqual(0);
      expect(bump).toBeLessThanOrEqual(255);
    });

    it('is deterministic across multiple calls', () => {
      const [pda1, bump1] = configPda();
      const [pda2, bump2] = configPda();
      expect(pda1.equals(pda2)).toBe(true);
      expect(bump1).toBe(bump2);
    });

    it('produces different PDA for different program IDs', () => {
      const [pdaDefault] = configPda();
      const [pdaCustom] = configPda(testProgramId);
      expect(pdaDefault.equals(pdaCustom)).toBe(false);
    });

    it('uses PROGRAM_ID by default', () => {
      const [pdaDefault] = configPda();
      const [pdaExplicit] = configPda(PROGRAM_ID);
      expect(pdaDefault.equals(pdaExplicit)).toBe(true);
    });
  });

  describe('coursePda', () => {
    it('returns a tuple of [PublicKey, number]', () => {
      const [pda, bump] = coursePda('solana-101');
      expect(pda).toBeInstanceOf(PublicKey);
      expect(typeof bump).toBe('number');
    });

    it('is deterministic for the same course ID', () => {
      const [pda1] = coursePda('solana-101');
      const [pda2] = coursePda('solana-101');
      expect(pda1.equals(pda2)).toBe(true);
    });

    it('produces different PDAs for different course IDs', () => {
      const [pdaA] = coursePda('solana-101');
      const [pdaB] = coursePda('rust-basics');
      expect(pdaA.equals(pdaB)).toBe(false);
    });
  });

  describe('enrollmentPda', () => {
    it('returns a tuple of [PublicKey, number]', () => {
      const [pda, bump] = enrollmentPda('solana-101', learnerA);
      expect(pda).toBeInstanceOf(PublicKey);
      expect(typeof bump).toBe('number');
    });

    it('is deterministic for the same course + learner', () => {
      const [pda1] = enrollmentPda('solana-101', learnerA);
      const [pda2] = enrollmentPda('solana-101', learnerA);
      expect(pda1.equals(pda2)).toBe(true);
    });

    it('produces different PDAs for different learners', () => {
      const [pdaA] = enrollmentPda('solana-101', learnerA);
      const [pdaB] = enrollmentPda('solana-101', learnerB);
      expect(pdaA.equals(pdaB)).toBe(false);
    });

    it('produces different PDAs for different courses', () => {
      const [pdaA] = enrollmentPda('solana-101', learnerA);
      const [pdaB] = enrollmentPda('rust-basics', learnerA);
      expect(pdaA.equals(pdaB)).toBe(false);
    });
  });

  describe('minterRolePda', () => {
    it('returns a tuple of [PublicKey, number]', () => {
      const [pda, bump] = minterRolePda(learnerA);
      expect(pda).toBeInstanceOf(PublicKey);
      expect(typeof bump).toBe('number');
    });

    it('is deterministic for the same minter', () => {
      const [pda1] = minterRolePda(learnerA);
      const [pda2] = minterRolePda(learnerA);
      expect(pda1.equals(pda2)).toBe(true);
    });

    it('produces different PDAs for different minters', () => {
      const [pdaA] = minterRolePda(learnerA);
      const [pdaB] = minterRolePda(learnerB);
      expect(pdaA.equals(pdaB)).toBe(false);
    });
  });

  describe('achievementTypePda', () => {
    it('returns a tuple of [PublicKey, number]', () => {
      const [pda, bump] = achievementTypePda('first-deploy');
      expect(pda).toBeInstanceOf(PublicKey);
      expect(typeof bump).toBe('number');
    });

    it('is deterministic for the same achievement ID', () => {
      const [pda1] = achievementTypePda('first-deploy');
      const [pda2] = achievementTypePda('first-deploy');
      expect(pda1.equals(pda2)).toBe(true);
    });

    it('produces different PDAs for different achievement IDs', () => {
      const [pdaA] = achievementTypePda('first-deploy');
      const [pdaB] = achievementTypePda('speed-run');
      expect(pdaA.equals(pdaB)).toBe(false);
    });
  });

  describe('achievementReceiptPda', () => {
    it('returns a tuple of [PublicKey, number]', () => {
      const [pda, bump] = achievementReceiptPda('first-deploy', learnerA);
      expect(pda).toBeInstanceOf(PublicKey);
      expect(typeof bump).toBe('number');
    });

    it('is deterministic for the same achievement + recipient', () => {
      const [pda1] = achievementReceiptPda('first-deploy', learnerA);
      const [pda2] = achievementReceiptPda('first-deploy', learnerA);
      expect(pda1.equals(pda2)).toBe(true);
    });

    it('produces different PDAs for different recipients', () => {
      const [pdaA] = achievementReceiptPda('first-deploy', learnerA);
      const [pdaB] = achievementReceiptPda('first-deploy', learnerB);
      expect(pdaA.equals(pdaB)).toBe(false);
    });

    it('produces different PDAs for different achievements', () => {
      const [pdaA] = achievementReceiptPda('first-deploy', learnerA);
      const [pdaB] = achievementReceiptPda('speed-run', learnerA);
      expect(pdaA.equals(pdaB)).toBe(false);
    });
  });

  describe('cross-function uniqueness', () => {
    it('different PDA functions produce different addresses even with overlapping seeds', () => {
      const [configAddr] = configPda();
      const [courseAddr] = coursePda('config');
      expect(configAddr.equals(courseAddr)).toBe(false);
    });
  });
});
