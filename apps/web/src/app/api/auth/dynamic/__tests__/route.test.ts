/* eslint-disable import/order -- vi.mock calls must precede importing the route. */
import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { SignJWT, exportJWK, generateKeyPair } from "jose";

vi.mock("server-only", () => ({}));

// Swap only after() — see the same shim in the /api/auth/wallet suite.
const { deferred } = vi.hoisted(() => ({
  deferred: vi.fn<(fn: () => Promise<void> | void) => void>(),
}));
vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  after: (fn: () => Promise<void> | void) => {
    deferred(fn);
    return Promise.resolve(fn());
  },
}));

const {
  getDynamicEnvironmentId,
  isRateLimited,
  getClientIp,
  createUser,
  generateLink,
  verifyOtp,
  signOut,
  isAccountDeleted,
  profileSingle,
  profileUpdate,
  shellLookup,
  getUserById,
  updateUserById,
  rpcMock,
  retryPendingOnchainActions,
  generateWalletName,
} = vi.hoisted(() => ({
  getDynamicEnvironmentId: vi.fn<() => string | null>(),
  isRateLimited: vi.fn<() => Promise<boolean>>(),
  getClientIp: vi.fn<() => string>(),
  createUser: vi.fn(),
  generateLink: vi.fn(),
  verifyOtp: vi.fn(),
  signOut: vi.fn().mockResolvedValue({ error: null }),
  isAccountDeleted: vi.fn<(userId: string) => Promise<boolean>>(),
  profileSingle: vi.fn(),
  profileUpdate: vi.fn<(values: Record<string, unknown>) => Promise<unknown>>(),
  shellLookup: vi.fn(),
  getUserById: vi.fn(),
  updateUserById: vi.fn(),
  rpcMock: vi.fn(),
  retryPendingOnchainActions: vi.fn<(userId: string) => Promise<void>>(),
  generateWalletName: vi.fn<() => string>(),
}));

vi.mock("@/lib/dynamic/config", () => ({ getDynamicEnvironmentId }));
vi.mock("@/lib/rate-limit", () => ({ isRateLimited, getClientIp }));
vi.mock("@/lib/auth/account-status", () => ({ isAccountDeleted }));
vi.mock("@/lib/logging", () => ({ logError: vi.fn(), logEvent: vi.fn() }));
vi.mock("@/lib/utils/generate-wallet-name", () => ({ generateWalletName }));
vi.mock("@/lib/solana/onchain-queue", () => ({ retryPendingOnchainActions }));

// Admin (service-role) client — user creation, magic-link minting, and the
// post-login profile read/update (placeholder-username replacement).
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    auth: { admin: { createUser, generateLink, getUserById, updateUserById } },
    rpc: rpcMock,
    from: () => ({
      select: () => ({
        eq: () => ({ single: profileSingle }),
        // The shell-candidate lookup: .in(wallets).neq(id).is(deleted_at).
        in: () => ({ neq: () => ({ is: shellLookup }) }),
      }),
      update: (values: Record<string, unknown>) => ({
        eq: () => profileUpdate(values),
      }),
    }),
  }),
}));

// Anon (cookie-bound) client — verifyOtp() sets the session cookies, signOut()
// clears them again for a tombstoned account.
vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({ auth: { verifyOtp, signOut } }),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({ getAll: () => [], set: () => {} }),
}));

import { POST } from "../route";
import { logEvent } from "@/lib/logging";

/** Shaped like a real Dynamic environment id: a lowercase UUID. */
const ENVIRONMENT_ID = "fb6dd9d1-09f5-43c3-8a8c-eab6e44c37f9";
const KID = "test-signing-key";
/**
 * A second, non-RS* key published in the same key set.
 *
 * Without it the algorithm allowlist is untestable: an HS256 forgery is already
 * refused by `createRemoteJWKSet` (it hands back an RSA public key, which cannot
 * verify an HMAC), so an HS256-only test passes whether the allowlist exists or
 * not. A PS256 key that the resolver WOULD happily return makes the allowlist
 * the only thing standing in the way.
 */
const PS_KID = "test-ps256-key";
const EXISTING_EMAIL = "user@gmail.com";
const GOOGLE_CREDENTIAL_ID = "cred-google";
const EMAIL_CREDENTIAL_ID = "cred-email";

let privateKey: CryptoKey;
let ps256PrivateKey: CryptoKey;
const fetchMock = vi.fn();

/**
 * The credential Dynamic emits for a completed Google sign-in, as observed in
 * a LIVE sandbox token (2026-08-13): no `email` field — the address arrives
 * only in `oauth_emails` (single element) and `oauth_username`. The SDK model
 * claims `email` can be present; tests for that shape pass it explicitly.
 */
function googleCredential(overrides: Record<string, unknown> = {}) {
  return {
    id: GOOGLE_CREDENTIAL_ID,
    format: "oauth",
    oauth_provider: "google",
    oauth_account_id: "google-account-1",
    oauth_username: EXISTING_EMAIL,
    oauth_display_name: "Existing User",
    oauth_emails: [EXISTING_EMAIL],
    signInEnabled: true,
    ...overrides,
  };
}

/** The credential Dynamic emits for an email-OTP sign-in — no `oauth_*` fields. */
function emailOtpCredential(overrides: Record<string, unknown> = {}) {
  return {
    id: EMAIL_CREDENTIAL_ID,
    format: "email",
    email: EXISTING_EMAIL,
    public_identifier: EXISTING_EMAIL,
    signInEnabled: true,
    ...overrides,
  };
}

interface SignOptions {
  claims?: Record<string, unknown>;
  issuer?: string;
  expSecondsFromNow?: number;
}

async function signDynamicJwt({
  claims = {},
  issuer = `app.dynamic.xyz/${ENVIRONMENT_ID}`,
  expSecondsFromNow = 3600,
}: SignOptions = {}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({
    environment_id: ENVIRONMENT_ID,
    scope: "user:basic",
    sid: "session-1",
    verified_credentials: [googleCredential()],
    ...claims,
  })
    .setProtectedHeader({ alg: "RS256", kid: KID })
    .setIssuer(issuer)
    .setSubject("dynamic-user-1")
    .setIssuedAt(now)
    .setExpirationTime(now + expSecondsFromNow)
    .sign(privateKey);
}

