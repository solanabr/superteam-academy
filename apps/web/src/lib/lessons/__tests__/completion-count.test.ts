import { describe, it, expect, vi, beforeEach } from "vitest";
import { getLessonCompletionCount } from "../completion-count";

vi.mock("server-only", () => ({}));

// `unstable_cache` throws outside a real Next.js request ("Invariant:
// incrementalCache missing"). Stub it as a passthrough that records its
// key/options so the tests can assert the caching contract (per-course key
// via args, ~5-minute revalidate) while exercising the real loader.
const cacheSpy = vi.hoisted(() => ({
  keyParts: null as string[] | null,
  options: null as { revalidate?: number } | null,
}));
vi.mock("next/cache", () => ({
  unstable_cache: <Args extends unknown[], R>(
    fn: (...args: Args) => Promise<R>,
    keyParts: string[],
    options: { revalidate?: number }
  ) => {
    cacheSpy.keyParts = keyParts;
    cacheSpy.options = options;
    return (...args: Args) => fn(...args);
  },
}));

const logError = vi.hoisted(() => vi.fn());
vi.mock("@/lib/logging", () => ({ logError }));

// `.rpc(...).abortSignal(signal)` — the builder is thenable, so the loader can
// await the chain. abortSignal records the signal it was handed.
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

beforeEach(() => {
  rpc.mockReset();
  logError.mockReset();
  signals.length = 0;
});

describe("getLessonCompletionCount", () => {
  it("returns the RPC's count for the lesson, 0 for a lesson with no rows", async () => {
    rpc.mockResolvedValue({
      data: [
        { lesson_id: "lesson-a", completed_by: 7 },
        { lesson_id: "lesson-b", completed_by: 2 },
      ],
      error: null,
    });
    expect(await getLessonCompletionCount("course-x", "lesson-a")).toBe(7);
    expect(rpc).toHaveBeenCalledWith("course_lesson_completion_counts", {
      p_course_id: "course-x",
    });
    expect(await getLessonCompletionCount("course-x", "lesson-nobody")).toBe(0);
    expect(logError).not.toHaveBeenCalled();
  });

  it("bounds the RPC with an abort signal", async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    await getLessonCompletionCount("course-x", "lesson-a");
    expect(signals).toHaveLength(1);
    expect(signals[0]).toBeInstanceOf(AbortSignal);
  });

  // The whole point of this module: a failure inside the `unstable_cache`
  // callback must NEVER become a throw. A throw there surfaces during
  // background revalidation, attributed to whatever page is rendering, which
  // is how this decorative chip became 98% of the platform's runtime errors.
  it("returns 0 and does not throw on an RPC error", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    await expect(
      getLessonCompletionCount("course-x", "lesson-a")
    ).resolves.toBe(0);
    expect(logError).toHaveBeenCalledTimes(1);
    expect(logError.mock.calls[0]?.[0].errorId).toBe(
      "LESSON_COMPLETION_COUNT_001"
    );
  });

  it("returns 0 and does not throw when the fetch itself rejects", async () => {
    rpc.mockRejectedValue(new TypeError("fetch failed"));
    await expect(
      getLessonCompletionCount("course-x", "lesson-a")
    ).resolves.toBe(0);
    expect(logError).toHaveBeenCalledTimes(1);
  });

  it("returns 0 and does not throw when the request is aborted", async () => {
    rpc.mockRejectedValue(
      Object.assign(new Error("The operation was aborted"), {
        name: "TimeoutError",
      })
    );
    await expect(
      getLessonCompletionCount("course-x", "lesson-a")
    ).resolves.toBe(0);
    expect(logError).toHaveBeenCalledTimes(1);
  });

  it("logs once per failed load, not once per lesson lookup", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    await getLessonCompletionCount("course-x", "lesson-a");
    expect(logError).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it("returns 0 on a null data payload", async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    expect(await getLessonCompletionCount("course-x", "lesson-a")).toBe(0);
  });

  it("caches per course with a 5-minute revalidate", () => {
    expect(cacheSpy.keyParts).toEqual(["lesson-completion-counts"]);
    expect(cacheSpy.options?.revalidate).toBe(300);
  });
});
