/**
 * Build the OAuth callback URL, returning the learner to the page they signed in
 * from via a `next` param (#619 — the branch otherwise always lands on
 * /dashboard, stranding someone mid-lesson and away from their banked-progress
 * replay).
 *
 * Client-side guard (defense in depth): the callback re-sanitizes `next` server
 * side, but this never even emits an unsafe one. Only a same-origin, path-shaped
 * value is attached — anything protocol-relative (`//host`), scheme-bearing
 * (`javascript:`, and any `:`), or backslash-carrying is dropped, so the learner
 * simply lands on the callback default rather than an attacker-chosen target.
 */
export function isSafeNextPath(path: string): boolean {
  return (
    path.length > 1 && // "/" alone adds nothing over the callback default
    path.startsWith("/") &&
    !path.startsWith("//") && // protocol-relative URL
    !path.includes("\\") && // backslash host-relative bypass
    !path.includes(":") // scheme injection (javascript:, data:, …)
  );
}

export function buildOAuthRedirect(origin: string, pathname: string): string {
  const callback = `${origin}/api/auth/callback`;
  return isSafeNextPath(pathname)
    ? `${callback}?next=${encodeURIComponent(pathname)}`
    : callback;
}