function dynamicRequest(body: unknown): NextRequest {
  return new NextRequest("https://app.test/api/auth/dynamic", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

beforeAll(async () => {
  const keyPair = await generateKeyPair("RS256", { extractable: true });
  privateKey = keyPair.privateKey;

  const ps256KeyPair = await generateKeyPair("PS256", { extractable: true });
  ps256PrivateKey = ps256KeyPair.privateKey;

  const publicJwk = await exportJWK(keyPair.publicKey);
  const ps256PublicJwk = await exportJWK(ps256KeyPair.publicKey);
  const jwks = {
    keys: [
      { ...publicJwk, alg: "RS256", use: "sig", kid: KID },
      { ...ps256PublicJwk, alg: "PS256", use: "sig", kid: PS_KID },
    ],
  };

  // jose resolves `fetch` from globalThis at call time, so stubbing it here is
  // enough to serve our own key set in place of Dynamic's.
  fetchMock.mockImplementation(
    async () =>
      new Response(JSON.stringify(jwks), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
  );
  vi.stubGlobal("fetch", fetchMock);
});

beforeEach(() => {
  vi.clearAllMocks();
  getDynamicEnvironmentId.mockReturnValue(ENVIRONMENT_ID);
  isRateLimited.mockResolvedValue(false);
  getClientIp.mockReturnValue("203.0.113.7");
  createUser.mockResolvedValue({ error: null });
  generateLink.mockResolvedValue({
    data: { properties: { hashed_token: "tok_123" } },
    error: null,
  });
  verifyOtp.mockResolvedValue({
    data: { session: { user: { id: "supabase-user-1" } } },
    error: null,
  });
  signOut.mockResolvedValue({ error: null });
  isAccountDeleted.mockResolvedValue(false);
  // Default: an account that already owns a wallet, so the account-fork
  // auto-merge never triggers unless a test opts in.
  profileSingle.mockResolvedValue({
    data: { username: "sol-surfer", wallet_address: "ExistingWallet1111" },
  });
  profileUpdate.mockResolvedValue({ error: null });
  shellLookup.mockResolvedValue({ data: [], error: null });
  getUserById.mockResolvedValue({ data: { user: null }, error: null });
  updateUserById.mockResolvedValue({ data: { user: null }, error: null });
  // `data: null` doubles as the subject rung's default no-match, so every
  // pre-#1055 test keeps exercising the email rung unchanged.
  rpcMock.mockResolvedValue({ data: null, error: null });
  retryPendingOnchainActions.mockResolvedValue(undefined);
  generateWalletName.mockReturnValue("brave-otter");
});

describe("POST /api/auth/dynamic — happy path", () => {
  it("mints a session for the EXISTING account behind a google-verified email", async () => {
    // Supabase rejects the create because the account is already there — which
    // is exactly the signal that this learner must not be forked into a new one.
    createUser.mockResolvedValue({
      error: {
        message: "A user with this email address has already been registered",
      },
    });

    const res = await POST(
      dynamicRequest({ dynamicJwt: await signDynamicJwt() })
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ success: true });

    // The session is minted for THAT email, not a wallet-shaped synthetic one.
    expect(generateLink).toHaveBeenCalledWith({
      type: "magiclink",
      email: EXISTING_EMAIL,
    });
    expect(verifyOtp).toHaveBeenCalledWith({
      type: "magiclink",
      token_hash: "tok_123",
    });
    expect(signOut).not.toHaveBeenCalled();
  });

  it("creates the account, email pre-confirmed, when no user matches", async () => {
    const res = await POST(
      dynamicRequest({ dynamicJwt: await signDynamicJwt() })
    );

    expect(res.status).toBe(200);
    expect(createUser).toHaveBeenCalledWith({
      email: EXISTING_EMAIL,
      email_confirm: true,
    });
    expect(generateLink).toHaveBeenCalledWith({
      type: "magiclink",
      email: EXISTING_EMAIL,
    });
  });

  it("matches 'User@GMAIL.com' onto the existing 'user@gmail.com' account", async () => {
    const token = await signDynamicJwt({
      claims: {
        verified_credentials: [googleCredential({ email: "User@GMAIL.com" })],
      },
    });

    const res = await POST(dynamicRequest({ dynamicJwt: token }));

    expect(res.status).toBe(200);
    // Trim + lowercase, and nothing else — the address that reaches Supabase is
    // byte-identical to the one the existing row was created with.
    expect(generateLink).toHaveBeenCalledWith({
      type: "magiclink",
      email: "user@gmail.com",
    });
  });

  it("accepts a github credential too", async () => {
    const token = await signDynamicJwt({
      claims: {
        signin_credential_id: "cred-github",
        verified_credentials: [
          googleCredential({
            id: "cred-github",
            oauth_provider: "github",
            email: "dev@example.com",
          }),
        ],
      },
    });

    const res = await POST(dynamicRequest({ dynamicJwt: token }));

    expect(res.status).toBe(200);
    expect(generateLink).toHaveBeenCalledWith({
      type: "magiclink",
      email: "dev@example.com",
    });
  });

  it("accepts the issuer under Dynamic's other hostname", async () => {
    const token = await signDynamicJwt({
      issuer: `app.dynamicauth.com/${ENVIRONMENT_ID}`,
    });

    const res = await POST(dynamicRequest({ dynamicJwt: token }));
    expect(res.status).toBe(200);
  });
});

describe("POST /api/auth/dynamic — token rejection", () => {
  it("rejects an HS256-signed token", async () => {
    const now = Math.floor(Date.now() / 1000);
    const forged = await new SignJWT({
      environment_id: ENVIRONMENT_ID,
      scope: "user:basic",
      verified_credentials: [googleCredential()],
    })
      .setProtectedHeader({ alg: "HS256", kid: KID })
      .setIssuer(`app.dynamic.xyz/${ENVIRONMENT_ID}`)
      .setSubject("dynamic-user-1")
      .setIssuedAt(now)
      .setExpirationTime(now + 3600)
      .sign(new TextEncoder().encode("attacker-knows-the-public-key"));

    const res = await POST(dynamicRequest({ dynamicJwt: forged }));

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "invalidToken" });
    expect(createUser).not.toHaveBeenCalled();
    expect(generateLink).not.toHaveBeenCalled();
  });

  it("rejects a PS256 token even though the key set publishes a PS256 key", async () => {
    // The allowlist is the ONLY thing that refuses this one: the key resolver
    // would return a usable PS256 key, and the signature is genuinely valid.
    const now = Math.floor(Date.now() / 1000);
    const token = await new SignJWT({
      environment_id: ENVIRONMENT_ID,
      scope: "user:basic",
      verified_credentials: [googleCredential()],
    })
      .setProtectedHeader({ alg: "PS256", kid: PS_KID })
      .setIssuer(`app.dynamic.xyz/${ENVIRONMENT_ID}`)
      .setSubject("dynamic-user-1")
      .setIssuedAt(now)
      .setExpirationTime(now + 3600)
      .sign(ps256PrivateKey);

    const res = await POST(dynamicRequest({ dynamicJwt: token }));

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "invalidToken" });
    expect(generateLink).not.toHaveBeenCalled();
  });

  it("rejects an unsigned ('none') token", async () => {
    const header = Buffer.from(
      JSON.stringify({ alg: "none", typ: "JWT" })
    ).toString("base64url");
    const payload = Buffer.from(
      JSON.stringify({
        environment_id: ENVIRONMENT_ID,
        scope: "user:basic",
        iss: `app.dynamic.xyz/${ENVIRONMENT_ID}`,
        sub: "dynamic-user-1",
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        verified_credentials: [googleCredential()],
      })
    ).toString("base64url");

    const res = await POST(
      dynamicRequest({ dynamicJwt: `${header}.${payload}.` })
    );

    expect(res.status).toBe(401);
    expect(generateLink).not.toHaveBeenCalled();
  });

  it("rejects a token minted for a different Dynamic environment", async () => {
    const foreign = "00000000-1111-2222-3333-444444444444";
    const token = await signDynamicJwt({
      issuer: `app.dynamic.xyz/${foreign}`,
      claims: { environment_id: foreign },
    });

    const res = await POST(dynamicRequest({ dynamicJwt: token }));

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "invalidToken" });
    expect(generateLink).not.toHaveBeenCalled();
  });

  it("rejects a token whose environment_id disagrees with its issuer", async () => {
    // Correctly-issued token, environment_id swapped out — the corroborating
    // check has to catch it even though `iss` is ours.
    const token = await signDynamicJwt({
      claims: { environment_id: "00000000-1111-2222-3333-444444444444" },
    });

    const res = await POST(dynamicRequest({ dynamicJwt: token }));

    expect(res.status).toBe(401);
    expect(generateLink).not.toHaveBeenCalled();
  });

  it("rejects an expired token", async () => {
    const token = await signDynamicJwt({ expSecondsFromNow: -60 });

    const res = await POST(dynamicRequest({ dynamicJwt: token }));

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "invalidToken" });
    expect(generateLink).not.toHaveBeenCalled();
  });

  it("rejects a token with no exp at all", async () => {
    const token = await new SignJWT({
      environment_id: ENVIRONMENT_ID,
      scope: "user:basic",
      verified_credentials: [googleCredential()],
    })
      .setProtectedHeader({ alg: "RS256", kid: KID })
      .setIssuer(`app.dynamic.xyz/${ENVIRONMENT_ID}`)
      .setSubject("dynamic-user-1")
      .setIssuedAt()
      .sign(privateKey);

    const res = await POST(dynamicRequest({ dynamicJwt: token }));

    expect(res.status).toBe(401);
    expect(generateLink).not.toHaveBeenCalled();
  });

  it("rejects a mid-flow token that has not reached user:basic scope", async () => {
    const token = await signDynamicJwt({
      claims: { scope: "user:pending" },
    });

    const res = await POST(dynamicRequest({ dynamicJwt: token }));

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "incompleteAuth" });
    expect(generateLink).not.toHaveBeenCalled();
  });
});

