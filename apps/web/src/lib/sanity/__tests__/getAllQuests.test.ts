/* eslint-disable import/order -- vi.mock must precede importing ../queries. */
import { describe, it, expect, vi, beforeEach } from "vitest";

const fetchMock = vi.fn();
vi.mock("../client", () => ({
  sanityFetch: (query: string, params?: unknown) => fetchMock(query, params),
}));

import { getAllQuests } from "../queries";

function flatten(q: string): string {
  return q.replace(/\s+/g, " ");
}

beforeEach(() => fetchMock.mockReset());

describe("getAllQuests (§15.4a block-model couplings)", () => {
  it("queries challenge lessons by code-block presence and rebuilds moduleLessonMap from inline modules", async () => {
    fetchMock.mockResolvedValue({
      quests: [],
      challengeLessonIds: [],
      moduleLessonMap: [],
    });
    await getAllQuests();
    const q = flatten(fetchMock.mock.calls[0]![0] as string);
    // challengeLessonIds derives from a graded code block, NOT the deleted `type`.
    expect(q).toContain('count(blocks[_type == "code"]) > 0');
    expect(q).not.toContain('type == "challenge"');
    // moduleLessonMap rebuilt from inline course.modules[], NOT module documents.
    expect(q).not.toContain('_type == "module"');
    expect(q).toContain(".modules[]");
  });

  it("maps a blocks-shaped fixture: challenge ids present, dangling refs filtered", async () => {
    fetchMock.mockResolvedValue({
      quests: [
        {
          _id: "quest-1",
          name: "Do a challenge",
          description: null,
          type: "challenge",
          icon: null,
          xpReward: 20,
          targetValue: 1,
          resetType: "daily",
        },
      ],
      challengeLessonIds: ["lesson-code", null],
      moduleLessonMap: [
        { _id: "course-x:mod-1", lessonIds: ["lesson-a", null, "lesson-b"] },
        { _id: "course-x:empty", lessonIds: [null] },
      ],
    });

    const data = await getAllQuests();

    expect(data.challengeLessonIds).toEqual(["lesson-code"]);
    expect(data.quests[0]?.id).toBe("quest-1");
    // Dangling (null) lesson refs are stripped from each module's lessonIds; the
    // composite `courseId:moduleKey` id is preserved.
    expect(data.moduleLessonMap).toEqual([
      { id: "course-x:mod-1", lessonIds: ["lesson-a", "lesson-b"] },
      { id: "course-x:empty", lessonIds: [] },
    ]);
  });
});
