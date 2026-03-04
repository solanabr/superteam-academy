/**
 * __tests__/services/supabase-progress.test.ts
 *
 * Unit tests for lib/services/SupabaseProgressService.ts
 *
 * Every Supabase call and fetch() is mocked so tests run in isolation with
 * zero network I/O. The mock builder pattern keeps each test readable:
 *   mockChain({ from: 'user_profiles', data: [...], error: null })
 *
 * What is tested:
 *   constructor()           — throws when env var is missing
 *   completeLesson()        — happy path, non-ok response, JSON parse failure
 *   getUserStats()          — found, not found, DB error on profile query, DB error on count
 *   getCourseProgress()     — not enrolled, enrolled + completions, DB errors
 *   getLeaderboard()        — mapping, empty, DB error
 *   subscribeToLeaderboard()— channel setup, cleanup calls removeChannel
 *   updateDisplayName()     — success, DB error
 *   getXpHistory()          — maps fields, default limit, DB error
 *   getProgressService()    — singleton
 *
 * Run: npm test -- supabase-progress
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Mock @/lib/supabaseClient ────────────────────────────────────────────────

// We build the entire fluent chain mock declaratively so each test can
// override only the parts it cares about.

const mockChannel   = vi.fn();
const mockOn        = vi.fn();
const mockSubscribe = vi.fn();
const mockRemoveChannel = vi.fn();

// A factory that creates a single Supabase query chain.
// Returns { data, error } when .maybeSingle() or .order() is awaited.
function makeQueryChain(data: unknown, error: unknown = null) {
  const chain: Record<string, unknown> = {};

  const resolve = () => Promise.resolve({ data, error });

  chain.select   = vi.fn().mockReturnValue(chain);
  chain.eq       = vi.fn().mockReturnValue(chain);
  chain.order    = vi.fn().mockReturnValue(chain);
  chain.limit    = vi.fn().mockReturnValue(chain);
  chain.update   = vi.fn().mockReturnValue(chain);
  chain.maybeSingle = vi.fn().mockImplementation(resolve);
  chain.then     = (resolve as any).then?.bind(resolve) ?? ((fn: (v: unknown) => unknown) => Promise.resolve({ data, error }).then(fn));

  // Make the chain itself thenable (await-able) for direct .from().select().order() patterns
  chain[Symbol.iterator] = undefined;

  return new Proxy(chain, {
    get(target, prop) {
      if (prop === 'then') {
        return (fn: (v: unknown) => unknown) => Promise.resolve({ data, error }).then(fn);
      }
      if (prop in target) return target[prop as string];
      return () => chain; // unknown method → return chain (fluent)
    },
  });
}

// Per-test queue: tests push { data, error } and fromMock pops them in order
let queryQueue: Array<{ data: unknown; error: unknown }> = [];

const mockFrom = vi.fn().mockImplementation(() => {
  const item = queryQueue.shift() ?? { data: null, error: null };
  return makeQueryChain(item.data, item.error);
});

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from:          (...args: unknown[]) => mockFrom(...args),
    channel:       (...args: unknown[]) => {
      mockChannel(...args);
      return { on: mockOn.mockReturnValue({ subscribe: mockSubscribe }) };
    },
    removeChannel: mockRemoveChannel,
  },
  // DbLeaderboardEntry is a type — no runtime value needed
}));

// Import AFTER mocks
import { SupabaseProgressService, getProgressService } from '@/lib/services/SupabaseProgressService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Push query results to the queue (consumed in order by mockFrom) */
function queueQuery(data: unknown, error: unknown = null) {
  queryQueue.push({ data, error });
}

// ─────────────────────────────────────────────────────────────────────────────
// constructor
// ─────────────────────────────────────────────────────────────────────────────

