#!/usr/bin/env node
// PreToolUse guard for git. Blocks:
//   - setting a git identity in repo/worktree config, via `git -c user.*=`,
//     or via GIT_AUTHOR_*/GIT_COMMITTER_* (the global identity is inherited);
//   - commit messages that carry a CI-skip marker, which would skip CI on main.
// Reading identity (`git config --get user.email`) and removing a local
// [user] block (`git config --local --unset user.email`) stay allowed.

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  basename,
  commands,
  normalize,
  optionValues,
  runHook,
} from "./lib/shell.mjs";

export const SKIP_MARKER =
  /\[(?:skip ci|ci skip|no ci|skip actions|actions skip)\]|skip-checks\s*:\s*true/i;

const IDENTITY_KEY = /^(?:user|author|committer)\./i;
const IDENTITY_SECTION = /^(?:user|author|committer)$/i;
const IDENTITY_ENV = /^GIT_(?:AUTHOR|COMMITTER)_(?:NAME|EMAIL)$/;

const IDENTITY_REASON =
  "Blocked: don't set a git identity in this repo (config user.*/author.*/committer.*, git -c user.*=, or GIT_AUTHOR_*/GIT_COMMITTER_* env). The global identity is inherited; remove any local [user] block instead.";
const MARKER_REASON =
  "Blocked: the commit message contains a CI-skip marker ([skip ci], [ci skip], [no ci], [skip actions], [actions skip] or skip-checks: true). Remove it so CI runs on this commit.";

const deny = (reason) => ({ allow: false, reason });

// git's global options that take a separate value.
const GIT_VALUE_OPTS = new Set([
  "-C",
  "--git-dir",
  "--work-tree",
  "--namespace",
  "--super-prefix",
  "--attr-source",
]);

function parseGit(args) {
  const configs = [];
  let dir = null;
  let i = 0;
  while (i < args.length) {
    const a = args[i];
    if (a === "-c" || a === "--config-env") {
      configs.push(args[i + 1] ?? "");
      i += 2;
    } else if (a.startsWith("--config-env=")) {
      configs.push(a.slice("--config-env=".length));
      i++;
    } else if (a === "-C") {
      dir = args[i + 1] ?? null;
      i += 2;
    } else if (GIT_VALUE_OPTS.has(a)) {
      i += 2;
    } else if (a.startsWith("-")) {
      i++;
    } else {
      break;
    }
  }
  return { configs, dir, sub: args[i], rest: args.slice(i + 1) };
}

// `git config` options that consume the next word.
const CONFIG_VALUE_OPTS = new Set([
  "-f",
  "--file",
  "--blob",
  "--type",
  "--default",
  "--comment",
  "--value",
]);
const CONFIG_READ_FLAGS = new Set([
  "--get",
  "--get-all",
  "--get-regexp",
  "--get-urlmatch",
  "--get-color",
  "--get-colorbool",
  "-l",
  "--list",
  "-e",
  "--edit",
]);
const CONFIG_UNSET_FLAGS = new Set([
  "--unset",
  "--unset-all",
  "--remove-section",
]);
const CONFIG_WRITE_FLAGS = new Set(["--add", "--replace-all"]);

function configWritesIdentity(rest) {
  const flags = [];
  const positionals = [];
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (CONFIG_VALUE_OPTS.has(a)) {
      i++;
    } else if (a.startsWith("-")) {
      flags.push(a.split("=")[0]);
    } else {
      positionals.push(a);
    }
  }
  const has = (set) => flags.some((f) => set.has(f));
  const globalScope = flags.includes("--global") || flags.includes("--system");

  // New-style subcommands (git 2.46+): get, list, set, unset, rename-section, remove-section, edit.
  const [first, second, third] = positionals;
  if (["get", "list", "edit"].includes(first)) return false;
  if (first === "set") return IDENTITY_KEY.test(second ?? "");
  if (first === "unset") return globalScope && IDENTITY_KEY.test(second ?? "");
  if (first === "remove-section")
    return globalScope && IDENTITY_SECTION.test(second ?? "");
  if (first === "rename-section") return IDENTITY_SECTION.test(third ?? "");

  // Old-style: action flags plus positionals.
  if (has(CONFIG_READ_FLAGS)) return false;
  if (flags.includes("--rename-section"))
    return IDENTITY_SECTION.test(second ?? "");
  if (has(CONFIG_UNSET_FLAGS))
    return (
      globalScope &&
      (IDENTITY_KEY.test(first ?? "") || IDENTITY_SECTION.test(first ?? ""))
    );
  if (has(CONFIG_WRITE_FLAGS)) return IDENTITY_KEY.test(first ?? "");
  // `git config user.email x` sets; `git config user.email` reads.
  return IDENTITY_KEY.test(first ?? "") && positionals.length >= 2;
}

function messageFiles(rest) {
  return optionValues(rest, ["--file", "-F"]).filter((f) => f && f !== "-");
}

export function decide(
  command,
  { cwd = process.cwd(), readFile = fs.readFileSync } = {}
) {
  const raw = normalize(command);
  for (const { argv, assigns } of commands(raw)) {
    const head = basename(argv[0] ?? "");

    if (assigns.some((a) => IDENTITY_ENV.test(a.split("=")[0])))
      return deny(IDENTITY_REASON);
    if (["export", "declare", "typeset", "setenv"].includes(head)) {
      if (argv.slice(1).some((a) => IDENTITY_ENV.test(a.split("=")[0])))
        return deny(IDENTITY_REASON);
    }
    if (head !== "git") continue;

    const { configs, dir, sub, rest } = parseGit(argv.slice(1));
    if (configs.some((kv) => IDENTITY_KEY.test(kv)))
      return deny(IDENTITY_REASON);
    if (sub === "config" && configWritesIdentity(rest))
      return deny(IDENTITY_REASON);

    if (sub === "commit" || sub === "merge" || sub === "commit-tree") {
      if (SKIP_MARKER.test(raw)) return deny(MARKER_REASON);
      for (const file of messageFiles(rest)) {
        let text = "";
        try {
          text = readFile(path.resolve(cwd, dir ?? ".", file), "utf8");
        } catch {
          continue;
        }
        if (SKIP_MARKER.test(text)) return deny(MARKER_REASON);
      }
    }
  }
  return { allow: true };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  runHook(decide);
}
