/* eslint-disable import/order -- vi.mock must be declared before importing the
   module under test (../queries), which forces an import after non-import code. */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Capture the GROQ query string passed to sanityFetch so we can assert on the
// projection shape (P0-C4 regression: the lesson payload must never contain the
// solution or hidden tests).
const fetchMock = vi.fn();

vi.mock("../client", () => ({
  sanityFetch: (query: string, params?: unknown, revalidate?: number) =>
    fetchMock(query, params, revalidate),
}));

import {
  getLessonBySlug,
  getCourseBySlug,
  getChallengeAnswerKey,
} from "../queries";

/**
 * Normalize a GROQ string so we can match projected fields regardless of
 * whitespace/newlines. Returns the query with runs of whitespace collapsed.
 */
function flatten(q: string): string {
  return q.replace(/\s+/g, " ");
}

/** Return the captured GROQ query string from the Nth sanityFetch call. */
function capturedQuery(callIndex: number): string {
  const call = fetchMock.mock.calls[callIndex];
  if (!call) throw new Error(`sanityFetch was not called ${callIndex + 1}x`);
  return call[0] as string;
}

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(null);
});

describe("P0-C4: client lesson queries do not leak answers", () => {
  it("getLessonBySlug never projects `solution` or `tutorNotes`", async () => {
    await getLessonBySlug("course-x", "lesson-y");
    const query = flatten(capturedQuery(0));

    // No server-only answer-key field is projected anywhere in the lesson
    // selection: `solution` is the reference answer, `tutorNotes` is the private
    // note that steers the AI Partner — both must stay in answerKeyProjection.
    expect(query).not.toMatch(/\bsolution\b/);
    expect(query).not.toMatch(/\btutorNotes\b/);
  });

  it("getLessonBySlug only selects visible tests (hidden != true) and drops the hidden flag", async () => {
    await getLessonBySlug("course-x", "lesson-y");
    const query = flatten(capturedQuery(0));

    // Tests are filtered to exclude hidden ones at the source.
    expect(query).toContain('"tests": tests[hidden != true]');
    // The projected test shape lists only client-safe fields — `hidden` is not
    // among the projected keys. `id` is projected as coalesce(id, _key) so each
    // test carries a stable, unique key (Sanity items key on `_key`).
    expect(query).toMatch(
      /"tests": tests\[hidden != true\]\{ "id": coalesce\(id, _key\), description, input, expectedOutput \}/
    );
    // Raw `tests,` (unfiltered, includes hidden) must not be projected.
    expect(query).not.toMatch(/\btests,/);
  });

  it("getCourseBySlug (course-detail payload) also strips solution + hidden tests", async () => {
    await getCourseBySlug("course-x");
    const query = flatten(capturedQuery(0));

    expect(query).not.toMatch(/\bsolution\b/);
    expect(query).not.toMatch(/\btutorNotes\b/);
    expect(query).toContain('"tests": tests[hidden != true]');
  });

  it("the lesson payload returned to the client carries no solution/hidden keys", async () => {
    // Simulate what Sanity returns for the (already-projected) query: because the
    // projection excludes them, neither `solution` nor `hidden` is present.
    fetchMock.mockResolvedValueOnce({
      _id: "lesson-y",
      title: "Challenge",
      slug: "lesson-y",
      type: "challenge",
      code: "// start",
      tests: [
        { id: "t1", description: "visible", input: "1", expectedOutput: "1" },
      ],
      hints: ["try harder"],
      order: 0,
    });

    const lesson = await getLessonBySlug("course-x", "lesson-y");
    const serialized = JSON.stringify(lesson);

    expect(serialized).not.toContain("solution");
    expect(serialized).not.toContain("tutorNotes");
    expect(serialized).not.toContain("hidden");
    // sanity check the payload is otherwise intact
    expect(lesson).toMatchObject({ type: "challenge", code: "// start" });
  });

  it("getChallengeAnswerKey (SERVER-ONLY) does include the answer key and is uncached", async () => {
    await getChallengeAnswerKey("course-x", "lesson-y");
    const call = fetchMock.mock.calls[0];
    if (!call) throw new Error("sanityFetch was not called");
    const [query, , revalidate] = call as [string, unknown, number];
    const flat = flatten(query);

    // This is the deliberate server-side counterpart — it DOES select the
    // answer key, including hidden tests + solution, and must be fetched fresh
    // (revalidate=0, never via the public CDN).
    expect(flat).toContain("solution");
    expect(flat).toContain("tutorNotes");
    expect(flat).toContain("hidden");
    expect(revalidate).toBe(0);
  });
});
