/**
 * Parses GitHub pull-request URLs for the course-content repo (#828).
 *
 * Pure and dependency-free so it can be unit-tested and shared by the API route
 * and the client form. The repo is PINNED here rather than taken from the URL:
 * the preview endpoint downloads and compiles whatever it is pointed at, so
 * accepting an arbitrary owner/repo would turn it into a general-purpose
 * GitHub fetcher (SSRF + a way to run the compiler over untrusted trees).
 */

export const CONTENT_REPO_OWNER = "solanabr";
export const CONTENT_REPO_NAME = "academy-courses";
export const CONTENT_REPO = `${CONTENT_REPO_OWNER}/${CONTENT_REPO_NAME}`;

export type PrUrlError =
  | "empty"
  | "malformed"
  | "wrong_host"
  | "wrong_repo"
  | "not_a_pull_request";

export type ParsedPrUrl =
  | { ok: true; owner: string; repo: string; number: number }
  | { ok: false; error: PrUrlError };

/** Accepts `github.com` and `www.github.com`, http or https. */
function isGitHubHost(host: string): boolean {
  return host === "github.com" || host === "www.github.com";
}

/**
 * Parses an academy-courses PR URL into its components.
 *
 * Accepted:  https://github.com/solanabr/academy-courses/pull/42
 *            (trailing segments like `/files` or `#discussion` are ignored)
 * Rejected:  other hosts, other repos, issue URLs, non-numeric PR numbers.
 *
 * A bare PR number (`"42"`) is also accepted as a convenience, since the repo
 * is fixed anyway.
 */
export function parsePrUrl(input: string): ParsedPrUrl {
  const raw = input.trim();
  if (raw.length === 0) return { ok: false, error: "empty" };

  // Convenience: a bare number (or "#42") means "PR N in the content repo".
  const bare = /^#?(\d+)$/.exec(raw);
  if (bare) {
    const number = Number(bare[1]);
    if (!Number.isSafeInteger(number) || number <= 0) {
      return { ok: false, error: "malformed" };
    }
    return {
      ok: true,
      owner: CONTENT_REPO_OWNER,
      repo: CONTENT_REPO_NAME,
      number,
    };
  }

  let url: URL;
  try {
    // Tolerate a pasted URL with no scheme (github.com/...).
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return { ok: false, error: "malformed" };
  }

  if (!isGitHubHost(url.hostname.toLowerCase())) {
    return { ok: false, error: "wrong_host" };
  }

  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length < 4) return { ok: false, error: "malformed" };

  const [owner, repo, kind, numberRaw] = segments as [
    string,
    string,
    string,
    string,
  ];

  if (
    owner.toLowerCase() !== CONTENT_REPO_OWNER ||
    repo.toLowerCase() !== CONTENT_REPO_NAME
  ) {
    return { ok: false, error: "wrong_repo" };
  }

  // `pull` is the web UI path; `pulls` is the API path. Anything else (issues,
  // commits, tree) is not a PR.
  if (kind !== "pull" && kind !== "pulls") {
    return { ok: false, error: "not_a_pull_request" };
  }

  if (!/^\d+$/.test(numberRaw)) {
    return { ok: false, error: "not_a_pull_request" };
  }
  const number = Number(numberRaw);
  if (!Number.isSafeInteger(number) || number <= 0) {
    return { ok: false, error: "malformed" };
  }

  return { ok: true, owner, repo, number };
}
