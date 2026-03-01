// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PublicKey } from '@solana/web3.js';
import type { Credential } from '@/lib/solana/credentials';
import type { Enrollment } from '@/lib/solana/idl/onchain-academy-types';
import BN from 'bn.js';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/lib/solana/credentials', () => ({
  getCredentialsByOwner: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/lib/solana/accounts', () => ({
  fetchUserEnrollments: vi.fn().mockResolvedValue([]),
}));

const mockGetTokenAccountBalance = vi.fn().mockResolvedValue({
  value: { amount: '0', decimals: 0, uiAmount: 0 },
});

vi.mock('@/lib/solana/program', () => ({
  getConnection: vi.fn(() => ({
    getTokenAccountBalance: mockGetTokenAccountBalance,
  })),
}));

vi.mock('@solana/spl-token', () => ({
  getAssociatedTokenAddressSync: vi.fn(() => new PublicKey('11111111111111111111111111111111')),
}));

// Mock localStorage for streak persistence
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
  };
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

// Dynamic import after mocks are in place
const { useUserStore } = await import('../user-store');
const { getCredentialsByOwner } = await import('@/lib/solana/credentials');
const { fetchUserEnrollments } = await import('@/lib/solana/accounts');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const testWallet = new PublicKey('ACAd3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn');

function makeCredential(overrides: Partial<Credential> = {}): Credential {
  return {
    assetId: 'asset-123',
    name: 'Solana Track - Level 1',
    uri: 'https://arweave.net/abc',
    imageUrl: 'https://arweave.net/img',
    owner: testWallet.toBase58(),
    collection: 'collection-xyz',
    frozen: false,
    attributes: { trackId: 1, level: 1, coursesCompleted: 3, totalXp: 1500 },
    createdAt: '2026-01-15T00:00:00Z',
    ...overrides,
  };
}

function makeEnrollment(courseId: string): Enrollment {
  return {
    courseId,
    learner: testWallet,
    lessonFlags: [new BN(0b111), new BN(0), new BN(0), new BN(0)],
    enrolledAt: new BN(Date.now() / 1000),
    completedAt: null,
    credentialAsset: null,
    bump: 255,
    reserved: [],
  };
}

function resetStore(): void {
  useUserStore.getState().reset();
}

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  localStorageMock.clear();
  resetStore();
  // Clear after reset so persistStreak calls from reset() don't pollute test assertions
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('User Store — Initial state', () => {
  it('has correct default values', () => {
    const state = useUserStore.getState();
    expect(state.wallet).toBeNull();
    expect(state.xpBalance).toBe(0);
    expect(state.level).toBe(0);
    expect(state.levelTitle).toBe('Newcomer');
    expect(state.streak.currentStreak).toBe(0);
    expect(state.streak.longestStreak).toBe(0);
    expect(state.streak.lastActiveDate).toBeNull();
    expect(state.enrollments.size).toBe(0);
    expect(state.credentials).toEqual([]);
    expect(state.achievements).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });
});

describe('User Store — setWallet', () => {
  it('sets wallet to a valid PublicKey', () => {
    useUserStore.getState().setWallet(testWallet);
    expect(useUserStore.getState().wallet).toEqual(testWallet);
  });

  it('clears wallet on null', () => {
    useUserStore.getState().setWallet(testWallet);
    useUserStore.getState().setWallet(null);
    expect(useUserStore.getState().wallet).toBeNull();
  });
});

describe('User Store — updateXp', () => {
  it('updates xpBalance and recalculates level and title', () => {
    // level = floor(sqrt(xp / 100))
    // xp=400 => level=2 => "Builder"
    useUserStore.getState().updateXp(400);
    const state = useUserStore.getState();
    expect(state.xpBalance).toBe(400);
    expect(state.level).toBe(2);
    expect(state.levelTitle).toBe('Builder');
  });

  it('handles zero XP correctly', () => {
    useUserStore.getState().updateXp(0);
    const state = useUserStore.getState();
    expect(state.xpBalance).toBe(0);
    expect(state.level).toBe(0);
    expect(state.levelTitle).toBe('Newcomer');
  });

  it('handles high XP values', () => {
    // xp=10000 => level=floor(sqrt(100))=10 => "Legend"
    useUserStore.getState().updateXp(10000);
    const state = useUserStore.getState();
    expect(state.xpBalance).toBe(10000);
    expect(state.level).toBe(10);
    expect(state.levelTitle).toBe('Legend');
  });
});

