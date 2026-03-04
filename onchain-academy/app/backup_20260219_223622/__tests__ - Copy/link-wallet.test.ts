/**
 * __tests__/api/link-wallet.test.ts
 *
 * Unit tests for app/api/auth/link-wallet/route.ts
 *
 * What is tested:
 *   - OPTIONS pre-flight            → 204 with CORS headers
 *   - POST body validation          → 400 for missing fields, bad formats
 *   - Supabase JWT verification     → 401 when user is unauthenticated
 *   - Message→userId binding        → 400 when message lacks the user ID
 *   - Ed25519 signature check       → 400 for invalid signatures, correct keys
 *   - DB RPC call                   → 200 on success, 409 on duplicate, 500 on errors
 *   - CORS headers                  → present on all responses
 *
 * Mocking strategy
 * ────────────────
 * External modules (tweetnacl, bs58, next/headers, @supabase/ssr,
 * @supabase/supabase-js) are mocked via vi.mock() so tests never hit
 * the network or filesystem.
 *
 * We DO use real nacl.sign.keyPair() / nacl.sign.detached() to generate
 * structurally correct 64-byte signatures — this tests the actual
 * verification path while keeping everything deterministic.
 *
 * Run: npm test -- link-wallet
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { NextRequest } from 'next/server';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockGetUser       = vi.fn();
const mockCookiesGetAll = vi.fn(() => []);
const mockCookiesSet    = vi.fn();
const mockRpc           = vi.fn();

// Mock next/headers cookies()
vi.mock('next/headers', () => ({
  cookies: () => Promise.resolve({
    getAll: mockCookiesGetAll,
    set:    mockCookiesSet,
  }),
}));

// Mock @supabase/ssr createServerClient
vi.mock('@supabase/ssr', () => ({
  createServerClient: (_url: string, _key: string, _opts: unknown) => ({
    auth: { getUser: mockGetUser },
  }),
}));

// Mock @supabase/supabase-js createClient (admin/service-role client)
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    rpc: mockRpc,
  }),
}));

// Import AFTER mocks are registered
import { POST, OPTIONS } from '@/app/api/auth/link-wallet/route';

// ─── Test fixtures ─────────────────────────────────────────────────────────────

/**
 * Generates a real Ed25519 keypair and returns helpers for building
 * signed request bodies.
 */
