import "server-only";
import { serverEnv } from "@/lib/env.server";
import { type ChecksState, GitHubUnavailableError } from "./types";

const REPO = "solanabr/academy-courses";
const BRANCH = "main";
const API = "https://api.github.com";

export interface GitHubClient {
  /**
   * Download a repo tarball at `sha`. `signal` lets the caller bound the whole
   * fetch (redirect + body read) with a timeout — aborting the fetch aborts the
   * response stream too. Existing callers pass none (unbounded, unchanged).
   */
  fetchTarball(sha: string, signal?: AbortSignal): Promise<Uint8Array>;
  fetchHeadSha(): Promise<string>;
  fetchChecksState(sha: string): Promise<ChecksState>;
  /** Commits `head` is ahead of `base` (compare API `ahead_by`). */
  fetchAheadBy(base: string, head: string): Promise<number>;
}

interface Opts {
  token?: string;
  fetchImpl?: typeof fetch;
}

export function createGitHubClient(opts: Opts = {}): GitHubClient {
  const token = "token" in opts ? opts.token : serverEnv.GITHUB_TOKEN;
  const doFetch = opts.fetchImpl ?? fetch;

  async function call(
    path: string,
    accept: string,
    signal?: AbortSignal
  ): Promise<Response> {
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
        signal,
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
    async fetchTarball(sha, signal) {
      // `tarball/<sha>` 302-redirects to codeload; fetch follows redirects by default.
      const res = await call(
        `/repos/${REPO}/tarball/${sha}`,
        "application/vnd.github+json",
        signal
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
      // `filter=latest` (the API default, pinned explicitly) drops superseded
      // re-run attempts, so a check that failed and was re-run green is judged
      // on its latest attempt only. `per_page=100` raises the default page of
      // 30 — this endpoint PAGINATES, and an unpaginated read silently hides
      // every run past the first page.
      const res = await call(
        `/repos/${REPO}/commits/${sha}/check-runs?filter=latest&per_page=100`,
        "application/vnd.github+json"
      );
      const body = (await res.json()) as {
        total_count?: number;
        check_runs?: { status?: string; conclusion?: string | null }[];
      };
      const runs = body.check_runs ?? [];
      if (runs.length === 0) return "unknown";
      // More runs exist than this page returned. We cannot see the rest, and a
      // failing invisible run must never be waved past the sync gate as green —
      // so the verdict is UNKNOWN, not a fold over a partial sample.
      if (
        typeof body.total_count === "number" &&
        body.total_count > runs.length
      ) {
        console.warn(
          `[github] check-runs for ${sha.slice(0, 7)}: ${body.total_count} total but only ${runs.length} returned — verdict UNKNOWN (invisible runs must not read green)`
        );
        return "unknown";
      }
      // A run only counts as green when its terminal conclusion is exactly
      // `success`. Every other terminal conclusion — failure/timed_out/
      // cancelled/action_required/stale AND neutral/skipped — blocks the sync:
      // we cannot tell a *required* skipped check (which must block) from an
      // optional one via the Checks API, so a skipped/neutral required check
      // must never read green and be waved past the Zod/executor gate. A run
      // with no conclusion yet is still in progress → pending.
      const isTerminal = (c: string | null | undefined): c is string =>
        c != null && c !== "";
      if (
        runs.some((r) => isTerminal(r.conclusion) && r.conclusion !== "success")
      )
        return "failure";
      if (runs.some((r) => !isTerminal(r.conclusion))) return "pending";
      return "success";
    },

    async fetchAheadBy(base, head) {
      const res = await call(
        `/repos/${REPO}/compare/${base}...${head}`,
        "application/vnd.github+json"
      );
      const body = (await res.json()) as { ahead_by?: number };
      if (typeof body.ahead_by !== "number")
        throw new GitHubUnavailableError("compare response missing ahead_by");
      return body.ahead_by;
    },
  };
}