describe('User Store — updateStreak', () => {
  it('starts a new streak on first activity', () => {
    useUserStore.getState().updateStreak();
    const { streak } = useUserStore.getState();
    expect(streak.currentStreak).toBe(1);
    expect(streak.longestStreak).toBe(1);
    expect(streak.lastActiveDate).toBe(new Date().toISOString().split('T')[0]);
  });

  it('does nothing when called twice on the same day', () => {
    useUserStore.getState().updateStreak();
    useUserStore.getState().updateStreak();
    const { streak } = useUserStore.getState();
    expect(streak.currentStreak).toBe(1);
  });

  it('increments streak on consecutive day', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0]!;

    // Manually set streak to yesterday
    useUserStore.setState({
      streak: {
        currentStreak: 5,
        longestStreak: 5,
        lastActiveDate: yesterdayStr,
        freezesAvailable: 1,
        freezeActiveDate: null,
      },
    });

    useUserStore.getState().updateStreak();
    const { streak } = useUserStore.getState();
    expect(streak.currentStreak).toBe(6);
    expect(streak.longestStreak).toBe(6);
    expect(streak.lastActiveDate).toBe(new Date().toISOString().split('T')[0]);
  });

  it('resets streak to 1 after a gap day', () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0]!;

    useUserStore.setState({
      streak: {
        currentStreak: 10,
        longestStreak: 10,
        lastActiveDate: twoDaysAgoStr,
        freezesAvailable: 1,
        freezeActiveDate: null,
      },
    });

    useUserStore.getState().updateStreak();
    const { streak } = useUserStore.getState();
    expect(streak.currentStreak).toBe(1);
    expect(streak.longestStreak).toBe(10);
  });

  it('persists streak to localStorage', () => {
    useUserStore.getState().updateStreak();
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'superteam-streak',
      expect.any(String),
    );
    const stored = JSON.parse(localStorageMock.setItem.mock.calls[0]![1]!);
    expect(stored.currentStreak).toBe(1);
    expect(stored.lastActiveDate).toBe(new Date().toISOString().split('T')[0]);
  });

  it('preserves longestStreak even when current resets', () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    useUserStore.setState({
      streak: {
        currentStreak: 3,
        longestStreak: 15,
        lastActiveDate: twoDaysAgo.toISOString().split('T')[0]!,
        freezesAvailable: 1,
        freezeActiveDate: null,
      },
    });

    useUserStore.getState().updateStreak();
    const { streak } = useUserStore.getState();
    expect(streak.currentStreak).toBe(1);
    expect(streak.longestStreak).toBe(15);
  });
});

describe('User Store — addEnrollment', () => {
  it('adds an enrollment to the map', () => {
    const enrollment = {
      courseId: 'solana-101',
      completedLessons: 3,
      totalLessons: 10,
      progressPercent: 30,
      isFinalized: false,
    };

    useUserStore.getState().addEnrollment(enrollment);
    const { enrollments } = useUserStore.getState();
    expect(enrollments.size).toBe(1);
    expect(enrollments.get('solana-101')).toEqual(enrollment);
  });

  it('overwrites existing enrollment with same courseId', () => {
    const first = {
      courseId: 'solana-101',
      completedLessons: 3,
      totalLessons: 10,
      progressPercent: 30,
      isFinalized: false,
    };
    const second = {
      courseId: 'solana-101',
      completedLessons: 8,
      totalLessons: 10,
      progressPercent: 80,
      isFinalized: false,
    };

    useUserStore.getState().addEnrollment(first);
    useUserStore.getState().addEnrollment(second);
    const { enrollments } = useUserStore.getState();
    expect(enrollments.size).toBe(1);
    expect(enrollments.get('solana-101')!.completedLessons).toBe(8);
  });
});

