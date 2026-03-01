// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { createHash } from 'crypto';
import { buildEnrollInstruction, buildCloseEnrollmentInstruction } from '../enrollment';
import { PROGRAM_ID } from '../constants';
import { coursePda, enrollmentPda } from '../pda';

const learner = new PublicKey('11111111111111111111111111111112');

describe('buildEnrollInstruction', () => {
  const courseId = 'solana-101';
  const ix = buildEnrollInstruction(courseId, learner);

  it('uses the correct program ID', () => {
    expect(ix.programId.equals(PROGRAM_ID)).toBe(true);
  });

  it('includes the course PDA as the first account (not signer, not writable)', () => {
    const [expectedCourse] = coursePda(courseId);
    expect(ix.keys[0]!.pubkey.equals(expectedCourse)).toBe(true);
    expect(ix.keys[0]!.isSigner).toBe(false);
    expect(ix.keys[0]!.isWritable).toBe(false);
  });

  it('includes the enrollment PDA as the second account (not signer, writable)', () => {
    const [expectedEnrollment] = enrollmentPda(courseId, learner);
    expect(ix.keys[1]!.pubkey.equals(expectedEnrollment)).toBe(true);
    expect(ix.keys[1]!.isSigner).toBe(false);
    expect(ix.keys[1]!.isWritable).toBe(true);
  });

  it('includes the learner as the third account (signer, writable)', () => {
    expect(ix.keys[2]!.pubkey.equals(learner)).toBe(true);
    expect(ix.keys[2]!.isSigner).toBe(true);
    expect(ix.keys[2]!.isWritable).toBe(true);
  });

  it('includes SystemProgram as the fourth account', () => {
    expect(ix.keys[3]!.pubkey.equals(SystemProgram.programId)).toBe(true);
    expect(ix.keys[3]!.isSigner).toBe(false);
    expect(ix.keys[3]!.isWritable).toBe(false);
  });

  it('has exactly 4 accounts when no prerequisite', () => {
    expect(ix.keys).toHaveLength(4);
  });

  it('data starts with the correct 8-byte Anchor discriminator', () => {
    const expectedDisc = createHash('sha256')
      .update('global:enroll')
      .digest()
      .subarray(0, 8);
    const actualDisc = ix.data.subarray(0, 8);
    expect(Buffer.compare(actualDisc, expectedDisc)).toBe(0);
  });

  it('data contains the course ID length as u32 LE after discriminator', () => {
    const courseIdLen = ix.data.readUInt32LE(8);
    expect(courseIdLen).toBe(Buffer.from(courseId, 'utf-8').length);
  });

  it('data contains the course ID string after the length prefix', () => {
    const len = ix.data.readUInt32LE(8);
    const courseIdFromData = ix.data.subarray(12, 12 + len).toString('utf-8');
    expect(courseIdFromData).toBe(courseId);
  });

  it('data has the correct total length', () => {
    const expectedLen = 8 + 4 + Buffer.from(courseId, 'utf-8').length;
    expect(ix.data.length).toBe(expectedLen);
  });
});

describe('buildEnrollInstruction with prerequisite', () => {
  const courseId = 'anchor-201';
  const prereqCourseId = 'anchor-101';
  const ix = buildEnrollInstruction(courseId, learner, prereqCourseId);

  it('has 6 accounts when prerequisite is provided', () => {
    expect(ix.keys).toHaveLength(6);
  });

  it('appends the prerequisite course PDA as remaining account (not signer, not writable)', () => {
    const [prereqCourse] = coursePda(prereqCourseId);
    expect(ix.keys[4]!.pubkey.equals(prereqCourse)).toBe(true);
    expect(ix.keys[4]!.isSigner).toBe(false);
    expect(ix.keys[4]!.isWritable).toBe(false);
  });

  it('appends the prerequisite enrollment PDA as remaining account (not signer, not writable)', () => {
    const [prereqEnrollment] = enrollmentPda(prereqCourseId, learner);
    expect(ix.keys[5]!.pubkey.equals(prereqEnrollment)).toBe(true);
    expect(ix.keys[5]!.isSigner).toBe(false);
    expect(ix.keys[5]!.isWritable).toBe(false);
  });

  it('still encodes only the primary course ID in instruction data', () => {
    const len = ix.data.readUInt32LE(8);
    const courseIdFromData = ix.data.subarray(12, 12 + len).toString('utf-8');
    expect(courseIdFromData).toBe(courseId);
  });
});

describe('buildEnrollInstruction — edge cases', () => {
  it('handles single-character course ID', () => {
    const ix = buildEnrollInstruction('x', learner);
    expect(ix.data.readUInt32LE(8)).toBe(1);
    expect(ix.data.subarray(12, 13).toString('utf-8')).toBe('x');
  });

  it('handles course ID with unicode characters', () => {
    const unicodeCourse = 'solana-日本語';
    const ix = buildEnrollInstruction(unicodeCourse, learner);
    const expectedLen = Buffer.from(unicodeCourse, 'utf-8').length;
    expect(ix.data.readUInt32LE(8)).toBe(expectedLen);
  });

  it('different course IDs produce different PDAs in instruction accounts', () => {
    const ix1 = buildEnrollInstruction('course-a', learner);
    const ix2 = buildEnrollInstruction('course-b', learner);
    expect(ix1.keys[0]!.pubkey.equals(ix2.keys[0]!.pubkey)).toBe(false);
    expect(ix1.keys[1]!.pubkey.equals(ix2.keys[1]!.pubkey)).toBe(false);
  });
});

describe('buildCloseEnrollmentInstruction', () => {
  const courseId = 'solana-101';
  const ix = buildCloseEnrollmentInstruction(courseId, learner);

  it('uses the correct program ID', () => {
    expect(ix.programId.equals(PROGRAM_ID)).toBe(true);
  });

  it('includes the course PDA as the first account (not signer, not writable)', () => {
    const [expectedCourse] = coursePda(courseId);
    expect(ix.keys[0]!.pubkey.equals(expectedCourse)).toBe(true);
    expect(ix.keys[0]!.isSigner).toBe(false);
    expect(ix.keys[0]!.isWritable).toBe(false);
  });

  it('includes the enrollment PDA as the second account (not signer, writable)', () => {
    const [expectedEnrollment] = enrollmentPda(courseId, learner);
    expect(ix.keys[1]!.pubkey.equals(expectedEnrollment)).toBe(true);
    expect(ix.keys[1]!.isSigner).toBe(false);
    expect(ix.keys[1]!.isWritable).toBe(true);
  });

  it('includes the learner as the third account (signer, writable)', () => {
    expect(ix.keys[2]!.pubkey.equals(learner)).toBe(true);
    expect(ix.keys[2]!.isSigner).toBe(true);
    expect(ix.keys[2]!.isWritable).toBe(true);
  });

  it('has exactly 3 accounts', () => {
    expect(ix.keys).toHaveLength(3);
  });

  it('data is exactly 8 bytes (discriminator only)', () => {
    expect(ix.data.length).toBe(8);
  });

  it('data matches the close_enrollment discriminator', () => {
    const expectedDisc = createHash('sha256')
      .update('global:close_enrollment')
      .digest()
      .subarray(0, 8);
    expect(Buffer.compare(ix.data, expectedDisc)).toBe(0);
  });
});
