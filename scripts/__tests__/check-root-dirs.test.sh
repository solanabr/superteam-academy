#!/bin/bash
# Exercises scripts/check-root-dirs.sh against fixture repos so the guard is
# never shipped unexercised (#662 "prove it fails on a bad line"; #614). Runs in
# the Root directory guard workflow *before* the real scan.
#
# The cases are the ones that have actually bitten us: a clean tree passes, a
# nanoid cache dump is rejected, and — the case the .gitignore workaround kept
# missing — a dump that is GITIGNORED but still TRACKED is still rejected,
# because gitignore never untracks what is already in the index.
#
# Pure bash, no test framework: CI runs the monorepo vitest via `pnpm -r test`,
# not the root `scripts/` suite, so a vitest spec here would not gate.
set -uo pipefail

guard="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/check-root-dirs.sh"
fails=0
tmproot=""
fixture=""

cleanup() { [ -n "$tmproot" ] && rm -rf "$tmproot"; }
trap cleanup EXIT

# new_fixture — a throwaway git repo with the given tracked top-level dirs.
new_fixture() {
  fixture="$tmproot/$1"; shift
  mkdir -p "$fixture"
  git -C "$fixture" init -q
  git -C "$fixture" config user.email t@t.t
  git -C "$fixture" config user.name t
  for d in "$@"; do
    mkdir -p "$fixture/$d"
    echo x > "$fixture/$d/file.txt"
  done
  git -C "$fixture" add -A
  git -C "$fixture" commit -qm fixture
}

run() {
  local expected="$1" desc="$2" out rc
  out="$(CHECK_ROOT_DIRS_ROOT="$fixture" bash "$guard" 2>&1)"
  rc=$?
  if [ "$rc" -eq "$expected" ]; then
    echo "  ok   $desc"
  else
    echo "  FAIL $desc (expected exit $expected, got $rc)"
    echo "$out" | sed 's/^/       /'
    fails=$((fails + 1))
  fi
}

tmproot="$(mktemp -d)"

echo "check-root-dirs self-test"

new_fixture clean apps docs packages scripts
run 0 "accepts a tree of allowlisted directories only"

# The exact shape that escaped three times: a nanoid dir holding client/ and
# ssr/ subtrees of hashed files.
new_fixture dumped apps docs "Gals8246YhWF8nB0-8urE/client" "Gals8246YhWF8nB0-8urE/ssr"
run 1 "rejects a nanoid Vitest/Vite cache dump at the root"

# The failure mode the .gitignore workaround could never catch: listed in
# .gitignore, yet still in the index (BgslqnjILApu8jL_vIFuC did exactly this
# until #1005).
new_fixture ignored_but_tracked apps "BgslqnjILApu8jL_vIFuC/client"
printf '/BgslqnjILApu8jL_vIFuC/\n' > "$fixture/.gitignore"
git -C "$fixture" add -A && git -C "$fixture" commit -qm gitignore
run 1 "rejects a dump that is gitignored but still TRACKED"

# A dir present on disk but never committed is the developer's business.
new_fixture untracked apps docs
mkdir -p "$fixture/scratch-dir" && echo x > "$fixture/scratch-dir/f.txt"
run 0 "ignores an UNTRACKED directory on disk"

if [ "$fails" -gt 0 ]; then
  echo "check-root-dirs self-test: $fails failure(s)"
  exit 1
fi
echo "check-root-dirs self-test: all passed"
