#!/usr/bin/env node
// The one PreToolUse hook for Bash. It runs on every Bash call, with no `if`
// filter: Claude Code matches `if` patterns against each command's argv, case
// sensitively, so a heredoc or here-string body, an upper-case name or a glob
// never started the guards. It runs each guard's decide() in one node process
// and stops at the first denial.

import { pathToFileURL } from "node:url";

import { decide as decideDeploy } from "./guard-deploy.mjs";
import { decide as decideGit } from "./guard-git.mjs";
import { decide as decideMerge } from "./guard-merge.mjs";
import { decide as decideSolana } from "./guard-solana.mjs";
import { privilegeReason, runHook } from "./lib/shell.mjs";

export const GUARDS = [decideGit, decideSolana, decideDeploy, decideMerge];

export function decide(command, deps = {}) {
  const privileged = privilegeReason(command);
  if (privileged) return { allow: false, reason: privileged };
  for (const guard of GUARDS) {
    const verdict = guard(command, deps);
    if (verdict?.allow === false) return verdict;
  }
  return { allow: true };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  runHook(decide);
}
