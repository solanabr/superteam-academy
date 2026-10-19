/* eslint-disable import/order -- vi.mock factories are hoisted above imports. */
import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { NextRequest } from "next/server";
import { GET } from "../[slug]/[file]/route";
import { CONTENT_BLOB_BASE_URL } from "@/lib/content/blob-store.mjs";
import { coursesBySlug } from "@/lib/content/store";

// Runs against the committed bundle: these are the urls real social cards hold.
async function get(slug: string, file: string): Promise<Response> {
  return GET(
    new NextRequest(`https://st.academy/content-assets/${slug}/${file}`),
    { params: Promise.resolve({ slug, file }) }
  );
}

describe("GET /content-assets/[slug]/[file] (old banner urls)", () => {
  it.each([
    ["btc-to-sol-evolution", "banner.webp"],
    ["visao-geral-solana", "banner.jpg"],
  ])("308s %s/%s to the course's current thumbnail", async (slug, file) => {
    const res = await get(slug, file);

    const thumbnail = coursesBySlug.get(slug)?.thumbnail as string;
    expect(thumbnail.startsWith(`${CONTENT_BLOB_BASE_URL}/content/`)).toBe(
      true
    );
    expect(res.status).toBe(308);
    expect(res.headers.get("location")).toBe(thumbnail);
    expect(res.headers.get("cache-control")).toBe("public, max-age=3600");
  });

  it.each([
    ["no-such-course", "banner.webp"],
    // Lesson figures never had a published url outside the bundle.
    ["btc-to-sol-evolution", "v01-diagram.webp"],
    ["btc-to-sol-evolution", "banner.html"],
    ["btc-to-sol-evolution", "banner."],
    ["btc-to-sol-evolution", "banner"],
  ])("404s %s/%s", async (slug, file) => {
    const res = await get(slug, file);

    expect(res.status).toBe(404);
    expect(res.headers.get("location")).toBeNull();
  });
});
