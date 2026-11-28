// A command behind a wrapper (a script such as heavy.sh, caffeinate, stdbuf,
// flock, xargs, env, a nested shell) gets the same decision as the command run
// directly. Also: pushes to main, production deploy tools, and the constructs
// that hide a command from the parser.

import assert from "node:assert/strict";
import { test } from "node:test";

import { decide as decideDeploy } from "../guard-deploy.mjs";
import { decide as decideGit } from "../guard-git.mjs";
import { decide as decideMerge } from "../guard-merge.mjs";
import { decide as decideSolana } from "../guard-solana.mjs";
import { commands, hiddenReason } from "../lib/shell.mjs";

const HEAVY = "/Users/x/Documents/STBR/st-cloud/.superpowers/sdd/ops/heavy.sh";
const HELIUS = "https://devnet.helius-rpc.com/?api-key=00000000-test";

// A git stub: the current branch and its push target, as `git` would print them.
const onBranch =
  (branch, pushTarget = branch ? `origin/${branch}` : null) =>
  (args) => {
    if (args[0] === "symbolic-ref") return branch;
    if (args[0] === "rev-parse") return pushTarget;
    return null;
  };
const featureGit = onBranch("feat/x");

// A gh stub that fails like a missing PR, so a merge the guard sees is denied.
function failingGh() {
  const calls = [];
  const gh = (args) => {
    calls.push(args);
    throw new Error("gh pr view failed (exit 1)");
  };
  return { gh, calls };
}

const git = (command, opts = {}) =>
  decideGit(command, { git: featureGit, readFile: () => "", ...opts });
const merge = (command) => decideMerge(command, failingGh());
const solana = (command) =>
  decideSolana(command, { env: {}, readFile: () => "", cwd: "/tmp" });
const deploy = (command) => decideDeploy(command);

const WRAPPERS = [
  (c) => c,
  (c) => `bash ${HEAVY} ${c}`,
  (c) => `${HEAVY} ${c}`,
  (c) => `HEAVY_ALL=1 bash ${HEAVY} ${c}`,
  (c) => `sh ${HEAVY} ${c}`,
  (c) => `./.superpowers/sdd/ops/heavy.sh ${c}`,
  (c) => `env HEAVY_TOTAL=2 bash ${HEAVY} ${c}`,
  (c) => `bash ${HEAVY} caffeinate -i stdbuf -oL ${c}`,
  (c) => `bash ${HEAVY} bash -c '${c}'`,
  (c) => `caffeinate -i ${c}`,
  (c) => `stdbuf -oL ${c}`,
  (c) => `flock /tmp/x ${c}`,
  (c) => `flock /tmp/x -c '${c}'`,
  (c) => `watch -n 5 '${c}'`,
  (c) => `ionice -c 3 ${c}`,
  (c) => `npx --yes some-runner ${c}`,
  (c) => `cd apps/web && bash ${HEAVY} ${c}`,
];

const DENIED = [
  ["git", git, "git config user.email bot@example.com"],
  ["git", git, "git commit -m 'fix: x [skip ci]'"],
  ["git", git, "git push origin HEAD:main"],
  ["git", git, "git push --force origin feature:refs/heads/main"],
  ["merge", merge, "gh pr merge 999999 --squash"],
  ["merge", merge, "gh api -X PUT repos/o/r/pulls/9/merge"],
  [
    "solana",
    solana,
    "solana program deploy x.so --url https://api.devnet.solana.com",
  ],
  ["solana", solana, "solana program deploy x.so -um"],
  ["solana", solana, "anchor deploy --provider.cluster mainnet"],
  ["deploy", deploy, "npx vercel --prod"],
  ["deploy", deploy, "vercel promote dpl_123"],
  ["deploy", deploy, "npx wrangler deploy"],
];

test("every wrapper gets the direct command's deny", () => {
  for (const [name, guard, command] of DENIED) {
    assert.equal(guard(command).allow, false, `plain ${name}: ${command}`);
    for (const wrap of WRAPPERS) {
      const wrapped = wrap(command);
      assert.equal(
        guard(wrapped).allow,
        false,
        `${name} let through: ${wrapped}`
      );
    }
  }
});

