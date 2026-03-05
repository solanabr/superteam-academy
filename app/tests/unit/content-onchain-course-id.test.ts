import { describe, expect, it, vi } from "vitest";

describe("ContentLocalService on-chain course ids", () => {
  it("injects explicit onChainCourseId into course payloads", async () => {
    vi.resetModules();
    const { ContentLocalService } = await import("@/lib/services/content-local");
    const service = new ContentLocalService();
    const course = await service.getCourse("solana-fundamentals");

    expect(course).not.toBeNull();
    expect(course?.onChainCourseId).toBe("solana-mock-test");
  }, 15000);

  it("allows env overrides for upstream on-chain ids", async () => {
    const previousValue = process.env.COURSE_ONCHAIN_IDS_JSON;
    process.env.COURSE_ONCHAIN_IDS_JSON = JSON.stringify({
      "solana-fundamentals": "academy-course-001",
    });

    try {
      vi.resetModules();
      const { ContentLocalService: ReloadedContentLocalService } = await import("@/lib/services/content-local");
      const service = new ReloadedContentLocalService();
      const course = await service.getCourse("solana-fundamentals");

      expect(course?.onChainCourseId).toBe("academy-course-001");
    } finally {
      if (previousValue === undefined) {
        delete process.env.COURSE_ONCHAIN_IDS_JSON;
      } else {
        process.env.COURSE_ONCHAIN_IDS_JSON = previousValue;
      }
    }
  }, 15000);
});
