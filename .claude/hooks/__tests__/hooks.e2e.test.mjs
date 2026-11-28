// Runs the hook scripts the way Claude Code does: the PreToolUse payload on
// stdin, a block as exit 2 with the reason on stderr, an allow as a silent
// exit 0. Also checks that .claude/settings.json wires each hook to a file
// that exists.

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const hooksDir = path.resolve(here, "..");
const projectDir = path.resolve(hooksDir, "..", "..");
const KEY = "00000000-e2e-secret-key";
const HOOKS = [
  "guard-git.mjs",
  "guard-solana.mjs",
  "guard-merge.mjs",
  "guard-deploy.mjs",
];

function runHook(name, command, env = {}) {
  const payload = {
    session_id: "test",
    cwd: projectDir,
    hook_event_name: "PreToolUse",
    tool_name: "Bash",
    tool_input: { command, description: "test" },
  };
  return spawnSync(process.execPath, [path.join(hooksDir, name)], {
    input: JSON.stringify(payload),
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
}

function solanaHome(rpcUrl) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "guard-solana-"));
  fs.mkdirSync(path.join(home, ".config", "solana", "cli"), {
    recursive: true,
  });
  fs.writeFileSync(
    path.join(home, ".config", "solana", "cli", "config.yml"),
    `json_rpc_url: "${rpcUrl}"\n`
  );
  return home;
}

test("guard-git: exit 2 with a reason for a local identity, silent exit 0 otherwise", () => {
  const blocked = runHook(
    "guard-git.mjs",
    "git config user.email bot@example.com"
  );
  assert.equal(blocked.status, 2);
  assert.match(blocked.stderr, /^Blocked:/);
  assert.equal(blocked.stdout, "");

  const allowed = runHook("guard-git.mjs", "git status");
  assert.equal(allowed.status, 0);
  assert.equal(allowed.stderr + allowed.stdout, "");
});

test("guard-git: blocks a CI-skip marker in a commit message", () => {
  assert.equal(
    runHook("guard-git.mjs", 'git commit -m "chore: x [skip ci]"').status,
    2
  );
});

test("every guard ignores a non-Bash payload", () => {
  for (const name of HOOKS) {
    const r = spawnSync(process.execPath, [path.join(hooksDir, name)], {
      input: JSON.stringify({ tool_name: "Read", tool_input: {} }),
      encoding: "utf8",
    });
    assert.equal(r.status, 0, name);
  }
});

test("every guard blocks input it can't read", () => {
  const inputs = [
    "",
    "not json",
    "[]",
    "null",
    JSON.stringify({ tool_name: "Bash", tool_input: {} }),
    JSON.stringify({ tool_name: "Bash", tool_input: { command: 42 } }),
  ];
  for (const name of HOOKS) {
    for (const input of inputs) {
      const r = spawnSync(process.execPath, [path.join(hooksDir, name)], {
        input,
        encoding: "utf8",
      });
      assert.equal(r.status, 2, `${name} with ${JSON.stringify(input)}`);
      assert.match(r.stderr, /couldn't read the command/);
    }
  }
});

test("guard-solana: blocks public devnet from the CLI config and never prints the URL", () => {
  const home = solanaHome(`https://api.devnet.solana.com/?api-key=${KEY}`);
  const r = runHook(
    "guard-solana.mjs",
    "solana program deploy target/deploy/x.so",
    { HOME: home }
  );
  assert.equal(r.status, 2);
  assert.doesNotMatch(r.stderr + r.stdout, new RegExp(KEY));
});

test("guard-solana: allows a Helius devnet deploy from the CLI config", () => {
  const home = solanaHome(`https://devnet.helius-rpc.com/?api-key=${KEY}`);
  const r = runHook(
    "guard-solana.mjs",
    "solana program deploy target/deploy/x.so",
    { HOME: home }
  );
  assert.equal(r.status, 0);
  assert.equal(r.stderr + r.stdout, "");
});

test("guard-solana: blocks a mainnet deploy whatever the config says", () => {
  const home = solanaHome(`https://devnet.helius-rpc.com/?api-key=${KEY}`);
  const r = runHook(
    "guard-solana.mjs",
    "solana program deploy target/deploy/x.so -um",
    { HOME: home }
  );
  assert.equal(r.status, 2);
  assert.match(r.stderr, /mainnet/);
});

test("guard-merge: runs the real gh call path against a stub gh", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "guard-merge-"));
  const head = "c".repeat(40);
  const required = [
    "Frontend (lint · typecheck · test)",
    "On-chain (fmt · clippy · cargo test)",
    "SHA-pin guard",
  ];
  const scenario = (runs) => {
    const file = path.join(dir, `s-${runs.length}.json`);
    fs.writeFileSync(
      file,
      JSON.stringify({
        pr: {
          number: 7,
          url: "https://github.com/solanabr/superteam-academy/pull/7",
          headRefOid: head,
          baseRefName: "main",
          title: "docs: fix a link",
          commits: [{ messageHeadline: "docs: fix a link", messageBody: "" }],
        },
        required,
        runs,
      })
    );
    return file;
  };
  const env = (file) => ({
    PATH: `${path.join(here, "fixtures", "bin")}${path.delimiter}${process.env.PATH}`,
    GH_STUB_SCENARIO: file,
  });
  const green = required.map((name, i) => ({
    id: i + 1,
    name,
    status: "completed",
    conclusion: "success",
  }));

  const ok = runHook(
    "guard-merge.mjs",
    "gh pr merge 7 --squash",
    env(scenario(green))
  );
  assert.equal(ok.status, 0, ok.stderr);

  const pending = runHook(
    "guard-merge.mjs",
    "gh pr merge 7 --squash",
    env(scenario(green.slice(0, 2)))
  );
  assert.equal(pending.status, 2);
  assert.match(pending.stderr, /SHA-pin guard: not reported/);

  const marker = runHook(
    "guard-merge.mjs",
    'gh pr merge 7 --squash --body "x [skip ci]"',
    env(scenario(green))
  );
  assert.equal(marker.status, 2);
});

