#!/bin/bash
# Exercises scripts/check-action-pins.sh against fixture trees so the guard is
# never shipped unexercised (#662 "prove it fails on a bad line"; #614). Runs in
# the Action pin guard workflow *before* the real scan.
#
# These are representative cases, not a proof of completeness: they show the
# guard accepts a fully-pinned tree and rejects unpinned refs across the surfaces
# that have bitten us — block style in a workflow AND a composite action (#681),
# and flow style `[{uses: ...}]` / `- { uses: ... }` and symlinked composite
# files (#723). New evasions should arrive here as a new failing case first.
#
# Pure bash, no test framework: CI runs the monorepo vitest via `pnpm -r test`,
# not the root `scripts/` suite, so a vitest spec here would not gate.
# Self-contained + exit-code assertions do.
set -uo pipefail

guard="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/check-action-pins.sh"
sha="1111111111111111111111111111111111111111"   # 40 hex, shape-valid
fails=0
tmproot=""

cleanup() { [ -n "$tmproot" ] && rm -rf "$tmproot"; }
trap cleanup EXIT

# run <expected_exit> <description> — invokes the guard against $fixture (built by
# the caller) and asserts its exit code. On mismatch, dumps output and flags.
run() {
  local expected="$1" desc="$2" out rc
  out="$(CHECK_ACTION_PINS_ROOT="$fixture" bash "$guard" 2>&1)"
  rc=$?
  if [ "$rc" -eq "$expected" ]; then
    printf 'ok   — %s (exit %s)\n' "$desc" "$rc"
  else
    printf 'FAIL — %s: expected exit %s, got %s\n%s\n' "$desc" "$expected" "$rc" "$out"
    fails=$((fails + 1))
  fi
}

new_fixture() {
  tmproot="$(mktemp -d)"
  fixture="$tmproot/repo"
  mkdir -p "$fixture/.github/workflows" "$fixture/.github/actions"
}

# 1. Fully pinned workflow + pinned composite action + legit exclusions → pass.
new_fixture
cat > "$fixture/.github/workflows/ci.yml" <<EOF
jobs:
  a:
    steps:
      - uses: actions/checkout@$sha # v7.0.1
      - uses: ./.github/actions/local-thing
      - uses: docker://alpine@sha256:$sha
EOF
mkdir -p "$fixture/.github/actions/local-thing"
cat > "$fixture/.github/actions/local-thing/action.yml" <<EOF
runs:
  using: composite
  steps:
    - uses: actions/setup-node@$sha # v4
EOF
run 0 "fully pinned workflow + composite action + ./ and docker:// exclusions"
cleanup

# 2. Unpinned tag in a WORKFLOW → fail.
new_fixture
cat > "$fixture/.github/workflows/ci.yml" <<EOF
jobs:
  a:
    steps:
      - uses: actions/checkout@v4
EOF
run 1 "unpinned tag in workflow is rejected"
cleanup

# 3. Unpinned tag in a COMPOSITE ACTION → fail (the #681 regression this closes).
new_fixture
cat > "$fixture/.github/workflows/ci.yml" <<EOF
jobs:
  a:
    steps:
      - uses: actions/checkout@$sha # v7.0.1
EOF
mkdir -p "$fixture/.github/actions/build"
cat > "$fixture/.github/actions/build/action.yml" <<EOF
runs:
  using: composite
  steps:
    - uses: actions/setup-node@v4
EOF
run 1 "unpinned tag in composite action is rejected (#681)"
cleanup

# 4. Empty .github (no workflow or action files) → fail loudly, not vacuous pass.
new_fixture
run 1 "empty .github fails loudly (no vacuous pass)"
cleanup

# 5. Branch ref and short SHA are not full-SHA pins → fail.
new_fixture
cat > "$fixture/.github/workflows/ci.yml" <<EOF
jobs:
  a:
    steps:
      - uses: actions/checkout@main
      - uses: actions/setup-node@1111111 # short SHA
EOF
run 1 "branch ref / short SHA rejected"
cleanup

# 6. Flow-style mapping, unpinned → fail (the #723 bypass: grep was blind to this).
new_fixture
cat > "$fixture/.github/workflows/ci.yml" <<EOF
jobs:
  a:
    steps:
      - { uses: actions/checkout@v4 }
EOF
run 1 "flow-style mapping unpinned is rejected (#723)"
cleanup

# 7. Flow-style sequence, unpinned → fail (the #723 bypass, second form).
new_fixture
cat > "$fixture/.github/workflows/ci.yml" <<EOF
jobs:
  a:
    steps: [{uses: actions/checkout@v4}]
EOF
run 1 "flow-style sequence unpinned is rejected (#723)"
cleanup

# 8. Flow-style, correctly pinned → pass (guard is precise, not a blanket reject).
new_fixture
cat > "$fixture/.github/workflows/ci.yml" <<EOF
jobs:
  a:
    steps: [{uses: actions/checkout@$sha}]
EOF
run 0 "flow-style correctly pinned is accepted"
cleanup

# 9. Symlinked composite action.yml, unpinned → fail (find -L must follow it; the
#    old find -type f skipped symlinks while the workflow glob followed them — #723).
new_fixture
cat > "$fixture/real-action.yml" <<EOF
runs:
  using: composite
  steps:
    - uses: actions/setup-node@v4
EOF
mkdir -p "$fixture/.github/actions/linked"
ln -s "$fixture/real-action.yml" "$fixture/.github/actions/linked/action.yml"
run 1 "symlinked composite action.yml is scanned (#723)"
cleanup

# 10. A `uses` key that is NOT an action ref — an env var and a `with:` input both
#     named `uses` — must NOT be flagged (the real step ref is pinned) → pass.
#     The old any-depth walk wrongly rejected these (#723 review MINOR).
new_fixture
cat > "$fixture/.github/workflows/ci.yml" <<EOF
jobs:
  a:
    env:
      uses: my-build@latest
    steps:
      - uses: actions/checkout@$sha # v7.0.1
        with:
          uses: some-input-value@latest
EOF
run 0 "env / with keys named 'uses' are not treated as action refs"
cleanup

# 11. Reusable-workflow call (jobs.<id>.uses), unpinned → fail. Proves the
#     schema-scoped walk keeps this real pinnable ref in scope.
new_fixture
cat > "$fixture/.github/workflows/ci.yml" <<EOF
jobs:
  call:
    uses: org/repo/.github/workflows/reusable.yml@v1
EOF
run 1 "unpinned reusable-workflow call is rejected"
cleanup

if [ "$fails" -gt 0 ]; then
  echo "check-action-pins.test.sh: $fails case(s) FAILED"
  exit 1
fi
echo "check-action-pins.test.sh: all cases passed ✓"
