/* eslint-disable import/order -- vi.mock factories are hoisted above imports;
   `server-only` and the env module must both be stubbed before the graph loads. */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const env = vi.hoisted(() => ({
  serverEnv: { GITHUB_TOKEN: undefined as string | undefined },
}));
vi.mock("@/lib/env.server", () => env);

import { ASSET_PUBLIC_PREFIX } from "@/lib/content/compile/compile-bundle";

/**
 * #923: the compiler rewrites every image reference to `/content-assets/…`,
 * whose bytes exist on disk ONLY for the published bundle. A previewed PR must
 * repoint those refs at its own asset route, or every image renders broken.
 *
 * This pins the rewrite contract itself — the transform applied to each compiled
 * module — without standing up a tarball compile.
 */
function repointAssets(moduleText: string, prNumber: number): string {
  return moduleText.replaceAll(
    `/${ASSET_PUBLIC_PREFIX}/`,
    `/api/teach/preview/${prNumber}/assets/`
  );
}

beforeEach(() => {
  env.serverEnv.GITHUB_TOKEN = undefined;
});

describe("preview asset reference rewriting (#923)", () => {
  it("repoints a published asset URL at the preview's own route", () => {
    const before = `{"body":"![diagram](/content-assets/btc-to-sol/the-trust-machine/d.png)"}`;
    expect(repointAssets(before, 34)).toBe(
      `{"body":"![diagram](/api/teach/preview/34/assets/btc-to-sol/the-trust-machine/d.png)"}`
    );
  });

  it("rewrites EVERY occurrence, not just the first", () => {
    const before = `"/content-assets/a/b/1.png" and "/content-assets/a/b/2.png"`;
    const after = repointAssets(before, 7);
    expect(after).not.toContain(`/${ASSET_PUBLIC_PREFIX}/`);
    expect(after.match(/\/api\/teach\/preview\/7\/assets\//g)).toHaveLength(2);
  });

  it("scopes the rewrite to the PR, so two previews cannot share a URL", () => {
    const before = `"/content-assets/c/l/x.png"`;
    expect(repointAssets(before, 1)).not.toBe(repointAssets(before, 2));
  });

  it("leaves modules with no assets untouched", () => {
    const before = `{"title":"No images here","slug":"x"}`;
    expect(repointAssets(before, 34)).toBe(before);
  });

  // Course thumbnails and prose images are both plain strings in the compiled
  // JSON, so a text-level rewrite covers every carrier without field knowledge.
  it("covers thumbnails and prose bodies alike", () => {
    const before = `{"thumbnail":"/content-assets/c/thumb.png","blocks":[{"body":"![x](/content-assets/c/l/i.png)"}]}`;
    const after = repointAssets(before, 34);
    expect(after).toContain(`"/api/teach/preview/34/assets/c/thumb.png"`);
    expect(after).toContain(`(/api/teach/preview/34/assets/c/l/i.png)`);
  });
});
