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

// course-a: deployed, matches its on-chain account. course-b: never deployed.
// course-c: deployed, on-chain xpPerLesson differs (updateable) and its
// content_tx_id is zeroed (content commitment behind the bundle).
// course-d: deployed, on-chain creator ≠ instructor wallet (#400, immutable).
const INSTRUCTOR_WALLET = "CreatorWa11et" + "1".repeat(31);
const WRONG_CREATOR = "WrongWa11et" + "1".repeat(33);
const baseCourse = {
  difficulty: "beginner",
  creatorWallet: INSTRUCTOR_WALLET,
  xpPerLesson: 50,
  trackId: 0,
  trackLevel: 0,
  prerequisiteCourse: null,
  creatorRewardXp: 0,
  minCompletionsForReward: 0,
  lessonCount: 3,
};
vi.mock("@/lib/content/queries", () => ({
  getAllCoursesAdmin: async () => [
    {
      _id: "course-a",
      slug: "a",
      title: "Course A",
      ...baseCourse,
      onChainStatus: { status: "synced", coursePda: "PDA_A" },
    },
    {
      _id: "course-b",
      slug: "b",
      title: "Course B",
      ...baseCourse,
      onChainStatus: null,
    },
    {
      _id: "course-c",
      slug: "c",
      title: "Course C",
      ...baseCourse,
      onChainStatus: { status: "synced", coursePda: "PDA_C" },
    },
    {
      _id: "course-d",
      slug: "d",
      title: "Course D",
      ...baseCourse,
      onChainStatus: { status: "synced", coursePda: "PDA_D" },
    },
  ],
  getAllAchievementsAdmin: async () => [],
}));

vi.mock("@/lib/solana/pda", () => ({
  findCoursePDA: (id: string) => [
    { toBase58: () => `PDA_${id.slice(-1).toUpperCase()}` },
  ],
  findAchievementTypePDA: () => [{ toBase58: () => "ACH" }],
  getProgramId: () => ({
    toBase58: () => "Prog11111111111111111111111111111111111111",
  }),
}));

// The synced bundle SHA is a…40; padded into content_tx_id as 12 zero bytes +
// the 20 sha bytes (0xaa each).
const MATCHING_TX_ID = [
  ...Array<number>(12).fill(0),
  ...Array<number>(20).fill(0xaa),
];
vi.mock("@/lib/content/meta", () => ({ SYNCED_SHA: "a".repeat(40) }));

// Raw snake_case decodes keyed by which account was fetched.
const matchingRaw = {
  creator: { toBase58: () => INSTRUCTOR_WALLET },
  content_tx_id: MATCHING_TX_ID,
  lesson_count: 3,
  difficulty: 1,
  xp_per_lesson: 50,
  track_id: 0,
  track_level: 0,
  prerequisite: null,
  creator_reward_xp: 0,
  min_completions_for_reward: 0,
  is_active: true,
};
const rawByMarker: Record<string, unknown> = {
  A: matchingRaw,
  C: {
    ...matchingRaw,
    content_tx_id: Array<number>(32).fill(0),
    xp_per_lesson: 25, // differs from the bundle's 50 — updateable diff
  },
  D: {
    ...matchingRaw,
    creator: { toBase58: () => WRONG_CREATOR }, // #400
  },
};
vi.mock("@/lib/solana/academy-reads", () => ({
  decodeCourse: (data: Buffer) => {
    const raw = rawByMarker[data.toString()];
    if (!raw) throw new Error("undecodable");
    return raw;
  },
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
      const addr = pda.toBase58();
      if (addr === "PDA_A") return { data: Buffer.from("A") };
      if (addr === "PDA_C") return { data: Buffer.from("C") };
      if (addr === "PDA_D") return { data: Buffer.from("D") };
      return null;
    }
  },
}));

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
  contentId: string;
  onChainStatus: string;
  contentDrift: string;
  chainDrift: string | null;
  differences: {
    field: string;
    contentValue: unknown;
    onChainValue: unknown;
    updateable: boolean;
  }[];
}

async function getCourses(): Promise<CourseRow[]> {
  const res = await get();
  expect(res.status).toBe(200);
  const body = (await res.json()) as { courses: CourseRow[] };
  return body.courses;
}

beforeEach(() => {
  githubMock.fetchHeadSha.mockResolvedValue("b".repeat(40));
  githubMock.fetchChecksState.mockResolvedValue("success");
});

describe("GET /api/admin/status — content drift", () => {
  it("folds repo-wide content drift into every course record", async () => {
    const courses = await getCourses();
    // bundle sha a…, HEAD b…, CI green → behind, on every row
    expect(courses).toHaveLength(4);
    for (const c of courses) expect(c.contentDrift).toBe("behind");
  });

  it("degrades contentDrift to 'unknown' when HEAD cannot be fetched, without failing the route", async () => {
    const { GitHubUnavailableError } = await import("@/lib/github/types");
    githubMock.fetchHeadSha.mockRejectedValueOnce(
      new GitHubUnavailableError("GITHUB_TOKEN is not configured")
    );
    const courses = await getCourses();
    for (const c of courses) expect(c.contentDrift).toBe("unknown");
  });
});

describe("GET /api/admin/status — per-course diff + chain drift (SP3-C Task 2)", () => {
  it("a matching deployed course is synced, diff-free, content_current", async () => {
    const a = (await getCourses()).find((c) => c.contentId === "course-a");
    expect(a?.onChainStatus).toBe("synced");
    expect(a?.differences).toEqual([]);
    expect(a?.chainDrift).toBe("content_current");
  });

  it("a never-deployed course reads not_deployed on both axes", async () => {
    const b = (await getCourses()).find((c) => c.contentId === "course-b");
    expect(b?.onChainStatus).toBe("not_deployed");
    expect(b?.chainDrift).toBe("not_deployed");
    expect(b?.differences).toEqual([]);
  });

  it("a drifted course carries real diffCourse differences and content_stale", async () => {
    const c = (await getCourses()).find((r) => r.contentId === "course-c");
    expect(c?.onChainStatus).toBe("out_of_sync");
    expect(c?.differences).toEqual([
      {
        field: "xpPerLesson",
        contentValue: 50,
        onChainValue: 25,
        updateable: true,
      },
    ]);
    expect(c?.chainDrift).toBe("content_stale");
  });

  it("#400: on-chain creator ≠ instructor wallet → immutable creator diff", async () => {
    const d = (await getCourses()).find((r) => r.contentId === "course-d");
    expect(d?.onChainStatus).toBe("out_of_sync");
    expect(d?.differences).toEqual([
      {
        field: "creator",
        contentValue: INSTRUCTOR_WALLET,
        onChainValue: WRONG_CREATOR,
        updateable: false,
      },
    ]);
  });
});