test("xargs feeding a guarded tool fails closed", () => {
  for (const [, guard, command] of DENIED) {
    const wrapped = `echo 1 | xargs ${command}`;
    assert.equal(guard(wrapped).allow, false, wrapped);
  }
});

test("an interpreter script, an xargs script and a PATH change don't hide the command", () => {
  const forms = [
    (c) => `python3 w.py ${c}`,
    (c) => `node w.js ${c}`,
    (c) => `ruby w.rb ${c}`,
    (c) => `perl w.pl ${c}`,
    (c) => `deno run w.ts ${c}`,
    (c) => `xargs ./w.sh ${c}`,
    (c) => `PATH=.:$PATH w ${c}`,
    (c) => `PATH=.:$PATH ./w.sh ${c}`,
    (c) => `export PATH=.:$PATH && w ${c}`,
  ];
  for (const [name, guard, command] of DENIED) {
    for (const form of forms) {
      const wrapped = form(command);
      assert.equal(
        guard(wrapped).allow,
        false,
        `${name} let through: ${wrapped}`
      );
    }
  }
  for (const command of [
    "echo origin HEAD:main | xargs ./w.sh git push",
    "echo --prod | xargs ./w.sh npx vercel",
    "echo 5 | xargs python3 w.py gh pr merge",
  ]) {
    const guard = command.includes("vercel")
      ? deploy
      : command.includes("gh ")
        ? merge
        : git;
    assert.equal(guard(command).allow, false, command);
  }
});

test("an assignment before the wrapped git still counts", () => {
  for (const command of [
    `bash ${HEAVY} GIT_AUTHOR_EMAIL=bot@x git commit -m x`,
    `GIT_COMMITTER_NAME=bot ${HEAVY} git commit -m x`,
    `caffeinate env GIT_AUTHOR_NAME=bot git commit -m x`,
  ])
    assert.equal(git(command).allow, false, command);
});

const ALLOWED_WORK = [
  "pnpm --filter web test",
  "HEAVY_ALL=1 pnpm --filter web build",
  "pnpm exec vitest run src/lib",
  "pnpm exec playwright test e2e/learner.spec.ts",
  "pnpm typecheck",
  "pnpm install --frozen-lockfile",
];

test("wrapped test and build jobs pass every guard", () => {
  for (const job of ALLOWED_WORK) {
    for (const command of [
      job,
      `bash ${HEAVY} ${job}`,
      `HEAVY_ALL=1 bash ${HEAVY} ${job}`,
    ]) {
      assert.equal(git(command).allow, true, `git: ${command}`);
      assert.equal(merge(command).allow, true, `merge: ${command}`);
      assert.equal(solana(command).allow, true, `solana: ${command}`);
      assert.equal(deploy(command).allow, true, `deploy: ${command}`);
    }
  }
});

test("normal git work stays allowed", () => {
  for (const command of [
    "git push origin feat/x",
    "git push -u origin fix/admin-sync-28-11-2026",
    "git push origin HEAD:fix/y",
    "git push origin HEAD:refs/heads/fix/z",
    "git push --force-with-lease origin feat/x",
    "git push origin HEAD",
    "git push",
    "git push origin --delete old-branch",
    "git -C ../other push origin feat/x",
    "git status && git diff --stat",
    "git log --oneline -5 | head -3",
    "git ls-files | xargs prettier --check",
    "git config --get alias.st",
    "git config --unset push.default",
    `bash ${HEAVY} pnpm test && git push origin feat/x`,
    "grep -rn 'git push origin main' docs/",
    "echo git push origin main",
    'gh pr create --title "fix: x" --body "Run git push origin main to see it"',
  ])
    assert.equal(git(command).allow, true, command);
});