describe("POST /api/auth/dynamic — email extraction", () => {
  it("refuses an email-OTP-only session (no oauth credential)", async () => {
    const token = await signDynamicJwt({
      claims: { verified_credentials: [emailOtpCredential()] },
    });

    const res = await POST(dynamicRequest({ dynamicJwt: token }));

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({
      error: "noVerifiedOauthEmail",
    });
    expect(createUser).not.toHaveBeenCalled();
    expect(generateLink).not.toHaveBeenCalled();
  });

  it("refuses when the session was established by the OTP credential, even with a google credential linked", async () => {
    const token = await signDynamicJwt({
      claims: {
        signin_credential_id: EMAIL_CREDENTIAL_ID,
        verified_credentials: [emailOtpCredential(), googleCredential()],
      },
    });

    const res = await POST(dynamicRequest({ dynamicJwt: token }));

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({
      error: "noVerifiedOauthEmail",
    });
    expect(generateLink).not.toHaveBeenCalled();
  });

  it("refuses a non-oauth credential even when it carries an oauth_provider", async () => {
    // `oauth_provider` is not proof of an OAuth handshake: Dynamic's ProviderEnum
    // also covers `emailOnly` and `magicLink`, so the field appears on
    // credentials that never involved a provider. `format` is the discriminator,
    // and this shape is refused by that check alone.
    const token = await signDynamicJwt({
      claims: {
        verified_credentials: [
          emailOtpCredential({ oauth_provider: "google" }),
        ],
      },
    });

    const res = await POST(dynamicRequest({ dynamicJwt: token }));

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({
      error: "noVerifiedOauthEmail",
    });
    expect(generateLink).not.toHaveBeenCalled();
  });

  it("refuses an oauth credential carrying no email anywhere", async () => {
    const token = await signDynamicJwt({
      claims: {
        verified_credentials: [googleCredential({ oauth_emails: undefined })],
      },
    });

    const res = await POST(dynamicRequest({ dynamicJwt: token }));

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({
      error: "noVerifiedOauthEmail",
    });
  });

  it("still accepts the SDK-model shape where the credential carries `email` itself", async () => {
    const token = await signDynamicJwt({
      claims: {
        verified_credentials: [
          googleCredential({ email: EXISTING_EMAIL, oauth_emails: undefined }),
        ],
      },
    });

    const res = await POST(dynamicRequest({ dynamicJwt: token }));

    expect(res.status).toBe(200);
    expect(generateLink).toHaveBeenCalledWith({
      type: "magiclink",
      email: EXISTING_EMAIL,
    });
  });

  it("refuses a credential Dynamic marked as not usable for sign-in", async () => {
    const token = await signDynamicJwt({
      claims: {
        verified_credentials: [googleCredential({ signInEnabled: false })],
      },
    });

    const res = await POST(dynamicRequest({ dynamicJwt: token }));

    expect(res.status).toBe(403);
    expect(generateLink).not.toHaveBeenCalled();
  });

  it("refuses an untrusted oauth provider", async () => {
    const token = await signDynamicJwt({
      claims: {
        verified_credentials: [
          googleCredential({
            oauth_provider: "twitter",
            email: "someone@example.com",
          }),
        ],
      },
    });

    const res = await POST(dynamicRequest({ dynamicJwt: token }));

    expect(res.status).toBe(403);
    expect(generateLink).not.toHaveBeenCalled();
  });

  it("refuses a github credential's oauth_emails without Dynamic corroboration", async () => {
    // GitHub lists addresses a user added but never verified. An attacker adds
    // a victim's address to their own GitHub account; without a Dynamic-verified
    // email credential for that exact address in the same token, the fallback
    // must not fire.
    const token = await signDynamicJwt({
      claims: {
        verified_credentials: [
          googleCredential({
            oauth_provider: "github",
            oauth_account_id: "github-account-1",
            oauth_emails: ["victim@gmail.com"],
          }),
        ],
      },
    });

    const res = await POST(dynamicRequest({ dynamicJwt: token }));

    expect(res.status).toBe(403);
    expect(generateLink).not.toHaveBeenCalled();
  });

  it("accepts a github credential's oauth_emails when Dynamic verified the same address (live 2026-08-18 shape)", async () => {
    // The real github credential carries no `email` field — the address lives
    // in oauth_emails, and the same token holds Dynamic's own verified
    // email-format credential for it. That pair is the trust rule.
    const token = await signDynamicJwt({
      claims: {
        signin_credential_id: "cred-github",
        verified_credentials: [
          googleCredential({
            id: "cred-github",
            oauth_provider: "github",
            oauth_account_id: "github-account-1",
            oauth_emails: [EXISTING_EMAIL],
          }),
          {
            id: EMAIL_CREDENTIAL_ID,
            format: "email",
            email: EXISTING_EMAIL,
            signInEnabled: true,
            verifiedAt: "2026-08-18T22:33:55.490Z",
          },
        ],
      },
    });

    const res = await POST(dynamicRequest({ dynamicJwt: token }));

    expect(res.status).toBe(200);
    expect(generateLink).toHaveBeenCalledTimes(1);
  });

  it("refuses github oauth_emails when Dynamic's verified email is a different address", async () => {
    const token = await signDynamicJwt({
      claims: {
        signin_credential_id: "cred-github",
        verified_credentials: [
          googleCredential({
            id: "cred-github",
            oauth_provider: "github",
            oauth_account_id: "github-account-1",
            oauth_emails: ["victim@gmail.com"],
          }),
          {
            id: EMAIL_CREDENTIAL_ID,
            format: "email",
            email: EXISTING_EMAIL,
            signInEnabled: true,
            verifiedAt: "2026-08-18T22:33:55.490Z",
          },
        ],
      },
    });

    const res = await POST(dynamicRequest({ dynamicJwt: token }));

    expect(res.status).toBe(403);
    expect(generateLink).not.toHaveBeenCalled();
  });

  it("refuses github oauth_emails when the email credential is unverified", async () => {
    // verifiedAt absent = Dynamic never proved the inbox — no corroboration.
    const token = await signDynamicJwt({
      claims: {
        signin_credential_id: "cred-github",
        verified_credentials: [
          googleCredential({
            id: "cred-github",
            oauth_provider: "github",
            oauth_account_id: "github-account-1",
            oauth_emails: [EXISTING_EMAIL],
          }),
          {
            id: EMAIL_CREDENTIAL_ID,
            format: "email",
            email: EXISTING_EMAIL,
            signInEnabled: true,
          },
        ],
      },
    });

    const res = await POST(dynamicRequest({ dynamicJwt: token }));

    expect(res.status).toBe(403);
    expect(generateLink).not.toHaveBeenCalled();
  });

  it("refuses a google oauth_emails list with more than one address", async () => {
    // Exactly-one is the invariant Google's OAuth surface guarantees; a
    // multi-element list means the shape assumption no longer holds, and
    // guessing which entry is verified is how takeovers happen.
    const token = await signDynamicJwt({
      claims: {
        verified_credentials: [
          googleCredential({
            oauth_emails: [EXISTING_EMAIL, "second@gmail.com"],
          }),
        ],
      },
    });

    const res = await POST(dynamicRequest({ dynamicJwt: token }));

    expect(res.status).toBe(403);
    expect(generateLink).not.toHaveBeenCalled();
  });

  it("refuses when linked oauth credentials disagree and nothing says which signed in", async () => {
    const token = await signDynamicJwt({
      claims: {
        verified_credentials: [
          googleCredential(),
          googleCredential({
            id: "cred-github",
            oauth_provider: "github",
            email: "other@example.com",
          }),
        ],
      },
    });

    const res = await POST(dynamicRequest({ dynamicJwt: token }));

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({
      error: "ambiguousVerifiedEmail",
    });
    expect(generateLink).not.toHaveBeenCalled();
  });

  it("refuses a minified access token, which carries no verified_credentials", async () => {
    const token = await signDynamicJwt({
      claims: { verified_credentials: undefined },
    });

    const res = await POST(dynamicRequest({ dynamicJwt: token }));

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({
      error: "noVerifiedOauthEmail",
    });
  });
});

