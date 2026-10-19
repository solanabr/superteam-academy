import { describe, it, expect } from "vitest";
import {
  buildReleaseBody,
  diffCourses,
  diffDocs,
  inert,
  MAX_BODY,
  type Bundle,
  type Compare,
} from "../content-release-body";

const OLD = "a".repeat(40);
const NEW = "b".repeat(40);
const WALLET_A = "3WECquwCtcKVRYNWBPFWE28ag3b1CDKchLZPXxifAJzQ";
const WALLET_B = "8kMziL5e3qEWhp1nQHEiYLRypymyBVTXNxgZXyQwhbSo";

const ref = (id: string) => ({ _ref: id });
const course = (
  slug: string,
  lessons: string[],
  fields: Record<string, unknown> = {}
) => ({
  _id: `course-${slug}`,
  slug: { current: slug },
  title: slug,
  creator: WALLET_A,
  difficulty: "beginner",
  trackId: 1,
  trackLevel: 1,
  xpPerLesson: 20,
  creatorRewardXp: 30,
  modules: [{ lessons: lessons.map(ref) }],
  ...fields,
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
    achievements: [{ _id: "achievement-first", name: "First", xpReward: 10 }],
    quests: [{ _id: "quest-daily", name: "Daily", xpReward: 20 }],
    paths: [{ _id: "path-start", title: "Start" }],
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

const before = bundle(OLD);
const withCourses = (...courses: ReturnType<typeof course>[]) =>
  bundle(NEW, { courses });

describe("diffCourses", () => {
  it("finds nothing when only the pin moved", () => {
    expect(diffCourses(before, bundle(NEW))).toEqual([]);
  });

  it("flags a lesson edit, and nothing on-chain", () => {
    const after = bundle(NEW, {
      lessons: [
        { _id: "lesson-a1", title: "A1, reworded" },
        { _id: "lesson-b1", title: "B1" },
      ],
    });
    expect(diffCourses(before, after)).toEqual([
      {
        slug: "alpha",
        kind: "changed",
        slotsChanged: false,
        creatorChanged: false,
        immutableChanged: [],
        deployChanged: [],
      },
    ]);
  });

  it("flags a translation-only change", () => {
    const after = bundle(NEW, { l10n: { "course-beta": { en: {} } } });
    expect(diffCourses(before, after).map((c) => c.slug)).toEqual(["beta"]);
  });

  it("names the on-chain fields that moved", () => {
    const after = withCourses(
      course("alpha", ["lesson-a1"], { trackId: 2, trackLevel: 3 }),
      course("beta", ["lesson-b1"], { creator: WALLET_B, xpPerLesson: 15 })
    );
    const [alpha, beta] = diffCourses(before, after);
    expect(alpha).toMatchObject({
      immutableChanged: ["trackId", "trackLevel"],
      creatorChanged: false,
      deployChanged: [],
    });
    expect(beta).toMatchObject({
      immutableChanged: [],
      creatorChanged: true,
      deployChanged: ["xpPerLesson"],
    });
  });

  it("flags the slot set when a lesson is added or retired", () => {
    const after = bundle(NEW, {
      slots: {
        "course-alpha": lock({ "lesson-a1": 0, "lesson-a2": 1 }),
        "course-beta": lock({}, [0]),
      },
    });
    expect(diffCourses(before, after).map((c) => c.slotsChanged)).toEqual([
      true,
      true,
    ]);
  });

  it("marks new and removed courses", () => {
    const after = withCourses(
      course("alpha", ["lesson-a1"]),
      course("gamma", [])
    );
    expect(diffCourses(before, after).map((c) => [c.slug, c.kind])).toEqual([
      ["beta", "removed"],
      ["gamma", "new"],
    ]);
  });
});

describe("diffDocs", () => {
  it("reports new, changed and removed docs by id", () => {
    expect(
      diffDocs(
        [
          { _id: "a", v: 1 },
          { _id: "b", v: 1 },
        ],
        [
          { _id: "b", v: 2 },
          { _id: "c", v: 1 },
        ]
      )
    ).toEqual([
      { id: "a", kind: "removed" },
      { id: "b", kind: "changed" },
      { id: "c", kind: "new" },
    ]);
  });
});

describe("buildReleaseBody", () => {
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

  it("reports achievement, quest and path changes, so a release is never 'nothing changed'", () => {
    const after = bundle(NEW, {
      achievements: [
        { _id: "achievement-first", name: "First", xpReward: 15 },
        { _id: "achievement-new", name: "New" },
      ],
      quests: [],
      paths: [{ _id: "path-start", title: "Start here" }],
    });
    const body = buildReleaseBody(before, after, compare([]));
    expect(body).toContain(
      "Achievements changed: `achievement-first`, `achievement-new` (new)."
    );
    expect(body).toContain("Quests changed: `quest-daily` (removed).");
    expect(body).toContain("Paths changed: `path-start`.");
    expect(body).not.toContain("No course");
    expect(body).not.toContain("Courses changed");
  });

  it("says nothing changed only when nothing did", () => {
    expect(buildReleaseBody(before, bundle(NEW), compare([]))).toContain(
      "No course, achievement, quest or path changed."
    );
  });

  it("names the changed courses", () => {
    const after = withCourses(
      course("alpha", ["lesson-a1"], { title: "Alpha v2" }),
      course("gamma", [])
    );
    expect(buildReleaseBody(before, after, compare([]))).toContain(
      "Courses changed: `alpha`, `beta` (removed), `gamma` (new)."
    );
  });
});

describe("buildReleaseBody — on-chain callouts", () => {
  const callouts = (after: Bundle) => {
    const body = buildReleaseBody(before, after, compare(["a commit"]));
    const block = body.split("> [!IMPORTANT]\n")[1] ?? "";
    // Every callout sits above the commit list.
    if (block)
      expect(body.indexOf("[!IMPORTANT]")).toBeLessThan(
        body.indexOf("- `a commit`")
      );
    return block
      .split("\n\n")[0]!
      .split("\n")
      .filter((l) => l.startsWith("> - "))
      .map((l) => l.slice(4));
  };

  it("has none when nothing on-chain moved", () => {
    const after = bundle(NEW, {
      lessons: [
        { _id: "lesson-a1", title: "A1, reworded" },
        { _id: "lesson-b1", title: "B1" },
      ],
    });
    expect(callouts(after)).toEqual([]);
  });

  it("asks for Deploy when the slot set changed", () => {
    const after = bundle(NEW, {
      slots: { ...before.slots, "course-alpha": lock({ "lesson-a1": 0 }, [1]) },
    });
    expect(callouts(after)).toEqual([
      "slot set changed — after merge, run Deploy for `alpha` in /admin/courses",
    ]);
  });

  it("flags a track change on an existing course as immutable", () => {
    const after = withCourses(
      course("alpha", ["lesson-a1"], { trackId: 0, trackLevel: 0 }),
      course("beta", ["lesson-b1"])
    );
    expect(callouts(after)).toEqual([
      "`alpha`: trackId, trackLevel changed — immutable on-chain once deployed; a deployed course would need a recreate",
    ]);
  });

  it("flags a creator change as immutable", () => {
    const after = withCourses(
      course("alpha", ["lesson-a1"]),
      course("beta", ["lesson-b1"], { creator: WALLET_B })
    );
    expect(callouts(after)).toEqual([
      "`beta`: creator wallet changed — immutable on-chain once deployed; a deployed course would need a recreate",
    ]);
  });

  it("flags xpPerLesson and creatorRewardXp as reaching the chain on Deploy", () => {
    const after = withCourses(
      course("alpha", ["lesson-a1"], { xpPerLesson: 15, creatorRewardXp: 0 }),
      course("beta", ["lesson-b1"])
    );
    expect(callouts(after)).toEqual([
      "`alpha`: xpPerLesson, creatorRewardXp changed — reaches the chain only on Deploy",
    ]);
  });

  it("explains a removed course and asks for Deploy on a new one", () => {
    const after = withCourses(
      course("alpha", ["lesson-a1"]),
      course("gamma", [])
    );
    expect(callouts(after)).toEqual([
      "`beta`: removed — if it was deployed, its pages, lesson completions and credential mint stop working and it drops out of /admin/courses, so deactivate it there before merging",
      "`gamma`: new course — after merge, run Deploy for it in /admin/courses to create it on-chain",
    ]);
  });

  it("asks for Deploy on a new achievement", () => {
    const after = bundle(NEW, {
      achievements: [...before.achievements, { _id: "achievement-new" }],
    });
    expect(callouts(after)).toEqual([
      "`achievement-new`: new achievement — run Deploy for it in /admin/courses before it can be awarded",
    ]);
  });
});

describe("buildReleaseBody — hostile commit subjects", () => {
  const LS = String.fromCharCode(0x2028);
  const hostile = [
    "fix typo\r<!-- hidden",
    "x\r\rCloses #1 cc @octocat [link](https://evil.example)",
    `line${LS}Closes #2`,
    "<!-- open comment",
    "Closes #1",
    "thanks @octocat",
    "y".repeat(5000),
  ];
  const after = bundle(NEW, {
    slots: { ...before.slots, "course-alpha": lock({ "lesson-a1": 0 }, [1]) },
  });
  const body = buildReleaseBody(before, after, compare(hostile));
  const commitLines = body.split("\n").filter((l) => l.startsWith("- `"));

  it("keeps each subject on one line, inside one code span", () => {
    expect(commitLines).toHaveLength(hostile.length);
    for (const line of commitLines) {
      expect(line).toMatch(/^- `[^`]*` \(\[`c+\d*`\]\(https:\/\/github\.com\//);
    }
    expect(body).not.toContain("\r");
    expect(body).not.toContain(LS);
  });

  it("puts the Deploy callout above every subject", () => {
    expect(body.indexOf("run Deploy for `alpha`")).toBeLessThan(
      body.indexOf("fix typo")
    );
  });

  it("caps a long subject", () => {
    const long = commitLines.find((l) => l.includes("yyy"))!;
    expect(long).toContain(`\`${"y".repeat(199)}…\``);
  });

  it("flattens every control and line-separator character", () => {
    expect(inert("a\rb\u0000c\u007fd\u0085e")).toBe("`a b c d e`");
    expect(inert(`a${LS}b${String.fromCharCode(0x2029)}c`)).toBe("`a b c`");
    expect(inert("a`b")).toBe("`a'b`");
  });
});

describe("buildReleaseBody — size", () => {
  it("stays under GitHub's limit by shortening the commit list", () => {
    const many = Array.from({ length: 300 }, (_, i) =>
      course(`course-number-${i}-with-a-long-slug`, [])
    );
    const after = bundle(NEW, { courses: many });
    const subjects = Array.from({ length: 250 }, () => "z".repeat(1000));
    const body = buildReleaseBody(before, after, compare(subjects, 250));
    expect(body.length).toBeLessThan(MAX_BODY);
    expect(body).toContain("new course");
    expect(body).toMatch(/- and \d+ more/);
    expect(body.trimEnd().endsWith("Don't commit to it.")).toBe(true);
  });
});