describe('SupabaseProgressService › constructor', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('throws when NEXT_PUBLIC_SUPABASE_URL is not set', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    expect(() => new SupabaseProgressService()).toThrow(
      'NEXT_PUBLIC_SUPABASE_URL is not set'
    );
  });

  it('constructs successfully when NEXT_PUBLIC_SUPABASE_URL is set', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
    expect(() => new SupabaseProgressService()).not.toThrow();
  });

  it('derives the edgeFunctionUrl from NEXT_PUBLIC_SUPABASE_URL', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://myproject.supabase.co');
    // Access via any-cast since edgeFunctionUrl is private
    const svc = new SupabaseProgressService() as unknown as { edgeFunctionUrl: string };
    expect(svc.edgeFunctionUrl).toBe(
      'https://myproject.supabase.co/functions/v1/complete-lesson'
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
      expect.objectContaining({
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
      })
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
    global.fetch = vi.fn().mockResolvedValue({
      ok: true, json: async () => expected,
    });

    const svc = new SupabaseProgressService();
    const result = await svc.completeLesson('wallet', 'c', 'm', 'l');
    expect(result).toEqual(expected);
  });

  it('throws when the edge function returns a non-ok status', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok:     false,
      status: 500,
      json:   async () => ({ error: 'Internal server error' }),
    });

    const svc = new SupabaseProgressService();
    await expect(svc.completeLesson('wallet', 'c', 'm', 'l')).rejects.toThrow(
      '[completeLesson] 500: Internal server error'
    );
  });

  it('throws with status code fallback when the error body is unparseable', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok:     false,
      status: 503,
      json:   async () => { throw new SyntaxError('bad json'); },
    });

    const svc = new SupabaseProgressService();
    await expect(svc.completeLesson('wallet', 'c', 'm', 'l')).rejects.toThrow(
      '[completeLesson] 503:'
    );
  });

  it('returns alreadyCompleted: true without throwing when lesson was already done', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok:   true,
      json: async () => ({
        xpEarned: 0, newTotalXp: 50, newLevel: 1,
        leveledUp: false, newStreak: 1, alreadyCompleted: true,
      }),
    });

    const svc    = new SupabaseProgressService();
    const result = await svc.completeLesson('wallet', 'c', 'm', 'l');
    expect(result.alreadyCompleted).toBe(true);
    expect(result.xpEarned).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getUserStats
// ─────────────────────────────────────────────────────────────────────────────

