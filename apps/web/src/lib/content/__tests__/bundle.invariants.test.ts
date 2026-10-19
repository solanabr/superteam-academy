import { NextRequest } from "next/server";
import { describe, it, expect, vi } from "vitest";
import { GET as legacyBanner } from "@/app/content-assets/[slug]/[file]/route";
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
 * to ship, so a release PR passes them without an edit. Apart from the banner
 * urls already published on social cards (last block), they never pin what the
 * bundle contains; projection behaviour is golden-tested over a fixture in
 * project.golden.test.ts.
 */

const BLOB = `${CONTENT_BLOB_BASE_URL.replace(/\./g, "\\.")}/content/([0-9a-f]{64})\\.(\\w+)`;

describe("the committed content bundle", () => {
  it("gives every course a compiled banner on the blob host", () => {
    // Asserted because the regression is silent: a course that loses its
    // banner falls back to /cover.png in the catalogue and nothing else fails.
    expect(coursesById.size).toBeGreaterThan(0);
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
    const referenced = [...text.matchAll(new RegExp(BLOB, "g"))].map(
      ([, sha, ext]) => `${sha}.${ext}`
    );
    expect(referenced.length).toBeGreaterThan(0);
    expect(referenced.filter((key) => !listed.has(key))).toEqual([]);
  });

  it("keeps early-adopter manual, so signing up never auto-awards it", () => {
    // The ladder wave retired its `user-number lte:100` rule. A doc drifting
    // back to an auto rule would hand every early signup its XP on day one.
    const doc = achievementsById.get("achievement-early-adopter");
    if (doc) expect(projectAchievement(doc).award).toEqual({ kind: "manual" });
  });
});

describe("banner urls already published on social cards", () => {
  // Course pages published these as og:image, and shared cards re-fetch them,
  // so they must keep redirecting whatever a release does. A release that
  // removes or renames one of these courses is meant to fail here.
  it.each([
    ["btc-to-sol-evolution", "banner.webp"],
    ["visao-geral-solana", "banner.jpg"],
  ])("%s/%s 308s to the course banner on the blob host", async (slug, file) => {
    const res = await legacyBanner(
      new NextRequest(`https://st.academy/content-assets/${slug}/${file}`),
      { params: Promise.resolve({ slug, file }) }
    );
    expect(res.status).toBe(308);
    expect(res.headers.get("location")).toMatch(new RegExp(`^${BLOB}$`));
  });
});
