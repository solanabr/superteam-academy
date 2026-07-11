import { describe, it, expect, vi } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/admin/auth", () => ({
  AdminAuthError: class extends Error {},
  adminUnauthorizedResponse: () => new Response("{}", { status: 401 }),
  requireAdminAuth: vi.fn(),
}));

const fetchHeadSha = vi.fn();
const fetchChecksState = vi.fn();
const fetchAheadBy = vi.fn();
vi.mock("@/lib/content-sync/github", () => ({
  createGitHubClient: () => ({ fetchHeadSha, fetchChecksState, fetchAheadBy }),
}));

// The committed bundle's meta — pin the sha the route reads.
vi.mock("@/lib/content/meta", () => ({
  contentMeta: {
    sha: "a".repeat(40),
    counts: { courses: 6, lessons: 76 },
    compiledAt: "2026-07-10T18:10:15Z",
  },
}));

import { GET } from "../route";

const get = (): Promise<Response> =>
  GET(new Request("https://x/api/admin/publish/pin") as unknown as NextRequest);

describe("GET /api/admin/publish/pin", () => {
  it("reports up_to_date when the pin equals HEAD", async () => {
    fetchHeadSha.mockResolvedValue("a".repeat(40));
    fetchChecksState.mockResolvedValue("success");
    const res = await get();
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      verdict: { state: string; commitsBehind: number };
      pin: { counts: Record<string, number> };
    };
    expect(body.verdict.state).toBe("up_to_date");
    expect(body.pin.counts.courses).toBe(6);
    expect(fetchAheadBy).not.toHaveBeenCalled();
  });

  it("reports behind with the compare ahead_by when drifted", async () => {
    fetchHeadSha.mockResolvedValue("b".repeat(40));
    fetchChecksState.mockResolvedValue("success");
    fetchAheadBy.mockResolvedValue(4);
    const res = await get();
    const body = (await res.json()) as {
      verdict: { state: string; commitsBehind: number; warnRedHead: boolean };
    };
    expect(body.verdict.state).toBe("behind");
    expect(body.verdict.commitsBehind).toBe(4);
    expect(body.verdict.warnRedHead).toBe(false);
  });

  it("warns and null-counts when compare fails on a red HEAD", async () => {
    fetchHeadSha.mockResolvedValue("c".repeat(40));
    fetchChecksState.mockResolvedValue("failure");
    fetchAheadBy.mockRejectedValue(new Error("compare boom"));
    const res = await get();
    const body = (await res.json()) as {
      verdict: { commitsBehind: number | null; warnRedHead: boolean };
    };
    expect(body.verdict.commitsBehind).toBeNull();
    expect(body.verdict.warnRedHead).toBe(true);
  });

  it("503s when GitHub is unreachable", async () => {
    const { GitHubUnavailableError } = await import("@/lib/content-sync/types");
    fetchHeadSha.mockRejectedValue(new GitHubUnavailableError("no token"));
    const res = await get();
    expect(res.status).toBe(503);
    const body = (await res.json()) as { unavailable: boolean };
    expect(body.unavailable).toBe(true);
  });
});
