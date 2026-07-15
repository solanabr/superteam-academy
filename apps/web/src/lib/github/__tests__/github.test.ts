import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createGitHubClient, createGitHubWriteClient } from "../github";
import {
  GitHubUnavailableError,
  RefExistsError,
  TreeTruncatedError,
} from "../types";

const okJson = (body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

describe("GitHubClient", () => {
  it("authenticates the tarball request and follows to bytes", async () => {
    const fetchImpl = vi.fn(
      async (_url: string, _init?: RequestInit) =>
        new Response(new Uint8Array([1, 2, 3]), { status: 200 })
    );
    const client = createGitHubClient({
      token: "ghp_x",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    const bytes = await client.fetchTarball("abc123");
    expect(Array.from(bytes)).toEqual([1, 2, 3]);
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toBe(
      "https://api.github.com/repos/solanabr/courses-academy/tarball/abc123"
    );
    expect(init?.headers).toMatchObject({
      Authorization: "Bearer ghp_x",
    });
  });

  it("reads HEAD sha from the branch ref", async () => {
    const fetchImpl = vi.fn(async (_url: string, _init?: RequestInit) =>
      okJson({ sha: "headsha999" })
    );
    const client = createGitHubClient({
      token: "t",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(await client.fetchHeadSha()).toBe("headsha999");
    expect(fetchImpl.mock.calls[0]![0]).toContain("/commits/main");
  });

  it("folds check-runs into a single state", async () => {
    const client = createGitHubClient({
      token: "t",
      fetchImpl: (async () =>
        okJson({
          check_runs: [{ conclusion: "success" }, { conclusion: "failure" }],
        })) as unknown as typeof fetch,
    });
    expect(await client.fetchChecksState("s")).toBe("failure");
  });

  it("reports pending when a run is still in progress", async () => {
    const client = createGitHubClient({
      token: "t",
      fetchImpl: (async () =>
        okJson({
          check_runs: [
            { conclusion: "success" },
            { status: "in_progress", conclusion: null },
          ],
        })) as unknown as typeof fetch,
    });
    expect(await client.fetchChecksState("s")).toBe("pending");
  });

  it("does NOT read a skipped check as green (a required skipped check must block)", async () => {
    // GitHub reports a skipped required check as conclusion `skipped`; the Checks
    // API can't tell us it was required, so a non-`success` terminal conclusion
    // must never fold to `success` and be waved past the sync gate.
    const client = createGitHubClient({
      token: "t",
      fetchImpl: (async () =>
        okJson({
          check_runs: [{ conclusion: "success" }, { conclusion: "skipped" }],
        })) as unknown as typeof fetch,
    });
    expect(await client.fetchChecksState("s")).toBe("failure");
  });

  it("does NOT read a neutral check as green", async () => {
    const client = createGitHubClient({
      token: "t",
      fetchImpl: (async () =>
        okJson({
          check_runs: [{ conclusion: "neutral" }],
        })) as unknown as typeof fetch,
    });
    expect(await client.fetchChecksState("s")).toBe("failure");
  });

  it("is green only when every run concluded success", async () => {
    const client = createGitHubClient({
      token: "t",
      fetchImpl: (async () =>
        okJson({
          check_runs: [{ conclusion: "success" }, { conclusion: "success" }],
        })) as unknown as typeof fetch,
    });
    expect(await client.fetchChecksState("s")).toBe("success");
  });

  it("throws GitHubUnavailableError without a token", async () => {
    const client = createGitHubClient({
      token: undefined,
      fetchImpl: (async () => new Response()) as unknown as typeof fetch,
    });
    await expect(client.fetchHeadSha()).rejects.toBeInstanceOf(
      GitHubUnavailableError
    );
  });

  it("throws GitHubUnavailableError on a non-2xx", async () => {
    const client = createGitHubClient({
      token: "t",
      fetchImpl: (async () =>
        new Response("rate limited", {
          status: 403,
        })) as unknown as typeof fetch,
    });
    await expect(client.fetchHeadSha()).rejects.toBeInstanceOf(
      GitHubUnavailableError
    );
  });

  it("reads the commit's committer date", async () => {
    const client = createGitHubClient({
      token: "t",
      fetchImpl: (async () =>
        okJson({
          commit: { committer: { date: "2026-07-14T16:55:35Z" } },
        })) as unknown as typeof fetch,
    });
    expect(await client.fetchCommitDate("s")).toBe("2026-07-14T16:55:35Z");
  });
});

describe("GitHubWriteClient", () => {
  it("targets the APP monorepo, not the content repo", async () => {
    const fetchImpl = vi.fn(async (_url: string, _init?: RequestInit) =>
      okJson({ sha: "c1", commit: { tree: { sha: "t1" } } })
    );
    const client = createGitHubWriteClient({
      token: "wt",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    const head = await client.branchHead("main");
    expect(head).toEqual({ commitSha: "c1", treeSha: "t1" });
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toBe(
      "https://api.github.com/repos/solanabr/superteam-academy/commits/main"
    );
    expect((init?.headers as Record<string, string>).Authorization).toBe(
      "Bearer wt"
    );
  });

  it("base64-encodes blob bytes and returns the sha", async () => {
    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as {
        content: string;
        encoding: string;
      };
      expect(body.encoding).toBe("base64");
      expect(Buffer.from(body.content, "base64")).toEqual(
        Buffer.from([1, 2, 3])
      );
      return okJson({ sha: "blobsha" });
    });
    const client = createGitHubWriteClient({
      token: "wt",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(await client.createBlob(new Uint8Array([1, 2, 3]))).toBe("blobsha");
  });

  it("creates a tree WITHOUT a base_tree (rebuild-from-scratch)", async () => {
    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      expect(body).not.toHaveProperty("base_tree");
      expect(body).toHaveProperty("tree");
      return okJson({ sha: "newtree" });
    });
    const client = createGitHubWriteClient({
      token: "wt",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    const sha = await client.createTree([
      { path: "a", mode: "100644", type: "blob", sha: "x" },
    ]);
    expect(sha).toBe("newtree");
  });

  it("throws TreeTruncatedError on a truncated recursive tree", async () => {
    const client = createGitHubWriteClient({
      token: "wt",
      fetchImpl: (async () =>
        okJson({ tree: [], truncated: true })) as unknown as typeof fetch,
    });
    await expect(client.recursiveTree("t")).rejects.toBeInstanceOf(
      TreeTruncatedError
    );
  });

  it("maps createBranch 422 to RefExistsError (idempotency, no force-push)", async () => {
    const client = createGitHubWriteClient({
      token: "wt",
      fetchImpl: (async () =>
        new Response("{}", { status: 422 })) as unknown as typeof fetch,
    });
    await expect(
      client.createBranch("chore/content-pin-abc", "c1")
    ).rejects.toBeInstanceOf(RefExistsError);
  });

  it("branchExists is false on 404, true on 200", async () => {
    const missing = createGitHubWriteClient({
      token: "wt",
      fetchImpl: (async () =>
        new Response("{}", { status: 404 })) as unknown as typeof fetch,
    });
    expect(await missing.branchExists("b")).toBe(false);
    const present = createGitHubWriteClient({
      token: "wt",
      fetchImpl: (async () =>
        okJson({ ref: "refs/heads/b" })) as unknown as typeof fetch,
    });
    expect(await present.branchExists("b")).toBe(true);
  });

  it("opens a PR and returns url + number", async () => {
    const client = createGitHubWriteClient({
      token: "wt",
      fetchImpl: (async () =>
        okJson({
          html_url: "https://gh/pr/7",
          number: 7,
        })) as unknown as typeof fetch,
    });
    expect(
      await client.openPullRequest({
        title: "t",
        head: "b",
        base: "main",
        body: "x",
      })
    ).toEqual({ url: "https://gh/pr/7", number: 7 });
  });

  it("throws GitHubUnavailableError when the write token is unset", async () => {
    const client = createGitHubWriteClient({
      token: undefined,
      fetchImpl: (async () => new Response()) as unknown as typeof fetch,
    });
    await expect(client.branchHead("main")).rejects.toBeInstanceOf(
      GitHubUnavailableError
    );
  });

  it("surfaces a scrub-safe status/path error (no token, no body) on non-2xx", async () => {
    const client = createGitHubWriteClient({
      token: "wt",
      fetchImpl: (async () =>
        new Response("secret-bearing body", {
          status: 500,
        })) as unknown as typeof fetch,
    });
    await client.createTree([]).catch((e: unknown) => {
      const msg = e instanceof Error ? e.message : String(e);
      expect(msg).not.toContain("wt");
      expect(msg).not.toContain("secret-bearing body");
      expect(msg).toContain("→ 500");
    });
  });
});
