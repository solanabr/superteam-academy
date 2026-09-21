import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const cacheSpy = vi.hoisted(() => ({
  keyParts: null as string[] | null,
  options: null as { revalidate?: number; tags?: string[] } | null,
}));
vi.mock("next/cache", () => ({
  unstable_cache: <Args extends unknown[], R>(
    fn: (...args: Args) => Promise<R>,
    keyParts: string[],
    options: { revalidate?: number; tags?: string[] }
  ) => {
    cacheSpy.keyParts = keyParts;
    cacheSpy.options = options;
    return (...args: Args) => fn(...args);
  },
}));

const logError = vi.hoisted(() => vi.fn());
vi.mock("@/lib/logging", () => ({ logError }));

const rpc = vi.hoisted(() => vi.fn());
const signals = vi.hoisted(() => [] as AbortSignal[]);
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    rpc: (...args: unknown[]) => {
      const result = rpc(...args);
      return {
        abortSignal(signal: AbortSignal) {
          signals.push(signal);
          return result;
        },
      };
    },
  }),
}));

const { getPlatformStats, PLATFORM_STATS_CACHE_TAG } = await import("../stats");

const ZEROS = {
  totalXpMinted: 0,
  enrolledBuilders: 0,
  credentialsIssued: 0,
};

beforeEach(() => {
  rpc.mockReset();
  logError.mockReset();
  signals.length = 0;
});

describe("getPlatformStats", () => {
  it("maps the RPC row onto the stats shape", async () => {
    rpc.mockResolvedValue({
      data: [{ total_xp: 425, builders: 361, credentials: 74 }],
      error: null,
    });
    expect(await getPlatformStats()).toEqual({
      totalXpMinted: 425,
      enrolledBuilders: 361,
      credentialsIssued: 74,
    });
    expect(rpc).toHaveBeenCalledWith("get_platform_stats");
    expect(logError).not.toHaveBeenCalled();
  });

  it("is cached for 5 minutes under the platform-stats tag", () => {
    expect(cacheSpy.keyParts).toEqual(["platform-stats"]);
    expect(cacheSpy.options?.revalidate).toBe(300);
    expect(cacheSpy.options?.tags).toEqual([PLATFORM_STATS_CACHE_TAG]);
    expect(PLATFORM_STATS_CACHE_TAG).toBe("platform-stats");
  });

  it("bounds the RPC with an abort signal", async () => {
    rpc.mockResolvedValue({
      data: [{ total_xp: 1, builders: 1, credentials: 1 }],
      error: null,
    });
    await getPlatformStats();
    expect(signals).toHaveLength(1);
    expect(signals[0]).toBeInstanceOf(AbortSignal);
  });

  it("degrades to zeros without throwing on an RPC error", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    await expect(getPlatformStats()).resolves.toEqual(ZEROS);
    expect(logError).toHaveBeenCalledTimes(1);
    expect(logError.mock.calls[0]?.[0].errorId).toBe("PLATFORM_STATS_001");
  });

  it("degrades to zeros when the fetch itself rejects", async () => {
    rpc.mockRejectedValue(new TypeError("fetch failed"));
    await expect(getPlatformStats()).resolves.toEqual(ZEROS);
    expect(logError).toHaveBeenCalledTimes(1);
  });

  it("degrades to zeros when the RPC returns no row", async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    await expect(getPlatformStats()).resolves.toEqual(ZEROS);
    expect(logError).toHaveBeenCalledTimes(1);
  });
});
