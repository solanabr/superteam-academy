/* eslint-disable import/order -- vi.mock factories are hoisted above imports;
   `server-only` and the env module must both be stubbed before the graph loads. */
import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

const env = vi.hoisted(() => ({
  serverEnv: { GITHUB_TOKEN: undefined as string | undefined },
}));
vi.mock("@/lib/env.server", () => env);

import { isPlainRepoPath, previewImageUrl } from "../preview-compile";

/**
 * #923: a previewed PR's images are not in blob storage, so the preview compile
 * points every image at its own asset route, keyed by repo path. These pin the
 * url contract and the path rule the route enforces before it fetches.
 */
describe("previewImageUrl (#923)", () => {
  it("addresses an image by its repo path under the PR's own route", () => {
    expect(
      previewImageUrl(34, "courses/demo/lessons/accounts/assets/d.png")
    ).toBe(
      "/api/teach/preview/34/assets/courses/demo/lessons/accounts/assets/d.png"
    );
  });

  it("scopes the url to the PR, so two previews cannot share a URL", () => {
    const p = "courses/c/assets/x.png";
    expect(previewImageUrl(1, p)).not.toBe(previewImageUrl(2, p));
  });

  it("encodes each segment, keeping the separators", () => {
    expect(previewImageUrl(7, "courses/c/assets/a b#1?.png")).toBe(
      "/api/teach/preview/7/assets/courses/c/assets/a%20b%231%3F.png"
    );
  });
});

describe("isPlainRepoPath", () => {
  it("accepts an ordinary repo path", () => {
    expect(isPlainRepoPath("courses/c/assets/x.png")).toBe(true);
  });

  it.each([
    "../secrets.png",
    "courses/../../other-repo/x.png",
    "courses/./x.png",
    "/courses/x.png",
    "courses//x.png",
    "",
  ])("refuses %j", (p) => {
    expect(isPlainRepoPath(p)).toBe(false);
  });
});
