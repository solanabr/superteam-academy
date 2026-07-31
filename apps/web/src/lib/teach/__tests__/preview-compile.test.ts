/* eslint-disable import/order -- vi.mock factories are hoisted above imports;
   `server-only` and the env module must both be stubbed before the graph loads. */
import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

// `serverEnv` snapshots process.env at module init, so mutating process.env in a
// test would never reach it. Mock the module with an object this file controls.
const env = vi.hoisted(() => ({
  serverEnv: { GITHUB_TOKEN: undefined as string | undefined },
}));
vi.mock("@/lib/env.server", () => env);

import { fetchPrHead } from "../preview-compile";
import { GitHubUnavailableError } from "@/lib/github/types";

const PR_BODY = {
  head: { sha: "a".repeat(40), ref: "feat/x" },
  title: "Add a course",
  state: "open",
  user: { login: "someone" },
};

function jsonRes(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

/** The headers the implementation passed to `fetch` on its first call. */
function sentHeaders(mock: ReturnType<typeof vi.fn>): Record<string, string> {
  const call = mock.mock.calls[0];
  if (!call) throw new Error("fetch was never called");
  return (call[1] as RequestInit).headers as Record<string, string>;
}

beforeEach(() => {
  env.serverEnv.GITHUB_TOKEN = undefined;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchPrHead auth behaviour (#830)", () => {
  it("works with NO token — academy-courses is public", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonRes(PR_BODY));
    vi.stubGlobal("fetch", fetchMock);

    const head = await fetchPrHead(24);

    expect(head.sha).toBe("a".repeat(40));
    expect(head.author).toBe("someone");
    // The whole point of #830: no Authorization header, and no throw.
    expect(sentHeaders(fetchMock).Authorization).toBeUndefined();
  });

  it("sends the token when one IS configured", async () => {
    env.serverEnv.GITHUB_TOKEN = "ghp_test";
    const fetchMock = vi.fn().mockResolvedValue(jsonRes(PR_BODY));
    vi.stubGlobal("fetch", fetchMock);

    await fetchPrHead(24);

    expect(sentHeaders(fetchMock).Authorization).toBe("Bearer ghp_test");
  });

  it("names the token when anonymous requests are rate-limited", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("", {
          status: 403,
          headers: { "x-ratelimit-remaining": "0" },
        })
      )
    );

    await expect(fetchPrHead(24)).rejects.toThrow(/GITHUB_TOKEN/);
  });

  it("does not mistake a plain 403 for a rate limit", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("", { status: 403 }))
    );

    // Still an error, but not the rate-limit advice — `remaining` was not 0.
    await expect(fetchPrHead(24)).rejects.toThrow(/403/);
  });

  it("reports a missing PR as not found", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("", { status: 404 }))
    );

    await expect(fetchPrHead(999)).rejects.toThrow(GitHubUnavailableError);
    await expect(fetchPrHead(999)).rejects.toThrow(/not found/i);
  });
});