describe('User Store — updateEnrollmentProgress', () => {
  it('updates progress on an existing enrollment', () => {
    useUserStore.getState().addEnrollment({
      courseId: 'solana-101',
      completedLessons: 3,
      totalLessons: 10,
      progressPercent: 30,
      isFinalized: false,
    });

    useUserStore.getState().updateEnrollmentProgress('solana-101', 7, 10);
    const updated = useUserStore.getState().enrollments.get('solana-101');
    expect(updated!.completedLessons).toBe(7);
    expect(updated!.totalLessons).toBe(10);
    expect(updated!.progressPercent).toBe(70);
  });

  it('does nothing for a non-existent courseId', () => {
    useUserStore.getState().updateEnrollmentProgress('nonexistent', 5, 10);
    expect(useUserStore.getState().enrollments.size).toBe(0);
  });

  it('handles zero totalLessons without division by zero', () => {
    useUserStore.getState().addEnrollment({
      courseId: 'empty-course',
      completedLessons: 0,
      totalLessons: 0,
      progressPercent: 0,
      isFinalized: false,
    });

    useUserStore.getState().updateEnrollmentProgress('empty-course', 0, 0);
    const updated = useUserStore.getState().enrollments.get('empty-course');
    expect(updated!.progressPercent).toBe(0);
  });
});

describe('User Store — addCredential', () => {
  it('appends a credential to the array', () => {
    const cred = makeCredential();
    useUserStore.getState().addCredential(cred);
    expect(useUserStore.getState().credentials).toHaveLength(1);
    expect(useUserStore.getState().credentials[0]).toEqual(cred);
  });

  it('accumulates multiple credentials', () => {
    useUserStore.getState().addCredential(makeCredential({ assetId: 'a' }));
    useUserStore.getState().addCredential(makeCredential({ assetId: 'b' }));
    useUserStore.getState().addCredential(makeCredential({ assetId: 'c' }));
    expect(useUserStore.getState().credentials).toHaveLength(3);
  });
});

describe('User Store — addAchievement', () => {
  it('appends an achievement ID', () => {
    useUserStore.getState().addAchievement('first-lesson');
    expect(useUserStore.getState().achievements).toEqual(['first-lesson']);
  });

  it('prevents duplicate achievement IDs', () => {
    useUserStore.getState().addAchievement('first-lesson');
    useUserStore.getState().addAchievement('first-lesson');
    expect(useUserStore.getState().achievements).toEqual(['first-lesson']);
  });

  it('accumulates distinct achievements', () => {
    useUserStore.getState().addAchievement('first-lesson');
    useUserStore.getState().addAchievement('streak-7');
    useUserStore.getState().addAchievement('course-complete');
    expect(useUserStore.getState().achievements).toHaveLength(3);
  });
});

