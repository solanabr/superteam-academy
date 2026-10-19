import { describe, it, expect } from "vitest";
import {
  buildReleaseBody,
  diffCourses,
  inert,
  type Bundle,
  type Compare,
} from "../content-release-body";

const OLD = "a".repeat(40);
const NEW = "b".repeat(40);

const ref = (id: string) => ({ _ref: id });
const course = (slug: string, lessons: string[], title = slug) => ({
  _id: `course-${slug}`,
  slug: { current: slug },
  title,
  modules: [{ lessons: lessons.map(ref) }],
});
const lock = (slots: Record<string, number>, retired: number[] = []) => ({
  version: 1,
  slots,
  retired,
  next: Object.keys(slots).length + retired.length,
});

function bundle(sha: string, overrides: Partial<Bundle> = {}): Bundle {
  return {
    sha,
    courses: [course("alpha", ["lesson-a1"]), course("beta", ["lesson-b1"])],
    lessons: [
      { _id: "lesson-a1", title: "A1" },
      { _id: "lesson-b1", title: "B1" },
    ],
    l10n: {},
    slots: {
      "course-alpha": lock({ "lesson-a1": 0 }),
      "course-beta": lock({ "lesson-b1": 0 }),
    },
    ...overrides,
  };
}

function compare(subjects: string[], total = subjects.length): Compare {
  return {
    status: "ahead",
    behind_by: 0,
    total_commits: total,
    commits: subjects.map((message, i) => ({
      sha: String(i).padStart(40, "c"),
      commit: { message },
    })),
  };
}

describe("diffCourses", () => {
  const before = bundle(OLD);

  it("finds nothing when only the pin moved", () => {
    expect(diffCourses(before, bundle(NEW))).toEqual([]);
  });

  it("flags a lesson edit without flagging the slot set", () => {
    const after = bundle(NEW, {
      lessons: [
        { _id: "lesson-a1", title: "A1, reworded" },
        { _id: "lesson-b1", title: "B1" },
      ],
    });
    expect(diffCourses(before, after)).toEqual([
      { slug: "alpha", kind: "changed", slotsChanged: false },
    ]);
  });

  it("flags a translation-only change", () => {
    const after = bundle(NEW, { l10n: { "course-beta": { en: {} } } });
    expect(diffCourses(before, after)).toEqual([
      { slug: "beta", kind: "changed", slotsChanged: false },
    ]);
  });

  it("flags the slot set when a lesson is added or retired", () => {
    const after = bundle(NEW, {
      courses: [
        course("alpha", ["lesson-a1", "lesson-a2"]),
        course("beta", []),
      ],
      lessons: [
        { _id: "lesson-a1", title: "A1" },
        { _id: "lesson-a2", title: "A2" },
      ],
      slots: {
        "course-alpha": lock({ "lesson-a1": 0, "lesson-a2": 1 }),
        "course-beta": lock({}, [0]),
      },
    });
    expect(diffCourses(before, after)).toEqual([
      { slug: "alpha", kind: "changed", slotsChanged: true },
      { slug: "beta", kind: "changed", slotsChanged: true },
    ]);
  });

  it("marks new courses (which need a Deploy) and removed ones (which cannot get one)", () => {
    const after = bundle(NEW, {
      courses: [course("alpha", ["lesson-a1"]), course("gamma", [])],
      slots: {
        "course-alpha": lock({ "lesson-a1": 0 }),
        "course-gamma": lock({}),
      },
    });
    expect(diffCourses(before, after)).toEqual([
      { slug: "beta", kind: "removed", slotsChanged: false },
      { slug: "gamma", kind: "new", slotsChanged: true },
    ]);
  });
});

describe("buildReleaseBody", () => {
  const before = bundle(OLD);

  it("states the pin move and lists each commit with its short sha and link", () => {
    const body = buildReleaseBody(
      before,
      bundle(NEW),
      compare(["Fix the quiz order\n\nlong body", "Add a banner"])
    );
    expect(body).toContain(
      "Moves `apps/web/content.lock` from academy-courses " +
        `[\`aaaaaaa\`](https://github.com/solanabr/academy-courses/tree/${OLD}) ` +
        `to [\`bbbbbbb\`](https://github.com/solanabr/academy-courses/tree/${NEW})`
    );
    expect(body).toContain(
      `(https://github.com/solanabr/academy-courses/compare/${OLD}...${NEW})`
    );
    expect(body).toContain(
      `- \`Fix the quiz order\` ([\`ccccccc\`](https://github.com/solanabr/academy-courses/commit/${"0".padStart(40, "c")}))`
    );
    expect(body).toContain("- `Add a banner`");
    expect(body).not.toContain("long body");
    expect(body).not.toContain("more");
  });

  it("caps the list at 50 commits and counts the rest", () => {
    const subjects = Array.from({ length: 60 }, (_, i) => `commit ${i}`);
    const body = buildReleaseBody(before, bundle(NEW), compare(subjects, 300));
    expect(body.match(/^- `commit/gm)).toHaveLength(50);
    expect(body).toContain("- and 250 more");
  });

  it("says so when the pin moves back", () => {
    const body = buildReleaseBody(before, bundle(NEW), {
      status: "behind",
      behind_by: 3,
      total_commits: 0,
      commits: [],
    });
    expect(body).toContain(
      "This rolls content back: the pin moves back 3 commit(s)."
    );
  });

  it("names the changed courses and says when none changed", () => {
    expect(buildReleaseBody(before, bundle(NEW), compare([]))).toContain(
      "No course content changed."
    );
    const after = bundle(NEW, {
      courses: [
        course("alpha", ["lesson-a1"], "Alpha v2"),
        course("gamma", []),
      ],
      slots: { ...before.slots, "course-gamma": lock({}) },
    });
    expect(buildReleaseBody(before, after, compare([]))).toContain(
      "Courses changed: `alpha`, `beta` (removed), `gamma` (new)."
    );
  });

  it("puts one Deploy line per slot change in a separate callout", () => {
    const after = bundle(NEW, {
      slots: {
        "course-alpha": lock({ "lesson-a1": 0 }, [1]),
        "course-beta": lock({ "lesson-b1": 0 }),
      },
    });
    const body = buildReleaseBody(before, after, compare([]));
    expect(body).toContain(
      "\n\n> [!IMPORTANT]\n" +
        "> - slot set changed — after merge, run Deploy for `alpha` in /admin/courses\n\n"
    );
    expect(body).not.toContain("Deploy for `beta`");
  });

  it("has no Deploy callout when no slot set moved", () => {
    const body = buildReleaseBody(before, bundle(NEW), compare(["x"]));
    expect(body).not.toContain("[!IMPORTANT]");
  });
});

describe("inert", () => {
  it("renders a subject verbatim: no mention, no autolink, no markdown", () => {
    expect(inert("Merge pull request #77 from @kauenet/`x`")).toBe(
      "`Merge pull request #77 from @kauenet/'x'`"
    );
  });
});
