import assert from "node:assert/strict";
import { test } from "node:test";

import { decide } from "../guard-git.mjs";

const blocked = [
  ["git config user.email bot@example.com", "plain set"],
  ['git config user.name "Some Bot"', "set name"],
  ["git config --local user.email bot@example.com", "--local"],
  ["git config --worktree user.name bot", "--worktree"],
  ["git config --global user.email bot@example.com", "--global"],
  ["git config --file .git/config user.email bot@example.com", "--file"],
  ["git config --add user.email bot@example.com", "--add"],
  ["git config set user.email bot@example.com", "new-style set"],
  ["git config set --local user.name bot", "new-style set with scope"],
  ["git config author.email bot@example.com", "author.* key"],
  ["git config --global --unset user.email", "unsetting the global identity"],
  ["git -c user.email=bot@example.com commit -m 'fix: x'", "git -c user.*"],
  ["git --config-env=user.email=BOT_EMAIL commit -m x", "--config-env"],
  ["GIT_AUTHOR_EMAIL=bot@example.com git commit -m 'fix: x'", "env prefix"],
  ["export GIT_COMMITTER_NAME=bot && git commit -m x", "exported env"],
  ["env GIT_AUTHOR_NAME=bot git commit -m x", "env wrapper"],
  ["cd apps/web && git config user.email bot@example.com", "compound command"],
  ["git -C ../other config user.email bot@example.com", "-C before config"],
  ['bash -c "git config user.email bot@example.com"', "inside bash -c"],
  ["echo $(git config user.name bot)", "inside $()"],
  ['git commit -m "chore: bump [skip ci]"', "[skip ci]"],
  ['git commit -m "chore: bump [CI SKIP]"', "case-insensitive marker"],
  ['git commit -m "fix: x" -m "[no ci]"', "marker in second -m"],
  ['git commit -m "fix: x" -m "skip-checks: true"', "skip-checks trailer"],
  [
    "git commit -m \"$(cat <<'EOF'\nfix: thing\n\n[skip actions]\nEOF\n)\"",
    "marker in a heredoc message",
  ],
  ['git merge --no-ff -m "Merge [actions skip]" feature', "git merge -m"],
  ["git add a.ts && git commit -m 'fix: thing [ci skip]'", "commit after add"],
];

// Each of these hid the guarded command behind a heredoc whose apostrophe or
// quote used to swallow the rest of the line.
const PREFIX = `git commit -m "$(cat <<'EOF'\nfix: don't drop the nonce\nEOF\n)"`;
blocked.push(
  [`${PREFIX}; git config user.email bot@x`, "identity after a heredoc commit"],
  [
    `gh pr create --title x --body "$(cat <<'EOF'\nIt's done\nEOF\n)" && git config user.email bot@x`,
    "identity after a heredoc PR body",
  ],
  [
    `git commit -m "$(cat <<'EOF'\nfix: say "hi"\nEOF\n)" && git config user.email bot@x`,
    "double quote inside the heredoc",
  ],
  [
    `echo "$(echo $(cat <<'EOF'\nit's\nEOF\n))" && git config user.email bot@x`,
    "nested $( $(...) )",
  ],
  [
    'git commit -m "unterminated && git config user.email bot@x',
    "unclosed quote",
  ],
  ["pnpm exec git config user.email bot@x", "pnpm exec wrapper"]
);

const allowed = [
  ["git status", "status"],
  ["git config --get user.email", "--get read"],
  ["git config user.email", "bare read"],
  ["git config get user.name", "new-style get"],
  ["git config --list --show-origin", "list"],
  ["git config --local --unset user.email", "removing a local identity"],
  [
    "git config --local --remove-section user",
    "removing the local [user] block",
  ],
  ["git config core.hooksPath .husky/_", "other keys"],
  ["git -c core.editor=true commit -m 'fix: x'", "other -c"],
  ["git commit -m 'fix(web): stop the double submit'", "normal commit"],
  [
    "git commit -m 'docs: explain why CI skips are blocked'",
    "talks about CI without a marker",
  ],
  ["git log --grep='skip ci'", "log search without brackets"],
  ["echo '[skip ci]'", "marker outside a commit"],
  ["GIT_PAGER=cat git log -1", "unrelated env"],
  ["pnpm --filter web test", "not git"],
  [
    "git commit -m \"$(cat <<'EOF'\nfix: don't drop the nonce\nEOF\n)\" && git push",
    "heredoc commit then push",
  ],
];

for (const [cmd, label] of blocked) {
  test(`blocks: ${label}`, () => {
    const v = decide(cmd, { readFile: () => "" });
    assert.equal(v.allow, false, cmd);
    assert.match(v.reason, /^Blocked:/);
  });
}

for (const [cmd, label] of allowed) {
  test(`allows: ${label}`, () => {
    assert.deepEqual(decide(cmd, { readFile: () => "" }), { allow: true }, cmd);
  });
}

test("reads -F message files and blocks a marker inside", () => {
  const files = { "/repo/msg.txt": "fix: x\n\n[skip ci]\n" };
  const readFile = (p) => {
    if (!(p in files)) throw new Error("ENOENT");
    return files[p];
  };
  assert.equal(
    decide("git commit -F msg.txt", { cwd: "/repo", readFile }).allow,
    false
  );
  assert.equal(
    decide("git commit --file=msg.txt", { cwd: "/repo", readFile }).allow,
    false
  );
  assert.equal(
    decide("git commit -F other.txt", { cwd: "/repo", readFile }).allow,
    true
  );
});
