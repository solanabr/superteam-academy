#!/usr/bin/env node
// PreToolUse guard for git. Blocks:
//   - setting a git identity in repo/worktree config, via `git -c user.*=`,
//     or via GIT_AUTHOR_*/GIT_COMMITTER_* (the global identity is inherited);
//   - commit messages that carry a CI-skip marker, which would skip CI on main;
//   - pushes to main (a refspec, --all, --mirror, or a bare push from main),
//     and config that changes where a push goes (alias.*, remote.*.push,
//     push.default);
//   - commands that hide git behind eval, a shell reading stdin, or xargs.
// Reading identity (`git config --get user.email`) and removing a local
// [user] block (`git config --local --unset user.email`) stay allowed.

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  commands,
  hiddenReason,
  normalize,
  toolName,
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
const MAIN_REASON =
  "Blocked: pushes to main don't run from an agent session. Push a feature branch and open a PR; the release approver merges it.";
const UNKNOWN_TARGET_REASON =
  "Blocked: this push names no branch, and the guard can't tell which branch it pushes (the command changes directory first, or git couldn't read the current branch). Name it: git push origin <branch>.";
const EXPANDED_REASON =
  "Blocked: the push target uses a shell expansion ($VAR, a command substitution, {a,b} or a glob), so the guard can't tell which branch it updates. Name the branch literally.";
const BUILT_REASON =
  "Blocked: the shell builds this git subcommand, flag or config value at run time ($(…), a variable, $'…', braces or a glob), so the guard can't check it. Write it literally.";
const GIT_CONFIG_ENV_REASON =
  "Blocked: GIT_CONFIG_* variables inject git config (aliases, push targets) the guard can't see. Pass settings on the command line instead.";
const PACK_REASON =
  "Blocked: send-pack, receive-pack and http-push write refs without the push checks. Use git push with a feature branch.";
const PUSH_CONFIG_REASON =
  "Blocked: don't set alias.*, remote.*.push or push.default here. They change what a later git command or push does.";

const GIT_CONFIG_ENV = /^GIT_CONFIG(_|$)/;
// Settings and env vars that name a program git runs, even on a "read".
const PROGRAM_KEY =
  /^(core\.(fsmonitor|pager|sshcommand|editor|hookspath|askpass)|diff\.external|diff\..+\.(textconv|command)|merge\..+\.driver|filter\..+\.(clean|smudge|process)|gpg(\..+)?\.program|credential(\..+)?\.helper|sequence\.editor|pager\..+|uploadpack\.packobjectshook|include(if\..+)?\.path)$/i;
const PROGRAM_ENV =
  /^(GIT_EXTERNAL_DIFF|GIT_PAGER|PAGER|GIT_SSH_COMMAND|GIT_SSH|GIT_EDITOR|GIT_SEQUENCE_EDITOR|GIT_ASKPASS|SSH_ASKPASS|GIT_PROXY_COMMAND|GIT_EXEC_PATH|GIT_TEMPLATE_DIR)$/;
// Values that run nothing new: no pager, a no-op editor, the repo's husky hooks.
const SAFE_PROGRAM = /^(cat|less|more|true|:|)$/;
const safeProgram = (key, value) =>
  SAFE_PROGRAM.test(value.trim()) ||
  (/^core\.hookspath$/i.test(key) && value.trim() === ".husky/_");
const PROGRAM_REASON =
  "Blocked: this git setting or environment variable names a program git would run (a pager, ssh command, diff tool, fsmonitor, hook path, filter), which the guard can't check. Leave it unset.";
