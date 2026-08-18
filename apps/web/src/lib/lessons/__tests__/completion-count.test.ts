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

const rpc = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ rpc }),
}));

beforeEach(() => {
  rpc.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
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
  });

  it("returns 0 on an RPC error (chip must never break the lesson render)", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    expect(await getLessonCompletionCount("course-x", "lesson-a")).toBe(0);
  });

  it("returns 0 when the client itself throws", async () => {
    rpc.mockRejectedValue(new Error("network down"));
    expect(await getLessonCompletionCount("course-x", "lesson-a")).toBe(0);
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