describe("POST /api/auth/dynamic — request gating", () => {
  it("503s when the Dynamic environment id is unset", async () => {
    getDynamicEnvironmentId.mockReturnValue(null);

    const res = await POST(dynamicRequest({ dynamicJwt: "irrelevant" }));

    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toEqual({
      error: "dynamicNotConfigured",
    });
    expect(isRateLimited).not.toHaveBeenCalled();
  });

  it("429s when the per-IP limiter trips", async () => {
    isRateLimited.mockResolvedValue(true);

    const res = await POST(
      dynamicRequest({ dynamicJwt: await signDynamicJwt() })
    );

    expect(res.status).toBe(429);
    await expect(res.json()).resolves.toEqual({ error: "rateLimited" });
    expect(isRateLimited).toHaveBeenCalledWith(
      "dynamic-auth",
      "203.0.113.7",
      expect.objectContaining({ maxTokens: 10 })
    );
    expect(generateLink).not.toHaveBeenCalled();
  });

  it("413s an oversized body without parsing it", async () => {
    const res = await POST(dynamicRequest({ dynamicJwt: "x".repeat(20_000) }));

    expect(res.status).toBe(413);
    await expect(res.json()).resolves.toEqual({ error: "requestTooLarge" });
    expect(generateLink).not.toHaveBeenCalled();
  });

  it("400s a body that is not JSON", async () => {
    const res = await POST(dynamicRequest("not json at all"));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "invalidRequest" });
  });

  it("400s a missing dynamicJwt", async () => {
    const res = await POST(dynamicRequest({}));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "invalidRequest" });
  });

  it("refuses a tombstoned account and clears the session it just minted", async () => {
    isAccountDeleted.mockResolvedValue(true);

    const res = await POST(
      dynamicRequest({ dynamicJwt: await signDynamicJwt() })
    );

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: "accountDeleted" });
    expect(isAccountDeleted).toHaveBeenCalledWith("supabase-user-1");
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it("aborts rather than forking the account when createUser fails ambiguously", async () => {
    createUser.mockResolvedValue({
      error: { message: "database is unavailable" },
    });

    const res = await POST(
      dynamicRequest({ dynamicJwt: await signDynamicJwt() })
    );

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "authFailed" });
    expect(generateLink).not.toHaveBeenCalled();
  });
});

