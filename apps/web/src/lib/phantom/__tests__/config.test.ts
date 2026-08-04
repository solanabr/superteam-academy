/* eslint-disable import/order -- vi.mock factories are hoisted above imports;
   the env module must be stubbed before the graph loads. */
import { describe, it, expect, vi, beforeEach } from "vitest";

// `env` validates and freezes process.env at module init, so mutating
// process.env in a test would never reach it. Mock the module instead.
const envMock = vi.hoisted(() => ({
  env: { NEXT_PUBLIC_PHANTOM_APP_ID: undefined as string | undefined },
}));
vi.mock("@/lib/env", () => envMock);

import { getPhantomAppId, isPhantomConnectEnabled } from "../config";

beforeEach(() => {
  envMock.env.NEXT_PUBLIC_PHANTOM_APP_ID = undefined;
});

describe("Phantom Connect feature gate (#984)", () => {
  it("is OFF when the app id is unset — the app must build and run without it", () => {
    expect(getPhantomAppId()).toBeNull();
    expect(isPhantomConnectEnabled()).toBe(false);
  });

  it("is OFF for an empty string — an unset Vercel var arrives as ''", () => {
    envMock.env.NEXT_PUBLIC_PHANTOM_APP_ID = "";

    expect(getPhantomAppId()).toBeNull();
    expect(isPhantomConnectEnabled()).toBe(false);
  });

  it("is OFF for whitespace only, rather than sending an unusable id to Phantom", () => {
    // A stray space in .env.local or a dashboard field is a misconfiguration.
    // Failing here beats failing later at connect time with an opaque SDK error.
    envMock.env.NEXT_PUBLIC_PHANTOM_APP_ID = "   ";

    expect(getPhantomAppId()).toBeNull();
    expect(isPhantomConnectEnabled()).toBe(false);
  });

  it("is ON with a configured app id", () => {
    envMock.env.NEXT_PUBLIC_PHANTOM_APP_ID = "app-id-123";

    expect(getPhantomAppId()).toBe("app-id-123");
    expect(isPhantomConnectEnabled()).toBe(true);
  });

  it("trims surrounding whitespace so the id sent to Phantom is exact", () => {
    envMock.env.NEXT_PUBLIC_PHANTOM_APP_ID = "  app-id-123  ";

    expect(getPhantomAppId()).toBe("app-id-123");
  });
});
