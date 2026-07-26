#!/usr/bin/env python3
"""YAML-aware core of the SHA-pin guard (#723).

Given a repo root and a list of workflow / composite-action files, parse each
with a real YAML parser and flag every `uses:` value that is not pinned to a
40-char commit SHA. Walking the parsed node tree (not line-anchored grep) is the
whole point: it sees `uses` keys at any nesting and in flow style —
`steps: [{uses: actions/checkout@v4}]` and `- { uses: ... }` — which the old
grep matcher passed green while unpinned (the #723 bypass).

Invoked by scripts/check-action-pins.sh, which owns file discovery and the
CHECK_ACTION_PINS_ROOT test seam. Kept as a separate helper so it is lintable and
unit-testable, and so the bash side stays a thin, reviewed shell.

Fail-closed: a missing PyYAML or an unparseable file exits non-zero rather than
skipping a file — a guard that silently scans nothing is worse than none.
"""

import re
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write(
        "::error::check-action-pins: PyYAML is required but `import yaml` failed. "
        "It ships with the pre-installed yamllint on GitHub's ubuntu runners; "
        "locally run `pip install pyyaml`. The guard fails closed rather than "
        "skip its check.\n"
    )
    sys.exit(2)

SHA_RE = re.compile(r"^[0-9a-fA-F]{40}$")


def is_pinned(value):
    """A `uses:` value is acceptable iff it is a local ref (./...), a docker://
    image ref, or pinned to a full 40-hex commit SHA after the last @."""
    v = value.strip()
    if v.startswith("./") or v.startswith("docker://"):
        return True
    if "@" not in v:
        return False
    ref = v.rsplit("@", 1)[1]
    return bool(SHA_RE.match(ref))


def _pairs(node):
    """Key/value node pairs of a MappingNode (empty for anything else). Aliases
    are already resolved to the referenced node by yaml.compose, so anchored /
    aliased steps and jobs are walked like inline ones."""
    return node.value if isinstance(node, yaml.MappingNode) else []


def _first(node, name):
    """First value node for scalar key `name` in a mapping, else None."""
    for key_node, val_node in _pairs(node):
        if isinstance(key_node, yaml.ScalarNode) and key_node.value == name:
            return val_node
    return None


def _uses_of(mapping):
    """Value nodes of the effective `uses` key(s) of one step/job mapping.
    Explicit keys win (all of them, so a duplicate-key `uses` can't smuggle an
    unpinned second value); only if there is none do we follow YAML merge keys
    (`<<`), so a `uses` injected via an anchor/merge is still seen."""
    explicit = [
        v for k, v in _pairs(mapping)
        if isinstance(k, yaml.ScalarNode) and k.value == "uses"
    ]
    if explicit:
        return explicit
    merged = []
    for k, v in _pairs(mapping):
        if isinstance(k, yaml.ScalarNode) and k.value == "<<":
            sources = v.value if isinstance(v, yaml.SequenceNode) else [v]
            for src in sources:
                merged.extend(_uses_of(src))
    return merged


def _emit(mapping, out):
    for v in _uses_of(mapping):
        if isinstance(v, yaml.ScalarNode):
            out.append((v.value, v.start_mark.line + 1))


def iter_uses(doc):
    """Yield (uses_value, line) for pinnable GitHub Action refs only, walking the
    Actions schema rather than every `uses` key:

      - workflow  jobs.<id>.steps[*].uses   (step action)
      - workflow  jobs.<id>.uses            (reusable-workflow call — pinnable)
      - action    runs.steps[*].uses        (composite action step)

    A `uses` key elsewhere is NOT an action ref — e.g. an env var or a `with:`
    input named `uses` — and is deliberately ignored so it can't wrongly fail the
    guard (#723 review). This also drops the old walk's blind descent, which
    flagged such keys at any depth."""
    out = []
    for _job_id, job in _pairs(_first(doc, "jobs")):
        if not isinstance(job, yaml.MappingNode):
            continue
        _emit(job, out)  # reusable-workflow call at job level
        steps = _first(job, "steps")
        if isinstance(steps, yaml.SequenceNode):
            for step in steps.value:
                _emit(step, out)
    runs_steps = _first(_first(doc, "runs"), "steps")
    if isinstance(runs_steps, yaml.SequenceNode):
        for step in runs_steps.value:
            _emit(step, out)
    return out


def scan_file(path, rel):
    """Return the number of unpinned `uses:` refs in one file, printing a GitHub
    error annotation for each. A YAML parse error is itself a failure (returns 1)."""
    violations = 0
    try:
        with open(path, "r", encoding="utf-8") as fh:
            documents = list(yaml.compose_all(fh))
    except (yaml.YAMLError, OSError) as exc:
        print(
            f"::error file={rel}::check-action-pins could not parse this file, so it "
            f"cannot be verified (failing closed): {exc}"
        )
        return 1

    for doc in documents:
        if doc is None:
            continue
        for value, line in iter_uses(doc):
            if not is_pinned(value):
                print(
                    f"::error file={rel},line={line}::Action is not SHA-pinned: "
                    f"`{value}`. Pin to a 40-char commit SHA with a version comment, "
                    f"e.g. `uses: owner/repo@<40-hex-sha> # v1.2.3`."
                )
                violations += 1
    return violations


def main(argv):
    if len(argv) < 2:
        sys.stderr.write("usage: check-action-pins.py <repo_root> <file>...\n")
        return 2
    repo_root = argv[1].rstrip("/") + "/"
    files = argv[2:]

    total = 0
    for path in files:
        rel = path[len(repo_root):] if path.startswith(repo_root) else path
        total += scan_file(path, rel)

    if total > 0:
        print(
            f"::error::{total} GitHub Action(s) are not pinned to a commit SHA. "
            "See #635 — mutable tags are forbidden."
        )
        return 1

    print(
        f"All GitHub Actions `uses:` refs are SHA-pinned across {len(files)} "
        "file(s) in .github/workflows/ and .github/actions/. ✓"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
