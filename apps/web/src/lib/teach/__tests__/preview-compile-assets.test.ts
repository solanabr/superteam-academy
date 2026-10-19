/* eslint-disable import/order -- vi.mock factories are hoisted above imports;
   `server-only` and the env module must both be stubbed before the graph loads. */
import { describe, it, expect, afterEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

const env = vi.hoisted(() => ({
  serverEnv: { GITHUB_TOKEN: undefined as string | undefined },
}));
vi.mock("@/lib/env.server", () => env);

import { compilePrPreview, previewImageUrl } from "../preview-compile";
import { makeCourseTarball } from "@/lib/content/compile/__tests__/_fixtures";
import { CONTENT_BLOB_BASE_URL } from "@/lib/content/blob-store.mjs";

/**
 * End-to-end cover for #923, through the SHIPPED compile path: a real tarball
 * goes in, and every image reference that comes out must point at the
 * preview asset route by a repo path the route will accept. No image bytes
 * may survive the compile — the route fetches them one at a time.
 */

const SHA = "b".repeat(40);
const PR = 34;
const IMAGE_PATH = "courses/demo/lessons/accounts/assets/pixel.png";

/** GitHub responses in call order: the PR head, the tarball, then pulls/N/files. */
function stubGitHub(): void {
  const tarball = makeCourseTarball(SHA, { withImage: true });
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockImplementationOnce(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              head: { sha: SHA, ref: "feat/images" },
              title: "Add a course with images",
              state: "open",
              user: { login: "someone" },
            }),
            { status: 200, headers: { "content-type": "application/json" } }
          )
        )
      )
      .mockImplementationOnce(() =>
        Promise.resolve(new Response(new Uint8Array(tarball), { status: 200 }))
      )
      .mockImplementation(() =>
        Promise.resolve(
          new Response("[]", {
            status: 200,
            headers: { "content-type": "application/json" },
          })
        )
      )
  );
}

/** True when any value reachable from `v` is a byte array. */
function holdsBytes(v: unknown, seen = new Set<unknown>()): boolean {
  if (v instanceof Uint8Array) return true;
  if (!v || typeof v !== "object" || seen.has(v)) return false;
  seen.add(v);
  const children = v instanceof Map ? [...v.values()] : Object.values(v);
  return children.some((c) => holdsBytes(c, seen));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("compilePrPreview image handling (#923)", () => {
  it("records the image by repo path and keeps no image bytes", async () => {
    stubGitHub();

    const result = await compilePrPreview(PR);

    expect(result.imagePaths).toEqual([IMAGE_PATH]);
    expect(holdsBytes(result)).toBe(false);
  });

  it("points the rendered lesson at the preview route, not the blob store", async () => {
    stubGitHub();

    const result = await compilePrPreview(PR);

    // What the lesson page actually renders — the hydrated, projected lesson.
    const rendered = JSON.stringify(result.lessonsByCourse["course-demo"]);
    expect(rendered).toContain(`/api/teach/preview/${PR}/assets/${IMAGE_PATH}`);
    // A PR's images are not uploaded until a lock bump ships them.
    expect(rendered).not.toContain(CONTENT_BLOB_BASE_URL);
  });

  it("addresses every image by exactly the path the route allowlists", async () => {
    stubGitHub();

    const result = await compilePrPreview(PR);

    // The route serves only `imagePaths`, so any drift between the url and the
    // list is a broken image no unit test of either half sees.
    const rendered = JSON.stringify(result.lessonsByCourse["course-demo"]);
    for (const p of result.imagePaths) {
      expect(rendered).toContain(previewImageUrl(PR, p));
    }
  });
});