describe('User Store — reset', () => {
  it('clears all state back to initial values', () => {
    // Populate store with data
    useUserStore.getState().setWallet(testWallet);
    useUserStore.getState().updateXp(900);
    useUserStore.getState().addEnrollment({
      courseId: 'solana-101',
      completedLessons: 5,
      totalLessons: 10,
      progressPercent: 50,
      isFinalized: false,
    });
    useUserStore.getState().addCredential(makeCredential());
    useUserStore.getState().addAchievement('streak-7');
    useUserStore.getState().updateStreak();

    useUserStore.getState().reset();
    const state = useUserStore.getState();

    expect(state.wallet).toBeNull();
    expect(state.xpBalance).toBe(0);
    expect(state.level).toBe(0);
    expect(state.levelTitle).toBe('Newcomer');
    expect(state.streak.currentStreak).toBe(0);
    expect(state.streak.longestStreak).toBe(0);
    expect(state.streak.lastActiveDate).toBeNull();
    expect(state.enrollments.size).toBe(0);
    expect(state.credentials).toEqual([]);
    expect(state.achievements).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('clears persisted streak from localStorage', () => {
    useUserStore.getState().updateStreak();
    localStorageMock.setItem.mockClear();

    useUserStore.getState().reset();
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'superteam-streak',
      JSON.stringify({
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: null,
        freezesAvailable: 1,
        freezeActiveDate: null,
      }),
    );
  });
});

describe('User Store — fetchUserData', () => {
  it('sets isLoading during fetch and clears when done', async () => {
    expect(useUserStore.getState().isLoading).toBe(false);
    const promise = useUserStore.getState().fetchUserData(testWallet);
    expect(useUserStore.getState().isLoading).toBe(true);
    await promise;
    expect(useUserStore.getState().isLoading).toBe(false);
  });

  it('fetches XP balance from Token-2022 ATA', async () => {
    mockGetTokenAccountBalance.mockResolvedValueOnce({
      value: { amount: '2500', decimals: 0, uiAmount: 25 },
    });

    await useUserStore.getState().fetchUserData(testWallet);
    const state = useUserStore.getState();

    // xp=2500 => level=floor(sqrt(25))=5 => "Architect"
    expect(state.xpBalance).toBe(2500);
    expect(state.level).toBe(5);
    expect(state.levelTitle).toBe('Architect');
  });

  it('defaults to zero XP when ATA does not exist', async () => {
    mockGetTokenAccountBalance.mockRejectedValueOnce(
      new Error('Account not found'),
    );

    await useUserStore.getState().fetchUserData(testWallet);
    const state = useUserStore.getState();
    expect(state.xpBalance).toBe(0);
    expect(state.level).toBe(0);
    expect(state.error).toBeNull();
  });

  it('fetches credentials from Helius DAS', async () => {
    const creds = [makeCredential({ assetId: 'cred-1' }), makeCredential({ assetId: 'cred-2' })];
    vi.mocked(getCredentialsByOwner).mockResolvedValueOnce(creds);

    await useUserStore.getState().fetchUserData(testWallet);
    expect(getCredentialsByOwner).toHaveBeenCalledWith(testWallet.toBase58());
    expect(useUserStore.getState().credentials).toEqual(creds);
  });

  it('handles credential fetch failure gracefully', async () => {
    vi.mocked(getCredentialsByOwner).mockRejectedValueOnce(
      new Error('DAS API unavailable'),
    );

    await useUserStore.getState().fetchUserData(testWallet);
    expect(useUserStore.getState().credentials).toEqual([]);
    expect(useUserStore.getState().error).toBeNull();
  });

  it('fetches enrollment data', async () => {
    const enrollment = makeEnrollment('solana-101');
    vi.mocked(fetchUserEnrollments).mockResolvedValueOnce([enrollment]);

    await useUserStore.getState().fetchUserData(testWallet);
    expect(fetchUserEnrollments).toHaveBeenCalled();
    // The enrollment mapping uses countCompletedLessons on the bitmap
    // Our mock enrollment has lessonFlags[0] = 0b111 (3 bits set)
    // Total lessons is derived from courseId length in current impl
  });

  it('sets wallet on the store after successful fetch', async () => {
    await useUserStore.getState().fetchUserData(testWallet);
    expect(useUserStore.getState().wallet).toEqual(testWallet);
  });

  it('sets error on complete fetch failure', async () => {
    // Mock getConnection to throw
    const { getConnection } = await import('@/lib/solana/program');
    vi.mocked(getConnection).mockImplementationOnce(() => {
      throw new Error('Network unreachable');
    });

    await useUserStore.getState().fetchUserData(testWallet);
    expect(useUserStore.getState().error).toBe('Network unreachable');
    expect(useUserStore.getState().isLoading).toBe(false);
  });
});
