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


def iter_uses(node):
    """Yield (uses_value, line) for every mapping key `uses` with a scalar value,
    at any depth, in both block and flow style."""
    if isinstance(node, yaml.MappingNode):
        for key_node, val_node in node.value:
            if (
                isinstance(key_node, yaml.ScalarNode)
                and key_node.value == "uses"
                and isinstance(val_node, yaml.ScalarNode)
            ):
                yield val_node.value, val_node.start_mark.line + 1
            yield from iter_uses(val_node)
    elif isinstance(node, yaml.SequenceNode):
        for item in node.value:
            yield from iter_uses(item)


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
