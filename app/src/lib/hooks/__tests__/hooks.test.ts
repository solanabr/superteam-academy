import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { PublicKey } from '@solana/web3.js';

// ---------------------------------------------------------------------------
// Mocks — declared before imports that consume them
// ---------------------------------------------------------------------------

const MOCK_WALLET = new PublicKey('ACAd3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn');

const mockSignTransaction = vi.fn();
const mockSendRawTransaction = vi.fn();
const mockConfirmTransaction = vi.fn();
const mockGetLatestBlockhash = vi.fn();

vi.mock('@solana/wallet-adapter-react', () => ({
  useWallet: vi.fn(() => ({
    publicKey: MOCK_WALLET,
    signTransaction: mockSignTransaction,
    connected: true,
  })),
  useConnection: vi.fn(() => ({
    connection: {
      sendRawTransaction: mockSendRawTransaction,
      confirmTransaction: mockConfirmTransaction,
      getLatestBlockhash: mockGetLatestBlockhash,
    },
  })),
}));

vi.mock('@/lib/solana/enrollment', () => ({
  buildEnrollInstruction: vi.fn(() => ({
    programId: MOCK_WALLET,
    keys: [],
    data: Buffer.from([]),
  })),
}));

// ---------------------------------------------------------------------------
// Store mock state — reset between tests
// ---------------------------------------------------------------------------

let mockUserState = createDefaultUserState();
let mockCourseState = createDefaultCourseState();

function createDefaultUserState() {
  return {
    wallet: MOCK_WALLET,
    xpBalance: 650,
    level: 2,
    levelTitle: 'Builder',
    streak: {
      currentStreak: 5,
      longestStreak: 12,
      lastActiveDate: '2026-02-23' as string | null,
    },
    enrollments: new Map([
      [
        'solana-101',
        {
          courseId: 'solana-101',
          completedLessons: 3,
          totalLessons: 10,
          progressPercent: 30,
          isFinalized: false,
        },
      ],
    ]),
    credentials: [
      {
        assetId: 'cred-1',
        name: 'Solana Foundations',
        uri: 'https://example.com/meta.json',
        imageUrl: 'https://example.com/img.png',
        owner: MOCK_WALLET.toBase58(),
        collection: 'col-1',
        frozen: false,
        attributes: { trackId: 1, level: 1, coursesCompleted: 1, totalXp: 250 },
      },
    ],
    achievements: ['first-course', 'streak-7'],
    isLoading: false,
    error: null,
    setWallet: vi.fn(),
    fetchUserData: vi.fn(),
    updateXp: vi.fn(),
    updateStreak: vi.fn(),
    addEnrollment: vi.fn(),
    updateEnrollmentProgress: vi.fn(),
    addCredential: vi.fn(),
    addAchievement: vi.fn(),
    reset: vi.fn(),
  };
}

function createDefaultCourseState() {
  const courses = [
    {
      courseId: 'solana-101',
      creator: '',
      lessonCount: 10,
      difficulty: 0,
      xpPerLesson: 25,
      trackId: 1,
      isActive: true,
      title: 'Solana 101',
      slug: 'solana-101',
      description: 'Intro to Solana',
      imageUrl: '',
      modules: [],
      tags: ['solana', 'beginner'],
      estimatedHours: 3,
      prerequisiteCourseId: null,
      totalXp: 250,
      enrollmentCount: 42,
      trackSlug: 'blockchain',
    },
    {
      courseId: 'anchor-dev',
      creator: '',
      lessonCount: 15,
      difficulty: 1,
      xpPerLesson: 50,
      trackId: 1,
      isActive: true,
      title: 'Anchor Development',
      slug: 'anchor-dev',
      description: 'Building programs with Anchor',
      imageUrl: '',
      modules: [],
      tags: ['anchor', 'intermediate'],
      estimatedHours: 5,
      prerequisiteCourseId: 'solana-101',
      totalXp: 750,
      enrollmentCount: 18,
      trackSlug: 'blockchain',
    },
  ];

  return {
    courses,
    selectedCourse: null as typeof courses[0] | null,
    filters: {
      track: null as string | null,
      difficulty: null as 'beginner' | 'intermediate' | 'advanced' | null,
      searchQuery: '',
      sortBy: 'newest' as 'newest' | 'popular' | 'difficulty' | 'title',
    },
    isLoading: false,
    error: null,
    fetchCourses: vi.fn(),
    selectCourse: vi.fn((id: string) => {
      mockCourseState.selectedCourse =
        mockCourseState.courses.find((c) => c.courseId === id) ?? null;
    }),
    setFilter: vi.fn(),
    resetFilters: vi.fn(),
    getFilteredCourses: vi.fn(() => mockCourseState.courses),
  };
}

