import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env.server", () => ({
  serverEnv: { SOLANA_RPC_URL: "https://rpc.test" },
}));
vi.mock("@/lib/admin/auth", () => ({
  AdminAuthError: class extends Error {},
  adminUnauthorizedResponse: () => new Response("{}", { status: 401 }),
  requireAdminAuth: vi.fn(),
}));

// A deployed course (course-a, PDA on chain) and a never-deployed one (course-b).
vi.mock("@/lib/content/queries", () => ({
  getAllCoursesAdmin: async () => [
    {
      _id: "course-a",
      slug: "a",
      title: "Course A",
      difficulty: "beginner",
      xpPerLesson: 50,
      lessonCount: 3,
      onChainStatus: { status: "synced", coursePda: "PDA_A" },
    },
    {
      _id: "course-b",
      slug: "b",
      title: "Course B",
      difficulty: "beginner",
      xpPerLesson: 50,
      lessonCount: 3,
      onChainStatus: null,
    },
  ],
  getAllAchievementsAdmin: async () => [],
}));

vi.mock("@/lib/solana/pda", () => ({
  findCoursePDA: (id: string) => [
    { toBase58: () => (id === "course-a" ? "PDA_A" : "PDA_B") },
  ],
  findAchievementTypePDA: () => [{ toBase58: () => "ACH" }],
  getProgramId: () => ({
    toBase58: () => "Prog11111111111111111111111111111111111111",
  }),
}));
vi.mock("@/lib/solana/academy-reads", () => ({
  decodeCourse: () => ({ is_active: true }),
}));
vi.mock("@/lib/solana/admin-signer", () => ({
  verifyAuthorityMatchesConfig: async () => ({
    matches: true,
    configAuthority: "auth",
  }),
  isAdminSignerReady: () => true,
}));
vi.mock("@solana/web3.js", () => ({
  Connection: class {
    async getAccountInfo(pda: { toBase58: () => string }) {
      return pda.toBase58() === "PDA_A" ? { data: Buffer.from([]) } : null;
    }
  },
}));

// Synced bundle SHA (a…) differs from the mocked HEAD (b…) → content is "behind".
vi.mock("@/lib/content/meta", () => ({ SYNCED_SHA: "a".repeat(40) }));

const githubMock = {
  fetchHeadSha: vi.fn(async () => "b".repeat(40)),
  fetchChecksState: vi.fn(async () => "success" as const),
};
vi.mock("@/lib/github/github", () => ({
  createGitHubClient: () => githubMock,
}));

import { GET } from "../route";

const get = (): Promise<Response> =>
  GET(new Request("https://x/api/admin/status") as unknown as NextRequest);

interface CourseRow {
  sanityId?: string;
  contentId?: string;
  onChainStatus: string;
  contentDrift?: string;
}

beforeEach(() => {
  githubMock.fetchHeadSha.mockResolvedValue("b".repeat(40));
  githubMock.fetchChecksState.mockResolvedValue("success");
});

describe("GET /api/admin/status — content drift", () => {
  it("folds content drift into the deployed course record", async () => {
    const res = await get();
    expect(res.status).toBe(200);
    const body = (await res.json()) as { courses: CourseRow[] };
    const a = body.courses.find((c) => c.contentId === "course-a");
    const b = body.courses.find((c) => c.contentId === "course-b");
    expect(a?.onChainStatus).toBe("synced");
    expect(a?.contentDrift).toBe("behind"); // bundle sha a…, HEAD b…, CI green
    expect(b?.onChainStatus).toBe("not_deployed");
  });

  it("degrades contentDrift to 'unknown' when HEAD cannot be fetched, without failing the route", async () => {
    const { GitHubUnavailableError } = await import("@/lib/github/types");
    githubMock.fetchHeadSha.mockRejectedValueOnce(
      new GitHubUnavailableError("GITHUB_TOKEN is not configured")
    );
    const res = await get();
    expect(res.status).toBe(200);
    const body = (await res.json()) as { courses: CourseRow[] };
    for (const c of body.courses) expect(c.contentDrift).toBe("unknown");
  });
});
