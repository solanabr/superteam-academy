import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getCoursesByIds,
  getLessonsByIds,
  getRecommendedCourses,
  getAllCourseTags,
  getAllAchievements,
  isInstructorWallet,
} from "../client-queries";

/**
 * Browser-side fetch wrappers for /api/content/*. Assert the wire contract:
 * URL + params, unwrapping of the `{courses}`/`{lessons}`/… envelopes, the
 * empty-ids fast path (no request), and rejection on a non-OK response.
 */

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function ok(body: unknown) {
  return { ok: true, status: 200, json: async () => body };
}

describe("client-queries — /api/content fetch wrappers", () => {
  it("getCoursesByIds hits the courses route and unwraps", async () => {
    fetchMock.mockResolvedValue(ok({ courses: [{ _id: "course-a" }] }));
    const res = await getCoursesByIds(["course-a", "course-b"]);
    expect(res).toEqual([{ _id: "course-a" }]);
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/content/courses?ids=${encodeURIComponent("course-a,course-b")}`
    );
  });

  it("getCoursesByIds([]) short-circuits without a request", async () => {
    expect(await getCoursesByIds([])).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("getLessonsByIds hits lessons-summary and unwraps", async () => {
    fetchMock.mockResolvedValue(ok({ lessons: [{ _id: "lesson-a" }] }));
    expect(await getLessonsByIds(["lesson-a"])).toEqual([{ _id: "lesson-a" }]);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/content/lessons-summary?ids=lesson-a"
    );
    fetchMock.mockClear();
    expect(await getLessonsByIds([])).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("getRecommendedCourses omits exclude when empty", async () => {
    fetchMock.mockResolvedValue(ok({ courses: [] }));
    await getRecommendedCourses([]);
    expect(fetchMock).toHaveBeenCalledWith("/api/content/recommended");
    await getRecommendedCourses(["course-a"]);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/content/recommended?exclude=course-a"
    );
  });

  it("getAllCourseTags / getAllAchievements unwrap their envelopes", async () => {
    fetchMock.mockResolvedValueOnce(ok({ tags: [{ _id: "course-a" }] }));
    expect(await getAllCourseTags()).toEqual([{ _id: "course-a" }]);
    fetchMock.mockResolvedValueOnce(
      ok({ achievements: [{ id: "achievement-a" }] })
    );
    expect(await getAllAchievements()).toEqual([{ id: "achievement-a" }]);
  });

  it("isInstructorWallet encodes the wallet and unwraps the boolean", async () => {
    fetchMock.mockResolvedValue(ok({ isInstructor: true }));
    expect(await isInstructorWallet("Wal1et")).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/content/instructor-wallet?wallet=Wal1et"
    );
  });

  it("answer-key guard: exports NO full-Lesson reader (those stay server-only)", async () => {
    const clientQueries = await import("../client-queries");
    expect("getLessonBySlug" in clientQueries).toBe(false);
    expect("getLessonByIdForGrading" in clientQueries).toBe(false);
    expect("getCourseBySlug" in clientQueries).toBe(false);
    expect("getCourseById" in clientQueries).toBe(false);
  });

  it("rejects on a non-OK response (matching the old direct-call semantics)", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });
    await expect(getAllCourseTags()).rejects.toThrow("500");
  });
});