describe("POST /api/auth/dynamic — post-login parity with the other chokepoints", () => {
  it("replaces a placeholder username with a generated one", async () => {
    profileSingle.mockResolvedValue({ data: { username: "user_a1b2c3d4" } });

    const res = await POST(
      dynamicRequest({ dynamicJwt: await signDynamicJwt() })
    );

    expect(res.status).toBe(200);
    expect(profileUpdate).toHaveBeenCalledWith({ username: "brave-otter" });
  });

  it("leaves an existing account's real username alone", async () => {
    profileSingle.mockResolvedValue({ data: { username: "gabriel" } });

    const res = await POST(
      dynamicRequest({ dynamicJwt: await signDynamicJwt() })
    );

    expect(res.status).toBe(200);
    // The wallet_kind write (#1179) is the only profile update this account
    // earns — the username is already real.
    expect(profileUpdate).not.toHaveBeenCalledWith(
      expect.objectContaining({ username: expect.anything() })
    );
  });

  it("drains the on-chain retry queue for the signed-in user", async () => {
    const res = await POST(
      dynamicRequest({ dynamicJwt: await signDynamicJwt() })
    );

    expect(res.status).toBe(200);
    expect(retryPendingOnchainActions).toHaveBeenCalledWith("supabase-user-1");
    expect(deferred).toHaveBeenCalledTimes(1);
  });

  it("still signs in when the queue drain rejects", async () => {
    retryPendingOnchainActions.mockRejectedValue(new Error("rpc down"));

    const res = await POST(
      dynamicRequest({ dynamicJwt: await signDynamicJwt() })
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ success: true });
  });

  it("does not drain the queue for a tombstoned account", async () => {
    isAccountDeleted.mockResolvedValue(true);

    const res = await POST(
      dynamicRequest({ dynamicJwt: await signDynamicJwt() })
    );

    expect(res.status).toBe(403);
    expect(retryPendingOnchainActions).not.toHaveBeenCalled();
  });
});