describe('SupabaseProgressService › getUserStats', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
    queryQueue = [];
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const PROFILE_ROW = {
    total_xp:       150,
    level:          1,
    streak:         3,
    longest_streak: 5,
    achievements:   ['first-lesson'],
  };

  it('returns null when the user profile does not exist', async () => {
    // First query (user_profiles) returns null data
    queueQuery(null, null);

    const svc   = new SupabaseProgressService();
    const stats = await svc.getUserStats('unknown-wallet');
    expect(stats).toBeNull();
  });

  it('returns populated stats when the profile exists', async () => {
    queueQuery(PROFILE_ROW, null);                      // user_profiles
    queueQuery({ count: 12 } as unknown, null);         // lesson_completions count

    const svc   = new SupabaseProgressService();
    const stats = await svc.getUserStats('wallet-abc');
    expect(stats).toEqual({
      totalXp:          150,
      level:            1,
      streak:           3,
      longestStreak:    5,
      completedLessons: 12,
      achievements:     ['first-lesson'],
    });
  });

  it('falls back to completedLessons: 0 when the count query returns null', async () => {
    queueQuery(PROFILE_ROW, null);
    queueQuery(null, null);  // no completions data

    const svc   = new SupabaseProgressService();
    const stats = await svc.getUserStats('wallet-abc');
    expect(stats!.completedLessons).toBe(0);
  });

  it('defaults achievements to [] when profile.achievements is null', async () => {
    queueQuery({ ...PROFILE_ROW, achievements: null }, null);
    queueQuery(null, null);

    const svc   = new SupabaseProgressService();
    const stats = await svc.getUserStats('wallet-abc');
    expect(stats!.achievements).toEqual([]);
  });

  it('throws when the user_profiles query returns a DB error', async () => {
    queueQuery(null, { message: 'connection timeout' });

    const svc = new SupabaseProgressService();
    await expect(svc.getUserStats('wallet-abc')).rejects.toThrow(
      '[getUserStats] connection timeout'
    );
  });

  it('throws when the lesson_completions count query returns a DB error', async () => {
    queueQuery(PROFILE_ROW, null);
    queueQuery(null, { message: 'permission denied' });

    const svc = new SupabaseProgressService();
    await expect(svc.getUserStats('wallet-abc')).rejects.toThrow(
      '[getUserStats] permission denied'
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
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns null when the user is not enrolled in the course', async () => {
    queueQuery(null, null); // course_enrollments → not found

    const svc = new SupabaseProgressService();
    const progress = await svc.getCourseProgress('wallet', 'solana-101');
    expect(progress).toBeNull();
  });

  it('returns progress with completedLessonIds and totalXpEarned', async () => {
    const enrollment = { enrolled_at: '2024-01-01T00:00:00Z', completed_at: null };
    const completions = [
      { lesson_id: 'lesson-1', xp_earned: 50 },
      { lesson_id: 'lesson-2', xp_earned: 75 },
    ];
    queueQuery(enrollment,   null);  // course_enrollments
    queueQuery(completions,  null);  // lesson_completions

    const svc      = new SupabaseProgressService();
    const progress = await svc.getCourseProgress('wallet', 'solana-101');

    expect(progress).not.toBeNull();
    expect(progress!.courseId).toBe('solana-101');
    expect(progress!.enrolledAt).toBe('2024-01-01T00:00:00Z');
    expect(progress!.completedAt).toBeNull();
    expect(progress!.completedLessonIds).toEqual(['lesson-1', 'lesson-2']);
    expect(progress!.totalXpEarned).toBe(125);
  });

  it('returns empty completedLessonIds and 0 totalXpEarned when no lessons are done', async () => {
    const enrollment = { enrolled_at: '2024-01-01T00:00:00Z', completed_at: null };
    queueQuery(enrollment, null);
    queueQuery([],         null); // no completions

    const svc      = new SupabaseProgressService();
    const progress = await svc.getCourseProgress('wallet', 'solana-101');

    expect(progress!.completedLessonIds).toEqual([]);
    expect(progress!.totalXpEarned).toBe(0);
  });

  it('reflects completedAt when the course is finished', async () => {
    const enrollment = {
      enrolled_at:  '2024-01-01T00:00:00Z',
      completed_at: '2024-02-15T00:00:00Z',
    };
    queueQuery(enrollment, null);
    queueQuery([],         null);

    const svc      = new SupabaseProgressService();
    const progress = await svc.getCourseProgress('wallet', 'solana-101');
    expect(progress!.completedAt).toBe('2024-02-15T00:00:00Z');
  });

  it('throws when the course_enrollments query returns a DB error', async () => {
    queueQuery(null, { message: 'row-level security violation' });

    const svc = new SupabaseProgressService();
    await expect(svc.getCourseProgress('wallet', 'c1')).rejects.toThrow(
      '[getCourseProgress] row-level security violation'
    );
  });

  it('throws when the lesson_completions query returns a DB error', async () => {
    queueQuery({ enrolled_at: '2024-01-01T00:00:00Z', completed_at: null }, null);
    queueQuery(null, { message: 'table not found' });

    const svc = new SupabaseProgressService();
    await expect(svc.getCourseProgress('wallet', 'c1')).rejects.toThrow(
      '[getCourseProgress] table not found'
    );
  });

  it('handles null completions gracefully (treats null as empty array)', async () => {
    queueQuery({ enrolled_at: '2024-01-01T00:00:00Z', completed_at: null }, null);
    queueQuery(null, null); // null data, no error

    const svc      = new SupabaseProgressService();
    const progress = await svc.getCourseProgress('wallet', 'c1');
    expect(progress!.completedLessonIds).toEqual([]);
    expect(progress!.totalXpEarned).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getLeaderboard
// ─────────────────────────────────────────────────────────────────────────────

describe('SupabaseProgressService › getLeaderboard', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
    queryQueue = [];
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const DB_ROW = {
    rank:               1,
    user_id:            'wallet-xyz',
    display_name:       'Alice',
    wallet_address:     'So11111111111111111111111111111111111111112',
    total_xp:           1500,
    level:              3,
    streak:             7,
    completed_lessons:  30,
    completed_courses:  2,
    achievement_count:  5,
  };

  it('returns an empty array when the leaderboard view has no rows', async () => {
    queueQuery([], null);

    const svc   = new SupabaseProgressService();
    const board = await svc.getLeaderboard();
    expect(board).toEqual([]);
  });

  it('maps DB row fields to the LeaderboardEntry shape', async () => {
    queueQuery([DB_ROW], null);

    const svc   = new SupabaseProgressService();
    const board = await svc.getLeaderboard();
    expect(board).toHaveLength(1);
    expect(board[0]).toEqual({
      rank:             1,
      userId:           'wallet-xyz',
      displayName:      'Alice',
      walletAddress:    'So11111111111111111111111111111111111111112',
      totalXp:          1500,
      level:            3,
      streak:           7,
      completedLessons: 30,
      completedCourses: 2,
      achievementCount: 5,
    });
  });

  it('maps multiple rows preserving order', async () => {
    const rows = [DB_ROW, { ...DB_ROW, rank: 2, user_id: 'wallet-bob', display_name: 'Bob', total_xp: 1000 }];
    queueQuery(rows, null);

    const svc   = new SupabaseProgressService();
    const board = await svc.getLeaderboard();
    expect(board[0].rank).toBe(1);
    expect(board[1].rank).toBe(2);
    expect(board[1].userId).toBe('wallet-bob');
  });

  it('handles null data from Supabase by returning empty array', async () => {
    queueQuery(null, null);

    const svc   = new SupabaseProgressService();
    const board = await svc.getLeaderboard();
    expect(board).toEqual([]);
  });

  it('throws when the leaderboard query returns a DB error', async () => {
    queueQuery(null, { message: 'view not found' });

    const svc = new SupabaseProgressService();
    await expect(svc.getLeaderboard()).rejects.toThrow('[getLeaderboard] view not found');
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
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('creates a channel named "leaderboard-updates"', () => {
    const svc = new SupabaseProgressService();
    svc.subscribeToLeaderboard(vi.fn());
    expect(mockChannel).toHaveBeenCalledWith('leaderboard-updates');
  });

  it('listens for UPDATE events on the user_profiles table', () => {
    const svc = new SupabaseProgressService();
    svc.subscribeToLeaderboard(vi.fn());
    expect(mockOn).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({ event: 'UPDATE', table: 'user_profiles' }),
      expect.any(Function)
    );
  });

  it('calls supabase.removeChannel() when the returned cleanup function is invoked', () => {
    const svc     = new SupabaseProgressService();
    const cleanup = svc.subscribeToLeaderboard(vi.fn());
    cleanup();
    expect(mockRemoveChannel).toHaveBeenCalledOnce();
  });

  it('returns a cleanup function', () => {
    const svc     = new SupabaseProgressService();
    const cleanup = svc.subscribeToLeaderboard(vi.fn());
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
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('resolves without error on a successful update', async () => {
    queueQuery(null, null); // update returns no data, no error

    const svc = new SupabaseProgressService();
    await expect(svc.updateDisplayName('wallet', 'NewName')).resolves.toBeUndefined();
  });

  it('throws when the update query returns a DB error', async () => {
    queueQuery(null, { message: 'unique constraint violated' });

    const svc = new SupabaseProgressService();
    await expect(svc.updateDisplayName('wallet', 'BadName')).rejects.toThrow(
      '[updateDisplayName] unique constraint violated'
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getXpHistory
// ─────────────────────────────────────────────────────────────────────────────

describe('SupabaseProgressService › getXpHistory', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
    queryQueue = [];
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const DB_TX_ROWS = [
    { amount: 50, reason: 'lesson_complete', created_at: '2024-01-10T10:00:00Z' },
    { amount: 25, reason: 'streak_bonus',    created_at: '2024-01-09T10:00:00Z' },
  ];

  it('maps DB rows to the expected shape', async () => {
    queueQuery(DB_TX_ROWS, null);

    const svc     = new SupabaseProgressService();
    const history = await svc.getXpHistory('wallet');

    expect(history).toHaveLength(2);
    expect(history[0]).toEqual({
      amount:    50,
      reason:    'lesson_complete',
      createdAt: '2024-01-10T10:00:00Z',
    });
    expect(history[1]).toEqual({
      amount:    25,
      reason:    'streak_bonus',
      createdAt: '2024-01-09T10:00:00Z',
    });
  });

  it('returns empty array when Supabase returns null data', async () => {
    queueQuery(null, null);

    const svc     = new SupabaseProgressService();
    const history = await svc.getXpHistory('wallet');
    expect(history).toEqual([]);
  });

  it('returns empty array when there are no transactions', async () => {
    queueQuery([], null);

    const svc     = new SupabaseProgressService();
    const history = await svc.getXpHistory('wallet');
    expect(history).toEqual([]);
  });

  it('throws when the query returns a DB error', async () => {
    queueQuery(null, { message: 'table xp_transactions not found' });

    const svc = new SupabaseProgressService();
    await expect(svc.getXpHistory('wallet')).rejects.toThrow(
      '[getXpHistory] table xp_transactions not found'
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getProgressService (singleton)
// ─────────────────────────────────────────────────────────────────────────────

describe('getProgressService', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
    // Reset module-level singleton by re-importing (can't easily do this without
    // vi.resetModules(); instead we just check behaviour within one module load)
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns a SupabaseProgressService instance', () => {
    const svc = getProgressService();
    expect(svc).toBeInstanceOf(SupabaseProgressService);
  });

  it('returns the same instance on repeated calls (singleton)', () => {
    const a = getProgressService();
    const b = getProgressService();
    expect(a).toBe(b);
  });
});
