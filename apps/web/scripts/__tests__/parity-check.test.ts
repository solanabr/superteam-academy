import { describe, it, expect } from "vitest";
import {
  canonicalize,
  normalizeAssetUrls,
  diffParity,
  type Doc,
} from "../parity-check";

// ── canonicalize ─────────────────────────────────────────────────────────────

describe("canonicalize", () => {
  it("strips Sanity metadata, sync/onChainStatus/authoringStatus, and nulls", () => {
    const sanity: Doc = {
      _id: "course-x",
      _type: "course",
      _rev: "abc",
      _createdAt: "2026-01-01T00:00:00Z",
      _updatedAt: "2026-07-01T00:00:00Z",
      sync: { source: "courses-academy", rev: "deadbeef" },
      onChainStatus: { status: "synced" },
      authoringStatus: null,
      thumbnail: null,
      title: "X",
      tags: ["a"],
    };
    const bundle: Doc = {
      _id: "course-x",
      _type: "course",
      title: "X",
      tags: ["a"],
    };
    expect(canonicalize(sanity)).toEqual(canonicalize(bundle));
  });

  it("sorts object keys deterministically at every depth", () => {
    const a = { b: 2, a: 1, nested: { z: 1, y: 2 } };
    const b = { a: 1, b: 2, nested: { y: 2, z: 1 } };
    expect(JSON.stringify(canonicalize(a))).toBe(
      JSON.stringify(canonicalize(b))
    );
  });

  it("drops nested null values so absent === explicit-null", () => {
    const withNull = {
      _id: "i",
      _type: "instructor",
      socialLinks: { github: "g", twitter: null },
    };
    const without = {
      _id: "i",
      _type: "instructor",
      socialLinks: { github: "g" },
    };
    expect(canonicalize(withNull)).toEqual(canonicalize(without));
  });

  it("preserves _key/_ref/_weak/_type on nested refs (not stripped)", () => {
    const doc = {
      _id: "c",
      _type: "course",
      ref: { _type: "reference", _ref: "x", _weak: true, _key: "x" },
    };
    const c = canonicalize(doc) as Record<string, unknown>;
    expect(c.ref).toEqual({
      _key: "x",
      _ref: "x",
      _type: "reference",
      _weak: true,
    });
  });
});

// ── normalizeAssetUrls ───────────────────────────────────────────────────────

describe("normalizeAssetUrls", () => {
  it("reduces a Sanity CDN url to its basename", () => {
    expect(
      normalizeAssetUrls("https://cdn.sanity.io/images/p/d/abc123-800x600.png")
    ).toBe("abc123-800x600.png");
  });

  it("reduces a /content-assets/ path to its basename", () => {
    expect(normalizeAssetUrls("/content-assets/intro/hello/diagram.png")).toBe(
      "diagram.png"
    );
  });

  it("normalizes both forms embedded in the same markdown string identically", () => {
    const sanityMd =
      "See ![d](https://cdn.sanity.io/images/p/d/abc-1x1.png) here.";
    const bundleMd = "See ![d](/content-assets/course/lesson/abc.png) here.";
    // Basenames differ (hash vs slug), but the point is the wrapper text is stable;
    // when the basenames match the strings become equal.
    const s = "![d](https://cdn.sanity.io/images/p/d/x-1x1.png)";
    const b = "![d](/content-assets/a/b/x-1x1.png)";
    expect(normalizeAssetUrls(s)).toBe(normalizeAssetUrls(b));
    expect(normalizeAssetUrls(sanityMd)).toContain("See ![d](");
    expect(normalizeAssetUrls(bundleMd)).toContain("here.");
  });

  it("strips query strings when reducing to basename", () => {
    expect(
      normalizeAssetUrls("https://cdn.sanity.io/images/p/d/abc-1x1.png?w=200")
    ).toBe("abc-1x1.png");
  });
});

// ── diffParity ───────────────────────────────────────────────────────────────

const bundleDocs: Doc[] = [
  { _id: "course-a", _type: "course", title: "A", tags: ["x"] },
  { _id: "lesson-a", _type: "lesson", title: "LA", blocks: [] },
];

function sanityMirror(): Doc[] {
  // What Sanity serves for the same content: same fields + overlays + metadata.
  return [
    {
      _id: "course-a",
      _type: "course",
      _rev: "r1",
      _createdAt: "2026-01-01T00:00:00Z",
      _updatedAt: "2026-07-01T00:00:00Z",
      sync: { source: "courses-academy", rev: "sha" },
      onChainStatus: { status: "synced" },
      title: "A",
      tags: ["x"],
    },
    {
      _id: "lesson-a",
      _type: "lesson",
      _rev: "r2",
      sync: { source: "courses-academy", rev: "sha" },
      title: "LA",
      blocks: [],
    },
  ];
}

describe("diffParity", () => {
  it("passes when the bundle equals what Sanity serves (overlays stripped)", () => {
    const r = diffParity({ bundleDocs, sanityDocs: sanityMirror() });
    expect(r.ok).toBe(true);
    expect(r.mismatches).toEqual([]);
    expect(r.missing).toEqual([]);
    expect(r.extras).toEqual([]);
    expect(r.bundleCounts).toEqual({ course: 1, lesson: 1 });
    expect(r.sanityCounts).toEqual({ course: 1, lesson: 1 });
  });

  it("FAILS on a doctored Sanity doc, naming the id and showing the diff", () => {
    const doctored = sanityMirror();
    (doctored[0] as Doc).title = "TAMPERED";
    const r = diffParity({ bundleDocs, sanityDocs: doctored });
    expect(r.ok).toBe(false);
    expect(r.mismatches).toHaveLength(1);
    expect(r.mismatches[0]!._id).toBe("course-a");
    expect(r.mismatches[0]!.diff).toContain("title");
    expect(r.mismatches[0]!.diff).toContain("TAMPERED");
  });

  it("FAILS when a bundle doc is absent from Sanity (data loss)", () => {
    const r = diffParity({ bundleDocs, sanityDocs: [sanityMirror()[0]!] });
    expect(r.ok).toBe(false);
    expect(r.missing).toEqual(["lesson-a"]);
  });

  it("REPORTS (does not fail) a managed Sanity doc absent from the bundle", () => {
    const withExtra = [
      ...sanityMirror(),
      {
        _id: "quest-legacy",
        _type: "quest",
        sync: { source: "courses-academy", rev: "sha" },
        name: "Legacy",
      },
    ];
    const r = diffParity({ bundleDocs, sanityDocs: withExtra });
    expect(r.ok).toBe(true);
    expect(r.extras).toEqual(["quest-legacy"]);
  });
});
