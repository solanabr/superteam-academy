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

test("guard-git: ignores non-Bash payloads and empty input", () => {
  const r = spawnSync(
    process.execPath,
    [path.join(hooksDir, "guard-git.mjs")],
    { input: "", encoding: "utf8" }
  );
  assert.equal(r.status, 0);
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
  for (const name of ["guard-git.mjs", "guard-solana.mjs", "guard-merge.mjs"]) {
    assert.ok(
      hooks.some((h) => h.command.includes(name)),
      `${name} is not wired`
    );
  }
});
