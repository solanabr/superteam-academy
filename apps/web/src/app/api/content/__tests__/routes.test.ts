/* eslint-disable import/order -- vi.mock calls must precede importing the routes. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const fns = vi.hoisted(() => ({
  getCoursesByIds: vi.fn(),
  getLessonsByIds: vi.fn(),
  getRecommendedCourses: vi.fn(),
  getAllCourseTags: vi.fn(),
  getAllAchievements: vi.fn(),
  isInstructorWallet: vi.fn(),
}));

vi.mock("@/lib/content/queries", () => fns);

import { GET as getCourses } from "../courses/route";
import { GET as getLessons } from "../lessons-summary/route";
import { GET as getRecommended } from "../recommended/route";
import { GET as getTags } from "../tags/route";
import { GET as getAchievements } from "../achievements/route";
import { GET as getInstructorWallet } from "../instructor-wallet/route";
import { MAX_IDS } from "../params";

function req(path: string): NextRequest {
  return new NextRequest(`http://localhost${path}`);
}

beforeEach(() => {
  vi.clearAllMocks();
});

const WALLET = "B7o8NfV81HzjuZFWQTTx3Xdvh77Dqoajwib3kWEnvzJF";

describe("GET /api/content/courses", () => {
  it("passes validated ids through and wraps the result", async () => {
    fns.getCoursesByIds.mockResolvedValue([{ _id: "course-a" }]);
    const res = await getCourses(
      req("/api/content/courses?ids=course-a,course-b")
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ courses: [{ _id: "course-a" }] });
    expect(fns.getCoursesByIds).toHaveBeenCalledWith(["course-a", "course-b"]);
  });

  it("400s on missing ids", async () => {
    expect((await getCourses(req("/api/content/courses"))).status).toBe(400);
    expect(fns.getCoursesByIds).not.toHaveBeenCalled();
  });

  it("400s on malformed ids (shape check)", async () => {
    const res = await getCourses(
      req(
        `/api/content/courses?ids=${encodeURIComponent("course-a,not valid!")}`
      )
    );
    expect(res.status).toBe(400);
    expect(fns.getCoursesByIds).not.toHaveBeenCalled();
  });

  it("400s past the ids cap (no unbounded fan-out)", async () => {
    const ids = Array.from({ length: MAX_IDS + 1 }, (_, i) => `c-${i}`).join(
      ","
    );
    const res = await getCourses(req(`/api/content/courses?ids=${ids}`));
    expect(res.status).toBe(400);
    expect(fns.getCoursesByIds).not.toHaveBeenCalled();
  });

  it("500s with a generic message on failure", async () => {
    fns.getCoursesByIds.mockRejectedValue(new Error("boom secret detail"));
    const res = await getCourses(req("/api/content/courses?ids=course-a"));
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain("secret detail");
  });
});

describe("GET /api/content/lessons-summary", () => {
  it("answer-key guard: response shape is LOCKED to {_id,title,slug} — adversarial extras are stripped", async () => {
    fns.getLessonsByIds.mockResolvedValue([
      {
        _id: "lesson-a",
        title: "A",
        slug: "a",
        // If the underlying fn ever regressed into returning full lessons,
        // the route must not become the leak:
        blocks: [{ _type: "code", solution: "SECRET", tests: ["hidden"] }],
        solution: "SECRET",
      },
    ]);
    const res = await getLessons(
      req("/api/content/lessons-summary?ids=lesson-a")
    );
    const body = (await res.json()) as { lessons: Record<string, unknown>[] };
    expect(body.lessons).toEqual([{ _id: "lesson-a", title: "A", slug: "a" }]);
    for (const lesson of body.lessons) {
      expect(Object.keys(lesson).sort()).toEqual(["_id", "slug", "title"]);
    }
    expect(JSON.stringify(body)).not.toContain("SECRET");
  });

  it("returns lesson SUMMARIES only", async () => {
    fns.getLessonsByIds.mockResolvedValue([
      { _id: "lesson-a", title: "A", slug: "a" },
    ]);
    const res = await getLessons(
      req("/api/content/lessons-summary?ids=lesson-a")
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      lessons: [{ _id: "lesson-a", title: "A", slug: "a" }],
    });
  });

  it("400s on missing ids", async () => {
    expect((await getLessons(req("/api/content/lessons-summary"))).status).toBe(
      400
    );
  });
});

describe("GET /api/content/recommended", () => {
  it("treats an absent exclude as empty (recommend from all)", async () => {
    fns.getRecommendedCourses.mockResolvedValue([]);
    const res = await getRecommended(req("/api/content/recommended"));
    expect(res.status).toBe(200);
    expect(fns.getRecommendedCourses).toHaveBeenCalledWith([]);
  });

  it("passes exclude ids through", async () => {
    fns.getRecommendedCourses.mockResolvedValue([{ _id: "course-b" }]);
    const res = await getRecommended(
      req("/api/content/recommended?exclude=course-a")
    );
    expect(await res.json()).toEqual({ courses: [{ _id: "course-b" }] });
    expect(fns.getRecommendedCourses).toHaveBeenCalledWith(["course-a"]);
  });

  it("400s on malformed exclude ids", async () => {
    const res = await getRecommended(
      req(`/api/content/recommended?exclude=${encodeURIComponent("bad id!")}`)
    );
    expect(res.status).toBe(400);
  });
});

describe("GET /api/content/tags", () => {
  it("wraps getAllCourseTags", async () => {
    fns.getAllCourseTags.mockResolvedValue([{ _id: "course-a", tags: ["x"] }]);
    const res = await getTags();
    expect(await res.json()).toEqual({
      tags: [{ _id: "course-a", tags: ["x"] }],
    });
  });
});

describe("GET /api/content/achievements", () => {
  it("wraps getAllAchievements", async () => {
    fns.getAllAchievements.mockResolvedValue([{ id: "achievement-a" }]);
    const res = await getAchievements();
    expect(await res.json()).toEqual({
      achievements: [{ id: "achievement-a" }],
    });
  });
});

describe("GET /api/content/instructor-wallet", () => {
  it("returns the boolean for a valid base58 wallet", async () => {
    fns.isInstructorWallet.mockResolvedValue(true);
    const res = await getInstructorWallet(
      req(`/api/content/instructor-wallet?wallet=${WALLET}`)
    );
    expect(await res.json()).toEqual({ isInstructor: true });
    expect(fns.isInstructorWallet).toHaveBeenCalledWith(WALLET);
  });

  it("400s on a missing or non-base58 wallet", async () => {
    expect(
      (await getInstructorWallet(req("/api/content/instructor-wallet"))).status
    ).toBe(400);
    expect(
      (
        await getInstructorWallet(
          req("/api/content/instructor-wallet?wallet=not-a-wallet-0OIl")
        )
      ).status
    ).toBe(400);
    expect(fns.isInstructorWallet).not.toHaveBeenCalled();
  });
});