describe("POST /api/auth/dynamic — account-fork auto-merge", () => {
  const SHELL_WALLET = "She11Wa11etAddre55Base58Looking111";
  const SHELL_ID = "shell-user-1";

  function blockchainCredential(overrides: Record<string, unknown> = {}) {
    return {
      id: "wallet-credential-1",
      format: "blockchain",
      address: SHELL_WALLET,
      chain: "solana",
      signInEnabled: true,
      ...overrides,
    };
  }

  /** A walletless target + one matching shell, unless a test overrides. */
  function armMergeScenario() {
    profileSingle.mockResolvedValue({
      data: { username: "sol-surfer", wallet_address: null },
    });
    shellLookup.mockResolvedValue({
      data: [{ id: SHELL_ID, wallet_address: SHELL_WALLET }],
      error: null,
    });
    getUserById.mockResolvedValue({
      data: {
        user: {
          email: `${SHELL_WALLET}@wallet.superteam-lms.local`,
          identities: [{ provider: "email" }],
        },
      },
      error: null,
    });
  }

  const jwtWithWallet = () =>
    signDynamicJwt({
      claims: {
        verified_credentials: [googleCredential(), blockchainCredential()],
      },
    });

  it("merges the shell the JWT's blockchain credential proves ownership of", async () => {
    armMergeScenario();

    const res = await POST(
      dynamicRequest({ dynamicJwt: await jwtWithWallet() })
    );

    expect(res.status).toBe(200);
    expect(rpcMock).toHaveBeenCalledWith("merge_wallet_shell_account", {
      p_target: "supabase-user-1",
      p_shell: SHELL_ID,
      p_wallet: SHELL_WALLET,
    });
  });

  // #1179 MERGE BRANCH. Previously uncovered, and the branch where a naive
  // "a wallet appeared ⇒ external" inference hands this fix's own target user
  // the dead end back: DynamicAuthHandler links the EMBEDDED wallet through
  // /api/auth/wallet with walletKind "embedded", so a Dynamic email sign-in
  // leaves a shell holding an embedded wallet.
  //
  // profileSingle serves three reads in order: the initial profile, the
  // post-merge wallet_address re-read, then recordWalletKind's wallet_kind.
  function armMergeReads(shellKind: string | null) {
    shellLookup.mockResolvedValue({
      data: [
        { id: SHELL_ID, wallet_address: SHELL_WALLET, wallet_kind: shellKind },
      ],
      error: null,
    });
    profileSingle
      .mockResolvedValueOnce({
        data: { username: "sol-surfer", wallet_address: null },
      })
      .mockResolvedValueOnce({ data: { wallet_address: SHELL_WALLET } })
      .mockResolvedValueOnce({ data: { wallet_kind: null } });
  }

  it("carries an EMBEDDED shell's kind through the merge", async () => {
    armMergeScenario();
    armMergeReads("embedded");

    const res = await POST(
      dynamicRequest({ dynamicJwt: await jwtWithWallet() })
    );

    expect(res.status).toBe(200);
    expect(profileUpdate).toHaveBeenCalledWith({ wallet_kind: "embedded" });
  });

  it("carries an EXTERNAL shell's kind through the merge", async () => {
    // A SIWS-with-an-extension shell: the wallet really is external, and the
    // learner really should get the connect modal.
    armMergeScenario();
    armMergeReads("external");

    const res = await POST(
      dynamicRequest({ dynamicJwt: await jwtWithWallet() })
    );

    expect(res.status).toBe(200);
    expect(profileUpdate).toHaveBeenCalledWith({ wallet_kind: "external" });
  });

  it("writes nothing when a pre-migration shell has no kind to carry", async () => {
    // Unknown is the honest answer — and it keeps the pre-#1179 behaviour
    // rather than guessing. The backfill classifies these.
    armMergeScenario();
    armMergeReads(null);

    const res = await POST(
      dynamicRequest({ dynamicJwt: await jwtWithWallet() })
    );

    expect(res.status).toBe(200);
    expect(profileUpdate).not.toHaveBeenCalledWith(
      expect.objectContaining({ wallet_kind: expect.anything() })
    );
  });

  it("revokes the shell's sessions (permanent ban) after a successful merge", async () => {
    armMergeScenario();

    const res = await POST(
      dynamicRequest({ dynamicJwt: await jwtWithWallet() })
    );

    expect(res.status).toBe(200);
    expect(updateUserById).toHaveBeenCalledWith(SHELL_ID, {
      ban_duration: "876600h",
    });
  });

  it("never bans anyone when the merge is refused", async () => {
    armMergeScenario();
    rpcMock.mockResolvedValue({ data: null, error: { message: "refused" } });

    const res = await POST(
      dynamicRequest({ dynamicJwt: await jwtWithWallet() })
    );

    expect(res.status).toBe(200);
    expect(updateUserById).not.toHaveBeenCalled();
  });

  it("a failed ban is non-fatal — sign-in still succeeds", async () => {
    armMergeScenario();
    updateUserById.mockResolvedValue({
      data: { user: null },
      error: { message: "gotrue down" },
    });

    const res = await POST(
      dynamicRequest({ dynamicJwt: await jwtWithWallet() })
    );

    expect(res.status).toBe(200);
    // …but not silently: the ban is retried before giving up (review F2).
    expect(updateUserById).toHaveBeenCalledTimes(3);
  });

  it("never merges on an email match alone — no blockchain credential, no merge", async () => {
    armMergeScenario();

    const res = await POST(
      dynamicRequest({ dynamicJwt: await signDynamicJwt() })
    );

    expect(res.status).toBe(200);
    expect(rpcMock).not.toHaveBeenCalledWith(
      "merge_wallet_shell_account",
      expect.anything()
    );
  });

  it("skips the merge when the signed-in account already has a wallet", async () => {
    armMergeScenario();
    profileSingle.mockResolvedValue({
      data: { username: "sol-surfer", wallet_address: "AlreadyLinked111" },
    });

    const res = await POST(
      dynamicRequest({ dynamicJwt: await jwtWithWallet() })
    );

    expect(res.status).toBe(200);
    expect(rpcMock).not.toHaveBeenCalledWith(
      "merge_wallet_shell_account",
      expect.anything()
    );
  });

  it("refuses to merge an account whose email is not the synthetic wallet form", async () => {
    armMergeScenario();
    getUserById.mockResolvedValue({
      data: {
        user: {
          email: "human@example.com",
          identities: [{ provider: "email" }],
        },
      },
      error: null,
    });

    const res = await POST(
      dynamicRequest({ dynamicJwt: await jwtWithWallet() })
    );

    expect(res.status).toBe(200);
    expect(rpcMock).not.toHaveBeenCalledWith(
      "merge_wallet_shell_account",
      expect.anything()
    );
  });

  it("refuses to merge an account that has a real OAuth identity", async () => {
    armMergeScenario();
    getUserById.mockResolvedValue({
      data: {
        user: {
          email: `${SHELL_WALLET}@wallet.superteam-lms.local`,
          identities: [{ provider: "email" }, { provider: "google" }],
        },
      },
      error: null,
    });

    const res = await POST(
      dynamicRequest({ dynamicJwt: await jwtWithWallet() })
    );

    expect(res.status).toBe(200);
    expect(rpcMock).not.toHaveBeenCalledWith(
      "merge_wallet_shell_account",
      expect.anything()
    );
  });

  it("skips when two shells match — ambiguity never merges", async () => {
    armMergeScenario();
    shellLookup.mockResolvedValue({
      data: [
        { id: SHELL_ID, wallet_address: SHELL_WALLET },
        { id: "shell-user-2", wallet_address: "OtherWallet222" },
      ],
      error: null,
    });

    const res = await POST(
      dynamicRequest({ dynamicJwt: await jwtWithWallet() })
    );

    expect(res.status).toBe(200);
    expect(rpcMock).not.toHaveBeenCalledWith(
      "merge_wallet_shell_account",
      expect.anything()
    );
  });

  it("ignores a blockchain credential from a foreign chain", async () => {
    armMergeScenario();

    const res = await POST(
      dynamicRequest({
        dynamicJwt: await signDynamicJwt({
          claims: {
            verified_credentials: [
              googleCredential(),
              blockchainCredential({ chain: "EVM" }),
            ],
          },
        }),
      })
    );

    expect(res.status).toBe(200);
    expect(rpcMock).not.toHaveBeenCalledWith(
      "merge_wallet_shell_account",
      expect.anything()
    );
  });

  it("ignores a blockchain credential Dynamic says cannot sign in", async () => {
    armMergeScenario();

    const res = await POST(
      dynamicRequest({
        dynamicJwt: await signDynamicJwt({
          claims: {
            verified_credentials: [
              googleCredential(),
              blockchainCredential({ signInEnabled: false }),
            ],
          },
        }),
      })
    );

    expect(res.status).toBe(200);
    expect(rpcMock).not.toHaveBeenCalledWith(
      "merge_wallet_shell_account",
      expect.anything()
    );
  });

  it("still merges when the credential carries no chain field at all", async () => {
    // `chain` is schema-optional; refusing on absence would silently dead the
    // feature on a wire-shape change. Address equality still gates.
    armMergeScenario();

    const res = await POST(
      dynamicRequest({
        dynamicJwt: await signDynamicJwt({
          claims: {
            verified_credentials: [
              googleCredential(),
              blockchainCredential({ chain: undefined }),
            ],
          },
        }),
      })
    );

    expect(res.status).toBe(200);
    expect(rpcMock).toHaveBeenCalledWith(
      "merge_wallet_shell_account",
      expect.anything()
    );
  });

  it("refuses a candidate with NO identities at all", async () => {
    armMergeScenario();
    getUserById.mockResolvedValue({
      data: {
        user: {
          email: `${SHELL_WALLET}@wallet.superteam-lms.local`,
          identities: [],
        },
      },
      error: null,
    });

    const res = await POST(
      dynamicRequest({ dynamicJwt: await jwtWithWallet() })
    );

    expect(res.status).toBe(200);
    expect(rpcMock).not.toHaveBeenCalledWith(
      "merge_wallet_shell_account",
      expect.anything()
    );
  });

  it("still signs in when the merge RPC refuses", async () => {
    armMergeScenario();
    rpcMock.mockResolvedValue({
      data: null,
      error: { message: "merge refused: shell wallet does not match" },
    });

    const res = await POST(
      dynamicRequest({ dynamicJwt: await jwtWithWallet() })
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ success: true });
  });

  it("runs the merge before the on-chain queue drain", async () => {
    armMergeScenario();
    const order: string[] = [];
    rpcMock.mockImplementation(async (fn: string) => {
      if (fn === "merge_wallet_shell_account") order.push("merge");
      return { data: null, error: null };
    });
    retryPendingOnchainActions.mockImplementation(async () => {
      order.push("drain");
    });

    await POST(dynamicRequest({ dynamicJwt: await jwtWithWallet() }));

    expect(order).toEqual(["merge", "drain"]);
  });
});