test("B1 repros: each guard still sees commands after a heredoc with an apostrophe", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "guard-b1-"));
  const file = path.join(dir, "scenario.json");
  fs.writeFileSync(
    file,
    JSON.stringify({
      pr: {
        number: 7,
        url: "https://github.com/solanabr/superteam-academy/pull/7",
        headRefOid: "d".repeat(40),
        baseRefName: "main",
        title: "fix: x",
        commits: [{ messageHeadline: "wip", messageBody: "[skip ci]" }],
      },
      required: ["SHA-pin guard"],
      runs: [],
    })
  );
  const env = {
    PATH: `${path.join(here, "fixtures", "bin")}${path.delimiter}${process.env.PATH}`,
    GH_STUB_SCENARIO: file,
  };
  const prBody = `gh pr create --title x --body "$(cat <<'EOF'\nIt's done\nEOF\n)"`;
  const commit = `git commit -m "$(cat <<'EOF'\nfix: don't drop the nonce\nEOF\n)"`;
  const home = solanaHome(`https://devnet.helius-rpc.com/?api-key=${KEY}`);

  const cases = [
    ["guard-merge.mjs", `${prBody} && gh pr merge 7 --squash --auto`, env],
    ["guard-merge.mjs", `${commit} && git push && gh pr merge 7 --squash`, env],
    [
      "guard-solana.mjs",
      `${commit} && solana program deploy x.so -um`,
      { HOME: home },
    ],
    ["guard-git.mjs", `${commit}; git config user.email bot@x`, {}],
  ];
  for (const [hook, command, extraEnv] of cases) {
    const r = runHook(hook, command, extraEnv);
    assert.equal(r.status, 2, `${hook} let through: ${command}`);
    assert.match(r.stderr, /^Blocked:/);
  }
});

test("settings.json wires every hook to an existing script, scoped and failing closed", () => {
  const settings = JSON.parse(
    fs.readFileSync(path.join(projectDir, ".claude", "settings.json"), "utf8")
  );
  const hooks = settings.hooks.PreToolUse.flatMap((group) =>
    group.hooks.map((h) => ({ ...h, matcher: group.matcher }))
  );
  assert.ok(hooks.length >= 3);
  for (const h of hooks) {
    assert.equal(h.matcher, "Bash");
    assert.equal(h.type, "command");
    assert.match(h.if, /^Bash\(.+\)$/);
    assert.equal(h.onFailure, "block");
    const script = h.command.match(/\$CLAUDE_PROJECT_DIR\/(\S+?\.mjs)/)?.[1];
    assert.ok(
      script && fs.existsSync(path.join(projectDir, script)),
      `missing hook script for: ${h.command}`
    );
  }
  for (const name of HOOKS) {
    assert.ok(
      hooks.some((h) => h.command.includes(name)),
      `${name} is not wired`
    );
  }
  // Each guard runs on any command that names its tool anywhere, so a wrapper
  // in front of the tool can't keep the guard from running.
  const wired = (name, pattern) =>
    hooks.some((h) => h.command.includes(name) && h.if === pattern);
  assert.ok(wired("guard-git.mjs", "Bash(*git*)"));
  assert.ok(wired("guard-solana.mjs", "Bash(*solana*)"));
  assert.ok(wired("guard-solana.mjs", "Bash(*anchor*)"));
  assert.ok(wired("guard-merge.mjs", "Bash(*gh*)"));
  assert.ok(wired("guard-deploy.mjs", "Bash(*vercel*)"));
  assert.ok(wired("guard-deploy.mjs", "Bash(*wrangler*)"));
});

test("wrapped commands get the direct decision through the hook scripts", () => {
  const heavy = "bash /Users/x/st-cloud/.superpowers/sdd/ops/heavy.sh";
  const blocked = [
    ["guard-git.mjs", `${heavy} git config user.email bot@x`],
    ["guard-git.mjs", `${heavy} git push origin HEAD:main`],
    ["guard-git.mjs", `caffeinate -i git commit -m 'x [skip ci]'`],
    [
      "guard-merge.mjs",
      `${heavy} gh pr merge 999999999 --squash --repo solanabr/does-not-exist-x`,
    ],
    ["guard-solana.mjs", `${heavy} solana program deploy x.so -um`],
    ["guard-solana.mjs", `stdbuf -oL anchor deploy --provider.cluster mainnet`],
    ["guard-deploy.mjs", `${heavy} npx vercel --prod`],
    ["guard-deploy.mjs", `flock /tmp/x npx wrangler deploy`],
  ];
  for (const [hook, command] of blocked) {
    const r = runHook(hook, command);
    assert.equal(r.status, 2, `${hook} let through: ${command}`);
    assert.match(r.stderr, /^Blocked:/);
  }
  for (const hook of HOOKS) {
    const r = runHook(hook, `${heavy} pnpm --filter web test`);
    assert.equal(r.status, 0, `${hook} blocked a wrapped test run`);
  }
});