test("pushes to main are denied in every form", () => {
  for (const command of [
    "git push origin main",
    "git push origin HEAD:main",
    "git push origin @:main",
    "git push origin feat:main",
    "git push origin +main",
    "git push origin +feat:main",
    "git push origin :main",
    "git push origin feat:refs/heads/main",
    "git push origin --delete main",
    "git push --all origin",
    "git push --mirror origin",
    "git push --branches origin",
    "git push origin 'refs/heads/*:refs/heads/*'",
    "git push -f origin feat/x main",
    "git push --repo=origin main",
    "git -C ../academy push origin main",
    "git -c push.default=upstream push",
    "git config alias.ship 'push origin HEAD:main'",
    "git config remote.origin.push HEAD:main",
    "git config set push.default upstream",
  ])
    assert.equal(git(command).allow, false, command);
});

test("a push target built by the shell is denied", () => {
  for (const command of [
    "git push origin $BRANCH",
    "git push origin HEAD:$B",
    "git push origin ${B:-main}",
    "git push origin {main,}",
    "git push origin HEAD:mai?",
    "git push origin `echo main`",
    "git push origin $(echo main)",
  ])
    assert.equal(git(command).allow, false, command);
  assert.equal(git('git push origin "ma""in"').allow, false);
});

test("gh aliases are refused, other gh work passes", () => {
  assert.equal(merge('gh alias set m "pr merge"').allow, false);
  assert.equal(merge("gh alias import aliases.yml").allow, false);
  assert.equal(merge("gh alias list").allow, true);
  assert.equal(merge("gh pr view 5 --json title").allow, true);
  assert.equal(merge("gh pr checks 5").allow, true);
});

test("a push to the current branch checks which branch that is", () => {
  const onMain = { git: onBranch("main") };
  const trackingMain = { git: onBranch("feat/x", "origin/main") };
  const detached = { git: onBranch(null) };
  for (const command of [
    "git push",
    "git push origin",
    "git push -u origin HEAD",
  ]) {
    assert.equal(git(command, onMain).allow, false, `on main: ${command}`);
    assert.equal(
      git(command, trackingMain).allow,
      false,
      `tracks main: ${command}`
    );
    assert.equal(git(command, detached).allow, false, `detached: ${command}`);
    assert.equal(git(command).allow, true, `feature branch: ${command}`);
    assert.equal(
      git(`cd ../academy && ${command}`).allow,
      false,
      `after cd: ${command}`
    );
  }
});

test("production deploy tools are denied in every runner form", () => {
  const runners = [
    "",
    "npx ",
    "npx --yes ",
    "pnpx ",
    "bunx ",
    "bun x ",
    "pnpm dlx ",
    "pnpm exec ",
    "yarn ",
    "yarn dlx ",
    "npm exec -- ",
  ];
  for (const runner of runners) {
    for (const tail of [
      "vercel --prod",
      "vercel deploy --prod",
      "vercel deploy --prod=true",
      "vercel --production",
      "vercel@latest deploy --prod",
      "vercel deploy --target=production",
      "vercel deploy --target production",
      "vercel promote https://x.vercel.app",
      "vercel rollback",
      "vercel redeploy https://x.vercel.app",
      "vercel alias set a b",
      "vercel rm dpl_1",
      "vercel env pull .env --environment=production",
      "vercel env ls production",
      "vercel env add SECRET production",
      "vercel pull --environment production",
      "wrangler deploy",
      "wrangler versions deploy",
      "wrangler rollback",
      "wrangler pages deploy dist",
      "wrangler secret put KEY",
      "wrangler d1 migrations apply db --remote",
    ]) {
      const command = `${runner}${tail}`;
      assert.equal(deploy(command).allow, false, command);
    }
  }
});

test("the Vercel refusal for production steps says how they run", () => {
  const { reason } = deploy("npx vercel rollback");
  assert.match(reason, /release gate runs them from its own session/);
  assert.match(reason, /Instant Rollback in the Vercel dashboard/);
});

