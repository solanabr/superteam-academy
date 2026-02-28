import { describe, it, expect } from "vitest";

/**
 * Data service tests.
 *
 * The data service now fetches from PostgreSQL via Prisma.
 * These tests validate the data service module loads correctly
 * and exposes the expected functions. Full integration testing
 * of the data pipeline is done via E2E tests.
 */
describe("data-service", () => {
  it("exports getAllCourses function", async () => {
    const mod = await import("@/lib/data-service");
    expect(typeof mod.getAllCourses).toBe("function");
  });

  it("exports getCourseBySlug function", async () => {
    const mod = await import("@/lib/data-service");
    expect(typeof mod.getCourseBySlug).toBe("function");
  });

  it("exports getCoursesByTrack function", async () => {
    const mod = await import("@/lib/data-service");
    expect(typeof mod.getCoursesByTrack).toBe("function");
  });

  it("exports getCoursesByDifficulty function", async () => {
    const mod = await import("@/lib/data-service");
    expect(typeof mod.getCoursesByDifficulty).toBe("function");
  });

  it("exports getAllAchievements function", async () => {
    const mod = await import("@/lib/data-service");
    expect(typeof mod.getAllAchievements).toBe("function");
  });

  it("exports getAllLearningPaths function", async () => {
    const mod = await import("@/lib/data-service");
    expect(typeof mod.getAllLearningPaths).toBe("function");
  });
});
