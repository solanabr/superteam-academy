/* eslint-disable import/order -- vi.mock factories are hoisted above imports;
   `server-only` and the env module must both be stubbed before the graph loads. */
import { describe, it, expect, afterEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

const env = vi.hoisted(() => ({
  serverEnv: { GITHUB_TOKEN: undefined as string | undefined },
}));
vi.mock("@/lib/env.server", () => env);

import { compilePrPreview } from "../preview-compile";
import {
  makeCourseTarball,
  PNG_1X1,
} from "@/lib/content/compile/__tests__/_fixtures";

/**
 * End-to-end cover for #923, through the SHIPPED compile path rather than a
 * re-implementation of the rewrite: a real tarball goes in, and what comes out
 * must carry both halves of a working image — the bytes, and a url that can
 * serve them. `compileContent` (the pre-#923 call) satisfies neither.
 */

const SHA = "b".repeat(40);
const PR = 34;
const ASSET_KEY = "demo/accounts/pixel.png";

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

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("compilePrPreview asset handling (#923)", () => {
  it("keeps the compiled bytes on the result", async () => {
    stubGitHub();

    const result = await compilePrPreview(PR);

    expect([...result.assets.keys()]).toContain(ASSET_KEY);
    expect(Buffer.from(result.assets.get(ASSET_KEY)!)).toEqual(PNG_1X1);
  });

  it("points the rendered lesson at the preview route, not the published tree", async () => {
    stubGitHub();

    const result = await compilePrPreview(PR);

    // What the lesson page actually renders — the hydrated, projected lesson.
    const rendered = JSON.stringify(result.lessonsByCourse["course-demo"]);
    expect(rendered).toContain(`/api/teach/preview/${PR}/assets/${ASSET_KEY}`);
    // `/content-assets/...` would resolve against the PINNED bundle's static
    // files, which never contain a previewed PR's assets.
    expect(rendered).not.toContain("/content-assets/");
  });

  it("keys the assets exactly as the rewritten urls address them", async () => {
    stubGitHub();

    const result = await compilePrPreview(PR);

    // The route serves `assets.get(path)` for the path in the url, so any drift
    // between the two halves is a broken image no unit test of either half sees.
    const rendered = JSON.stringify(result.lessonsByCourse["course-demo"]);
    for (const key of result.assets.keys()) {
      expect(rendered).toContain(`/api/teach/preview/${PR}/assets/${key}`);
    }
  });
});
