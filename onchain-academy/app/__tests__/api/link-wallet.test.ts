// @vitest-environment node
/**
 * __tests__/api/link-wallet.test.ts
 *
 * ROOT CAUSE OF "OPTIONS is not a function" / "POST is not a function"
 * ─────────────────────────────────────────────────────────────────────────────
 * Importing next/server in Vitest — even in the node environment — fails
 * because Next.js 14's next/server internals require the Next.js build system
 * to have resolved @edge-runtime/primitives and related polyfills. Without
 * a running Next.js server process, those modules are uninitialised, causing
 * the module to export undefined for its bindings. The result:
 *
 *   import { POST, OPTIONS } from '@/app/api/auth/link-wallet/route';
 *   // → POST = undefined, OPTIONS = undefined  (module failed to load)
 *
 * THE FIX: mock 'next/server' with a complete, self-contained implementation
 * of NextRequest and NextResponse that satisfies every code path exercised by
 * the route and the tests.  This mock is 100% reliable regardless of Next.js
 * version, Vitest pool, or runtime configuration.
 *
 * Run: npm test -- link-wallet
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import nacl from 'tweetnacl';
import bs58  from 'bs58';

// ══════════════════════════════════════════════════════════════════════════════
// Step 1 — mock declarations via vi.hoisted()
//
// vi.mock() factories are hoisted above all imports. Variables referenced
// inside factories MUST be initialised before the hoist, so vi.hoisted() is
// the correct place to create them.
// ══════════════════════════════════════════════════════════════════════════════

const { mockGetUser, mockRpc, mockCookiesGetAll, mockCookiesSet } = vi.hoisted(() => ({
  mockGetUser:       vi.fn(),
  mockRpc:           vi.fn(),
  mockCookiesGetAll: vi.fn(() => [] as unknown[]),
  mockCookiesSet:    vi.fn(),
}));

// ══════════════════════════════════════════════════════════════════════════════
// Step 2 — mock next/server
//
// We provide a self-contained MockNextRequest and MockNextResponse that cover
// every operation the route performs:
//   • new NextRequest(url, { method, headers, body }) — parse body with .json()
//   • new NextResponse(null, { status, headers })     — used in OPTIONS()
//   • NextResponse.json(data, { status, headers })    — used in json() helper
//   • response.status, response.headers.get(key)      — asserted in tests
// ══════════════════════════════════════════════════════════════════════════════

vi.mock('next/server', () => {
  /** Minimal Headers implementation — case-insensitive get/set */
  class MockHeaders {
    private _m = new Map<string, string>();
    constructor(init?: Record<string, string> | [string, string][]) {
      if (Array.isArray(init)) {
        init.forEach(([k, v]) => this._m.set(k.toLowerCase(), v));
      } else if (init && typeof init === 'object') {
        Object.entries(init).forEach(([k, v]) => this._m.set(k.toLowerCase(), v));
      }
    }
    get(k: string) { return this._m.get(k.toLowerCase()) ?? null; }
    set(k: string, v: string) { this._m.set(k.toLowerCase(), v); }
  }

  class MockNextRequest {
    url:     string;
    method:  string;
    headers: MockHeaders;
    private _body: string;

    constructor(url: string, init: { method?: string; headers?: Record<string, string>; body?: unknown } = {}) {
      this.url     = url;
      this.method  = init.method  ?? 'GET';
      this.headers = new MockHeaders(init.headers ?? {});
      this._body   = init.body != null ? String(init.body) : '';
    }

    async json() {
      // Intentionally throws SyntaxError for invalid JSON — caught by the route's try/catch
      return JSON.parse(this._body);
    }
  }

  class MockNextResponse {
    status:  number;
    headers: MockHeaders;
    private _data: unknown;

    constructor(body: unknown, init: { status?: number; headers?: Record<string, string> } = {}) {
      this.status  = init.status  ?? 200;
      this.headers = new MockHeaders(init.headers ?? {});
      this._data   = body;
    }

    async json() { return this._data; }

    /** Static factory used by the route's json() helper */
    static json(data: unknown, init: { status?: number; headers?: Record<string, string> } = {}) {
      return new MockNextResponse(data, init);
    }
  }

  return { NextRequest: MockNextRequest, NextResponse: MockNextResponse };
});

// ══════════════════════════════════════════════════════════════════════════════
// Step 3 — mock Next.js / Supabase dependencies the route uses
// ══════════════════════════════════════════════════════════════════════════════

vi.mock('next/headers', () => ({
  cookies: () => Promise.resolve({
    getAll: mockCookiesGetAll,
    set:    mockCookiesSet,
  }),
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: { getUser: mockGetUser },
  }),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ rpc: mockRpc }),
}));

// ══════════════════════════════════════════════════════════════════════════════
// Step 4 — import the route AFTER all mocks are registered
// ══════════════════════════════════════════════════════════════════════════════

