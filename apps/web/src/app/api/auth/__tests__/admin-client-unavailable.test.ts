/* eslint-disable import/order -- the env must change before the route
   modules load, and vi.mock calls are hoisted above the imports. */
import { describe, it, expect, vi, afterAll, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Sign-in goes dark, cleanly, when the admin client cannot be made.
//
// The real server env loads with no service-role key on a preview deployment,
// so this is the path a deployment without the key takes. Every sign-in and
// account-link route must answer 503 with the fixed message before it builds a
// client, exchanges a code, verifies a signature or drains the queue.
// ---------------------------------------------------------------------------

const saved = vi.hoisted(() => {
  const before = {
    key: process.env.SUPABASE_SERVICE_ROLE_KEY,
    deployment: process.env.VERCEL_ENV,
    dynamic: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID,
  };
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.VERCEL_ENV = "preview";
  process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID =
    "00000000-0000-4000-8000-000000000000";
  return before;
});

const h = vi.hoisted(() => ({
  createAdminClient: vi.fn(),
  createServerClient: vi.fn(),
  createSupabaseJsClient: vi.fn(),
  createSessionClient: vi.fn(),
  verifySIWSRequest: vi.fn(),
  retryPendingOnchainActions: vi.fn(),
  isRateLimited: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: h.createAdminClient,
}));
vi.mock("@supabase/ssr", () => ({ createServerClient: h.createServerClient }));
vi.mock("@supabase/supabase-js", () => ({
  createClient: h.createSupabaseJsClient,
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: h.createSessionClient,
}));
vi.mock("@/lib/solana/verify-siws", () => ({
  verifySIWSRequest: h.verifySIWSRequest,
}));
vi.mock("@/lib/solana/onchain-queue", () => ({
  retryPendingOnchainActions: h.retryPendingOnchainActions,
}));
vi.mock("@/lib/rate-limit", () => ({
  isRateLimited: h.isRateLimited,
  getClientIp: () => "203.0.113.1",
}));
vi.mock("@/lib/solana/xp-mint", () => ({ mintXpToWallet: vi.fn() }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ getAll: () => [], set: vi.fn() }),
}));

import { GET as callback } from "../callback/route";
import { POST as dynamicLogin } from "../dynamic/route";
import { POST as linkWallet } from "../link-wallet/route";
import { GET as nonce } from "../nonce/route";
import { POST as unlink } from "../unlink/route";
import { POST as walletLogin } from "../wallet/route";

afterAll(() => {
  const restore = (name: string, value: string | undefined) => {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  };
  restore("SUPABASE_SERVICE_ROLE_KEY", saved.key);
  restore("VERCEL_ENV", saved.deployment);
  restore("NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID", saved.dynamic);
});

beforeEach(() => {
  vi.clearAllMocks();
  h.isRateLimited.mockResolvedValue(false);
});

const post = (path: string, body: unknown) =>
  new NextRequest(`https://app.test${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", host: "app.test" },
    body: JSON.stringify(body),
  });

const routes = [
  [
    "GET /api/auth/callback",
    () =>
      callback(new NextRequest("https://app.test/api/auth/callback?code=c")),
  ],
  [
    "POST /api/auth/dynamic",
    () => dynamicLogin(post("/api/auth/dynamic", { dynamicJwt: "jwt" })),
  ],
  [
    "POST /api/auth/wallet",
    () =>
      walletLogin(
        post("/api/auth/wallet", {
          message: "m",
          signature: [1],
          publicKey: "k",
        })
      ),
  ],
  [
    "GET /api/auth/nonce",
    () =>
      nonce(
        new NextRequest("https://app.test/api/auth/nonce", {
          headers: { host: "app.test" },
        })
      ),
  ],
  [
    "POST /api/auth/link-wallet",
    () =>
      linkWallet(
        post("/api/auth/link-wallet", {
          message: "m",
          signature: [1],
          publicKey: "k",
        })
      ),
  ],
  [
    "POST /api/auth/unlink",
    () => unlink(post("/api/auth/unlink", { provider: "google" })),
  ],
] as const;

describe.each(routes)("%s without the admin client", (_name, call) => {
  it("answers 503 with the fixed message", async () => {
    const res = await call();

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "Service unavailable" });
  });

  it("does no sign-in work first", async () => {
    await call();

    expect(h.createAdminClient).not.toHaveBeenCalled();
    expect(h.createServerClient).not.toHaveBeenCalled();
    expect(h.createSupabaseJsClient).not.toHaveBeenCalled();
    expect(h.createSessionClient).not.toHaveBeenCalled();
    expect(h.verifySIWSRequest).not.toHaveBeenCalled();
    expect(h.retryPendingOnchainActions).not.toHaveBeenCalled();
    expect(h.isRateLimited).not.toHaveBeenCalled();
  });
});
