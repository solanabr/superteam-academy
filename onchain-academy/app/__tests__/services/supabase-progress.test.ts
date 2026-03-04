/**
 * __tests__/services/supabase-progress.test.ts
 *
 * ROOT CAUSE OF "Cannot read properties of undefined (reading 'maybeSingle')"
 * ─────────────────────────────────────────────────────────────────────────────
 * The previous proxy implementation contained a critical bug:
 *
 *   // BUG: returns raw `chain` object, NOT the Proxy
 *   return (..._args) => chain;
 *
 * Chain method calls work as follows:
 *   1. proxy.select('...')
 *      → Proxy trap returns `(..._args) => chain`
 *      → Calling it yields the raw `chain` object (not the Proxy)
 *   2. chain.eq('id', walletAddress)   ← called on RAW chain, not Proxy
 *      → chain.eq is vi.fn() with no implementation → returns undefined
 *   3. undefined.maybeSingle()
 *      → TypeError: Cannot read properties of undefined ✓ explains the error
 *
 * THE FIX: redesign makeQueryChain so every fluent method returns the Proxy
 * itself. The Proxy is captured in a `let` variable and used in its own
 * get trap. This creates a self-referential proxy where every method returns
 * the same Proxy, meaning chaining works to any depth.
 *
 *   proxy.select('...').eq('id', val).maybeSingle()
 *   → select() returns proxy → eq() returns proxy → maybeSingle() → Promise ✓
 *
 *   await proxy.from('t').select('*').order('rank')
 *   → from() → proxy → select() → proxy → order() → proxy
 *   → await proxy → proxy.then(resolve) → Promise.resolve({ data, error }) ✓
 *
 * SECONDARY FIX: setupMockFrom() must be called AFTER vi.clearAllMocks()
 * in each beforeEach that resets mock state. vi.clearAllMocks() can wipe the
 * mockFrom.mockImplementation set at module level. Calling setupMockFrom() last
 * in every affected beforeEach re-installs the implementation.
 *
 * Run: npm test -- supabase-progress
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Step 1: vi.hoisted() — initialised before vi.mock() factory hoisting ──────

const {
  mockChannel,
  mockOn,
  mockSubscribe,
  mockRemoveChannel,
  mockFrom,
} = vi.hoisted(() => ({
  mockChannel:       vi.fn(),
  mockOn:            vi.fn(),
  mockSubscribe:     vi.fn(),
  mockRemoveChannel: vi.fn(),
  mockFrom:          vi.fn(),
}));

// ── Step 2: register mock ─────────────────────────────────────────────────────

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from:          (...args: unknown[]) => mockFrom(...args),
    channel:       (...args: unknown[]) => {
      mockChannel(...args);
      return { on: mockOn.mockReturnValue({ subscribe: mockSubscribe }) };
    },
    removeChannel: mockRemoveChannel,
  },
}));

// ── Step 3: import module under test AFTER mocks ──────────────────────────────

import { SupabaseProgressService, getProgressService } from '@/lib/services/SupabaseProgressService';

// ── Query chain factory ───────────────────────────────────────────────────────

/**
 * Returns a self-referential Proxy that models a Supabase fluent query chain.
 *
 * Every method call (select, eq, order, limit, update, etc.) returns the SAME
 * Proxy, allowing indefinitely deep chaining. Two special cases:
 *
 *   • proxy.maybeSingle() → Promise<{ data, error }>
 *     Used by getUserStats and getCourseProgress.
 *
 *   • await proxy (via proxy.then) → resolves { data, error }
 *     Used by getLeaderboard, updateDisplayName, getXpHistory.
 *
 * This is structurally identical to how the real Supabase client works.
 */
function makeQueryChain(data: unknown, error: unknown = null) {
  let proxy: object;

  proxy = new Proxy({}, {
    get(_target, prop: string | symbol) {
      // Direct await: `const { data, error } = await supabase.from(...).select(...)`
      if (prop === 'then') {
        return (resolve: (v: unknown) => unknown) =>
          Promise.resolve({ data, error }).then(resolve);
      }
      // Explicit terminal: `.maybeSingle()` → Promise
      if (prop === 'maybeSingle') {
        return () => Promise.resolve({ data, error });
      }
      // All other chainable methods (select, eq, order, limit, update, …)
      return () => proxy;
    },
  });

  return proxy;
}

