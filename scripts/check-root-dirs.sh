#!/bin/bash
# CI guard (#1005, after the third recurrence in #1003): reject any TRACKED
# top-level directory that is not on the allowlist below.
#
# WHAT THIS CATCHES
# Vitest/Vite has repeatedly written its transformed-module cache to the repo
# ROOT under a random nanoid directory (`<id>/client/<hash>`, `<id>/ssr/<hash>`,
# files full of `__vite_ssr_exports__` and inlined base64 sourcemaps). A
# `git add -A` then sweeps hundreds of files into a commit. It happened three
# times (#879 twice, #1003), and ~18MB survived on main until #1005 because
# .gitignore does not untrack what is already in the index.
#
# WHY AN ALLOWLIST AND NOT MORE .gitignore ENTRIES
# The directory name is a fresh nanoid every run, and gitignore has no regex
# quantifiers — a random name cannot be matched generically. Listing each one
# after the fact is strictly reactive: it never stops the FIRST commit, which is
# the only one that matters. An allowlist inverts that: anything new is refused
# by default and a genuinely new top-level directory costs one line here, in a
# review where a human sees it.
#
# apps/web/vitest.config.ts also pins `cacheDir` so the cache cannot reach the
# root in the first place. That fixes the known generator; this guard covers
# every generator we have not met yet.
#
# Only DIRECTORIES are checked. Top-level files are noisy, low-risk, and
# routinely legitimate (configs, lockfiles, docs).
#
# Test seam: CHECK_ROOT_DIRS_ROOT points the scan at a fixture repo.
set -uo pipefail

root="${CHECK_ROOT_DIRS_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"

# Every top-level directory the repo legitimately tracks. Adding one is a
# deliberate, reviewable act — that is the entire point of the guard.
ALLOWED=(
  ".claude"
  ".github"
  ".husky"
  ".superpowers"
  "apps"
  "docs"
  "onchain-academy"
  "packages"
  "scripts"
  "supabase"
)

cd "$root" || { echo "check-root-dirs: cannot cd to $root" >&2; exit 2; }

# `git ls-tree HEAD` lists what is COMMITTED, which is what we care about —
# untracked scratch dirs on a developer's disk are their own business.
#
# Read loop rather than `mapfile`/`readarray`: those are bash 4+, and macOS
# ships bash 3.2, so the guard would abort on a maintainer's laptop while
# passing in CI. The self-test caught exactly that.
tracked=()
while IFS= read -r line; do
  [ -n "$line" ] && tracked+=("$line")
done < <(git ls-tree HEAD --name-only -d 2>/dev/null)

if [ ${#tracked[@]} -eq 0 ]; then
  echo "check-root-dirs: no tracked top-level directories found (not a git repo?)" >&2
  exit 2
fi

violations=()
for dir in "${tracked[@]}"; do
  allowed=false
  for ok in "${ALLOWED[@]}"; do
    [ "$dir" = "$ok" ] && { allowed=true; break; }
  done
  $allowed || violations+=("$dir")
done

if [ ${#violations[@]} -gt 0 ]; then
  echo "✗ Unexpected tracked top-level director$([ ${#violations[@]} -eq 1 ] && echo y || echo ies):"
  for v in "${violations[@]}"; do
    count=$(git ls-tree -r HEAD --name-only "$v" 2>/dev/null | wc -l | tr -d ' ')
    echo "    $v/  ($count files)"
  done
  echo
  echo "If this is a build/cache artifact (Vitest and Vite have escaped to the"
  echo "repo root three times — see #1003/#1005), remove it:"
  echo "    git rm -r --cached <dir>"
  echo "and pin the tool's cache location so it cannot recur."
  echo
  echo "If it is a genuine new top-level directory, add it to ALLOWED in"
  echo "scripts/check-root-dirs.sh in the same PR."
  exit 1
fi

echo "✓ All ${#tracked[@]} tracked top-level directories are on the allowlist."
