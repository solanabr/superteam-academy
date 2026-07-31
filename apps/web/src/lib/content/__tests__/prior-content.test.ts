import { describe, it, expect, vi, beforeEach } from "vitest";

// #757: resolve removed-lesson id/title from the PRIOR content revision. Mock
// the GitHub tarball fetch + extractTarball so we can feed a canned repo tree;
// the yaml/JSON parsing under test runs for real.

vi.mock("server-only", () => ({}));

let fetchTarballImpl: () => Promise<Uint8Array>;
let extractImpl: () => Promise<Map<string, Uint8Array>>;

vi.mock("@/lib/github/github", () => ({
  createGitHubClient: () => ({
    fetchTarball: () => fetchTarballImpl(),
  }),
}));
vi.mock("@/lib/content/compile/tarball", () => ({
  extractTarball: () => extractImpl(),
}));

import {
  contentShaFromTxId,
  resolvePriorRemovedLessons,
} from "../prior-content";

const enc = (s: string) => new TextEncoder().encode(s);

/** A prior repo tree: the target course + a decoy, in academy-courses layout. */
function priorTree(): Map<string, Uint8Array> {
  return new Map<string, Uint8Array>([
    // Decoy course — must NOT be matched (proves id-match, not path-guess).
    [
      "courses/other-course/course.yaml",
      enc("id: course-other\nslug: other\n"),
    ],
    [
      "courses/other-course/slots.lock.json",
      enc('{"slots":{"lesson-z":0},"retired":[],"next":1,"version":1}'),
    ],
    // Target course — dir name deliberately unlike the id/slug (#757: dir != slug).
    [
      "courses/building-your-first-solana-program/course.yaml",
      enc("id: course-building-first-program\nslug: building-first-program\n"),
    ],
    [
      "courses/building-your-first-solana-program/slots.lock.json",
      enc(
        '{"slots":{"lesson-bfsp-from-code-to-chain":0,"lesson-bfsp-anatomy-anchor-program":2,"lesson-bfsp-live":5},"retired":[],"next":6,"version":1}'
      ),
    ],
    [
      "courses/building-your-first-solana-program/lessons/intro/lesson.yaml",
      enc("id: lesson-bfsp-from-code-to-chain\ntitle: From Code to Chain\n"),
    ],
    [
      "courses/building-your-first-solana-program/lessons/anatomy/lesson.yaml",
      enc(
        "id: lesson-bfsp-anatomy-anchor-program\ntitle: Anatomy of an Anchor Program\n"
      ),
    ],
  ]);
}

beforeEach(() => {
  fetchTarballImpl = () => Promise.resolve(new Uint8Array([1, 2, 3]));
  extractImpl = () => Promise.resolve(priorTree());
});

describe("contentShaFromTxId", () => {
  const pad = (sha: string): number[] => {
    const bytes: number[] = [];
    for (let i = 0; i < 40; i += 2)
      bytes.push(parseInt(sha.slice(i, i + 2), 16));
    return [...Array(12).fill(0), ...bytes];
  };

  it("decodes a padded 20-byte sha back to 40-hex", () => {
    const sha = "1b74e4a60f8813374219451b60436af832df2d91";
    expect(contentShaFromTxId(pad(sha))).toBe(sha);
  });

  it("returns null for an all-zero content_tx_id (never committed content)", () => {
    expect(contentShaFromTxId(new Array(32).fill(0))).toBeNull();
  });

  it("returns null when the 12-byte pad is not all zero", () => {
    const b = pad("1b74e4a60f8813374219451b60436af832df2d91");
    b[3] = 9;
    expect(contentShaFromTxId(b)).toBeNull();
  });

  it("returns null for a wrong-length input", () => {
    expect(contentShaFromTxId([0, 1, 2])).toBeNull();
  });
});

describe("resolvePriorRemovedLessons", () => {
  it("resolves removed slots to id + title from the prior revision", async () => {
    const map = await resolvePriorRemovedLessons({
      courseId: "course-building-first-program",
      priorSha: "deadbeef",
      removedSlots: [0, 2],
    });
    expect(map.get(0)).toEqual({
      id: "lesson-bfsp-from-code-to-chain",
      title: "From Code to Chain",
    });
    expect(map.get(2)).toEqual({
      id: "lesson-bfsp-anatomy-anchor-program",
      title: "Anatomy of an Anchor Program",
    });
  });

  it("matches the course by id, not by a path guess (dir != slug)", async () => {
    // slug is building-first-program; the dir is building-your-first-solana-program.
    const map = await resolvePriorRemovedLessons({
      courseId: "course-building-first-program",
      priorSha: "x",
      removedSlots: [0],
    });
    expect(map.get(0)?.id).toBe("lesson-bfsp-from-code-to-chain");
  });

  it("records the id with a null title when the prior title is unavailable", async () => {
    // slot 5's lesson is in the prior lock but has no lesson.yaml in the tree.
    const map = await resolvePriorRemovedLessons({
      courseId: "course-building-first-program",
      priorSha: "x",
      removedSlots: [5],
    });
    expect(map.get(5)).toEqual({ id: "lesson-bfsp-live", title: null });
  });

  it("omits a slot absent from the prior lock (keeps the slot-only fallback)", async () => {
    const map = await resolvePriorRemovedLessons({
      courseId: "course-building-first-program",
      priorSha: "x",
      removedSlots: [99],
    });
    expect(map.has(99)).toBe(false);
  });

  it("degrades to empty (and WARNS) when the course id is not found", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const map = await resolvePriorRemovedLessons({
      courseId: "course-does-not-exist",
      priorSha: "x",
      removedSlots: [0],
    });
    expect(map.size).toBe(0);
    // #731 bar: the degrade is not silent — it names the course and the reason.
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("course-does-not-exist")
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("slot-only"));
    warn.mockRestore();
  });

  it("degrades to empty (never throws, and WARNS) when the tarball fetch fails", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    fetchTarballImpl = () => Promise.reject(new Error("GITHUB_TOKEN not set"));
    const map = await resolvePriorRemovedLessons({
      courseId: "course-building-first-program",
      priorSha: "x",
      removedSlots: [0, 2],
    });
    expect(map.size).toBe(0);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("GITHUB_TOKEN not set")
    );
    warn.mockRestore();
  });

  it("short-circuits with no removed slots", async () => {
    let fetched = false;
    fetchTarballImpl = () => {
      fetched = true;
      return Promise.resolve(new Uint8Array());
    };
    const map = await resolvePriorRemovedLessons({
      courseId: "course-building-first-program",
      priorSha: "x",
      removedSlots: [],
    });
    expect(map.size).toBe(0);
    expect(fetched).toBe(false);
  });
});