// Mock the stores — use a callback so tests can mutate mockUserState/mockCourseState
vi.mock('@/lib/stores/user-store', () => ({
  useUserStore: vi.fn((selector: (s: typeof mockUserState) => unknown) =>
    selector(mockUserState),
  ),
}));

vi.mock('@/lib/stores/course-store', () => ({
  useCourseStore: vi.fn((selector: (s: typeof mockCourseState) => unknown) =>
    selector(mockCourseState),
  ),
}));

// ---------------------------------------------------------------------------
// Import hooks AFTER mocks are registered
// ---------------------------------------------------------------------------

import { useXp } from '../use-xp';
import { useEnrollment } from '../use-enrollment';
import { useCredentials } from '../use-credentials';
import { useLeaderboard } from '../use-leaderboard';
import { useAchievements } from '../use-achievements';
import { useStreak } from '../use-streak';
import { useCourse, useCourseList } from '../use-course';

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeEach(async () => {
  mockUserState = createDefaultUserState();
  mockCourseState = createDefaultCourseState();
  vi.clearAllMocks();

  // Reset wallet adapter mocks to connected state (tests that disconnect
  // the wallet mutate the global mock, so we must restore it each time).
  const walletAdapter = await import('@solana/wallet-adapter-react');
  vi.mocked(walletAdapter.useWallet).mockReturnValue({
    publicKey: MOCK_WALLET,
    signTransaction: mockSignTransaction,
    connected: true,
  } as unknown as ReturnType<typeof walletAdapter.useWallet>);
  vi.mocked(walletAdapter.useConnection).mockReturnValue({
    connection: {
      sendRawTransaction: mockSendRawTransaction,
      confirmTransaction: mockConfirmTransaction,
      getLatestBlockhash: mockGetLatestBlockhash,
    },
  } as unknown as ReturnType<typeof walletAdapter.useConnection>);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ===================================================================
// useXp
// ===================================================================

describe('useXp', () => {
  it('returns xp and level from the user store', () => {
    const { result } = renderHook(() => useXp());

    expect(result.current.xp).toBe(650);
    expect(result.current.level).toBe(2);
  });

  it('computes progress percentage within current level bracket', () => {
    // Level 2 = 400 XP, Level 3 = 900 XP. At 650: (650-400)/(900-400) = 50%
    const { result } = renderHook(() => useXp());

    expect(result.current.progress).toBe(50);
  });

  it('computes XP remaining to next level', () => {
    // Next level at 900, current 650 => 250 remaining
    const { result } = renderHook(() => useXp());

    expect(result.current.toNextLevel).toBe(250);
  });

  it('returns the correct level title', () => {
    const { result } = renderHook(() => useXp());

    expect(result.current.levelTitle).toBe('Builder');
  });

  it('reflects store isLoading state', () => {
    mockUserState.isLoading = true;

    const { result } = renderHook(() => useXp());

    expect(result.current.isLoading).toBe(true);
  });

  it('handles zero XP correctly', () => {
    mockUserState.xpBalance = 0;
    mockUserState.level = 0;

    const { result } = renderHook(() => useXp());

    expect(result.current.xp).toBe(0);
    expect(result.current.level).toBe(0);
    expect(result.current.progress).toBe(0);
    expect(result.current.toNextLevel).toBe(100);
    expect(result.current.levelTitle).toBe('Newcomer');
  });
});

// ===================================================================
// useEnrollment
// ===================================================================

describe('useEnrollment', () => {
  it('returns enrollment data for enrolled course', () => {
    const { result } = renderHook(() => useEnrollment('solana-101'));

    expect(result.current.isEnrolled).toBe(true);
    expect(result.current.enrollment).toEqual({
      courseId: 'solana-101',
      completedLessons: 3,
      totalLessons: 10,
      progressPercent: 30,
      isFinalized: false,
    });
  });

  it('returns null enrollment for non-enrolled course', () => {
    const { result } = renderHook(() => useEnrollment('anchor-dev'));

    expect(result.current.isEnrolled).toBe(false);
    expect(result.current.enrollment).toBeNull();
  });

  it('enroll() builds instruction, signs, and sends transaction', async () => {
    mockGetLatestBlockhash.mockResolvedValue({
      blockhash: 'mockBlockhash123',
      lastValidBlockHeight: 200,
    });

    const mockSerialize = vi.fn(() => new Uint8Array([1, 2, 3]));
    mockSignTransaction.mockResolvedValue({ serialize: mockSerialize });
    mockSendRawTransaction.mockResolvedValue('mockSignature123');
    mockConfirmTransaction.mockResolvedValue({ value: { err: null } });

    const { result } = renderHook(() => useEnrollment('anchor-dev'));

    let signature: string | undefined;
    await act(async () => {
      signature = await result.current.enroll();
    });

    expect(signature).toBe('mockSignature123');
    expect(mockSignTransaction).toHaveBeenCalledOnce();
    expect(mockSendRawTransaction).toHaveBeenCalledOnce();
    expect(mockConfirmTransaction).toHaveBeenCalledOnce();
    expect(mockUserState.addEnrollment).toHaveBeenCalledWith({
      courseId: 'anchor-dev',
      completedLessons: 0,
      totalLessons: 0,
      progressPercent: 0,
      isFinalized: false,
    });
  });

  it('enroll() throws when wallet is not connected', async () => {
    const { useWallet } = await import('@solana/wallet-adapter-react');
    vi.mocked(useWallet).mockReturnValue({
      publicKey: null,
      signTransaction: mockSignTransaction,
      connected: false,
    } as unknown as ReturnType<typeof useWallet>);

    const { result } = renderHook(() => useEnrollment('anchor-dev'));

    await expect(
      act(async () => {
        await result.current.enroll();
      }),
    ).rejects.toThrow('Wallet not connected');
  });

  it('completeLesson() calls the API and updates enrollment progress', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ completedLessons: 4, totalLessons: 10 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const { result } = renderHook(() => useEnrollment('solana-101'));

    await act(async () => {
      await result.current.completeLesson(3);
    });

    expect(fetchSpy).toHaveBeenCalledWith('/api/lessons/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courseId: 'solana-101',
        lessonIndex: 3,
        wallet: MOCK_WALLET.toBase58(),
      }),
    });

    expect(mockUserState.updateEnrollmentProgress).toHaveBeenCalledWith(
      'solana-101',
      4,
      10,
    );

    fetchSpy.mockRestore();
  });

  it('finalizeCourse() calls the API and marks enrollment as finalized', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const { result } = renderHook(() => useEnrollment('solana-101'));

    await act(async () => {
      await result.current.finalizeCourse();
    });

    expect(fetchSpy).toHaveBeenCalledWith('/api/courses/finalize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courseId: 'solana-101',
        wallet: MOCK_WALLET.toBase58(),
      }),
    });

    expect(mockUserState.addEnrollment).toHaveBeenCalledWith(
      expect.objectContaining({ isFinalized: true }),
    );

    fetchSpy.mockRestore();
  });
});