// ── Per-test FIFO queue ───────────────────────────────────────────────────────

let queryQueue: Array<{ data: unknown; error: unknown }> = [];

function queueQuery(data: unknown, error: unknown = null) {
  queryQueue.push({ data, error });
}

// ── setupMockFrom: re-installs implementation after vi.clearAllMocks() ────────

function setupMockFrom() {
  mockFrom.mockImplementation(() => {
    const item = queryQueue.shift() ?? { data: null, error: null };
    return makeQueryChain(item.data, item.error);
  });
}

// Install at module load so tests that don't call clearAllMocks work too
setupMockFrom();

// ─────────────────────────────────────────────────────────────────────────────
// constructor
// ─────────────────────────────────────────────────────────────────────────────

describe('SupabaseProgressService › constructor', () => {
  afterEach(() => { vi.unstubAllEnvs(); });

  it('throws when NEXT_PUBLIC_SUPABASE_URL is not set', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    expect(() => new SupabaseProgressService()).toThrow('NEXT_PUBLIC_SUPABASE_URL is not set');
  });

  it('constructs successfully when NEXT_PUBLIC_SUPABASE_URL is set', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
    expect(() => new SupabaseProgressService()).not.toThrow();
  });

  it('derives edgeFunctionUrl from NEXT_PUBLIC_SUPABASE_URL', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://myproject.supabase.co');
    const svc = new SupabaseProgressService() as unknown as { edgeFunctionUrl: string };
    expect(svc.edgeFunctionUrl).toBe(
      'https://myproject.supabase.co/functions/v1/complete-lesson',
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// completeLesson
// ─────────────────────────────────────────────────────────────────────────────

describe('SupabaseProgressService › completeLesson', () => {
  const SUPABASE_URL = 'https://snymsdtjekhelhahbhvs.supabase.co';

  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', SUPABASE_URL);
    queryQueue = [];
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('POSTs to the edge function with the correct payload', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok:   true,
      json: async () => ({
        xpEarned: 50, newTotalXp: 50, newLevel: 1,
        leveledUp: false, newStreak: 1, alreadyCompleted: false,
      }),
    });
    global.fetch = mockFetch;

    const svc = new SupabaseProgressService();
    await svc.completeLesson('wallet123', 'solana-101', 'module-1', 'lesson-1');

    expect(mockFetch).toHaveBeenCalledWith(
      `${SUPABASE_URL}/functions/v1/complete-lesson`,
      expect.objectContaining({ method: 'POST', headers: { 'Content-Type': 'application/json' } }),
    );
    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
    expect(body).toEqual({
      walletAddress: 'wallet123',
      courseId:      'solana-101',
      moduleId:      'module-1',
      lessonId:      'lesson-1',
    });
  });

  it('returns the JSON result from the edge function on success', async () => {
    const expected = {
      xpEarned: 50, newTotalXp: 150, newLevel: 1,
      leveledUp: false, newStreak: 3, alreadyCompleted: false,
    };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => expected });
    const result = await new SupabaseProgressService().completeLesson('wallet', 'c', 'm', 'l');
    expect(result).toEqual(expected);
  });

  it('throws when the edge function returns a non-ok status', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false, status: 500,
      json: async () => ({ error: 'Internal server error' }),
    });
    await expect(new SupabaseProgressService().completeLesson('wallet', 'c', 'm', 'l')).rejects.toThrow(
      '[completeLesson] 500: Internal server error',
    );
  });

  it('throws with status code fallback when the error body is unparseable', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false, status: 503,
      json: async () => { throw new SyntaxError('bad json'); },
    });
    await expect(new SupabaseProgressService().completeLesson('wallet', 'c', 'm', 'l')).rejects.toThrow(
      '[completeLesson] 503:',
    );
  });

  it('returns alreadyCompleted:true without throwing when lesson was already done', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok:   true,
      json: async () => ({
        xpEarned: 0, newTotalXp: 50, newLevel: 1,
        leveledUp: false, newStreak: 1, alreadyCompleted: true,
      }),
    });
    const result = await new SupabaseProgressService().completeLesson('wallet', 'c', 'm', 'l');
    expect(result.alreadyCompleted).toBe(true);
    expect(result.xpEarned).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getUserStats
