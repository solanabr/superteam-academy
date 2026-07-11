import { createHash } from "node:crypto";
import { describe, it, expect } from "vitest";
import { computeAssetId, rewriteMarkdownAssetPaths, cdnUrl } from "../assets";

describe("computeAssetId", () => {
  it("derives image-<sha1>-<dims>-<format> from the bytes", () => {
    const bytes = new Uint8Array([1, 2, 3, 4]);
    const sha1 = createHash("sha1").update(Buffer.from(bytes)).digest("hex");
    expect(computeAssetId(bytes, { width: 640, height: 480 }, "png")).toBe(
      `image-${sha1}-640x480-png`
    );
  });

  it("is stable — same bytes yield the same id (dedupe key)", () => {
    const b = new Uint8Array([9, 9, 9]);
    expect(computeAssetId(b, { width: 1, height: 1 }, "png")).toBe(
      computeAssetId(b, { width: 1, height: 1 }, "png")
    );
  });
});

describe("rewriteMarkdownAssetPaths", () => {
  it("rewrites a relative image path to its resolved CDN url", () => {
    const md = "See ![accounts](assets/accounts.png) here.";
    const out = rewriteMarkdownAssetPaths(md, (rel) =>
      rel === "assets/accounts.png"
        ? "https://cdn.sanity.io/images/p/d/x-1x1.png"
        : null
    );
    expect(out).toBe(
      "See ![accounts](https://cdn.sanity.io/images/p/d/x-1x1.png) here."
    );
  });

  it("leaves absolute/remote urls untouched", () => {
    const md = "![x](https://example.com/x.png)";
    expect(rewriteMarkdownAssetPaths(md, () => "SHOULD_NOT_BE_USED")).toBe(md);
  });
});

describe("cdnUrl", () => {
  it("builds the Sanity CDN url for an asset id", () => {
    expect(cdnUrl("image-abc-640x480-png", "proj", "production")).toBe(
      "https://cdn.sanity.io/images/proj/production/abc-640x480.png"
    );
  });
});
