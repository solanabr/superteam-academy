// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Connection, PublicKey } from '@solana/web3.js';
import {
  fetchConfig,
  fetchCourse,
  fetchEnrollment,
  fetchAllCourses,
  fetchUserEnrollments,
  fetchMinterRole,
  fetchAchievementType,
  fetchAchievementReceipt,
} from '../accounts';
import {
  configPda,
  coursePda,
  enrollmentPda,
  minterRolePda,
  achievementTypePda,
  achievementReceiptPda,
} from '../pda';
import { PROGRAM_ID } from '../constants';

// Mock Connection — all RPC calls return null/empty by default
const mockGetAccountInfo = vi.fn().mockResolvedValue(null);
const mockGetProgramAccounts = vi.fn().mockResolvedValue([]);

const mockConnection = {
  getAccountInfo: mockGetAccountInfo,
  getProgramAccounts: mockGetProgramAccounts,
} as unknown as Connection;

const learner = new PublicKey('11111111111111111111111111111112');
const minter = new PublicKey('11111111111111111111111111111113');
const recipient = new PublicKey('11111111111111111111111111111114');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Account readers — PDA derivation correctness', () => {
  it('fetchConfig queries the correct PDA address', async () => {
    await fetchConfig(mockConnection);
    const [expectedPda] = configPda();
    expect(mockGetAccountInfo).toHaveBeenCalledWith(expectedPda);
  });

  it('fetchCourse queries the correct PDA address', async () => {
    await fetchCourse(mockConnection, 'solana-101');
    const [expectedPda] = coursePda('solana-101');
    expect(mockGetAccountInfo).toHaveBeenCalledWith(expectedPda);
  });

  it('fetchEnrollment queries the correct PDA address', async () => {
    await fetchEnrollment(mockConnection, 'solana-101', learner);
    const [expectedPda] = enrollmentPda('solana-101', learner);
    expect(mockGetAccountInfo).toHaveBeenCalledWith(expectedPda);
  });

  it('fetchMinterRole queries the correct PDA address', async () => {
    await fetchMinterRole(mockConnection, minter);
    const [expectedPda] = minterRolePda(minter);
    expect(mockGetAccountInfo).toHaveBeenCalledWith(expectedPda);
  });

  it('fetchAchievementType queries the correct PDA address', async () => {
    await fetchAchievementType(mockConnection, 'hackathon-winner');
    const [expectedPda] = achievementTypePda('hackathon-winner');
    expect(mockGetAccountInfo).toHaveBeenCalledWith(expectedPda);
  });

  it('fetchAchievementReceipt queries the correct PDA address', async () => {
    await fetchAchievementReceipt(mockConnection, 'hackathon-winner', recipient);
    const [expectedPda] = achievementReceiptPda('hackathon-winner', recipient);
    expect(mockGetAccountInfo).toHaveBeenCalledWith(expectedPda);
  });
});

describe('Account readers — null handling', () => {
  it('fetchConfig returns null when account does not exist', async () => {
    mockGetAccountInfo.mockResolvedValueOnce(null);
    const result = await fetchConfig(mockConnection);
    expect(result).toBeNull();
  });

  it('fetchCourse returns null when account does not exist', async () => {
    mockGetAccountInfo.mockResolvedValueOnce(null);
    const result = await fetchCourse(mockConnection, 'nonexistent');
    expect(result).toBeNull();
  });

  it('fetchEnrollment returns null when account does not exist', async () => {
    mockGetAccountInfo.mockResolvedValueOnce(null);
    const result = await fetchEnrollment(mockConnection, 'nonexistent', learner);
    expect(result).toBeNull();
  });

  it('fetchMinterRole returns null when account does not exist', async () => {
    mockGetAccountInfo.mockResolvedValueOnce(null);
    const result = await fetchMinterRole(mockConnection, minter);
    expect(result).toBeNull();
  });

  it('fetchAchievementType returns null when account does not exist', async () => {
    mockGetAccountInfo.mockResolvedValueOnce(null);
    const result = await fetchAchievementType(mockConnection, 'nonexistent');
    expect(result).toBeNull();
  });

  it('fetchAchievementReceipt returns null when account does not exist', async () => {
    mockGetAccountInfo.mockResolvedValueOnce(null);
    const result = await fetchAchievementReceipt(mockConnection, 'nonexistent', recipient);
    expect(result).toBeNull();
  });
});