// ===================================================================
// useCredentials
// ===================================================================

describe('useCredentials', () => {
  it('returns credentials from the user store', () => {
    const { result } = renderHook(() => useCredentials());

    expect(result.current.credentials).toHaveLength(1);
    expect(result.current.credentials[0]?.name).toBe('Solana Foundations');
  });

  it('returns empty array when user has no credentials', () => {
    mockUserState.credentials = [];

    const { result } = renderHook(() => useCredentials());

    expect(result.current.credentials).toEqual([]);
  });

  it('refresh() calls fetchUserData on the store', async () => {
    // Need to mock useUserStore.getState for the refresh function
    mockUserState.fetchUserData = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => useCredentials());

    await act(async () => {
      await result.current.refresh();
    });

    expect(mockUserState.fetchUserData).toHaveBeenCalledWith(MOCK_WALLET);
  });
});

// ===================================================================
// useLeaderboard
// ===================================================================

describe('useLeaderboard', () => {
  it('fetches leaderboard data on mount', async () => {
    const entries = [
      { wallet: MOCK_WALLET.toBase58(), xpBalance: 650, level: 2, rank: 1 },
      { wallet: 'SomeOtherWallet111111111111111111111111111111', xpBalance: 300, level: 1, rank: 2 },
    ];

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ entries }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const { result } = renderHook(() => useLeaderboard());

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.entries).toHaveLength(2);
    expect(result.current.userRank).toBe(1);
    expect(result.current.error).toBeNull();

    fetchSpy.mockRestore();
  });

  it('handles API errors gracefully', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { status: 500 }),
    );

    const { result } = renderHook(() => useLeaderboard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Leaderboard fetch failed (HTTP 500)');
    expect(result.current.entries).toEqual([]);

    fetchSpy.mockRestore();
  });

  it('returns null userRank when wallet is not in entries', async () => {
    const entries = [
      { wallet: 'SomeOtherWallet111111111111111111111111111111', xpBalance: 300, level: 1, rank: 1 },
    ];

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ entries }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const { result } = renderHook(() => useLeaderboard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.userRank).toBeNull();

    fetchSpy.mockRestore();
  });

  it('refresh() re-fetches leaderboard data', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ entries: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const { result } = renderHook(() => useLeaderboard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.refresh();
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);

    fetchSpy.mockRestore();
  });
});

// ===================================================================
// useAchievements
// ===================================================================

