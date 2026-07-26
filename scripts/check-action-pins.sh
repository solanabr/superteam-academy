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
# Pure bash + grep — no third-party action or tool, so the guard can't itself
# reintroduce an unpinned dependency. Runnable locally: scripts/check-action-pins.sh
# Test seam: CHECK_ACTION_PINS_ROOT overrides the repo root so the guard can be
# exercised against fixture trees (scripts/__tests__/check-action-pins.test.sh).
set -euo pipefail

repo_root="${CHECK_ACTION_PINS_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
workflow_dir="$repo_root/.github/workflows"
actions_dir="$repo_root/.github/actions"
sha_re='^[0-9a-fA-F]{40}$'
violations=0

shopt -s nullglob
files=("$workflow_dir"/*.yml "$workflow_dir"/*.yaml)
shopt -u nullglob

# Composite actions (.github/actions/**/action.yml) at any nesting depth. `find`
# rather than a `**` glob: globstar is bash 4+ only and this must also run under
# the bash 3.2 that ships on macOS (local runs, .husky pre-commit).
if [ -d "$actions_dir" ]; then
  while IFS= read -r action_file; do
    files+=("$action_file")
  done < <(find "$actions_dir" -type f \( -name action.yml -o -name action.yaml \))
fi

if [ ${#files[@]} -eq 0 ]; then
  echo "::error::No workflow or composite-action files found under .github/ — check-action-pins.sh misconfigured (broken checkout?)."
  exit 1
fi

for file in "${files[@]}"; do
  rel="${file#"$repo_root"/}"
  # `uses:` as a step/list key: optional leading "- ", then uses:. Skips comments
  # and run-block prose (those don't start with an optional "- " + "uses:" key).
  while IFS=: read -r lineno _; do
    raw="$(sed -n "${lineno}p" "$file")"
    # Strip up to and including "uses:", trailing "# comment", surrounding quotes/space.
    value="${raw#*uses:}"
    value="${value%%#*}"
    value="$(echo "$value" | tr -d '\r' | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' -e 's/^["'\'']//' -e 's/["'\'']$//')"

    # Excluded: local reusable workflows and docker image refs (not SHA-pinnable as a git ref).
    case "$value" in
      ./*) continue ;;
      docker://*) continue ;;
    esac

    ref="${value##*@}"
    if [ "$ref" = "$value" ] || ! [[ "$ref" =~ $sha_re ]]; then
      printf '::error file=%s,line=%s::Action is not SHA-pinned: `%s`. Pin to a 40-char commit SHA with a version comment, e.g. `uses: owner/repo@<40-hex-sha> # v1.2.3`.\n' \
        "$rel" "$lineno" "$value"
      violations=$((violations + 1))
    fi
  done < <(grep -nE '^[[:space:]]*(-[[:space:]]+)?uses:[[:space:]]*[^[:space:]]' "$file")
done

if [ "$violations" -gt 0 ]; then
  echo "::error::$violations GitHub Action(s) are not pinned to a commit SHA. See #635 — mutable tags are forbidden."
  exit 1
fi

echo "All GitHub Actions \`uses:\` refs are SHA-pinned across ${#files[@]} file(s) in .github/workflows/ and .github/actions/. ✓"
