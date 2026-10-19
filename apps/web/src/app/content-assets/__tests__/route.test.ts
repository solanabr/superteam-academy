/* eslint-disable import/order -- vi.mock factories are hoisted above imports. */
import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/content/store", async () => {
  const { CONTENT_BLOB_BASE_URL } =
    await import("@/lib/content/blob-store.mjs");
  const banner = `${CONTENT_BLOB_BASE_URL}/content/${"a".repeat(64)}.webp`;
  return {
    coursesBySlug: new Map([
      ["with-banner", { _id: "course-with-banner", thumbnail: banner }],
      ["no-banner", { _id: "course-no-banner" }],
      [
        "off-host",
        { _id: "course-off-host", thumbnail: "https://example.com/b.webp" },
      ],
    ]),
  };
});

import { NextRequest } from "next/server";
import { GET } from "../[slug]/[file]/route";
import { CONTENT_BLOB_BASE_URL } from "@/lib/content/blob-store.mjs";

const BANNER = `${CONTENT_BLOB_BASE_URL}/content/${"a".repeat(64)}.webp`;

async function get(slug: string, file: string): Promise<Response> {
  return GET(
    new NextRequest(`https://st.academy/content-assets/${slug}/${file}`),
    { params: Promise.resolve({ slug, file }) }
  );
}

describe("GET /content-assets/[slug]/[file] (old banner urls)", () => {
  it.each(["banner.webp", "banner.jpg", "banner.png"])(
    "308s with-banner/%s to the course's current thumbnail",
    async (file) => {
      const res = await get("with-banner", file);

      expect(res.status).toBe(308);
      expect(res.headers.get("location")).toBe(BANNER);
      expect(res.headers.get("cache-control")).toBe("public, max-age=3600");
    }
  );

  it.each([
    ["no-such-course", "banner.webp"],
    // Lesson figures never had a published url outside the bundle.
    ["with-banner", "v01-diagram.webp"],
    ["with-banner", "banner.html"],
    ["with-banner", "banner."],
    ["with-banner", "banner"],
    // No thumbnail, or one off the blob host: nowhere safe to send the card.
    ["no-banner", "banner.webp"],
    ["off-host", "banner.webp"],
  ])("404s %s/%s", async (slug, file) => {
    const res = await get(slug, file);

    expect(res.status).toBe(404);
    expect(res.headers.get("location")).toBeNull();
  });
});
