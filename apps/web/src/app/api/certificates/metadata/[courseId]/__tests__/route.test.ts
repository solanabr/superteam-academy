/* eslint-disable import/order -- vi.mock('server-only') must be hoisted above
   the route import so the content store loads under vitest. */
import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { CONTENT_BLOB_BASE_URL } from "@/lib/content/blob-store.mjs";

vi.mock("server-only", () => ({}));

import { GET } from "../route";

const get = (courseId: string) =>
  GET(
    new NextRequest(`http://localhost/api/certificates/metadata/${courseId}`),
    { params: Promise.resolve({ courseId }) }
  );

describe("GET /api/certificates/metadata/[courseId]", () => {
  it("serves the credential collection JSON for a course in the bundle", async () => {
    const res = await get("course-solana-speedrun");
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.name).toMatch(/ Credentials$/);
    expect(body.symbol).toBe("STACAD");
    expect(String(body.image).startsWith(`${CONTENT_BLOB_BASE_URL}/`)).toBe(
      true
    );
    expect(body.external_url).toBe(
      "http://localhost:3000/courses/solana-speedrun"
    );
    expect(res.headers.get("Cache-Control")).toMatch(/s-maxage=604800/);
  });

  it("404s on a course that isn't in the bundle, including a credential uuid", async () => {
    for (const id of [
      "course-nope",
      "5b0e5c7e-1f2a-4c3d-9e8f-0a1b2c3d4e5f",
      "",
    ]) {
      const res = await get(id);
      expect(res.status).toBe(404);
    }
  });
});