// ─────────────────────────────────────────────────────────────────────────────

describe('SupabaseProgressService › getUserStats', () => {
  const PROFILE_ROW = {
    total_xp: 150, level: 1, streak: 3,
    longest_streak: 5, achievements: ['first-lesson'],
  };

  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
    queryQueue = [];
    vi.clearAllMocks();
    setupMockFrom(); // ← MUST be after vi.clearAllMocks() — re-installs wiped implementation
  });
  afterEach(() => { vi.unstubAllEnvs(); });

  it('returns null when the user profile does not exist', async () => {
    queueQuery(null, null);
    expect(await new SupabaseProgressService().getUserStats('unknown')).toBeNull();
  });

  it('returns populated stats when the profile exists', async () => {
    queueQuery(PROFILE_ROW, null);
    queueQuery({ count: 12 } as unknown, null);
    const stats = await new SupabaseProgressService().getUserStats('wallet-abc');
    expect(stats).toEqual({
      totalXp: 150, level: 1, streak: 3,
      longestStreak: 5, completedLessons: 12, achievements: ['first-lesson'],
    });
  });

  it('falls back to completedLessons:0 when count query returns null', async () => {
    queueQuery(PROFILE_ROW, null);
    queueQuery(null, null);
    const stats = await new SupabaseProgressService().getUserStats('wallet-abc');
    expect(stats!.completedLessons).toBe(0);
  });

  it('defaults achievements to [] when profile.achievements is null', async () => {
    queueQuery({ ...PROFILE_ROW, achievements: null }, null);
    queueQuery(null, null);
    const stats = await new SupabaseProgressService().getUserStats('wallet-abc');
    expect(stats!.achievements).toEqual([]);
  });

  it('throws when user_profiles query returns a DB error', async () => {
    queueQuery(null, { message: 'connection timeout' });
    await expect(new SupabaseProgressService().getUserStats('wallet')).rejects.toThrow(
      '[getUserStats] connection timeout',
    );
  });

  it('throws when lesson_completions count query returns a DB error', async () => {
    queueQuery(PROFILE_ROW, null);
    queueQuery(null, { message: 'permission denied' });
    await expect(new SupabaseProgressService().getUserStats('wallet')).rejects.toThrow(
      '[getUserStats] permission denied',
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getCourseProgress
// ─────────────────────────────────────────────────────────────────────────────

describe('SupabaseProgressService › getCourseProgress', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
    queryQueue = [];
    vi.clearAllMocks();
    setupMockFrom(); // ← re-install after clearAllMocks
  });
  afterEach(() => { vi.unstubAllEnvs(); });

  it('returns null when the user is not enrolled', async () => {
    queueQuery(null, null);
    expect(await new SupabaseProgressService().getCourseProgress('wallet', 'c1')).toBeNull();
  });

  it('returns progress with completedLessonIds and totalXpEarned', async () => {
    queueQuery({ enrolled_at: '2024-01-01T00:00:00Z', completed_at: null }, null);
    queueQuery([
      { lesson_id: 'lesson-1', xp_earned: 50 },
      { lesson_id: 'lesson-2', xp_earned: 75 },
    ], null);
    const p = await new SupabaseProgressService().getCourseProgress('wallet', 'solana-101');
    expect(p).not.toBeNull();
    expect(p!.completedLessonIds).toEqual(['lesson-1', 'lesson-2']);
    expect(p!.totalXpEarned).toBe(125);
    expect(p!.enrolledAt).toBe('2024-01-01T00:00:00Z');
    expect(p!.completedAt).toBeNull();
  });

  it('returns empty arrays when no lessons are completed', async () => {
    queueQuery({ enrolled_at: '2024-01-01T00:00:00Z', completed_at: null }, null);
    queueQuery([], null);
    const p = await new SupabaseProgressService().getCourseProgress('wallet', 'c1');
    expect(p!.completedLessonIds).toEqual([]);
    expect(p!.totalXpEarned).toBe(0);
  });

  it('reflects completedAt when the course is finished', async () => {
    queueQuery({ enrolled_at: '2024-01-01T00:00:00Z', completed_at: '2024-02-15T00:00:00Z' }, null);
    queueQuery([], null);
    const p = await new SupabaseProgressService().getCourseProgress('wallet', 'c1');
    expect(p!.completedAt).toBe('2024-02-15T00:00:00Z');
  });

  it('throws when course_enrollments query returns a DB error', async () => {
    queueQuery(null, { message: 'RLS violation' });
    await expect(new SupabaseProgressService().getCourseProgress('wallet', 'c1')).rejects.toThrow(
      '[getCourseProgress] RLS violation',
    );
  });

  it('throws when lesson_completions query returns a DB error', async () => {
    queueQuery({ enrolled_at: '2024-01-01T00:00:00Z', completed_at: null }, null);
    queueQuery(null, { message: 'table not found' });
    await expect(new SupabaseProgressService().getCourseProgress('wallet', 'c1')).rejects.toThrow(
      '[getCourseProgress] table not found',
    );
  });

  it('handles null completions data gracefully', async () => {
    queueQuery({ enrolled_at: '2024-01-01T00:00:00Z', completed_at: null }, null);
    queueQuery(null, null);
    const p = await new SupabaseProgressService().getCourseProgress('wallet', 'c1');
    expect(p!.completedLessonIds).toEqual([]);
    expect(p!.totalXpEarned).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getLeaderboard
// ─────────────────────────────────────────────────────────────────────────────

describe('SupabaseProgressService › getLeaderboard', () => {
  const DB_ROW = {
    rank: 1, user_id: 'wallet-xyz', display_name: 'Alice',
    wallet_address: 'So11111111111111111111111111111111111111112',
    total_xp: 1500, level: 3, streak: 7,
    completed_lessons: 30, completed_courses: 2, achievement_count: 5,
  };

  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
    queryQueue = [];
    vi.clearAllMocks();
    setupMockFrom(); // ← re-install after clearAllMocks
  });
  afterEach(() => { vi.unstubAllEnvs(); });

  it('returns empty array when the view has no rows', async () => {
    queueQuery([], null);
    expect(await new SupabaseProgressService().getLeaderboard()).toEqual([]);
  });

  it('maps DB row fields to LeaderboardEntry shape', async () => {
    queueQuery([DB_ROW], null);
    const board = await new SupabaseProgressService().getLeaderboard();
    expect(board).toHaveLength(1);
    expect(board[0]).toEqual({
      rank: 1, userId: 'wallet-xyz', displayName: 'Alice',
      walletAddress: 'So11111111111111111111111111111111111111112',
      totalXp: 1500, level: 3, streak: 7,
      completedLessons: 30, completedCourses: 2, achievementCount: 5,
    });
  });

  it('maps multiple rows preserving order', async () => {
    queueQuery([
      DB_ROW,
      { ...DB_ROW, rank: 2, user_id: 'wallet-bob', display_name: 'Bob', total_xp: 1000 },
    ], null);
    const board = await new SupabaseProgressService().getLeaderboard();
    expect(board[0].rank).toBe(1);
    expect(board[1].rank).toBe(2);
    expect(board[1].userId).toBe('wallet-bob');
  });

  it('handles null data by returning empty array', async () => {
    queueQuery(null, null);
    expect(await new SupabaseProgressService().getLeaderboard()).toEqual([]);
  });

  it('throws when the leaderboard query returns a DB error', async () => {
    queueQuery(null, { message: 'view not found' });
    await expect(new SupabaseProgressService().getLeaderboard()).rejects.toThrow(
      '[getLeaderboard] view not found',
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// subscribeToLeaderboard
// ─────────────────────────────────────────────────────────────────────────────

describe('SupabaseProgressService › subscribeToLeaderboard', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
    queryQueue = [];
    vi.clearAllMocks();
    mockSubscribe.mockReturnValue({});
    mockOn.mockReturnValue({ subscribe: mockSubscribe });
    setupMockFrom(); // ← re-install after clearAllMocks
  });
  afterEach(() => { vi.unstubAllEnvs(); });

  it('creates a channel named "leaderboard-updates"', () => {
    new SupabaseProgressService().subscribeToLeaderboard(vi.fn());
    expect(mockChannel).toHaveBeenCalledWith('leaderboard-updates');
  });

  it('listens for UPDATE events on user_profiles', () => {
    new SupabaseProgressService().subscribeToLeaderboard(vi.fn());
    expect(mockOn).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({ event: 'UPDATE', table: 'user_profiles' }),
      expect.any(Function),
    );
  });

  it('calls supabase.removeChannel() when cleanup is invoked', () => {
    const cleanup = new SupabaseProgressService().subscribeToLeaderboard(vi.fn());
    cleanup();
    expect(mockRemoveChannel).toHaveBeenCalledOnce();
  });

  it('returns a cleanup function', () => {
    const cleanup = new SupabaseProgressService().subscribeToLeaderboard(vi.fn());
    expect(typeof cleanup).toBe('function');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// updateDisplayName
// ─────────────────────────────────────────────────────────────────────────────

describe('SupabaseProgressService › updateDisplayName', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
    queryQueue = [];
    vi.clearAllMocks();
    setupMockFrom(); // ← re-install after clearAllMocks
  });
  afterEach(() => { vi.unstubAllEnvs(); });

  it('resolves without error on success', async () => {
    queueQuery(null, null);
    await expect(new SupabaseProgressService().updateDisplayName('wallet', 'NewName'))
      .resolves.toBeUndefined();
  });

  it('throws when the update returns a DB error', async () => {
    queueQuery(null, { message: 'unique constraint violated' });
    await expect(new SupabaseProgressService().updateDisplayName('wallet', 'Bad'))
      .rejects.toThrow('[updateDisplayName] unique constraint violated');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getXpHistory
// ─────────────────────────────────────────────────────────────────────────────

describe('SupabaseProgressService › getXpHistory', () => {
  const DB_ROWS = [
    { amount: 50, reason: 'lesson_complete', created_at: '2024-01-10T10:00:00Z' },
    { amount: 25, reason: 'streak_bonus',    created_at: '2024-01-09T10:00:00Z' },
  ];

  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
    queryQueue = [];
    vi.clearAllMocks();
    setupMockFrom(); // ← re-install after clearAllMocks
  });
  afterEach(() => { vi.unstubAllEnvs(); });

  it('maps DB rows to the expected shape', async () => {
    queueQuery(DB_ROWS, null);
    const history = await new SupabaseProgressService().getXpHistory('wallet');
    expect(history).toHaveLength(2);
    expect(history[0]).toEqual({ amount: 50, reason: 'lesson_complete', createdAt: '2024-01-10T10:00:00Z' });
    expect(history[1]).toEqual({ amount: 25, reason: 'streak_bonus',    createdAt: '2024-01-09T10:00:00Z' });
  });

  it('returns empty array when data is null', async () => {
    queueQuery(null, null);
    expect(await new SupabaseProgressService().getXpHistory('wallet')).toEqual([]);
  });

  it('returns empty array when there are no transactions', async () => {
    queueQuery([], null);
    expect(await new SupabaseProgressService().getXpHistory('wallet')).toEqual([]);
  });

  it('throws when the query returns a DB error', async () => {
    queueQuery(null, { message: 'table xp_transactions not found' });
    await expect(new SupabaseProgressService().getXpHistory('wallet')).rejects.toThrow(
      '[getXpHistory] table xp_transactions not found',
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getProgressService (singleton)
// ─────────────────────────────────────────────────────────────────────────────

describe('getProgressService', () => {
  beforeEach(() => { vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co'); });
  afterEach(() => { vi.unstubAllEnvs(); });

  it('returns a SupabaseProgressService instance', () => {
    expect(getProgressService()).toBeInstanceOf(SupabaseProgressService);
  });

  it('returns the same instance on repeated calls (singleton)', () => {
    expect(getProgressService()).toBe(getProgressService());
  });
});