describe("POST /api/auth/dynamic — subject rung (#1055)", () => {
  const MATCHED_ID = "wallet-first-user-1";
  const SYNTHETIC_EMAIL = "So1WalletPubkey111@wallet.superteam-lms.local";

  /** The token's Google identity is linked to an existing (wallet-first) account. */
  function armSubjectMatch() {
    rpcMock.mockImplementation(async (fn: string) =>
      fn === "find_user_by_oauth_identity"
        ? { data: MATCHED_ID, error: null }
        : { data: null, error: null }
    );
    getUserById.mockResolvedValue({
      data: { user: { id: MATCHED_ID, email: SYNTHETIC_EMAIL } },
      error: null,
    });
  }

  it("mints the session with the MATCHED user's own synthetic email and never calls createUser", async () => {
    armSubjectMatch();

    const res = await POST(
      dynamicRequest({ dynamicJwt: await signDynamicJwt() })
    );

    expect(res.status).toBe(200);
    expect(rpcMock).toHaveBeenCalledWith("find_user_by_oauth_identity", {
      p_provider: "google",
      p_subject: "google-account-1",
    });
    expect(getUserById).toHaveBeenCalledWith(MATCHED_ID);
    // The whole point: the synthetic email an email match could never reach.
    expect(generateLink).toHaveBeenCalledWith({
      type: "magiclink",
      email: SYNTHETIC_EMAIL,
    });
    expect(createUser).not.toHaveBeenCalled();
  });

  it("subject beats email when both would match — the linked account wins over the coincidental one", async () => {
    armSubjectMatch();
    // An account with the token's email ALSO exists; a fallen-through email
    // rung would sign into it. The subject rung must make that unreachable.
    createUser.mockResolvedValue({
      error: {
        message: "A user with this email address has already been registered",
      },
    });

    const res = await POST(
      dynamicRequest({ dynamicJwt: await signDynamicJwt() })
    );

    expect(res.status).toBe(200);
    expect(generateLink).toHaveBeenCalledWith({
      type: "magiclink",
      email: SYNTHETIC_EMAIL,
    });
    expect(generateLink).not.toHaveBeenCalledWith({
      type: "magiclink",
      email: EXISTING_EMAIL,
    });
    expect(createUser).not.toHaveBeenCalled();
  });

  it("resolves through the signin-pinned credential's subject too", async () => {
    armSubjectMatch();

    const res = await POST(
      dynamicRequest({
        dynamicJwt: await signDynamicJwt({
          claims: { signin_credential_id: GOOGLE_CREDENTIAL_ID },
        }),
      })
    );

    expect(res.status).toBe(200);
    expect(rpcMock).toHaveBeenCalledWith("find_user_by_oauth_identity", {
      p_provider: "google",
      p_subject: "google-account-1",
    });
    expect(generateLink).toHaveBeenCalledWith({
      type: "magiclink",
      email: SYNTHETIC_EMAIL,
    });
  });

  it("falls through to the email rung, exactly as before, when no identity matches", async () => {
    const res = await POST(
      dynamicRequest({ dynamicJwt: await signDynamicJwt() })
    );

    expect(res.status).toBe(200);
    expect(createUser).toHaveBeenCalledWith({
      email: EXISTING_EMAIL,
      email_confirm: true,
    });
    expect(generateLink).toHaveBeenCalledWith({
      type: "magiclink",
      email: EXISTING_EMAIL,
    });
  });

  it("403s when two credentials subject-match DIFFERENT users", async () => {
    rpcMock.mockImplementation(
      async (fn: string, args: Record<string, unknown>) => {
        if (fn !== "find_user_by_oauth_identity")
          return { data: null, error: null };
        return {
          data: args.p_provider === "google" ? "user-A" : "user-B",
          error: null,
        };
      }
    );
    // Fallback path: both credentials agree on ONE email (so the email
    // resolution passes) but their subjects belong to different accounts.
    const token = await signDynamicJwt({
      claims: {
        verified_credentials: [
          googleCredential(),
          googleCredential({
            id: "cred-github",
            oauth_provider: "github",
            oauth_account_id: "github-account-1",
            email: EXISTING_EMAIL,
          }),
        ],
      },
    });

    const res = await POST(dynamicRequest({ dynamicJwt: token }));

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({
      error: "conflictingOauthIdentity",
    });
    expect(createUser).not.toHaveBeenCalled();
    expect(generateLink).not.toHaveBeenCalled();
  });

  it("degrades to the email rung and logs when the lookup RPC errors (migration not landed)", async () => {
    rpcMock.mockImplementation(async (fn: string) =>
      fn === "find_user_by_oauth_identity"
        ? {
            data: null,
            error: {
              message:
                "Could not find the function public.find_user_by_oauth_identity in the schema cache",
            },
          }
        : { data: null, error: null }
    );

    const res = await POST(
      dynamicRequest({ dynamicJwt: await signDynamicJwt() })
    );

    expect(res.status).toBe(200);
    expect(createUser).toHaveBeenCalledWith({
      email: EXISTING_EMAIL,
      email_confirm: true,
    });
    expect(generateLink).toHaveBeenCalledWith({
      type: "magiclink",
      email: EXISTING_EMAIL,
    });
    expect(vi.mocked(logEvent)).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "dynamic-auth.subject-lookup-degraded",
      })
    );
  });

  it("skips the rung entirely when the credential carries no oauth_account_id", async () => {
    armSubjectMatch();

    const res = await POST(
      dynamicRequest({
        dynamicJwt: await signDynamicJwt({
          claims: {
            verified_credentials: [
              googleCredential({ oauth_account_id: undefined }),
            ],
          },
        }),
      })
    );

    expect(res.status).toBe(200);
    expect(rpcMock).not.toHaveBeenCalledWith(
      "find_user_by_oauth_identity",
      expect.anything()
    );
    expect(generateLink).toHaveBeenCalledWith({
      type: "magiclink",
      email: EXISTING_EMAIL,
    });
  });

  it("treats an empty-string oauth_account_id as absent", async () => {
    armSubjectMatch();

    const res = await POST(
      dynamicRequest({
        dynamicJwt: await signDynamicJwt({
          claims: {
            verified_credentials: [googleCredential({ oauth_account_id: "" })],
          },
        }),
      })
    );

    expect(res.status).toBe(200);
    expect(rpcMock).not.toHaveBeenCalledWith(
      "find_user_by_oauth_identity",
      expect.anything()
    );
  });

  it("degrades to the email rung when the matched user cannot be fetched", async () => {
    armSubjectMatch();
    getUserById.mockResolvedValue({
      data: { user: null },
      error: { message: "unexpected_failure" },
    });

    const res = await POST(
      dynamicRequest({ dynamicJwt: await signDynamicJwt() })
    );

    expect(res.status).toBe(200);
    expect(createUser).toHaveBeenCalledWith({
      email: EXISTING_EMAIL,
      email_confirm: true,
    });
    expect(generateLink).toHaveBeenCalledWith({
      type: "magiclink",
      email: EXISTING_EMAIL,
    });
  });

  it("still refuses a subject-matched account that is tombstoned", async () => {
    armSubjectMatch();
    isAccountDeleted.mockResolvedValue(true);

    const res = await POST(
      dynamicRequest({ dynamicJwt: await signDynamicJwt() })
    );

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: "accountDeleted" });
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(retryPendingOnchainActions).not.toHaveBeenCalled();
  });

  it("composes with the auto-merge: a subject-matched wallet-first account has a wallet, so no merge runs", async () => {
    armSubjectMatch();
    // The matched account's profile carries its wallet — the merge gate
    // (`!profile.wallet_address`) closes before any shell lookup happens.
    profileSingle.mockResolvedValue({
      data: { username: "sol-surfer", wallet_address: "So1WalletPubkey111" },
    });

    const res = await POST(
      dynamicRequest({
        dynamicJwt: await signDynamicJwt({
          claims: {
            verified_credentials: [
              googleCredential(),
              {
                id: "wallet-credential-1",
                format: "blockchain",
                address: "So1WalletPubkey111",
                chain: "solana",
                signInEnabled: true,
              },
            ],
          },
        }),
      })
    );

    expect(res.status).toBe(200);
    expect(rpcMock).not.toHaveBeenCalledWith(
      "merge_wallet_shell_account",
      expect.anything()
    );
  });
});

