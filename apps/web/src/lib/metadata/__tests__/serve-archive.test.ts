/* eslint-disable import/order -- vi.mock() must be hoisted above the module
   under test. */
import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

// A bundle that no longer has `achievement-retired` or `course-retired`, and
// an archive that still remembers both.
vi.mock("@/lib/content/store", () => ({
  achievementsById: new Map([
    [
      "achievement-live",
      { _id: "achievement-live", _type: "achievement", name: "Live" },
    ],
  ]),
  coursesById: new Map(),
  archivedAchievementsById: new Map([
    [
      "achievement-live",
      { _id: "achievement-live", _type: "achievement", name: "Old name" },
    ],
    [
      "achievement-retired",
      {
        _id: "achievement-retired",
        _type: "achievement",
        name: "Retired",
        description: "Gone from content",
        category: "special",
        xpReward: 100,
      },
    ],
  ]),
  archivedCoursesById: new Map([
    [
      "course-retired",
      {
        _id: "course-retired",
        _type: "course",
        slug: { _type: "slug", current: "retired" },
        title: "Retired Course",
        description: null,
        difficulty: "beginner",
        thumbnail: null,
      },
    ],
  ]),
}));

import {
  achievementMetadataResponse,
  courseCollectionMetadataResponse,
} from "../serve";

describe("metadata for ids that left content", () => {
  it("still serves a retired achievement from the archive", async () => {
    const res = achievementMetadataResponse("achievement-retired");
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      name: "Retired",
      description: "Gone from content",
    });
  });

  it("still serves a retired course collection from the archive", async () => {
    const res = courseCollectionMetadataResponse("course-retired");
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      name: "Retired Course Credentials",
      external_url: "http://localhost:3000/courses/retired",
    });
  });

  it("prefers the live bundle over the archive", async () => {
    const res = achievementMetadataResponse("achievement-live");
    expect(((await res.json()) as { name: string }).name).toBe("Live");
  });

  it("404s only for an id that was never compiled", () => {
    expect(achievementMetadataResponse("achievement-never").status).toBe(404);
    expect(courseCollectionMetadataResponse("course-never").status).toBe(404);
  });
});
