import { describe, it, expect } from "vitest";
import { VersionStamp } from "../version-stamp";
import { Lesson } from "../lesson";

const validStamp = {
  checkedAt: "2026-07-25",
  packages: {
    "@solana/kit": "6.10.0",
    "@solana-program/token": "0.14.0",
  },
};

describe("VersionStamp", () => {
  it("accepts a well-formed stamp", () => {
    const r = VersionStamp.safeParse(validStamp);
    expect(r.success).toBe(true);
  });

  it("accepts an exact prerelease pin (Kit 8 canary)", () => {
    const r = VersionStamp.safeParse({
      checkedAt: "2026-07-25",
      packages: { "@solana/kit": "8.0.0-canary-20260724151329" },
    });
    expect(r.success).toBe(true);
  });

  it("rejects a range instead of an exact version", () => {
    for (const bad of ["^7.0.0", "~6.10.0", ">=5.1.0", "7.x", "latest"]) {
      const r = VersionStamp.safeParse({
        checkedAt: "2026-07-25",
        packages: { "@solana/kit": bad },
      });
      expect(r.success, `${bad} should be rejected`).toBe(false);
    }
  });

  it("rejects an empty package set", () => {
    const r = VersionStamp.safeParse({
      checkedAt: "2026-07-25",
      packages: {},
    });
    expect(r.success).toBe(false);
  });

  it("rejects an upper-cased or otherwise invalid package name", () => {
    const r = VersionStamp.safeParse({
      checkedAt: "2026-07-25",
      packages: { "@Solana/Kit": "7.0.0" },
    });
    expect(r.success).toBe(false);
  });

  it("rejects a malformed date", () => {
    for (const bad of ["2026-7-5", "07-25-2026", "2026-13-01", "2026-02-30"]) {
      const r = VersionStamp.safeParse({
        checkedAt: bad,
        packages: { "@solana/kit": "7.0.0" },
      });
      expect(r.success, `${bad} should be rejected`).toBe(false);
    }
  });

  it("requires both checkedAt and packages", () => {
    expect(
      VersionStamp.safeParse({ packages: { "@solana/kit": "7.0.0" } }).success
    ).toBe(false);
    expect(VersionStamp.safeParse({ checkedAt: "2026-07-25" }).success).toBe(
      false
    );
  });
});

describe("Lesson.versionStamp (optional)", () => {
  const baseLesson = {
    id: "lesson-a",
    slug: "a",
    title: "A",
    skills: ["pdas"],
    blocks: [{ key: "intro", type: "prose", src: "intro.md" }],
  };

  it("omits versionStamp by default (backward-compatible)", () => {
    const r = Lesson.safeParse(baseLesson);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.versionStamp).toBeUndefined();
  });

  it("accepts a lesson carrying a version stamp", () => {
    const r = Lesson.safeParse({ ...baseLesson, versionStamp: validStamp });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.versionStamp?.packages["@solana/kit"]).toBe("6.10.0");
    }
  });

  it("rejects a lesson whose stamp is malformed", () => {
    const r = Lesson.safeParse({
      ...baseLesson,
      versionStamp: {
        checkedAt: "2026-07-25",
        packages: { "@solana/kit": "^7" },
      },
    });
    expect(r.success).toBe(false);
  });
});