// Subcommands whose every argument decides where refs go: a built word there
// can't be checked.
const WHOLLY_CHECKED = new Set(["push", "config", "send-pack"]);
const PUSH_CONFIG_KEY = /^(?:alias\..+|remote\..+\.push|push\.default)$/i;
const MAIN_REF = /^(?:refs\/)?(?:heads\/)?main$/;
const PUSH_ALL = new Set(["--all", "--mirror", "--branches"]);
const PUSH_VALUE_OPTS = new Set([
  "-o",
  "--push-option",
  "--receive-pack",
  "--exec",
]);

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
  const configAt = [];
  let dir = null;
  let i = 0;
  while (i < args.length) {
    const a = args[i];
    if (a === "-c" || a === "--config-env") {
      configs.push(args[i + 1] ?? "");
      configAt.push(i + 1);
      i += 2;
    } else if (a.startsWith("--config-env=")) {
      configs.push(a.slice("--config-env=".length));
      configAt.push(i);
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
  return {
    configs,
    configAt,
    dir,
    sub: args[i],
    subAt: i,
    rest: args.slice(i + 1),
  };
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

// True when `git config <rest>` sets (not reads or unsets) a key matching keyRe.
function configSetsKey(rest, keyRe) {
  const flags = [];
  const positionals = [];
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (CONFIG_VALUE_OPTS.has(a)) i++;
    else if (a.startsWith("-")) flags.push(a.split("=")[0]);
    else positionals.push(a);
  }
  const [first, second] = positionals;
  if (first === "set") return keyRe.test(second ?? "");
  if (
    [
      "get",
      "list",
      "edit",
      "unset",
      "remove-section",
      "rename-section",
    ].includes(first)
  )
    return false;
  if (
    flags.some((f) => CONFIG_READ_FLAGS.has(f) || CONFIG_UNSET_FLAGS.has(f)) ||
    flags.includes("--rename-section")
  )
    return false;
  if (flags.some((f) => CONFIG_WRITE_FLAGS.has(f)))
    return keyRe.test(first ?? "");
  return keyRe.test(first ?? "") && positionals.length >= 2;
}

// The key and value that `git config <rest>` writes (old or `set` form).
function configWritePair(rest) {
  const positionals = [];
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (CONFIG_VALUE_OPTS.has(a)) i++;
    else if (!a.startsWith("-")) positionals.push(a);
  }
  return positionals[0] === "set"
    ? [positionals[1] ?? "", positionals[2]]
    : [positionals[0] ?? "", positionals[1]];
}

// "main" when a refspec, --all/--mirror or a glob can update main; "expanded"
// when the shell would rewrite a refspec; "current" when the push goes to the
// current branch (no refspec, or HEAD/@); else "ok".
function pushVerdict(rest) {
  const positionals = [];
  let repoFlag = false;
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === "--") {
      positionals.push(...rest.slice(i + 1));
      break;
    }
    if (PUSH_ALL.has(a)) return "main";
    if (a === "--repo") {
      repoFlag = true;
      i++;
    } else if (a.startsWith("--repo=")) repoFlag = true;
    else if (PUSH_VALUE_OPTS.has(a)) i++;
    else if (!a.startsWith("-")) positionals.push(a);
  }
  const refspecs = repoFlag ? positionals : positionals.slice(1);
  if (refspecs.length === 0) return "current";
  let current = false;
  for (const spec of refspecs) {
    if (/[^\w./@:+~^*-]/.test(spec)) return "expanded";
    const s = spec.replace(/^\+/, "");
    const colon = s.indexOf(":");
    const dst = colon >= 0 ? s.slice(colon + 1) : s;
    if (MAIN_REF.test(dst) || dst.includes("*")) return "main";
    if (colon < 0 && (s === "HEAD" || s === "@")) current = true;
  }
  return current ? "current" : "ok";
}

function gitRunner(args, dir) {
  try {
    return execFileSync("git", args, {
      cwd: dir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 5000,
    }).trim();
  } catch {
    return null;
  }
}

// Whether a push to the current branch lands on main: the branch is main, or
// its push target is */main. null when the branch can't be read.
function currentPushHitsMain(dir, git) {
  const branch = git(["symbolic-ref", "--quiet", "--short", "HEAD"], dir);
  if (!branch) return null;
  if (MAIN_REF.test(branch)) return true;
  const target = git(
    ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{push}"],
    dir
  );
  return Boolean(target && /(^|\/)main$/.test(target));
}

function messageFiles(rest) {
  return optionValues(rest, ["--file", "-F"]).filter((f) => f && f !== "-");
}