function makeFixtures() {
  const kp      = nacl.sign.keyPair();
  const address = bs58.encode(Buffer.from(kp.publicKey));
  const userId  = 'test-user-uuid-abcd-1234';

  function buildMessage(uid = userId) {
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
    return Array.from(nacl.sign.detached(bytes, kp.secretKey));
  }

  function validBody(overrides?: Partial<{
    walletAddress: string;
    signature: number[];
    message: string;
    userId: string;
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

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/auth/link-wallet', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// OPTIONS (CORS preflight)
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// POST body validation
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/auth/link-wallet — body validation', () => {
  it('returns 400 for a non-JSON body', async () => {
    const req = new NextRequest('http://localhost/api/auth/link-wallet', {
      method: 'POST',
      body:   'not json',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('Invalid JSON');
  });

  it('returns 400 when walletAddress is missing', async () => {
    const { validBody } = makeFixtures();
    const body = validBody();
    const { walletAddress: _, ...noAddr } = body;
    const res = await POST(makeRequest(noAddr));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('Missing');
  });

  it('returns 400 when signature is missing', async () => {
    const { validBody } = makeFixtures();
    const body = validBody();
    const { signature: _, ...noSig } = body;
    const res = await POST(makeRequest(noSig));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('Missing');
  });

  it('returns 400 when message is missing', async () => {
    const { validBody } = makeFixtures();
    const body = validBody();
    const { message: _, ...noMsg } = body;
    const res = await POST(makeRequest(noMsg));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('Missing');
  });

  it('returns 400 for an invalid wallet address format (contains "0")', async () => {
    const { validBody } = makeFixtures();
    const res = await POST(makeRequest(validBody({ walletAddress: '0'.repeat(32) })));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('Invalid wallet address format');
  });

  it('returns 400 for a wallet address that is too short (< 32 chars)', async () => {
    const { validBody } = makeFixtures();
    const res = await POST(makeRequest(validBody({ walletAddress: '1'.repeat(31) })));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('Invalid wallet address format');
  });

  it('returns 400 for a wallet address that is too long (> 44 chars)', async () => {
    const { validBody } = makeFixtures();
    const res = await POST(makeRequest(validBody({ walletAddress: '1'.repeat(45) })));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('Invalid wallet address format');
  });

  it('returns 400 when signature is not an array', async () => {
    const { validBody } = makeFixtures();
    const res = await POST(makeRequest({ ...validBody(), signature: 'not-an-array' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('64-byte array');
  });

  it('returns 400 when signature array has fewer than 64 bytes', async () => {
    const { validBody } = makeFixtures();
    const res = await POST(makeRequest({ ...validBody(), signature: new Array(63).fill(0) }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('64-byte array');
  });

  it('returns 400 when signature array has more than 64 bytes', async () => {
    const { validBody } = makeFixtures();
    const res = await POST(makeRequest({ ...validBody(), signature: new Array(65).fill(0) }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('64-byte array');
  });

  it('returns 400 when all fields are empty strings', async () => {
    const res = await POST(makeRequest({ walletAddress: '', signature: '', message: '' }));
    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST — Supabase JWT verification
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/auth/link-wallet — authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when getUser returns null user (no session)', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const { validBody } = makeFixtures();
    const res = await POST(makeRequest(validBody()));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toContain('Unauthorized');
  });

  it('returns 401 when getUser returns an error', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'JWT expired' },
    });
    const { validBody } = makeFixtures();
    const res = await POST(makeRequest(validBody()));
    expect(res.status).toBe(401);
  });

  it('returns 401 with a message directing the user to sign in first', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const { validBody } = makeFixtures();
    const res = await POST(makeRequest(validBody()));
    const body = await res.json();
    expect(body.error).toMatch(/sign in/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST — message → userId binding check
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/auth/link-wallet — message binding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when the message does not contain the authenticated user\'s ID', async () => {
    const { validBody, userId, sign, buildMessage } = makeFixtures();

    // Auth returns user 'real-user-id', but message was built for a different user
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'real-user-id' } },
      error: null,
    });

    const wrongMessage = buildMessage('attacker-user-id');
    const body = validBody({ message: wrongMessage, signature: sign(wrongMessage) });
    const res  = await POST(makeRequest(body));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('user ID');
  });

  it('proceeds past the binding check when the message contains the correct userId', async () => {
    const { validBody, userId } = makeFixtures();

    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: userId } },
      error: null,
    });

    // Signature will fail verification (different keypair); that's fine —
    // we're testing that the binding check passes, not sig verification.
    mockRpc.mockResolvedValueOnce({ error: null });

    const res = await POST(makeRequest(validBody()));
    // Should NOT be a 400 "user ID" error — it's either 200, or a later-stage error
    if (res.status === 400) {
      const json = await res.json();
      expect(json.error).not.toContain('user ID');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST — Ed25519 signature verification
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/auth/link-wallet — signature verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 for an all-zero signature (invalid, does not verify)', async () => {
    const { validBody, userId, buildMessage } = makeFixtures();
    const msg = buildMessage(userId);

    mockGetUser.mockResolvedValueOnce({ data: { user: { id: userId } }, error: null });

    const body = validBody({ signature: new Array(64).fill(0), message: msg });
    const res  = await POST(makeRequest(body));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('Signature verification');
  });

  it('returns 400 when a valid signature is verified against the wrong public key', async () => {
    const { userId, sign, buildMessage, address: correctAddr } = makeFixtures();
    const wrongKp      = nacl.sign.keyPair(); // different key
    const wrongAddress = bs58.encode(Buffer.from(wrongKp.publicKey));
    const msg          = buildMessage(userId);
    const sig          = sign(msg); // signed with CORRECT key

    mockGetUser.mockResolvedValueOnce({ data: { user: { id: userId } }, error: null });

    // Send sig but claim it came from the WRONG wallet
    const res = await POST(makeRequest({
      walletAddress: wrongAddress,
      signature:     sig,
      message:       msg,
    }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('Signature verification');
  });

  it('returns 200 when the signature is valid and the DB RPC succeeds', async () => {
    const { validBody, userId } = makeFixtures();
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: userId } }, error: null });
    mockRpc.mockResolvedValueOnce({ error: null });

    const res = await POST(makeRequest(validBody()));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it('includes the walletAddress in the 200 response body', async () => {
    const { validBody, userId, address } = makeFixtures();
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: userId } }, error: null });
    mockRpc.mockResolvedValueOnce({ error: null });

    const res  = await POST(makeRequest(validBody()));
    const json = await res.json();
    expect(json.walletAddress).toBe(address);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST — Database RPC (link_wallet_to_profile)
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/auth/link-wallet — database RPC', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls the link_wallet_to_profile RPC with the correct user ID and wallet address', async () => {
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
    mockRpc.mockResolvedValueOnce({
      error: { message: 'Wallet already linked to another account' },
    });

    const res  = await POST(makeRequest(validBody()));
    expect(res.status).toBe(409);
    expect((await res.json()).error).toContain('already linked to a different account');
  });

  it('returns 500 for a generic database error', async () => {
    const { validBody, userId } = makeFixtures();
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: userId } }, error: null });
    mockRpc.mockResolvedValueOnce({
      error: { message: 'Connection refused' },
    });

    const res = await POST(makeRequest(validBody()));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toContain('please try again');
  });

  it('does not call the RPC when the signature is invalid', async () => {
    const { validBody, userId } = makeFixtures();
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: userId } }, error: null });

    const body = validBody({ signature: new Array(64).fill(0) });
    await POST(makeRequest(body));

    expect(mockRpc).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CORS headers — present on all response types
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/auth/link-wallet — CORS headers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function getAllHeaders(body: unknown) {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const res = await POST(makeRequest(body));
    return res.headers;
  }

  it('includes Access-Control-Allow-Methods on a 400 validation error', async () => {
    const headers = await getAllHeaders({});
    expect(headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  it('includes Access-Control-Allow-Headers on a 401 auth error', async () => {
    const headers = await getAllHeaders({ walletAddress: '1'.repeat(32), signature: new Array(64).fill(0), message: 'test' });
    expect(headers.get('Access-Control-Allow-Headers')).toBeTruthy();
  });
});
