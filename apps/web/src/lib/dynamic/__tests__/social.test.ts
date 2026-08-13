/* eslint-disable import/order -- vi.mock factories are hoisted above imports. */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * The bridge POST is the seam where a server refusal becomes copy a learner
 * reads, so the mapping is pinned here rather than discovered at an event.
 *
 * The token choice is pinned too: `/api/auth/dynamic` matches accounts on
 * `verified_credentials`, which only the FULL JWT (`legacyToken`) carries —
 * sending `token` (the minified access JWT) would verify and then 403.
 */

const { state, clientRef } = vi.hoisted(() => ({
  state: {
    current: { legacyToken: "full.jwt" as string | null, token: "minified" },
  },
  clientRef: { current: {} as object | null },
}));

vi.mock("@dynamic-labs-sdk/client/core", () => ({
  getCore: () => ({ state: { get: () => state.current } }),
}));
vi.mock("@/lib/dynamic/client", () => ({
  getDynamicClient: () => clientRef.current,
}));

import { bridgeDynamicSession, getDynamicAuthToken } from "../social";

function mockFetch(status: number, body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  state.current = { legacyToken: "full.jwt", token: "minified" };
  clientRef.current = {};
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getDynamicAuthToken", () => {
  it("returns the full JWT, never the minified access token", () => {
    expect(getDynamicAuthToken()).toBe("full.jwt");
  });

  it("returns null when Dynamic is off", () => {
    clientRef.current = null;
    expect(getDynamicAuthToken()).toBeNull();
  });

  it("returns null in cookie-based environments, where no token is readable", () => {
    state.current = { legacyToken: null, token: "minified" };
    expect(getDynamicAuthToken()).toBeNull();
  });
});

describe("bridgeDynamicSession", () => {
  it("posts the full JWT and reports success", async () => {
    const fetchMock = mockFetch(200, { success: true });

    await expect(bridgeDynamicSession()).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/dynamic",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ dynamicJwt: "full.jwt" }),
      })
    );
  });

  it("never calls the route when there is no token", async () => {
    state.current = { legacyToken: null, token: "minified" };
    const fetchMock = mockFetch(200, { success: true });

    await expect(bridgeDynamicSession()).resolves.toEqual({
      ok: false,
      errorKey: "googleBridgeFailed",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ["noVerifiedOauthEmail", 403, "googleEmailUnmatched"],
    ["ambiguousVerifiedEmail", 403, "googleEmailUnmatched"],
    ["accountDeleted", 403, "accountDeleted"],
    ["rateLimited", 429, "otpRateLimited"],
    ["invalidToken", 401, "googleBridgeFailed"],
    ["internalError", 500, "googleBridgeFailed"],
  ])("maps %s (%d) to %s", async (error, status, errorKey) => {
    mockFetch(status, { error });
    await expect(bridgeDynamicSession()).resolves.toEqual({
      ok: false,
      errorKey,
    });
  });

  it("fails closed on a 200 that does not say success", async () => {
    mockFetch(200, {});
    await expect(bridgeDynamicSession()).resolves.toEqual({
      ok: false,
      errorKey: "googleBridgeFailed",
    });
  });

  it("fails closed when the network drops", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await expect(bridgeDynamicSession()).resolves.toEqual({
      ok: false,
      errorKey: "googleBridgeFailed",
    });
  });
});