export function decide(
  command,
  { cwd = process.cwd(), readFile = fs.readFileSync, git = gitRunner } = {}
) {
  const raw = normalize(command);
  const hidden = hiddenReason(raw, ["git"]);
  if (hidden) return deny(hidden);
  const list = commands(raw);
  const changesDir = list.some(({ argv }) =>
    ["cd", "pushd"].includes(toolName(argv[0] ?? ""))
  );
  for (const { argv, assigns, marks } of list) {
    const head = toolName(argv[0] ?? "");

    if (assigns.some((a) => IDENTITY_ENV.test(a.split("=")[0])))
      return deny(IDENTITY_REASON);
    if (assigns.some((a) => GIT_CONFIG_ENV.test(a.split("=")[0])))
      return deny(GIT_CONFIG_ENV_REASON);
    if (
      toolName(argv[0] ?? "") === "git" &&
      assigns.some((a) => {
        const [key, ...value] = a.split("=");
        return PROGRAM_ENV.test(key) && !safeProgram(key, value.join("="));
      })
    )
      return deny(PROGRAM_REASON);
    if (["export", "declare", "typeset", "setenv"].includes(head)) {
      if (argv.slice(1).some((a) => IDENTITY_ENV.test(a.split("=")[0])))
        return deny(IDENTITY_REASON);
      if (argv.slice(1).some((a) => GIT_CONFIG_ENV.test(a.split("=")[0])))
        return deny(GIT_CONFIG_ENV_REASON);
      if (
        /(^|[^\w-])git(?=$|[^\w-])/i.test(raw) &&
        argv.slice(1).some((a) => {
          const [key, ...value] = a.split("=");
          return PROGRAM_ENV.test(key) && !safeProgram(key, value.join("="));
        })
      )
        return deny(PROGRAM_REASON);
    }
    if (head !== "git") continue;

    const parsed = parseGit(argv.slice(1));
    const { configs, dir, rest } = parsed;
    const sub = (parsed.sub ?? "").toLowerCase();
    // marks[k + 1] belongs to argv.slice(1)[k].
    const built = (k) => marks[k + 1] === true;
    const args = argv.slice(1);
    if (
      built(parsed.subAt) ||
      parsed.configAt.some(built) ||
      args.some((a, k) => a.startsWith("-") && built(k)) ||
      (WHOLLY_CHECKED.has(sub) && args.some((_, k) => built(k)))
    )
      return deny(BUILT_REASON);
    if (["send-pack", "receive-pack", "http-push"].includes(sub))
      return deny(PACK_REASON);
    if (configs.some((kv) => IDENTITY_KEY.test(kv)))
      return deny(IDENTITY_REASON);
    if (sub === "config" && configWritesIdentity(rest))
      return deny(IDENTITY_REASON);
    if (configs.some((kv) => PUSH_CONFIG_KEY.test(kv.split("=")[0])))
      return deny(PUSH_CONFIG_REASON);
    if (
      configs.some((kv) => {
        const [key, ...value] = kv.split("=");
        return PROGRAM_KEY.test(key) && !safeProgram(key, value.join("="));
      })
    )
      return deny(PROGRAM_REASON);
    if (sub === "config" && configSetsKey(rest, PROGRAM_KEY)) {
      const [key, value] = configWritePair(rest);
      if (!safeProgram(key, value ?? "?")) return deny(PROGRAM_REASON);
    }
    if (sub === "config" && configSetsKey(rest, PUSH_CONFIG_KEY))
      return deny(PUSH_CONFIG_REASON);

    if (sub === "push") {
      const verdict = pushVerdict(rest);
      if (verdict === "main") return deny(MAIN_REASON);
      if (verdict === "expanded") return deny(EXPANDED_REASON);
      if (verdict === "current") {
        if (changesDir) return deny(UNKNOWN_TARGET_REASON);
        const hits = currentPushHitsMain(path.resolve(cwd, dir ?? "."), git);
        if (hits === null) return deny(UNKNOWN_TARGET_REASON);
        if (hits) return deny(MAIN_REASON);
      }
    }

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