describe('useAchievements', () => {
  it('returns achievements array from the user store', () => {
    const { result } = renderHook(() => useAchievements());

    expect(result.current.achievements).toEqual(['first-course', 'streak-7']);
  });

  it('hasAchievement returns true for earned achievement', () => {
    const { result } = renderHook(() => useAchievements());

    expect(result.current.hasAchievement('first-course')).toBe(true);
    expect(result.current.hasAchievement('streak-7')).toBe(true);
  });

  it('hasAchievement returns false for unearned achievement', () => {
    const { result } = renderHook(() => useAchievements());

    expect(result.current.hasAchievement('nonexistent')).toBe(false);
    expect(result.current.hasAchievement('')).toBe(false);
  });

  it('returns empty achievements when user has none', () => {
    mockUserState.achievements = [];

    const { result } = renderHook(() => useAchievements());

    expect(result.current.achievements).toEqual([]);
    expect(result.current.hasAchievement('first-course')).toBe(false);
  });
});

// ===================================================================
// useStreak
// ===================================================================

describe('useStreak', () => {
  it('returns streak data from the user store', () => {
    const { result } = renderHook(() => useStreak());

    expect(result.current.currentStreak).toBe(5);
    expect(result.current.longestStreak).toBe(12);
    expect(result.current.lastActiveDate).toBe('2026-02-23');
  });

  it('recordActivity calls updateStreak on the store', () => {
    const { result } = renderHook(() => useStreak());

    act(() => {
      result.current.recordActivity();
    });

    expect(mockUserState.updateStreak).toHaveBeenCalledOnce();
  });

  it('handles initial streak state (no activity)', () => {
    mockUserState.streak = {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
    };

    const { result } = renderHook(() => useStreak());

    expect(result.current.currentStreak).toBe(0);
    expect(result.current.longestStreak).toBe(0);
    expect(result.current.lastActiveDate).toBeNull();
  });
});

// ===================================================================
// useCourse
// ===================================================================

describe('useCourse', () => {
  it('selects course by ID and returns course data', () => {
    // Simulate selectCourse setting selectedCourse
    mockCourseState.selectedCourse = mockCourseState.courses[0]!;

    const { result } = renderHook(() => useCourse('solana-101'));

    expect(result.current.course).not.toBeNull();
    expect(result.current.course?.courseId).toBe('solana-101');
  });

  it('returns enrollment data for enrolled course', () => {
    mockCourseState.selectedCourse = mockCourseState.courses[0]!;

    const { result } = renderHook(() => useCourse('solana-101'));

    expect(result.current.isEnrolled).toBe(true);
    expect(result.current.enrollment?.completedLessons).toBe(3);
  });

  it('returns null enrollment for non-enrolled course', () => {
    mockCourseState.selectedCourse = mockCourseState.courses[1]!;

    const { result } = renderHook(() => useCourse('anchor-dev'));

    expect(result.current.isEnrolled).toBe(false);
    expect(result.current.enrollment).toBeNull();
  });

  it('calls selectCourse on mount when courseId is provided', () => {
    renderHook(() => useCourse('solana-101'));

    expect(mockCourseState.selectCourse).toHaveBeenCalledWith('solana-101');
  });

  it('returns null course when no courseId and none selected', () => {
    const { result } = renderHook(() => useCourse());

    expect(result.current.course).toBeNull();
    expect(result.current.isEnrolled).toBe(false);
  });
});

// ===================================================================
// useCourseList
// ===================================================================

describe('useCourseList', () => {
  it('returns all courses from the store', () => {
    const { result } = renderHook(() => useCourseList());

    expect(result.current.courses).toHaveLength(2);
    expect(result.current.courses[0]?.courseId).toBe('solana-101');
  });

  it('returns filtered courses from getFilteredCourses', () => {
    mockCourseState.getFilteredCourses = vi.fn(() => [
      mockCourseState.courses[0]!,
    ]);

    const { result } = renderHook(() => useCourseList());

    expect(result.current.filteredCourses).toHaveLength(1);
    expect(mockCourseState.getFilteredCourses).toHaveBeenCalled();
  });

  it('exposes setFilter and resetFilters from the store', () => {
    const { result } = renderHook(() => useCourseList());

    expect(result.current.setFilter).toBe(mockCourseState.setFilter);
    expect(result.current.resetFilters).toBe(mockCourseState.resetFilters);
  });

  it('returns current filter state', () => {
    mockCourseState.filters = {
      track: 'blockchain' as string | null,
      difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced' | null,
      searchQuery: 'solana',
      sortBy: 'title' as 'newest' | 'popular' | 'difficulty' | 'title',
    };

    const { result } = renderHook(() => useCourseList());

    expect(result.current.filters.track).toBe('blockchain');
    expect(result.current.filters.difficulty).toBe('beginner');
    expect(result.current.filters.searchQuery).toBe('solana');
    expect(result.current.filters.sortBy).toBe('title');
  });
});
