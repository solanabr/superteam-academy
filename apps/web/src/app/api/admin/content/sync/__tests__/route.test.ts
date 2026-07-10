import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/admin/auth", () => ({
  AdminAuthError: class AdminAuthError extends Error {},
  adminUnauthorizedResponse: () =>
    new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
  requireAdminAuth: vi.fn(),
}));
const runContentSync = vi.fn();
vi.mock("@/lib/content-sync/sync", () => ({
  runContentSync: (...a: unknown[]) => runContentSync(...a),
}));
vi.mock("@/lib/content-sync/github", () => ({
  createGitHubClient: () => ({}),
}));
vi.mock("@/lib/content-sync/gateway", () => ({
  createLiveGateway: () => ({}),
}));
vi.mock("@/lib/content-sync/graders", () => ({
  createLiveGraders: () => ({}),
}));

import { POST } from "../route";
import { requireAdminAuth } from "@/lib/admin/auth";
import {
  BlockedCommitError,
  ContentValidationError,
} from "@/lib/content-sync/types";

const post = (body: unknown): Promise<Response> =>
  POST(
    new Request("https://x/api/admin/content/sync", {
      method: "POST",
      body: JSON.stringify(body),
    }) as unknown as NextRequest
  );

beforeEach(() => {
  runContentSync.mockReset();
  (requireAdminAuth as unknown as ReturnType<typeof vi.fn>).mockReset();
});

describe("POST /api/admin/content/sync", () => {
  it("401 when the admin cookie is missing", async () => {
    const { AdminAuthError } =
      (await import("@/lib/admin/auth")) as unknown as {
        AdminAuthError: new () => Error;
      };
    (
      requireAdminAuth as unknown as ReturnType<typeof vi.fn>
    ).mockImplementation(() => {
      throw new AdminAuthError();
    });
    expect((await post({ sha: "a".repeat(40) })).status).toBe(401);
  });

  it("400 when sha is missing or malformed", async () => {
    expect((await post({})).status).toBe(400);
    expect((await post({ sha: "nope" })).status).toBe(400);
  });

  it("returns the SyncResult on success", async () => {
    runContentSync.mockResolvedValue({
      sha: "a".repeat(40),
      written: 3,
      skipped: 0,
      pruned: 0,
      assetsUploaded: 0,
      pendingChainDeltas: [],
    });
    const res = await post({ sha: "a".repeat(40) });
    expect(res.status).toBe(200);
    expect((await res.json()).written).toBe(3);
  });

  it("409 on a blocked commit", async () => {
    runContentSync.mockRejectedValue(new BlockedCommitError("a".repeat(40)));
    expect((await post({ sha: "a".repeat(40) })).status).toBe(409);
  });

  it("422 with issues on a validation failure", async () => {
    runContentSync.mockRejectedValue(
      new ContentValidationError(["bad course id"])
    );
    const res = await post({ sha: "a".repeat(40) });
    expect(res.status).toBe(422);
    expect((await res.json()).issues).toEqual(["bad course id"]);
  });
});
