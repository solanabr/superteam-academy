import { describe, it, expect } from "vitest";
import {
  planStructureMutations,
  type IdGen,
  type CurrentTree,
  type DesiredModule,
} from "../structure";

function makeGen(): IdGen {
  let n = 0;
  return {
    docId: (kind) => `${kind}-new-${++n}`,
    key: () => `key-${++n}`,
    slug: (t) => `slug-${t.toLowerCase()}`,
  };
}

const empty: CurrentTree = { moduleIds: [], lessonIds: [] };

describe("planStructureMutations", () => {
  it("creates new module + lesson and points the course at them", () => {
    const desired: DesiredModule[] = [
      { title: "M1", lessons: [{ title: "L1", type: "content" }] },
    ];
    const muts = planStructureMutations("course-1", empty, desired, makeGen());

    const creates = muts.filter((m) => m.op === "create");
    expect(creates).toHaveLength(2); // module + lesson
    const lesson = creates.find(
      (m) => m.op === "create" && m.doc._type === "lesson"
    );
    const mod = creates.find(
      (m) => m.op === "create" && m.doc._type === "module"
    );
    expect(lesson).toBeTruthy();
    expect(mod).toBeTruthy();

    // Course is patched to reference the new module.
    const coursePatch = muts.find((m) => m.op === "patch" && m.id === "course-1");
    expect(coursePatch).toBeTruthy();
    if (coursePatch && coursePatch.op === "patch") {
      const refs = coursePatch.set.modules as { _ref: string }[];
      expect(refs).toHaveLength(1);
      expect((mod as { op: "create"; doc: { _id: string } }).doc._id).toBe(
        refs[0]?._ref
      );
    }
  });

  it("patches existing docs instead of recreating them", () => {
    const current: CurrentTree = {
      moduleIds: ["mod-1"],
      lessonIds: ["les-1"],
    };
    const desired: DesiredModule[] = [
      {
        _id: "mod-1",
        title: "Renamed",
        lessons: [{ _id: "les-1", title: "Lesson", type: "content" }],
      },
    ];
    const muts = planStructureMutations("c", current, desired, makeGen());

    expect(muts.some((m) => m.op === "create")).toBe(false);
    expect(
      muts.some((m) => m.op === "patch" && m.id === "mod-1")
    ).toBe(true);
    expect(
      muts.some((m) => m.op === "patch" && m.id === "les-1")
    ).toBe(true);
  });

  it("deletes modules and lessons dropped from the tree", () => {
    const current: CurrentTree = {
      moduleIds: ["mod-1", "mod-2"],
      lessonIds: ["les-1", "les-2"],
    };
    // Keep only mod-1/les-1; mod-2 + les-2 removed.
    const desired: DesiredModule[] = [
      {
        _id: "mod-1",
        title: "M1",
        lessons: [{ _id: "les-1", title: "L1", type: "content" }],
      },
    ];
    const muts = planStructureMutations("c", current, desired, makeGen());

    const deletes = muts.filter((m) => m.op === "delete").map((m) => m.id);
    expect(deletes).toContain("mod-2");
    expect(deletes).toContain("les-2");
    expect(deletes).not.toContain("mod-1");
    expect(deletes).not.toContain("les-1");
  });

  it("writes order from array position", () => {
    const desired: DesiredModule[] = [
      { title: "A", lessons: [] },
      {
        title: "B",
        lessons: [
          { title: "b1", type: "content" },
          { title: "b2", type: "content" },
        ],
      },
    ];
    const muts = planStructureMutations("c", empty, desired, makeGen());
    const modCreates = muts.filter(
      (m) => m.op === "create" && m.doc._type === "module"
    ) as { op: "create"; doc: Record<string, unknown> }[];
    expect(modCreates[0]?.doc.order).toBe(0);
    expect(modCreates[1]?.doc.order).toBe(1);

    const lessonCreates = muts.filter(
      (m) => m.op === "create" && m.doc._type === "lesson"
    ) as { op: "create"; doc: Record<string, unknown> }[];
    expect(lessonCreates.map((l) => l.doc.order)).toEqual([0, 1]);
  });

  it("maps challenge tests into inline objects with a hidden flag", () => {
    const desired: DesiredModule[] = [
      {
        title: "M",
        lessons: [
          {
            title: "Chal",
            type: "challenge",
            language: "rust",
            tests: [
              {
                id: "t1",
                description: "d",
                input: "1",
                expectedOutput: "2",
                hidden: true,
              },
            ],
          },
        ],
      },
    ];
    const muts = planStructureMutations("c", empty, desired, makeGen());
    const lesson = muts.find(
      (m) => m.op === "create" && m.doc._type === "lesson"
    ) as { op: "create"; doc: Record<string, unknown> };
    const tests = lesson.doc.tests as Record<string, unknown>[];
    expect(tests[0]).toMatchObject({
      id: "t1",
      description: "d",
      input: "1",
      expectedOutput: "2",
      hidden: true,
    });
  });
});
