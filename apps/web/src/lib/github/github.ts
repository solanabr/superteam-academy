import "server-only";
import {
  type ChecksState,
  GitHubUnavailableError,
  RefExistsError,
  TreeTruncatedError,
} from "./types";
import { APP_REPO } from "./publish-pin";
import { serverEnv } from "@/lib/env.server";

const REPO = "solanabr/courses-academy";
const BRANCH = "main";
const API = "https://api.github.com";

export interface GitHubClient {
  fetchTarball(sha: string): Promise<Uint8Array>;
  fetchHeadSha(): Promise<string>;
  fetchChecksState(sha: string): Promise<ChecksState>;
  /** Commits `head` is ahead of `base` (compare API `ahead_by`). */
  fetchAheadBy(base: string, head: string): Promise<number>;
  /** The commit's own committer date (ISO) — the deterministic `meta.compiledAt`. */
  fetchCommitDate(sha: string): Promise<string>;
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

    async fetchCommitDate(sha) {
      const res = await call(
        `/repos/${REPO}/commits/${sha}`,
        "application/vnd.github+json"
      );
      const body = (await res.json()) as {
        commit?: { committer?: { date?: string } };
      };
      const date = body.commit?.committer?.date;
      if (!date)
        throw new GitHubUnavailableError(`commit ${sha} has no committer date`);
      return date;
    },
  };
}

// ── write client (APP monorepo, GITHUB_PUBLISH_TOKEN) ────────────────────────

/** A leaf/subtree entry in a git tree POST (blob file, commit gitlink, subtree). */
export interface GitTreeEntry {
  path: string;
  mode: string;
  type: "blob" | "tree" | "commit";
  sha: string;
}

/**
 * Write-scoped GitHub client for the APP monorepo. Powers the one-click publish
 * route ONLY: it can create blobs/trees/commits, a `chore/content-pin-<sha>`
 * branch, and a PR — it is structurally incapable of writing `main` (no
 * update-ref / force-push method exists). `main` branch protection is the
 * backstop; the PAT-created ref fires the `push` CI event so the byte-check runs
 * pre-merge. Uses `GITHUB_PUBLISH_TOKEN`, never the read-scoped `GITHUB_TOKEN`.
 */
export interface GitHubWriteClient {
  /** The branch tip's commit sha + its tree sha (one call). */
  branchHead(branch: string): Promise<{ commitSha: string; treeSha: string }>;
  /** Every entry of a tree, recursively. Throws `TreeTruncatedError` if the API
   *  truncated the read — a partial list would silently drop repo files. */
  recursiveTree(treeSha: string): Promise<GitTreeEntry[]>;
  /** Upload a blob (bytes, base64-encoded on the wire); returns its sha. */
  createBlob(bytes: Uint8Array): Promise<string>;
  /** Create a brand-new tree from an explicit entry list (NO base_tree). */
  createTree(entries: GitTreeEntry[]): Promise<string>;
  createCommit(input: {
    message: string;
    tree: string;
    parents: string[];
  }): Promise<string>;
  /** True if `refs/heads/<branch>` already exists (idempotency pre-check). */
  branchExists(branch: string): Promise<boolean>;
  /** Create `refs/heads/<branch>` → sha. Throws `RefExistsError` on 422. */
  createBranch(branch: string, sha: string): Promise<void>;
  openPullRequest(input: {
    title: string;
    head: string;
    base: string;
    body: string;
  }): Promise<{ url: string; number: number }>;
}

interface WriteOpts {
  token?: string;
  fetchImpl?: typeof fetch;
  repo?: string;
}