describe("POST /api/auth/dynamic — avatar adoption on the bridge", () => {
  const PHOTO = "https://lh3.googleusercontent.com/a/photo=s96-c";

  const jwtWithPhoto = (photo: unknown = PHOTO) =>
    signDynamicJwt({
      claims: {
        verified_credentials: [
          googleCredential({ oauth_account_photos: [photo] }),
        ],
      },
    });

  function avatarUpdates() {
    return profileUpdate.mock.calls
      .map(([values]) => values as Record<string, unknown>)
      .filter((values) => "avatar_url" in values);
  }

  it("adopts the provider photo when the profile has no avatar", async () => {
    profileSingle.mockResolvedValue({
      data: {
        username: "sol-surfer",
        wallet_address: "ExistingWallet1111",
        avatar_url: null,
      },
    });

    const res = await POST(
      dynamicRequest({ dynamicJwt: await jwtWithPhoto() })
    );

    expect(res.status).toBe(200);
    expect(avatarUpdates()).toEqual([{ avatar_url: PHOTO }]);
  });

  it("never overwrites an existing avatar — same provider or custom upload alike", async () => {
    // First-login-only (owner ruling 2026-08-18): an existing provider photo
    // stays even when the same provider offers a fresher URL.
    profileSingle.mockResolvedValue({
      data: {
        username: "sol-surfer",
        wallet_address: "ExistingWallet1111",
        avatar_url: "https://lh3.googleusercontent.com/a/old-rotated-url",
      },
    });
    const res = await POST(
      dynamicRequest({ dynamicJwt: await jwtWithPhoto() })
    );
    expect(res.status).toBe(200);
    expect(avatarUpdates()).toEqual([]);

    vi.clearAllMocks();
    getDynamicEnvironmentId.mockReturnValue(ENVIRONMENT_ID);
    isRateLimited.mockResolvedValue(false);
    getClientIp.mockReturnValue("203.0.113.7");
    createUser.mockResolvedValue({ error: null });
    generateLink.mockResolvedValue({
      data: { properties: { hashed_token: "tok_123" } },
      error: null,
    });
    verifyOtp.mockResolvedValue({
      data: { session: { user: { id: "supabase-user-1" } } },
      error: null,
    });
    isAccountDeleted.mockResolvedValue(false);
    shellLookup.mockResolvedValue({ data: [], error: null });
    rpcMock.mockResolvedValue({ data: [], error: null });
    profileUpdate.mockResolvedValue({ error: null });
    // Custom upload: URL carries the project storage host — never overwritten.
    // Derived from the same env the route reads (CI sets a real URL, so a
    // hardcoded host would silently stop matching there).
    const storageHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).host;
    profileSingle.mockResolvedValue({
      data: {
        username: "sol-surfer",
        wallet_address: "ExistingWallet1111",
        avatar_url: `https://${storageHost}/storage/v1/object/public/avatars/me.png`,
      },
    });
    const res2 = await POST(
      dynamicRequest({ dynamicJwt: await jwtWithPhoto() })
    );
    expect(res2.status).toBe(200);
    expect(avatarUpdates()).toEqual([]);
  });

  it("never ping-pongs: a different provider's photo does not replace the stored one", async () => {
    // Stored = GitHub avatar; incoming = Google photo. Refresh is same-host
    // only — alternating providers must not swap the learner's face on every
    // sign-in. Adopt happens only when no avatar is stored at all.
    profileSingle.mockResolvedValue({
      data: {
        username: "sol-surfer",
        wallet_address: "ExistingWallet1111",
        avatar_url: "https://avatars.githubusercontent.com/u/61333600?v=4",
      },
    });

    const res = await POST(
      dynamicRequest({ dynamicJwt: await jwtWithPhoto() })
    );

    expect(res.status).toBe(200);
    expect(avatarUpdates()).toEqual([]);
  });

  it("drops a non-https photo at the boundary", async () => {
    profileSingle.mockResolvedValue({
      data: {
        username: "sol-surfer",
        wallet_address: "ExistingWallet1111",
        avatar_url: null,
      },
    });

    const res = await POST(
      dynamicRequest({
        dynamicJwt: await jwtWithPhoto("javascript:alert(1)"),
      })
    );

    expect(res.status).toBe(200);
    expect(avatarUpdates()).toEqual([]);
  });
});

// #1179 — the ONE server-authoritative wallet_kind write. It is what lets the
// SIWS routes treat their client-declared kind as a first-write-only hint.
describe("POST /api/auth/dynamic — wallet_kind (#1179)", () => {
  it("marks a wallet-less Dynamic sign-in as embedded", async () => {
    // No wallet yet: the only wallet this account can end up with is the
    // embedded one DynamicAuthHandler is about to create.
    profileSingle.mockResolvedValue({
      data: { username: "gabriel", wallet_address: null },
    });

    const res = await POST(
      dynamicRequest({ dynamicJwt: await signDynamicJwt() })
    );

    expect(res.status).toBe(200);
    expect(profileUpdate).toHaveBeenCalledWith({ wallet_kind: "embedded" });
  });

  it("leaves an account that already holds a wallet alone", async () => {
    // An EXTENSION user signing in with Google through Dynamic reaches this
    // route too. Marking them embedded would offer the wrong recovery path
    // for a wallet they hold in Phantom.
    profileSingle.mockResolvedValue({
      data: { username: "gabriel", wallet_address: "Wa11et1111111111111111" },
    });

    const res = await POST(
      dynamicRequest({ dynamicJwt: await signDynamicJwt() })
    );

    expect(res.status).toBe(200);
    expect(profileUpdate).not.toHaveBeenCalledWith(
      expect.objectContaining({ wallet_kind: expect.anything() })
    );
  });
});
