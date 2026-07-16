/* eslint-disable import/order -- vi.mock calls must be hoisted above the
   module-under-test import. */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Hoisted, mutable read result the supabase stub resolves. Each test sets it to
// a success row or a Supabase error to drive the success / stale-on-error paths.
const h = vi.hoisted(() => ({
  readResult: { data: null as { frozen: boolean } | null, error: null } as {
    data: { frozen: boolean } | null;
    error: { message: string } | null;
  },
  maybeSingle: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({
  env: { NEXT_PUBLIC_SUPABASE_URL: "http://localhost" },
}));
vi.mock("@/lib/env.server", () => ({
  serverEnv: { SUPABASE_SERVICE_ROLE_KEY: "srk" },
}));
vi.mock("@/lib/logging", () => ({ logError: vi.fn() }));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => {
            h.maybeSingle();
            return Promise.resolve(h.readResult);
          },
        }),
      }),
    }),
  }),
}));

import {
  isPlatformFrozen,
  __resetPlatformFreezeCacheForTests,
} from "../freeze";

function readSucceeds(frozen: boolean): void {
  h.readResult = { data: { frozen }, error: null };
}
function readErrors(): void {
  h.readResult = { data: null, error: { message: "db down" } };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  __resetPlatformFreezeCacheForTests();
});

afterEach(() => {
  vi.useRealTimers();
});

const TTL_MS = 5_000;

describe("isPlatformFrozen — basic reads", () => {
  it("returns true when the flag row says frozen", async () => {
    readSucceeds(true);
    expect(await isPlatformFrozen()).toBe(true);
  });

  it("returns false when the flag row says not frozen", async () => {
    readSucceeds(false);
    expect(await isPlatformFrozen()).toBe(false);
  });

  it("caches within the TTL — a second call does not re-read", async () => {
    readSucceeds(true);
    expect(await isPlatformFrozen()).toBe(true);
    expect(await isPlatformFrozen()).toBe(true);
    expect(h.maybeSingle).toHaveBeenCalledTimes(1);
  });
});

describe("isPlatformFrozen — stale-on-error (fail to LAST-KNOWN value)", () => {
  it("last-known=true: a read error after a frozen read returns true", async () => {
    readSucceeds(true);
    expect(await isPlatformFrozen()).toBe(true); // caches true, lastKnown=true

    vi.advanceTimersByTime(TTL_MS + 1); // expire the cache
    readErrors();

    // The read now fails; must return the last confirmed value, never throw.
    await expect(isPlatformFrozen()).resolves.toBe(true);
  });

  it("last-known=false: a read error after an unfrozen read returns false", async () => {
    readSucceeds(false);
    expect(await isPlatformFrozen()).toBe(false); // caches false, lastKnown=false

    vi.advanceTimersByTime(TTL_MS + 1);
    readErrors();

    await expect(isPlatformFrozen()).resolves.toBe(false);
  });

  it("cold start (error before any successful read) defaults to false and never throws", async () => {
    readErrors();
    await expect(isPlatformFrozen()).resolves.toBe(false);
  });

  it("recovers to the fresh value once the read succeeds again", async () => {
    readSucceeds(true);
    expect(await isPlatformFrozen()).toBe(true);

    vi.advanceTimersByTime(TTL_MS + 1);
    readErrors();
    expect(await isPlatformFrozen()).toBe(true); // stale-on-error keeps true

    vi.advanceTimersByTime(TTL_MS + 1);
    readSucceeds(false);
    expect(await isPlatformFrozen()).toBe(false); // fresh read wins
  });
});
