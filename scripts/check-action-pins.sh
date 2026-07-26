#!/bin/bash
# CI guard (#661, follows #635/#659; #681 composite-action coverage): every
# third-party GitHub Action referenced by a `uses:` MUST be pinned to a 40-char
# commit SHA, never a mutable tag/branch (@v4, @main). A mutable tag lets an
# upstream compromise or re-point silently change what runs in CI with our
# permissions.
#
# Scan surface (#681): both workflow files (.github/workflows/*.yml) AND composite
# actions (.github/actions/**/action.yml), because a composite action can carry its
# own `uses:` steps — an unpinned one there is the same arbitrary-code-execution
# risk with the guard otherwise green.
#
# The whole repo is uniformly SHA-pinned today (checkout/cache included), so the
# rule is simple and exceptionless: EVERY `uses:` needs a SHA. The only refs
# that are legitimately not SHA-pinnable are excluded:
#   - local reusable workflows / composite actions:  uses: ./.github/actions/foo
#   - Docker image refs:         uses: docker://alpine:3.20  (pin by @sha256 digest)
#
# This shell owns file discovery + the CHECK_ACTION_PINS_ROOT test seam; the
# YAML-aware matching lives in check-action-pins.py (parses each file with a real
# YAML parser and walks every `uses` key). A line-anchored grep used to do the
# match, but it was blind to flow-style YAML — `steps: [{uses: foo@v4}]` passed
# green while unpinned (#723). The only runtime dependency is python3 + PyYAML,
# both pre-installed on GitHub's ubuntu runners (PyYAML ships with the
# pre-installed yamllint); no `npm/pip install` at guard time and no third-party
# Action to pin, so the guard can't reintroduce the unpinned-dependency risk it
# exists to prevent. Runnable locally: scripts/check-action-pins.sh
# Test seam: CHECK_ACTION_PINS_ROOT overrides the repo root so the guard can be
# exercised against fixture trees (scripts/__tests__/check-action-pins.test.sh).
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="${CHECK_ACTION_PINS_ROOT:-$(cd "$script_dir/.." && pwd)}"
workflow_dir="$repo_root/.github/workflows"
actions_dir="$repo_root/.github/actions"

shopt -s nullglob
files=("$workflow_dir"/*.yml "$workflow_dir"/*.yaml)
shopt -u nullglob

# Composite actions (.github/actions/**/action.yml) at any nesting depth. `find`
# rather than a `**` glob: globstar is bash 4+ only and this must also run under
# the bash 3.2 that ships on macOS. `-L` follows symlinks so a symlinked
# action.yml is included — matching the workflow glob above, which follows
# symlinks too (the asymmetry was a #723 minor).
if [ -d "$actions_dir" ]; then
  while IFS= read -r action_file; do
    files+=("$action_file")
  done < <(find -L "$actions_dir" -type f \( -name action.yml -o -name action.yaml \))
fi

if [ ${#files[@]} -eq 0 ]; then
  echo "::error::No workflow or composite-action files found under .github/ — check-action-pins.sh misconfigured (broken checkout?)."
  exit 1
fi

exec python3 "$script_dir/check-action-pins.py" "$repo_root" "${files[@]}"
