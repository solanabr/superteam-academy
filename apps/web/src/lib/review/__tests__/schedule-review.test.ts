/* eslint-disable import/order -- vi.mock must precede importing the helpers. */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const { rpc, logError } = vi.hoisted(() => ({
  rpc: vi.fn<
    (...a: unknown[]) => Promise<{ data?: unknown; error: unknown }>
  >(),
  logError: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ rpc: (...a: unknown[]) => rpc(...a) }),
}));
vi.mock("@/lib/logging", () => ({ logError }));

import { captureReviewFailure, scheduleReviewItem } from "../schedule-review";

beforeEach(() => {
  vi.clearAllMocks();
  rpc.mockResolvedValue({ error: null });
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("captureReviewFailure", () => {
  it("enqueues the lesson id as the review item_key via the RPC", async () => {
    await captureReviewFailure({
      userId: "user-1",
      lessonId: "lesson-abc",
      reason: "quiz_failed",
    });

    expect(rpc).toHaveBeenCalledWith("schedule_review_item", {
      p_user_id: "user-1",
      p_item_key: "lesson-abc",
    });
    expect(logError).not.toHaveBeenCalled();
  });

  it("does NOT strip/transform the lesson id (PDA-seed convention)", async () => {
    await captureReviewFailure({
      userId: "u",
      lessonId: "lesson-what-is-a-pda",
      reason: "challenge_failed",
    });
    expect(rpc).toHaveBeenCalledWith("schedule_review_item", {
      p_user_id: "u",
      p_item_key: "lesson-what-is-a-pda",
    });
  });

  it("swallows an RPC error — never throws (best-effort contract)", async () => {
    rpc.mockResolvedValue({ error: { message: "boom" } });
    await expect(
      captureReviewFailure({
        userId: "u",
        lessonId: "l",
        reason: "quiz_failed",
      })
    ).resolves.toBeUndefined();
    expect(logError).toHaveBeenCalledTimes(1);
  });

  it("swallows a thrown client error too", async () => {
    rpc.mockRejectedValue(new Error("network down"));
    await expect(
      captureReviewFailure({
        userId: "u",
        lessonId: "l",
        reason: "quiz_failed",
      })
    ).resolves.toBeUndefined();
    expect(logError).toHaveBeenCalledTimes(1);
  });

  it("logs the failing test ids for observability, not the box math", async () => {
    rpc.mockResolvedValue({ error: { message: "x" } });
    await captureReviewFailure({
      userId: "u",
      lessonId: "l",
      reason: "challenge_failed",
      failedTests: [
        { id: "t2", hidden: true, passed: false, detail: "wrong" },
        { id: "t5", hidden: false, passed: false, detail: "wrong" },
      ],
    });
    const arg = logError.mock.calls[0]?.[0] as {
      context: { failedTestIds: string[]; step: string };
    };
    expect(arg.context.failedTestIds).toEqual(["t2", "t5"]);
    expect(arg.context.step).toBe("review_capture");
  });
});

describe("scheduleReviewItem (best-effort review reschedule)", () => {
  it("calls the SECURITY DEFINER RPC with the raw ids and returns true on success", async () => {
    rpc.mockResolvedValue({ data: [{ box: 1 }], error: null });
    await expect(scheduleReviewItem("user-1", "lesson-abc")).resolves.toBe(
      true
    );
    expect(rpc).toHaveBeenCalledWith("schedule_review_item", {
      p_user_id: "user-1",
      p_item_key: "lesson-abc",
    });
  });

  it("returns false (never throws) when the RPC reports an error", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "denied" } });
    await expect(scheduleReviewItem("user-1", "lesson-abc")).resolves.toBe(
      false
    );
  });

  it("returns false (never throws) when the RPC call rejects", async () => {
    rpc.mockRejectedValue(new Error("network down"));
    await expect(scheduleReviewItem("user-1", "lesson-abc")).resolves.toBe(
      false
    );
  });
});
