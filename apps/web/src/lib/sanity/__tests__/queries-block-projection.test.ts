/* eslint-disable import/order -- vi.mock must precede importing ../queries. */
import { describe, it, expect, vi, beforeEach } from "vitest";

const fetchMock = vi.fn();

vi.mock("../client", () => ({
  sanityFetch: (
    query: string,
    params?: unknown,
    revalidate?: number,
    tags?: string[]
  ) => fetchMock(query, params, revalidate, tags),
}));

import * as queries from "../queries";
import { getLessonBySlug, getCourseBySlug } from "../queries";

function flatten(q: string): string {
  return q.replace(/\s+/g, " ");
}
function capturedQuery(i: number): string {
  const call = fetchMock.mock.calls[i];
  if (!call) throw new Error(`sanityFetch not called ${i + 1}x`);
  return call[0] as string;
}

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(null);
});

describe("CS-5: lesson read path is one literal blocks[] projection", () => {
  it("projects blocks[] with _type and _key and the code block's public solution/tests", async () => {
    await getLessonBySlug("course-x", "lesson-y");
    const q = flatten(capturedQuery(0));
    // The projection is a single literal blocks[] — no per-_type conditional.
    expect(q).toContain("blocks[]{");
    expect(q).toContain("_type");
    expect(q).toContain('"key": _key');
    // Post-D4 the code grader reads solution + tests from this same public projection.
    expect(q).toContain("solution");
    expect(q).toContain("tests[]{");
    // The quiz block's only content field — omitting it made every quiz DOA.
    expect(q).toContain("questions[]{");
    // The old hidden-stripping is gone: no `hidden` predicate anywhere.
    expect(q).not.toContain("hidden");
  });

  it("reads inline modules, not module-document dereferences", async () => {
    await getCourseBySlug("course-x");
    const q = flatten(capturedQuery(0));
    // Inline modules: modules[].lessons[]-> , never modules[]->lessons[]-> .
    expect(q).not.toContain("modules[]->");
    expect(q).toContain("modules[]{");
  });

  it("no longer exports the deleted answer-key surface", () => {
    expect("getChallengeAnswerKey" in queries).toBe(false);
    expect("getChallengeAnswerKeyById" in queries).toBe(false);
  });
});
