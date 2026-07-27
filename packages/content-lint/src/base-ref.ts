import { resolvesRef } from "./git";

/**
 * Map a raw base ref (`GITHUB_BASE_REF` / `LINT_BASE_REF`) to a ref that resolves
 * in the linter's checkout.
 *
 * `github.base_ref` is a BARE branch name — usually "main", but also "release/1.0"
 * or "hotfix/x". In the content-lint checkout the base branch lives under
 * `origin/`, so a bare name must be prefixed with `origin/` REGARDLESS of any slash
 * it contains. The previous `raw.includes("/")` proxy for "already qualified" left
 * a slashed branch name verbatim, so it never resolved — and post-#747 an
 * explicit-but-unresolvable base is a HARD CI failure, so every content PR against
 * a slashed base branch would red-wall (#748).
 *
 * Resolution order:
 *   1. Already remote-/fully-qualified (`origin/…`, `refs/…`) → verbatim.
 *   2. Bare branch name → `origin/<raw>` when that resolves (the #748 fix; also
 *      preserves the old "main" → "origin/main" target for the no-slash case).
 *   3. Otherwise a SHA or local ref that resolves as-is → verbatim.
 *   4. Nothing resolves → return the `origin/`-qualified form so the downstream
 *      gate's #747 hard error names the ref CI meant to fetch. A genuinely bogus
 *      ref still ERRORs; this never silently fails open.
 *
 * Only two candidates are ever tried (`origin/<raw>`, then `<raw>`), so an
 * unresolvable ref cannot accidentally match some unrelated object.
 */
export function normalizeBaseRef(
  raw: string | undefined,
  root: string
): string | undefined {
  if (!raw) return undefined;
  if (raw.startsWith("origin/") || raw.startsWith("refs/")) return raw;
  const prefixed = `origin/${raw}`;
  if (resolvesRef(root, prefixed)) return prefixed;
  if (resolvesRef(root, raw)) return raw;
  return prefixed;
}
