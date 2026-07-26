// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { bankCompletion, readBank } from "../progress-bank";
import { replayBankedCompletions } from "../replay-banked";

const base = {
  courseId: "solana-101",
  courseSlug: "solana-101",
  lessonSlug: "intro",
  lessonTitle: "Intro",
  proofs: { c1: { code: "ok" } },
};

function mockFetch(
  handler: (body: unknown) => { status: number; json?: unknown }
) {
  return vi.fn(async (_url: string, init?: RequestInit) => {
    const body = init?.body ? JSON.parse(init.body as string) : {};
    const { status, json } = handler(body);
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => json ?? {},
    } as Response;
  });
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("replayBankedCompletions", () => {
  it("posts every banked entry with the replay marker set", async () => {
    bankCompletion({ ...base, lessonId: "lesson-1" });
    const fetchMock = mockFetch(() => ({
      status: 200,
      json: { success: true },
    }));
    vi.stubGlobal("fetch", fetchMock);

    await replayBankedCompletions();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const sent = JSON.parse(
      (fetchMock.mock.calls[0]![1] as RequestInit).body as string
    );
    expect(sent).toMatchObject({
      lessonId: "lesson-1",
      courseId: "solana-101",
      replay: true,
      proofs: { c1: { code: "ok" } },
    });
  });

  it("removes an entry the server accepts (completed)", async () => {
    bankCompletion({ ...base, lessonId: "lesson-1" });
    vi.stubGlobal(
      "fetch",
      mockFetch(() => ({ status: 200, json: { success: true } }))
    );

    const outcomes = await replayBankedCompletions();

    expect(outcomes[0]!.status).toBe("completed");
    expect(readBank()).toHaveLength(0);
  });

  it("keeps an entry that fails on missing enrollment (needsEnroll)", async () => {
    bankCompletion({ ...base, lessonId: "lesson-1" });
    vi.stubGlobal(
      "fetch",
      mockFetch(() => ({
        status: 403,
        json: { error: "no enrollment", reason: "enrollment_missing" },
      }))
    );

    const outcomes = await replayBankedCompletions();

    expect(outcomes[0]!.status).toBe("needsEnroll");
    expect(readBank()).toHaveLength(1); // preserved for a post-enroll retry
  });

  it("drops an unrecoverable entry after surfacing it (needsRedo)", async () => {
    // An expired/absent reflection seal replays as reflection_required — it can
    // never pass, so it is surfaced then removed rather than nagged forever.
    bankCompletion({ ...base, lessonId: "lesson-1" });
    vi.stubGlobal(
      "fetch",
      mockFetch(() => ({
        status: 403,
        json: { error: "needs reflection", reason: "reflection_required" },
      }))
    );

    const outcomes = await replayBankedCompletions();

    expect(outcomes[0]!.status).toBe("needsRedo");
    expect(outcomes[0]!.reason).toBe("reflection_required");
    expect(readBank()).toHaveLength(0);
  });

  it("keeps an entry on a transient 429/5xx (retry)", async () => {
    bankCompletion({ ...base, lessonId: "lesson-1" });
    vi.stubGlobal(
      "fetch",
      mockFetch(() => ({ status: 429, json: { error: "slow down" } }))
    );

    const outcomes = await replayBankedCompletions();

    expect(outcomes[0]!.status).toBe("retry");
    expect(readBank()).toHaveLength(1);
  });

  it("captures a network error as retry and keeps walking the batch", async () => {
    bankCompletion({ ...base, lessonId: "lesson-1" });
    bankCompletion({ ...base, lessonId: "lesson-2" });
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      } as Response);
    vi.stubGlobal("fetch", fetchMock);

    const outcomes = await replayBankedCompletions();

    expect(outcomes).toHaveLength(2);
    expect(outcomes.map((o) => o.status).sort()).toEqual([
      "completed",
      "retry",
    ]);
    // The failed one is preserved; the succeeded one is gone.
    expect(readBank()).toHaveLength(1);
  });
});
