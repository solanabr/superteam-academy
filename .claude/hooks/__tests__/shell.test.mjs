import assert from "node:assert/strict";
import { test } from "node:test";

import { commands } from "../lib/shell.mjs";

const argvs = (cmd) => commands(cmd).map((c) => c.argv.join(" "));
const HEREDOC_MSG = (body) => `git commit -m "$(cat <<'EOF'\n${body}\nEOF\n)"`;

test("an apostrophe in a heredoc inside $() doesn't swallow what follows", () => {
  const cmd = `gh pr create --title x --body "$(cat <<'EOF'\nIt's done\nEOF\n)" && gh pr merge 7 --squash --auto`;
  assert.ok(argvs(cmd).includes("gh pr merge 7 --squash --auto"));
});

test("a double quote in a heredoc inside $() doesn't swallow what follows", () => {
  const cmd = `${HEREDOC_MSG('fix: say "hi"')} && git config user.email bot@x`;
  assert.ok(argvs(cmd).includes("git config user.email bot@x"));
});

test("nested $( $(...) ) with a heredoc", () => {
  const cmd = `echo "$(echo $(cat <<'EOF'\nit's here\nEOF\n))" && git config user.email bot@x`;
  assert.ok(argvs(cmd).includes("git config user.email bot@x"));
});

test("heredoc body lines are data, not commands", () => {
  const cmd = `git commit -F - <<'EOF'\ngit config user.email bot@x\nEOF`;
  assert.ok(!argvs(cmd).includes("git config user.email bot@x"));
  const nested = `${HEREDOC_MSG("solana program deploy x.so -um")} && git status`;
  assert.ok(!argvs(nested).some((c) => c.startsWith("solana program")));
});

test("an unclosed quote falls back to a loose split that yields more commands", () => {
  const cmd = 'git commit -m "unterminated && git config user.email bot@x';
  assert.ok(argvs(cmd).includes("git config user.email bot@x"));
});

test("an unclosed $( falls back to a loose split", () => {
  const cmd = 'echo "$(cat x && solana program deploy x.so -um';
  assert.ok(argvs(cmd).some((c) => c.startsWith("solana program deploy")));
});

test("pnpm exec, pnpm dlx and npx are unwrapped", () => {
  assert.ok(
    argvs("pnpm exec solana program deploy x.so").includes(
      "solana program deploy x.so"
    )
  );
  assert.ok(
    argvs("pnpm --filter web exec git config user.email x").includes(
      "git config user.email x"
    )
  );
  assert.ok(
    argvs("pnpm dlx solana program deploy x.so").includes(
      "solana program deploy x.so"
    )
  );
  assert.ok(
    argvs("npx -y solana program deploy x.so").includes(
      "solana program deploy x.so"
    )
  );
  assert.deepEqual(argvs("pnpm --filter web test"), ["pnpm --filter web test"]);
});
