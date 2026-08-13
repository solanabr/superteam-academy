/* eslint-disable import/order -- vi.mock factories are hoisted above imports. */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { runWalletSiws, type MessageSigner } from "../siws";

const NONCE = { nonce: "n0nce", domain: "st.academy" };
const ADDRESS = "SoLaNaAddr111";

function signerThatSigns(): MessageSigner {
  return {
    signMessage: vi.fn(async () => ({
      signature: new Uint8Array([1, 2, 3]),
      publicKey: ADDRESS,
    })),
  };
}

/** Records the routes hit, so we can assert sign-in vs link routing. */
function mockFetch(
  responder: (url: string) => Response | Promise<Response>
): ReturnType<typeof vi.fn> {
  const fn = vi.fn(async (url: string) => responder(url));
  vi.stubGlobal("fetch", fn);
  return fn;
}

const okJson = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.unstubAllGlobals());

describe("runWalletSiws — routing (#986)", () => {
  // The point of the whole design: a learner with no Supabase session must be
  // SIGNED IN by the wallet, not asked to authenticate a second time.
  it("signs a new learner IN via /api/auth/wallet — one login, not two", async () => {
    const fetchMock = mockFetch((url) =>
      url === "/api/auth/nonce" ? okJson(NONCE) : okJson({ ok: true })
    );

    const out = await runWalletSiws(signerThatSigns(), ADDRESS, false);

    expect(out).toEqual({ ok: true, mode: "signedIn" });
    const urls = fetchMock.mock.calls.map((c) => c[0]);
    expect(urls).toContain("/api/auth/wallet");
    expect(urls).not.toContain("/api/auth/link-wallet");
  });

  it("LINKS when a Supabase session already exists", async () => {
    const fetchMock = mockFetch((url) =>
      url === "/api/auth/nonce" ? okJson(NONCE) : okJson({ ok: true })
    );

    const out = await runWalletSiws(signerThatSigns(), ADDRESS, true);

    expect(out).toEqual({ ok: true, mode: "linked" });
    const urls = fetchMock.mock.calls.map((c) => c[0]);
    expect(urls).toContain("/api/auth/link-wallet");
    expect(urls).not.toContain("/api/auth/wallet");
  });
});

describe("runWalletSiws — the signed payload", () => {
  it("signs the SERVER-issued nonce, never a client-invented one", async () => {
    mockFetch((url) =>
      url === "/api/auth/nonce" ? okJson(NONCE) : okJson({ ok: true })
    );
    const signer = signerThatSigns();

    await runWalletSiws(signer, ADDRESS, false);

    const call = (signer.signMessage as ReturnType<typeof vi.fn>).mock.calls[0];
    if (!call) throw new Error("signMessage was never called");
    const signed = new TextDecoder().decode(call[0] as Uint8Array);
    // Replay protection lives server-side, so the nonce and domain must be the
    // ones the server just issued.
    expect(signed).toContain("n0nce");
    expect(signed).toContain("st.academy");
    expect(signed).toContain(ADDRESS);
  });
});

describe("runWalletSiws — failures", () => {
  it("treats a declined signature as an ordinary choice, not an error", async () => {
    mockFetch(() => okJson(NONCE));
    const signer: MessageSigner = {
      signMessage: vi.fn(async () => {
        throw new Error("User rejected");
      }),
    };

    const out = await runWalletSiws(signer, ADDRESS, false);

    // A distinct key so the caller can stay silent instead of showing an alert.
    expect(out).toEqual({ ok: false, reason: "declined", mode: "signIn" });
  });

  // The mocks below mirror the REAL route contracts (#994 review — an earlier
  // version of this test mocked both routes returning "walletAlreadyLinked",
  // a contract /api/auth/wallet never had, which let an inverted copy mapping
  // ship green). link-wallet 409s with `walletAlreadyLinked` when the wallet
  // belongs to another account; both routes 409 with `differentWalletLinked`
  // when the caller's own account already has a different wallet.
  it("passes the cross-account key through verbatim from link-wallet", async () => {
    mockFetch((url) =>
      url === "/api/auth/nonce"
        ? okJson(NONCE)
        : new Response(JSON.stringify({ error: "walletAlreadyLinked" }), {
            status: 409,
            headers: { "content-type": "application/json" },
          })
    );

    const linking = await runWalletSiws(signerThatSigns(), ADDRESS, true);
    expect(linking).toEqual({
      ok: false,
      reason: "walletAlreadyLinked",
      mode: "link",
    });
  });

  it("passes the own-account key through verbatim from the sign-in route", async () => {
    mockFetch((url) =>
      url === "/api/auth/nonce"
        ? okJson(NONCE)
        : new Response(JSON.stringify({ error: "differentWalletLinked" }), {
            status: 409,
            headers: { "content-type": "application/json" },
          })
    );

    const signingIn = await runWalletSiws(signerThatSigns(), ADDRESS, false);
    expect(signingIn).toEqual({
      ok: false,
      reason: "differentWalletLinked",
      mode: "signIn",
    });
  });

  it("fails with a generic key when the nonce cannot be fetched", async () => {
    mockFetch(() => new Response("", { status: 500 }));

    const out = await runWalletSiws(signerThatSigns(), ADDRESS, false);

    expect(out).toEqual({ ok: false, reason: "authFailed", mode: "signIn" });
  });

  it("falls back to a generic key when the error body is unparseable", async () => {
    mockFetch((url) =>
      url === "/api/auth/nonce"
        ? okJson(NONCE)
        : new Response("<html>502</html>", { status: 502 })
    );

    const out = await runWalletSiws(signerThatSigns(), ADDRESS, false);

    // Never surface raw server output to a learner.
    expect(out).toEqual({ ok: false, reason: "authFailed", mode: "signIn" });
  });
});