test("preview deploys and local tool use stay allowed", () => {
  for (const command of [
    "npx vercel deploy",
    "vercel build",
    "vercel ls",
    "vercel inspect https://x.vercel.app",
    "vercel env pull .env.local",
    "vercel env ls preview",
    "wrangler dev",
    "wrangler whoami",
    "wrangler d1 execute db --local --command 'select 1'",
    "echo deploy --prod",
    "grep -rn 'vercel --prod' docs",
  ])
    assert.equal(deploy(command).allow, true, command);
});

test("anchor program writes follow the Helius rule", () => {
  assert.equal(
    solana(`anchor deploy --provider.cluster ${HELIUS}`).allow,
    true
  );
  assert.equal(solana("anchor deploy --provider.cluster localnet").allow, true);
  assert.equal(solana("anchor build").allow, true);
  assert.equal(solana("anchor idl fetch P").allow, true);
  assert.equal(solana("anchor test --provider.cluster localnet").allow, true);
  for (const command of [
    "anchor deploy --provider.cluster devnet",
    "anchor deploy --provider.cluster https://api.devnet.solana.com",
    "anchor upgrade x.so --program-id P --provider.cluster mainnet",
    "anchor idl init -f idl.json P --provider.cluster devnet",
    // The cluster must be on the command line: Anchor.toml is not trusted.
    "anchor deploy",
    "anchor test",
    "anchor test --skip-deploy",
    "anchor run deploy",
    `cd other && anchor deploy --provider.cluster ${HELIUS}`,
  ])
    assert.equal(solana(command).allow, false, command);
});

test("a Helius devnet deploy stays allowed behind a wrapper", () => {
  for (const wrap of WRAPPERS) {
    const command = wrap(`solana program deploy x.so -u "${HELIUS}"`);
    // A `cd` before a program write is refused: the write's ground moved.
    const expected = !command.startsWith("cd ");
    assert.equal(solana(command).allow, expected, command);
  }
});

test("constructs that hide a guarded command fail closed", () => {
  const cases = [
    ['eval "git push origin main"', git],
    ["eval $CMD git", git],
    ["echo 'git push origin main' | sh", git],
    ["echo 'git push origin main' | bash -s", git],
    ["printf 'git push origin main' | /bin/zsh", git],
    ["bash <<'EOF'\ngit push origin main\nEOF", git],
    ["source /dev/stdin <<< 'git push origin main'", git],
    ["source <(echo git push origin main)", git],
    [". $SCRIPT && git status", git],
    ["echo 'gh pr merge 1 --admin' | sh", merge],
    ["echo 'solana program deploy x.so -um' | bash", solana],
    ["echo 'npx vercel --prod' | sh", deploy],
    ["eval 'npx wrangler deploy'", deploy],
  ];
  for (const [command, guard] of cases)
    assert.equal(guard(command).allow, false, command);
});

test("script files and unrelated pipes stay allowed", () => {
  for (const command of [
    "bash scripts/check.sh && git status",
    "sh -c 'git status'",
    "source ./scripts/env.sh && git status",
    ". ~/.nvm/nvm.sh && git status",
    "curl -fsSL https://example.com/install.sh | bash",
    "cat notes.txt | sh",
  ])
    assert.equal(git(command).allow, true, command);
});

test("hiddenReason ignores commands that name no guarded tool", () => {
  assert.equal(hiddenReason("echo hi | sh", ["git"]), null);
  assert.equal(hiddenReason("eval $(ssh-agent -s)", ["git"]), null);
  assert.ok(
    hiddenReason("eval $(ssh-agent -s) && git push origin feat", ["git"])
  );
});

test("commands() yields the tail of a wrapper as a candidate", () => {
  const argvs = commands(
    `HEAVY_ALL=1 bash ${HEAVY} caffeinate -i git push origin main`
  ).map((c) => c.argv.join(" "));
  assert.ok(argvs.includes("git push origin main"), argvs.join(" | "));
  const text = commands("grep -rn git src").map((c) => c.argv[0]);
  assert.deepEqual(text, ["grep"]);
});
