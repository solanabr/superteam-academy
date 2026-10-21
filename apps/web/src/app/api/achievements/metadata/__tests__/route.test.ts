/* eslint-disable import/order -- vi.mock('server-only') must be hoisted above
   the route imports so the content store loads under vitest. */
import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

import { GET as getByQuery } from "../route";
import { GET as getByPath } from "../[id]/route";

const KNOWN = "achievement-first-steps";

const byPath = (id: string) =>
  getByPath(
    new NextRequest(`http://localhost/api/achievements/metadata/${id}`),
    { params: Promise.resolve({ id }) }
  );

const byQuery = (query: string) =>
  getByQuery(
    new NextRequest(`http://localhost/api/achievements/metadata${query}`)
  );

describe("GET /api/achievements/metadata/[id]", () => {
  it("serves Metaplex JSON for an achievement in the bundle", async () => {
    const res = await byPath(KNOWN);
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toMatchObject({
      name: "First Steps",
      symbol: "STACAD",
      image: "http://localhost:3000/android-chrome-512x512.png",
      external_url: "http://localhost:3000/",
    });
    expect(Array.isArray(body.attributes)).toBe(true);
  });

  it("is cacheable on the CDN and readable cross-origin", async () => {
    const res = await byPath(KNOWN);
    expect(res.headers.get("Cache-Control")).toMatch(/s-maxage=604800/);
    expect(res.headers.get("CDN-Cache-Control")).toMatch(/s-maxage=604800/);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });

  it("404s on an id that isn't in the bundle", async () => {
    for (const id of ["achievement-nope", "__proto__", "constructor", ""]) {
      const res = await byPath(id);
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: "Metadata not found" });
    }
  });
});

describe("GET /api/achievements/metadata?id=", () => {
  it("answers the older query-string form with the same document", async () => {
    const [q, p] = await Promise.all([byQuery(`?id=${KNOWN}`), byPath(KNOWN)]);
    expect(q.status).toBe(200);
    expect(await q.json()).toEqual(await p.json());
  });

  it("404s on a missing or unknown id", async () => {
    expect((await byQuery("")).status).toBe(404);
    expect((await byQuery("?id=")).status).toBe(404);
    expect((await byQuery("?id=achievement-nope")).status).toBe(404);
  });
});
