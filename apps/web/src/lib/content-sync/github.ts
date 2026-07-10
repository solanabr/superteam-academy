import "server-only";
import { type ChecksState, GitHubUnavailableError } from "./types";
import { serverEnv } from "@/lib/env.server";

const REPO = "solanabr/academy-courses";
const BRANCH = "main";
const API = "https://api.github.com";

export interface GitHubClient {
  fetchTarball(sha: string): Promise<Uint8Array>;
  fetchHeadSha(): Promise<string>;
  fetchChecksState(sha: string): Promise<ChecksState>;
}

interface Opts {
  token?: string;
  fetchImpl?: typeof fetch;
}

export function createGitHubClient(opts: Opts = {}): GitHubClient {
  const token = "token" in opts ? opts.token : serverEnv.GITHUB_TOKEN;
  const doFetch = opts.fetchImpl ?? fetch;

  async function call(path: string, accept: string): Promise<Response> {
    if (!token) {
      throw new GitHubUnavailableError("GITHUB_TOKEN is not configured");
    }
    let res: Response;
    try {
      res = await doFetch(`${API}${path}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: accept,
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });
    } catch (e) {
      throw new GitHubUnavailableError(
        e instanceof Error ? e.message : String(e)
      );
    }
    if (!res.ok) {
      throw new GitHubUnavailableError(`GitHub ${path} → ${res.status}`);
    }
    return res;
  }

  return {
    async fetchTarball(sha) {
      // `tarball/<sha>` 302-redirects to codeload; fetch follows redirects by default.
      const res = await call(
        `/repos/${REPO}/tarball/${sha}`,
        "application/vnd.github+json"
      );
      return new Uint8Array(await res.arrayBuffer());
    },

    async fetchHeadSha() {
      const res = await call(
        `/repos/${REPO}/commits/${BRANCH}`,
        "application/vnd.github+json"
      );
      const body = (await res.json()) as { sha?: string };
      if (!body.sha)
        throw new GitHubUnavailableError("HEAD commit response missing sha");
      return body.sha;
    },

    async fetchChecksState(sha) {
      const res = await call(
        `/repos/${REPO}/commits/${sha}/check-runs`,
        "application/vnd.github+json"
      );
      const body = (await res.json()) as {
        check_runs?: { status?: string; conclusion?: string | null }[];
      };
      const runs = body.check_runs ?? [];
      if (runs.length === 0) return "unknown";
      const failed = new Set([
        "failure",
        "timed_out",
        "cancelled",
        "action_required",
        "stale",
      ]);
      const done = new Set(["success", "neutral", "skipped"]);
      if (runs.some((r) => r.conclusion && failed.has(r.conclusion)))
        return "failure";
      if (runs.some((r) => !r.conclusion || !done.has(r.conclusion)))
        return "pending";
      return "success";
    },
  };
}
