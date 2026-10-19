import { describe, it, expect, vi } from "vitest";
import assetsJson from "@/content/generated/assets.json";
import { CONTENT_BLOB_BASE_URL } from "../blob-store.mjs";
import { projectAchievement } from "../project";
import {
  achievementsById,
  coursesById,
  l10nByCourseId,
  lessonsById,
} from "../store";

vi.mock("server-only", () => ({}));

/**
 * Checks on the live committed bundle that hold for any content we are willing
 * to ship, so a release PR passes them without an edit. They never pin what the
 * bundle contains; projection behaviour is golden-tested over a fixture in
 * project.golden.test.ts.
 */

const BLOB = `${CONTENT_BLOB_BASE_URL.replace(/\./g, "\\.")}/content/([0-9a-f]{64})\\.(\\w+)`;

describe("the committed content bundle", () => {
  it("gives every course a compiled banner on the blob host", () => {
    // Asserted because the regression is silent: a course that loses its
    // banner falls back to /cover.png in the catalogue and nothing else fails.
    for (const course of coursesById.values()) {
      expect(course.thumbnail, course._id).toMatch(new RegExp(`^${BLOB}$`));
    }
  });

  it("names a creator wallet on every course (#399)", () => {
    // Course.creator is immutable on-chain, so a course has to be created with
    // its instructor's wallet the first time.
    for (const course of coursesById.values()) {
      expect(course.creator, course._id).toMatch(
        /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
      );
    }
  });

  it("lists every image it references in assets.json, so the build uploads it", () => {
    // Typed by hand: an image-free bundle would infer `never[]` here.
    const assets = assetsJson as { sha256: string; ext: string }[];
    const listed = new Set(assets.map((a) => `${a.sha256}.${a.ext}`));
    const text = JSON.stringify([
      [...coursesById.values()],
      [...lessonsById.values()],
      [...l10nByCourseId.values()],
    ]);
    const missing = [...text.matchAll(new RegExp(BLOB, "g"))]
      .map(([, sha, ext]) => `${sha}.${ext}`)
      .filter((key) => !listed.has(key));
    expect(missing).toEqual([]);
  });

  it("keeps early-adopter manual, so signing up never auto-awards it", () => {
    // The ladder wave retired its `user-number lte:100` rule. A doc drifting
    // back to an auto rule would hand every early signup its XP on day one.
    const doc = achievementsById.get("achievement-early-adopter");
    if (doc) expect(projectAchievement(doc).award).toEqual({ kind: "manual" });
  });
});