import { POST, OPTIONS } from '@/app/api/auth/link-wallet/route';

// Import the mocked NextRequest so tests can construct requests
import { NextRequest } from 'next/server';

// ──────────────────────────────────────────────────────────────────────────────
// Fixtures
// ──────────────────────────────────────────────────────────────────────────────

function makeFixtures() {
  const kp      = nacl.sign.keyPair();
  const address = bs58.encode(kp.publicKey);
  const userId  = 'test-user-uuid-abcd-1234';

  function buildMessage(uid = userId): string {
    return [
      'Sign this message to link your Solana wallet to Superteam Academy.',
      '',
      `Account ID: ${uid}`,
      `Timestamp:  ${new Date().toISOString()}`,
      '',
      'This signature does not authorise any transactions.',
    ].join('\n');
  }

  function sign(message: string): number[] {
    const bytes = new TextEncoder().encode(message);
    const sig   = nacl.sign.detached(bytes, kp.secretKey);
    return Array.from(sig);
  }

  function validBody(overrides?: Partial<{
    walletAddress: string; signature: number[]; message: string; userId: string;
  }>) {
    const msg = buildMessage(overrides?.userId ?? userId);
    return {
      walletAddress: overrides?.walletAddress ?? address,
      signature:     overrides?.signature     ?? sign(msg),
      message:       overrides?.message       ?? msg,
    };
  }

  return { kp, address, userId, buildMessage, sign, validBody };
}

function makeRequest(body: unknown): InstanceType<typeof NextRequest> {
  return new NextRequest('http://localhost/api/auth/link-wallet', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// OPTIONS (CORS preflight)
// ──────────────────────────────────────────────────────────────────────────────

describe('OPTIONS /api/auth/link-wallet', () => {
  it('returns 204 No Content', async () => {
    const res = await OPTIONS();
    expect(res.status).toBe(204);
  });

  it('includes Access-Control-Allow-Methods header', async () => {
    const res = await OPTIONS();
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  it('includes Access-Control-Allow-Headers header', async () => {
    const res = await OPTIONS();
    expect(res.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// POST body validation
// ──────────────────────────────────────────────────────────────────────────────

describe('POST /api/auth/link-wallet — body validation', () => {
  it('returns 400 for a non-JSON body', async () => {
    const req = new NextRequest('http://localhost/api/auth/link-wallet', {
      method: 'POST',
      body:   'not json',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('Invalid JSON');
  });

  it('returns 400 when walletAddress is missing', async () => {
    const { walletAddress: _, ...noAddr } = makeFixtures().validBody();
    const res = await POST(makeRequest(noAddr));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('Missing');
  });

  it('returns 400 when signature is missing', async () => {
    const { signature: _, ...noSig } = makeFixtures().validBody();
    const res = await POST(makeRequest(noSig));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('Missing');
  });

  it('returns 400 when message is missing', async () => {
    const { message: _, ...noMsg } = makeFixtures().validBody();
    const res = await POST(makeRequest(noMsg));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('Missing');
  });

  it('returns 400 for a wallet address containing "0" (invalid base58)', async () => {
    const res = await POST(makeRequest(makeFixtures().validBody({ walletAddress: '0'.repeat(32) })));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('Invalid wallet address format');
  });

  it('returns 400 for a wallet address shorter than 32 chars', async () => {
    const res = await POST(makeRequest(makeFixtures().validBody({ walletAddress: '1'.repeat(31) })));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('Invalid wallet address format');
  });

  it('returns 400 for a wallet address longer than 44 chars', async () => {
    const res = await POST(makeRequest(makeFixtures().validBody({ walletAddress: '1'.repeat(45) })));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('Invalid wallet address format');
  });

  it('returns 400 when signature is not an array', async () => {
    const res = await POST(makeRequest({ ...makeFixtures().validBody(), signature: 'not-an-array' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('64-byte array');
  });

  it('returns 400 when signature array has fewer than 64 bytes', async () => {
    const res = await POST(makeRequest({ ...makeFixtures().validBody(), signature: new Array(63).fill(0) }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('64-byte array');
  });

  it('returns 400 when signature array has more than 64 bytes', async () => {
    const res = await POST(makeRequest({ ...makeFixtures().validBody(), signature: new Array(65).fill(0) }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('64-byte array');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// POST — Supabase JWT auth
// ──────────────────────────────────────────────────────────────────────────────

describe('POST /api/auth/link-wallet — auth', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns 401 when getUser returns no user', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const res = await POST(makeRequest(makeFixtures().validBody()));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toContain('Unauthorized');
  });

  it('returns 401 when getUser returns an error', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'JWT expired' } });
    const res = await POST(makeRequest(makeFixtures().validBody()));
    expect(res.status).toBe(401);
  });

  it('includes a "sign in" message in the 401 body', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const res  = await POST(makeRequest(makeFixtures().validBody()));
    const body = await res.json();
    expect(body.error).toMatch(/sign in/i);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// POST — message → userId binding
// ──────────────────────────────────────────────────────────────────────────────

describe('POST /api/auth/link-wallet — message binding', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns 400 when the message does not contain the authenticated userId', async () => {
    const { validBody, sign, buildMessage } = makeFixtures();
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'real-user-id' } }, error: null });
    const wrongMessage = buildMessage('attacker-user-id');
    const res = await POST(makeRequest(validBody({ message: wrongMessage, signature: sign(wrongMessage) })));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('user ID');
  });

  it('proceeds past the binding check when the message contains the correct userId', async () => {
    const { validBody, userId } = makeFixtures();
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: userId } }, error: null });
    mockRpc.mockResolvedValueOnce({ error: null });
    const res = await POST(makeRequest(validBody()));
    if (res.status === 400) {
      expect((await res.json()).error).not.toContain('user ID');
    }
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// POST — Ed25519 signature verification
// ──────────────────────────────────────────────────────────────────────────────

describe('POST /api/auth/link-wallet — signature verification', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns 400 for an all-zero signature (does not verify)', async () => {
    const { buildMessage, userId } = makeFixtures();
    const msg = buildMessage(userId);
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: userId } }, error: null });
    const res = await POST(makeRequest(makeFixtures().validBody({ signature: new Array(64).fill(0), message: msg })));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('Signature verification');
  });

  it('returns 400 when a valid sig is verified against the wrong public key', async () => {
    const { userId, sign, buildMessage } = makeFixtures();
    const wrongKp      = nacl.sign.keyPair();
    const wrongAddress = bs58.encode(wrongKp.publicKey);
    const msg          = buildMessage(userId);
    const sig          = sign(msg); // signed with correct key but wrong address below
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: userId } }, error: null });
    const res = await POST(makeRequest({ walletAddress: wrongAddress, signature: sig, message: msg }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('Signature verification');
  });

  it('returns 200 when the signature is valid and DB RPC succeeds', async () => {
    const { validBody, userId } = makeFixtures();
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: userId } }, error: null });
    mockRpc.mockResolvedValueOnce({ error: null });
    const res = await POST(makeRequest(validBody()));
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
  });

  it('includes walletAddress in the 200 response body', async () => {
    const { validBody, userId, address } = makeFixtures();
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: userId } }, error: null });
    mockRpc.mockResolvedValueOnce({ error: null });
    const res = await POST(makeRequest(validBody()));
    expect((await res.json()).walletAddress).toBe(address);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// POST — Database RPC
