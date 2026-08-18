/* eslint-disable import/order -- vi.mock factories are hoisted above imports. */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const h = vi.hoisted(() => ({
  rpc: vi.fn(),
  logError: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ rpc: h.rpc }),
}));
vi.mock("@/lib/logging", () => ({ logError: h.logError }));

import { recordReferralCoursePoint } from "../server";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("recordReferralCoursePoint", () => {
  it("mints via the SECURITY DEFINER rpc with the completing learner + course", async () => {
    h.rpc.mockResolvedValue({ data: true, error: null });
    await recordReferralCoursePoint("user-1", "course-a");
    expect(h.rpc).toHaveBeenCalledWith("record_referral_course_completion", {
      p_user_id: "user-1",
      p_course_id: "course-a",
    });
    expect(h.logError).not.toHaveBeenCalled();
  });

  it("NEVER throws — a referral failure must not fail the finalize webhook", async () => {
    h.rpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    await expect(
      recordReferralCoursePoint("user-1", "course-a")
    ).resolves.toBeUndefined();
    expect(h.logError).toHaveBeenCalledTimes(1);

    h.rpc.mockRejectedValue(new Error("network down"));
    await expect(
      recordReferralCoursePoint("user-1", "course-a")
    ).resolves.toBeUndefined();
    expect(h.logError).toHaveBeenCalledTimes(2);
  });
});