describe('Account readers — wrong program owner', () => {
  const wrongOwner = new PublicKey('11111111111111111111111111111111');
  const fakeAccountInfo = {
    data: Buffer.alloc(200),
    executable: false,
    lamports: 1_000_000,
    owner: wrongOwner,
    rentEpoch: 0,
  };

  it('fetchConfig returns null when account is owned by wrong program', async () => {
    mockGetAccountInfo.mockResolvedValueOnce(fakeAccountInfo);
    const result = await fetchConfig(mockConnection);
    expect(result).toBeNull();
  });

  it('fetchCourse returns null when account is owned by wrong program', async () => {
    mockGetAccountInfo.mockResolvedValueOnce(fakeAccountInfo);
    const result = await fetchCourse(mockConnection, 'solana-101');
    expect(result).toBeNull();
  });

  it('fetchEnrollment returns null when account is owned by wrong program', async () => {
    mockGetAccountInfo.mockResolvedValueOnce(fakeAccountInfo);
    const result = await fetchEnrollment(mockConnection, 'solana-101', learner);
    expect(result).toBeNull();
  });
});

describe('Account readers — batch fetchers', () => {
  it('fetchAllCourses calls getProgramAccounts with correct program ID', async () => {
    await fetchAllCourses(mockConnection);
    expect(mockGetProgramAccounts).toHaveBeenCalledWith(
      PROGRAM_ID,
      expect.objectContaining({
        filters: expect.arrayContaining([
          expect.objectContaining({ dataSize: expect.any(Number) }),
        ]),
      }),
    );
  });

  it('fetchAllCourses returns empty array when no accounts exist', async () => {
    mockGetProgramAccounts.mockResolvedValueOnce([]);
    const result = await fetchAllCourses(mockConnection);
    expect(result).toEqual([]);
  });

  it('fetchUserEnrollments calls getProgramAccounts with correct program ID', async () => {
    await fetchUserEnrollments(mockConnection, learner);
    expect(mockGetProgramAccounts).toHaveBeenCalledWith(
      PROGRAM_ID,
      expect.objectContaining({
        filters: expect.arrayContaining([
          expect.objectContaining({ dataSize: expect.any(Number) }),
        ]),
      }),
    );
  });

  it('fetchUserEnrollments returns empty array when no accounts exist', async () => {
    mockGetProgramAccounts.mockResolvedValueOnce([]);
    const result = await fetchUserEnrollments(mockConnection, learner);
    expect(result).toEqual([]);
  });
});

describe('Account readers — function signatures', () => {
  it('all reader functions accept Connection as first argument', () => {
    expect(typeof fetchConfig).toBe('function');
    expect(fetchConfig.length).toBeGreaterThanOrEqual(1);

    expect(typeof fetchCourse).toBe('function');
    expect(fetchCourse.length).toBeGreaterThanOrEqual(2);

    expect(typeof fetchEnrollment).toBe('function');
    expect(fetchEnrollment.length).toBeGreaterThanOrEqual(3);

    expect(typeof fetchAllCourses).toBe('function');
    expect(fetchAllCourses.length).toBeGreaterThanOrEqual(1);

    expect(typeof fetchUserEnrollments).toBe('function');
    expect(fetchUserEnrollments.length).toBeGreaterThanOrEqual(2);

    expect(typeof fetchMinterRole).toBe('function');
    expect(fetchMinterRole.length).toBeGreaterThanOrEqual(2);

    expect(typeof fetchAchievementType).toBe('function');
    expect(fetchAchievementType.length).toBeGreaterThanOrEqual(2);

    expect(typeof fetchAchievementReceipt).toBe('function');
    expect(fetchAchievementReceipt.length).toBeGreaterThanOrEqual(3);
  });
});