// ──────────────────────────────────────────────────────────────────────────────

describe('POST /api/auth/link-wallet — database RPC', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('calls link_wallet_to_profile RPC with correct params', async () => {
    const { validBody, userId, address } = makeFixtures();
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: userId } }, error: null });
    mockRpc.mockResolvedValueOnce({ error: null });
    await POST(makeRequest(validBody()));
    expect(mockRpc).toHaveBeenCalledWith('link_wallet_to_profile', {
      p_user_id:     userId,
      p_wallet_addr: address,
    });
  });

  it('returns 409 when the wallet is already linked to a different account', async () => {
    const { validBody, userId } = makeFixtures();
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: userId } }, error: null });
    mockRpc.mockResolvedValueOnce({ error: { message: 'Wallet already linked to another account' } });
    const res = await POST(makeRequest(validBody()));
    expect(res.status).toBe(409);
    expect((await res.json()).error).toContain('already linked to a different account');
  });

  it('returns 500 for a generic database error', async () => {
    const { validBody, userId } = makeFixtures();
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: userId } }, error: null });
    mockRpc.mockResolvedValueOnce({ error: { message: 'Connection refused' } });
    const res = await POST(makeRequest(validBody()));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toContain('please try again');
  });

  it('does not call the RPC when the signature is invalid', async () => {
    const { validBody, userId } = makeFixtures();
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: userId } }, error: null });
    await POST(makeRequest(validBody({ signature: new Array(64).fill(0) })));
    expect(mockRpc).not.toHaveBeenCalled();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// CORS headers on all response types
// ──────────────────────────────────────────────────────────────────────────────

describe('POST /api/auth/link-wallet — CORS headers', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('includes Access-Control-Allow-Methods on a 400 validation error', async () => {
    const res = await POST(makeRequest({}));
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  it('includes Access-Control-Allow-Headers on a 401 auth error', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const res = await POST(makeRequest({
      walletAddress: '1'.repeat(32),
      signature:     new Array(64).fill(0),
      message:       'test',
    }));
    expect(res.headers.get('Access-Control-Allow-Headers')).toBeTruthy();
  });
});
