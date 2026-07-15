import { describe, it, expect, beforeEach, vi } from "vitest";
import type { NextRequest } from "next/server";
import { POST } from "../route";
import {
  GitHubUnavailableError,
  RefExistsError,
  TreeTruncatedError,
} from "@/lib/github/types";
import { suggestBranchName } from "@/lib/github/publish-pin";

// Never touches real GitHub: every client + env dependency is mocked. No real
// token, no real branch, no real PR is ever created here.
const h = vi.hoisted(() => ({
  env: { GITHUB_PUBLISH_TOKEN: "wt" as string | undefined },
  AdminAuthError: class extends Error {},
  requireAdminAuth: vi.fn(),
  read: {
    fetchHeadSha: vi.fn(),
    fetchChecksState: vi.fn(),
    fetchTarball: vi.fn(),
    fetchCommitDate: vi.fn(),
  },
  write: {
    branchExists: vi.fn(),
    branchHead: vi.fn(),
    recursiveTree: vi.fn(),
    createBlob: vi.fn(),
    createTree: vi.fn(),
    createCommit: vi.fn(),
    createBranch: vi.fn(),
    openPullRequest: vi.fn(),
  },
  compileBundle: vi.fn(),
  extractTarball: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env.server", () => ({ serverEnv: h.env }));
vi.mock("@/lib/admin/auth", () => ({
  AdminAuthError: h.AdminAuthError,
  adminUnauthorizedResponse: () => new Response("{}", { status: 401 }),
  requireAdminAuth: h.requireAdminAuth,
}));
vi.mock("@/lib/github/github", () => ({
  createGitHubClient: () => h.read,
  createGitHubWriteClient: () => h.write,
}));
vi.mock("@/lib/content/compile/compile-bundle", () => ({
  compileBundle: h.compileBundle,
  ASSET_PUBLIC_PREFIX: "content-assets",
  GENERATED_DIR: "src/content/generated",
  GENERATED_README: "# Generated content bundle\n",
}));
vi.mock("@/lib/content/compile/tarball", () => ({
  extractTarball: h.extractTarball,
}));
vi.mock("@/lib/content/meta", () => ({
  contentMeta: { sha: "b".repeat(40), counts: {}, compiledAt: "x" },
}));

const HEAD = "a".repeat(40);

const post = (body: unknown): Promise<Response> =>
  POST(
    new Request("https://x/api/admin/publish/pin/open", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }) as unknown as NextRequest
  );

/** Wire the whole happy path; individual tests override the step under test. */
function primeHappyPath(): void {
  h.env.GITHUB_PUBLISH_TOKEN = "wt";
  h.requireAdminAuth.mockReturnValue(undefined);
  h.read.fetchHeadSha.mockResolvedValue(HEAD);
  h.read.fetchChecksState.mockResolvedValue("success");
  h.read.fetchTarball.mockResolvedValue(new Uint8Array([1]));
  h.read.fetchCommitDate.mockResolvedValue("2026-07-14T00:00:00Z");
  h.extractTarball.mockResolvedValue(new Map());
  h.compileBundle.mockReturnValue({
    files: new Map([["meta.json", "{}\n"]]),
    assets: new Map(),
  });
  h.write.branchExists.mockResolvedValue(false);
  h.write.branchHead.mockResolvedValue({ commitSha: "c1", treeSha: "t1" });
  h.write.recursiveTree.mockResolvedValue([
    { path: "apps/web/package.json", mode: "100644", type: "blob", sha: "b1" },
  ]);
  h.write.createBlob.mockResolvedValue("blobsha");
  h.write.createTree.mockResolvedValue("newtree");
  h.write.createCommit.mockResolvedValue("commit1");
  h.write.createBranch.mockResolvedValue(undefined);
  h.write.openPullRequest.mockResolvedValue({
    url: "https://gh/pr/9",
    number: 9,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  primeHappyPath();
});

describe("POST /api/admin/publish/pin/open", () => {
  it("401s when admin auth / same-origin (CSRF) check fails", async () => {
    h.requireAdminAuth.mockImplementation(() => {
      throw new h.AdminAuthError();
    });
    const res = await post({ headSha: HEAD });
    expect(res.status).toBe(401);
    // Never proceeds to any GitHub call.
    expect(h.read.fetchHeadSha).not.toHaveBeenCalled();
    expect(h.write.createBranch).not.toHaveBeenCalled();
  });

  it("501-degrades when the publish token is unset (client keeps manual card)", async () => {
    h.env.GITHUB_PUBLISH_TOKEN = undefined;
    const res = await post({ headSha: HEAD });
    expect(res.status).toBe(501);
    expect(((await res.json()) as { unavailable: boolean }).unavailable).toBe(
      true
    );
    expect(h.read.fetchHeadSha).not.toHaveBeenCalled();
  });

  it("400s on a malformed headSha", async () => {
    const res = await post({ headSha: "not-a-sha" });
    expect(res.status).toBe(400);
  });

  it("409s (stale_head) when HEAD advanced since the page loaded", async () => {
    h.read.fetchHeadSha.mockResolvedValue("c".repeat(40));
    const res = await post({ headSha: HEAD });
    expect(res.status).toBe(409);
    expect(((await res.json()) as { code: string }).code).toBe("stale_head");
    // Refuses BEFORE any write.
    expect(h.write.createTree).not.toHaveBeenCalled();
    expect(h.write.createBranch).not.toHaveBeenCalled();
  });

  it("409s (checks_not_green) when HEAD's CI is not passing", async () => {
    h.read.fetchChecksState.mockResolvedValue("failure");
    const res = await post({ headSha: HEAD });
    expect(res.status).toBe(409);
    expect(((await res.json()) as { code: string }).code).toBe(
      "checks_not_green"
    );
    expect(h.write.createBranch).not.toHaveBeenCalled();
  });

  it("409s (branch_exists) when the publish branch already exists — no force-push", async () => {
    h.write.branchExists.mockResolvedValue(true);
    const res = await post({ headSha: HEAD });
    expect(res.status).toBe(409);
    expect(((await res.json()) as { code: string }).code).toBe("branch_exists");
    expect(h.write.createTree).not.toHaveBeenCalled();
    expect(h.write.createBranch).not.toHaveBeenCalled();
  });

  it("409s (branch_exists) when createBranch races into a 422 RefExistsError", async () => {
    h.write.createBranch.mockRejectedValue(
      new RefExistsError(suggestBranchName(HEAD))
    );
    const res = await post({ headSha: HEAD });
    expect(res.status).toBe(409);
    expect(((await res.json()) as { code: string }).code).toBe("branch_exists");
  });

  it("409s (already_pinned) when the rebuilt tree equals main's tree", async () => {
    h.write.createTree.mockResolvedValue("t1"); // == base treeSha
    const res = await post({ headSha: HEAD });
    expect(res.status).toBe(409);
    expect(((await res.json()) as { code: string }).code).toBe(
      "already_pinned"
    );
    expect(h.write.createCommit).not.toHaveBeenCalled();
    expect(h.write.createBranch).not.toHaveBeenCalled();
  });

  it("opens the PR on the happy path — PR-only, main never written", async () => {
    const res = await post({ headSha: HEAD });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      pr: { url: string; number: number; branch: string };
      pinnedFrom: string;
      pinnedTo: string;
    };
    expect(body.pr.number).toBe(9);
    expect(body.pr.branch).toBe(suggestBranchName(HEAD));
    expect(body.pinnedFrom).toBe("b".repeat(40));
    expect(body.pinnedTo).toBe(HEAD);

    // Rebuild-from-scratch: the tree carries the retained repo file AND the fresh
    // lock/generated files; the commit parents main; the ref is a chore branch.
    const treeArg = h.write.createTree.mock.calls[0]![0] as {
      path: string;
    }[];
    const paths = treeArg.map((e) => e.path);
    expect(paths).toContain("apps/web/package.json");
    expect(paths).toContain("apps/web/content.lock");
    expect(paths).toContain("apps/web/src/content/generated/meta.json");
    expect(paths).toContain("apps/web/src/content/generated/README.md");

    expect(h.write.createCommit.mock.calls[0]![0].parents).toEqual(["c1"]);
    expect(h.write.createBranch.mock.calls[0]![0]).toBe(
      suggestBranchName(HEAD)
    );
    expect(h.write.openPullRequest.mock.calls[0]![0].base).toBe("main");
    // The write client has no update-ref/force-push surface at all.
    expect(h.write).not.toHaveProperty("updateRef");
  });

  it("scrubs a tokened GitHub error before returning it (502)", async () => {
    h.write.branchHead.mockRejectedValue(
      new GitHubUnavailableError(
        "GitHub GET https://api.github.com/repos/x?token=ghs_LEAKED → 403"
      )
    );
    const res = await post({ headSha: HEAD });
    expect(res.status).toBe(502);
    const body = (await res.json()) as { error: string };
    expect(body.error).not.toMatch(/ghs_LEAKED/);
    expect(body.error).not.toMatch(/api\.github\.com/);
    expect(body.error).toContain("[redacted-url]");
  });

  it("502s on a truncated repo tree (refuses a destructive commit)", async () => {
    h.write.recursiveTree.mockRejectedValue(new TreeTruncatedError());
    const res = await post({ headSha: HEAD });
    expect(res.status).toBe(502);
    expect(h.write.createCommit).not.toHaveBeenCalled();
  });
});
