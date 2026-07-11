import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { buildStore } from "../build-store";
import { fixtureBundle } from "./fixtures/bundle";

describe("buildStore", () => {
  const store = buildStore(fixtureBundle);

  it("indexes courses by id and by slug", () => {
    expect(store.coursesById.get("course-alpha")?.title).toBe("Alpha Course");
    expect(store.coursesBySlug.get("beta")?._id).toBe("course-beta");
  });

  it("indexes lessons by id and by slug", () => {
    expect(store.lessonsById.get("lesson-intro")?.title).toBe("Intro Lesson");
    expect(store.lessonsBySlug.get("deep-dive")?._id).toBe("lesson-deep-dive");
  });

  it("indexes instructors, achievements, quests and paths by id", () => {
    expect(store.instructorsById.get("instructor-ada")?._type).toBe(
      "instructor"
    );
    expect(store.achievementsById.get("achievement-first")?._type).toBe(
      "achievement"
    );
    expect(store.questsById.get("quest-daily")?._type).toBe("quest");
    expect(store.pathsById.get("path-core")?._type).toBe("learningPath");
  });

  it("keys slot lockfiles by course id", () => {
    expect(store.slotsByCourseId.get("course-alpha")?.slots).toEqual({
      "lesson-intro": 0,
      "lesson-deep-dive": 1,
    });
  });

  it("returns undefined for unknown keys", () => {
    expect(store.coursesById.get("nope")).toBeUndefined();
    expect(store.coursesBySlug.get("nope")).toBeUndefined();
    expect(store.lessonsById.get("nope")).toBeUndefined();
    expect(store.lessonsBySlug.get("nope")).toBeUndefined();
    expect(store.instructorsById.get("nope")).toBeUndefined();
    expect(store.slotsByCourseId.get("nope")).toBeUndefined();
  });

  it("exposes maps that are readonly at the type level and mutation-guarded", () => {
    // The declared type is ReadonlyMap (no `.set` in the public surface). At
    // runtime buildStore hands out frozen Map instances so a cast-away `.set`
    // throws rather than silently corrupting the shared module-scoped index.
    const mutable = store.coursesById as Map<string, unknown>;
    expect(() => mutable.set("x", {})).toThrow();
  });
});

describe("content store security invariant", () => {
  it("store.ts carries the server-only marker", () => {
    // The bundle contains quiz answers, code solutions and hidden tests. store.ts
    // is the only module that value-imports the generated JSON, so it MUST carry
    // `import "server-only"` — a client-component value import then fails the
    // build. Assert the marker at the source level (there is no import-graph
    // harness for this in the repo; content-sync only stubs the module in tests).
    const source = readFileSync(path.resolve(__dirname, "../store.ts"), "utf8");
    expect(source).toMatch(/^import ["']server-only["'];/m);
  });
});