export function createGitHubWriteClient(
  opts: WriteOpts = {}
): GitHubWriteClient {
  const token = "token" in opts ? opts.token : serverEnv.GITHUB_PUBLISH_TOKEN;
  const doFetch = opts.fetchImpl ?? fetch;
  const repo = opts.repo ?? APP_REPO;

  async function call(path: string, init: RequestInit = {}): Promise<Response> {
    if (!token) {
      throw new GitHubUnavailableError(
        "GITHUB_PUBLISH_TOKEN is not configured"
      );
    }
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };
    if (init.body !== undefined) headers["Content-Type"] = "application/json";
    try {
      return await doFetch(`${API}${path}`, { ...init, headers });
    } catch (e) {
      throw new GitHubUnavailableError(
        e instanceof Error ? e.message : String(e)
      );
    }
  }

  /** Throw a scrub-safe error (status + path only, no token, no body) on non-2xx. */
  function unavailable(method: string, path: string, status: number): never {
    throw new GitHubUnavailableError(`GitHub ${method} ${path} → ${status}`);
  }

  return {
    async branchHead(branch) {
      const path = `/repos/${repo}/commits/${branch}`;
      const res = await call(path);
      if (!res.ok) unavailable("GET", path, res.status);
      const body = (await res.json()) as {
        sha?: string;
        commit?: { tree?: { sha?: string } };
      };
      const commitSha = body.sha;
      const treeSha = body.commit?.tree?.sha;
      if (!commitSha || !treeSha) {
        throw new GitHubUnavailableError(
          `branch ${branch} response missing commit/tree sha`
        );
      }
      return { commitSha, treeSha };
    },

    async recursiveTree(treeSha) {
      const path = `/repos/${repo}/git/trees/${treeSha}?recursive=1`;
      const res = await call(path);
      if (!res.ok) unavailable("GET", path, res.status);
      const body = (await res.json()) as {
        tree?: GitTreeEntry[];
        truncated?: boolean;
      };
      if (body.truncated) throw new TreeTruncatedError();
      return body.tree ?? [];
    },

    async createBlob(bytes) {
      const path = `/repos/${repo}/git/blobs`;
      const res = await call(path, {
        method: "POST",
        body: JSON.stringify({
          content: Buffer.from(bytes).toString("base64"),
          encoding: "base64",
        }),
      });
      if (!res.ok) unavailable("POST", path, res.status);
      const body = (await res.json()) as { sha?: string };
      if (!body.sha)
        throw new GitHubUnavailableError("blob response missing sha");
      return body.sha;
    },

    async createTree(entries) {
      const path = `/repos/${repo}/git/trees`;
      const res = await call(path, {
        method: "POST",
        body: JSON.stringify({ tree: entries }),
      });
      if (!res.ok) unavailable("POST", path, res.status);
      const body = (await res.json()) as { sha?: string };
      if (!body.sha)
        throw new GitHubUnavailableError("tree response missing sha");
      return body.sha;
    },

    async createCommit(input) {
      const path = `/repos/${repo}/git/commits`;
      const res = await call(path, {
        method: "POST",
        body: JSON.stringify(input),
      });
      if (!res.ok) unavailable("POST", path, res.status);
      const body = (await res.json()) as { sha?: string };
      if (!body.sha)
        throw new GitHubUnavailableError("commit response missing sha");
      return body.sha;
    },

    async branchExists(branch) {
      const path = `/repos/${repo}/git/ref/heads/${branch}`;
      const res = await call(path);
      if (res.status === 404) return false;
      if (!res.ok) unavailable("GET", path, res.status);
      return true;
    },

    async createBranch(branch, sha) {
      const path = `/repos/${repo}/git/refs`;
      const res = await call(path, {
        method: "POST",
        body: JSON.stringify({ ref: `refs/heads/${branch}`, sha }),
      });
      // 422 = ref already exists → idempotent 409-degrade, never a force-push.
      if (res.status === 422) throw new RefExistsError(branch);
      if (!res.ok) unavailable("POST", path, res.status);
    },

    async openPullRequest(input) {
      const path = `/repos/${repo}/pulls`;
      const res = await call(path, {
        method: "POST",
        body: JSON.stringify(input),
      });
      if (!res.ok) unavailable("POST", path, res.status);
      const body = (await res.json()) as {
        html_url?: string;
        number?: number;
      };
      if (!body.html_url || typeof body.number !== "number") {
        throw new GitHubUnavailableError(
          "pull request response missing fields"
        );
      }
      return { url: body.html_url, number: body.number };
    },
  };
}
