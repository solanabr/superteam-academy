import { describe, it, expect, vi } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/admin/auth", () => ({
  AdminAuthError: class extends Error {},
  adminUnauthorizedResponse: () => new Response("{}", { status: 401 }),
  requireAdminAuth: vi.fn(),
}));
vi.mock("@/lib/content-sync/github", () => ({
  createGitHubClient: () => ({
    fetchHeadSha: async () => "b".repeat(40),
    fetchChecksState: async () => "success",
    fetchTarball: async () => new Uint8Array(),
  }),
}));
vi.mock("@/lib/sanity/admin-mutations", () => ({
  readManagedDocuments: async () => [],
  readContentSyncSingleton: async () => ({ sha: "a".repeat(40) }),
}));
vi.mock("@/lib/sanity/queries", () => ({
  getAllCoursesAdmin: async () => [],
  COURSES_CACHE_TAG: "courses",
}));

import { GET } from "../route";

const get = (): Promise<Response> =>
  GET(
    new Request("https://x/api/admin/content/drift") as unknown as NextRequest
  );

describe("GET /api/admin/content/drift", () => {
  it("returns content drift computed from HEAD vs the singleton", async () => {
    const res = await get();
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      content: { state: string; canSync: boolean };
    };
    expect(body.content.state).toBe("behind"); // synced=a…, head=b…, ci green
    expect(body.content.canSync).toBe(true);
  });
});
