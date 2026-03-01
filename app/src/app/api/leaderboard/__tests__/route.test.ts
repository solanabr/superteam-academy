// @vitest-environment node
import { describe, it, expect, vi, afterEach } from 'vitest';
import { PublicKey } from '@solana/web3.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const MOCK_XP_MINT = new PublicKey('xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3');
const HELIUS_URL = 'https://devnet.helius-rpc.com/?api-key=test-key';
const NON_HELIUS_URL = 'https://api.devnet.solana.com';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeTokenAccounts(
  entries: Array<{ owner: string; amount: string }>,
) {
  return {
    jsonrpc: '2.0',
    id: '1',
    result: { token_accounts: entries },
  };
}

function mockFetchSuccess(body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(body),
  });
}

function mockFetchFailure(status = 500) {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve({}),
  });
}

/**
 * Reset modules and re-import the route with the given RPC URL.
 * Each call produces a fresh module with a cleared cachedLeaderboard.
 */
async function importRoute(rpcUrl = HELIUS_URL) {
  vi.resetModules();
  vi.doMock('@/lib/solana/constants', () => ({
    HELIUS_RPC_SERVER: rpcUrl,
    XP_MINT: MOCK_XP_MINT,
  }));
  const mod = await import('../route');
  return mod.GET;
}

// ─── Setup / Teardown ─────────────────────────────────────────────────────────

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('GET /api/leaderboard', () => {
  it('returns entries sorted by XP descending', async () => {
    const GET = await importRoute();
    const accounts = [
      { owner: 'walletA', amount: '100' },
      { owner: 'walletB', amount: '500' },
      { owner: 'walletC', amount: '250' },
    ];

    vi.stubGlobal('fetch', mockFetchSuccess(makeTokenAccounts(accounts)));

    const response = await GET();
    const data = await response.json();

    expect(data.entries).toHaveLength(3);
    expect(data.entries[0].wallet).toBe('walletB');
    expect(data.entries[0].xpBalance).toBe(500);
    expect(data.entries[1].wallet).toBe('walletC');
    expect(data.entries[1].xpBalance).toBe(250);
    expect(data.entries[2].wallet).toBe('walletA');
    expect(data.entries[2].xpBalance).toBe(100);
  });

  it('assigns correct rank numbers', async () => {
    const GET = await importRoute();
    const accounts = [
      { owner: 'walletA', amount: '50' },
      { owner: 'walletB', amount: '300' },
      { owner: 'walletC', amount: '150' },
      { owner: 'walletD', amount: '900' },
    ];

    vi.stubGlobal('fetch', mockFetchSuccess(makeTokenAccounts(accounts)));

    const response = await GET();
    const data = await response.json();

    expect(data.entries[0]).toMatchObject({ wallet: 'walletD', rank: 1 });
    expect(data.entries[1]).toMatchObject({ wallet: 'walletB', rank: 2 });
    expect(data.entries[2]).toMatchObject({ wallet: 'walletC', rank: 3 });
    expect(data.entries[3]).toMatchObject({ wallet: 'walletA', rank: 4 });
    expect(data.total).toBe(4);
  });

  it('returns dasUnavailable: true when no Helius RPC', async () => {
    const GET = await importRoute(NON_HELIUS_URL);

    const response = await GET();
    const data = await response.json();

    expect(data.dasUnavailable).toBe(true);
  });

  it('returns empty entries when DAS unavailable', async () => {
    const GET = await importRoute(NON_HELIUS_URL);

    const response = await GET();
    const data = await response.json();

    expect(data.entries).toEqual([]);
    expect(data.total).toBe(0);
  });

  it('cache returns stale data within TTL', async () => {
    const GET = await importRoute();
    const accounts = [{ owner: 'walletA', amount: '100' }];
    const fetchMock = mockFetchSuccess(makeTokenAccounts(accounts));
    vi.stubGlobal('fetch', fetchMock);

    // First call populates cache
    const first = await GET();
    const firstData = await first.json();
    expect(firstData.entries).toHaveLength(1);

    // Second call should hit cache
    const second = await GET();
    const secondData = await second.json();
    expect(secondData.entries).toHaveLength(1);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('cache expires after 60s', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-28T12:00:00Z'));

    const GET = await importRoute();
    const accounts = [{ owner: 'walletA', amount: '200' }];
    const fetchMock = mockFetchSuccess(makeTokenAccounts(accounts));
    vi.stubGlobal('fetch', fetchMock);

    // First call at t=0
    await GET();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Advance 59s — still cached
    vi.setSystemTime(new Date('2026-02-28T12:00:59Z'));
    await GET();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Advance past 60s — cache expired
    vi.setSystemTime(new Date('2026-02-28T12:01:01Z'));
    await GET();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('handles Helius API errors gracefully', async () => {
    const GET = await importRoute();
    vi.stubGlobal('fetch', mockFetchFailure(502));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch leaderboard');
  });

  it('handles malformed Helius response', async () => {
    const GET = await importRoute();
    const rpcError = {
      jsonrpc: '2.0',
      id: '1',
      error: { code: -32600, message: 'Invalid request' },
    };

    vi.stubGlobal('fetch', mockFetchSuccess(rpcError));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch leaderboard');
  });
});
