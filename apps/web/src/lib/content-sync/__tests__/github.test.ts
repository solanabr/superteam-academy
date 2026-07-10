import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createGitHubClient } from "../github";
import { GitHubUnavailableError } from "../types";

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
      "https://api.github.com/repos/solanabr/academy-courses/tarball/abc123"
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
});
