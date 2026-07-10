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

import {
  getInstructorCourses,
  isInstructorWallet,
  COURSES_CACHE_TAG,
} from "../queries";

function flatten(q: string): string {
  return q.replace(/\s+/g, " ").trim();
}

beforeEach(() => fetchMock.mockReset());

describe("getInstructorCourses", () => {
  it("queries courses by instructor wallet, gated only on synced on-chain status", async () => {
    fetchMock.mockResolvedValue([]);
    await getInstructorCourses("WALLET123");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [query, params, , tags] = fetchMock.mock.calls[0]!;
    const q = flatten(query as string);

    expect(q).toContain('_type == "course"');
    expect(q).toContain("instructor->wallet == $wallet");
    expect(q).toContain('onChainStatus.status == "synced"');
    expect(q).toContain('"slug": slug.current');
    expect(q).toContain("_id");
    expect(q).toContain("title");

    // Deliberately NOT gated by the public authoring/active gates — instructors
    // must see their own deactivated / not-yet-approved courses too, unlike
    // every public catalog query in this file.
    expect(q).not.toContain("authoringStatus");
    expect(q).not.toContain("onChainStatus.isActive");

    expect(params).toEqual({ wallet: "WALLET123" });
    // Uses catalogFetch, matching the sibling course queries' fetch wrapper.
    expect(tags).toEqual([COURSES_CACHE_TAG]);
  });

  it("returns whatever sanityFetch resolves, unmodified", async () => {
    const rows = [{ _id: "c1", title: "Rust 101", slug: "rust-101" }];
    fetchMock.mockResolvedValue(rows);
    const result = await getInstructorCourses("WALLET123");
    expect(result).toEqual(rows);
  });
});

describe("isInstructorWallet", () => {
  it("queries instructor existence by wallet via a count() boolean, using catalogFetch", async () => {
    fetchMock.mockResolvedValue(true);
    await isInstructorWallet("WALLET123");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [query, params, , tags] = fetchMock.mock.calls[0]!;
    const q = flatten(query as string);

    expect(q).toContain(
      'count(*[_type == "instructor" && wallet == $wallet]) > 0'
    );
    expect(params).toEqual({ wallet: "WALLET123" });
    expect(tags).toEqual([COURSES_CACHE_TAG]);
  });

  it("returns the boolean sanityFetch resolves", async () => {
    fetchMock.mockResolvedValue(false);
    await expect(isInstructorWallet("nope")).resolves.toBe(false);
  });
});
