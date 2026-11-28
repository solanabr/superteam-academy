#!/usr/bin/env node
// PreToolUse guard for deploy tools, as allow lists, in any runner form (npx,
// pnpx, bunx, bun x, pnpm dlx/exec, yarn, npm exec), behind any wrapper and in
// any letter case:
//   - vercel: build, dev, deploy without a production target, env ls/pull and
//     pull for preview or development, ls, inspect, logs, link, whoami, help;
//   - wrangler: dev, build, types, whoami, help, and d1/kv/r2 with --local.
// Every other subcommand, any word the shell builds at run time, and commands
// that hide either tool behind eval, a shell reading stdin, or xargs are
// refused. Production steps run from merged main through the release gate.

import { pathToFileURL } from "node:url";

import { commands, hiddenReason, runHook, toolName } from "./lib/shell.mjs";

export const PRODUCTION_REASON =
  "Blocked: production deploys, promotes and rollbacks don't run from an agent session in this repo. The release gate runs them from its own session, or a person uses Instant Rollback in the Vercel dashboard.";
export const SECRETS_REASON =
  "Blocked: production environment values are secrets and don't come into an agent session. Use the variable names in .env.example.";
export const CLOUDFLARE_REASON =
  "Blocked: Cloudflare deploys, rollbacks, secrets and remote writes don't run from an agent session in this repo. The release gate runs them from its own session.";

const deny = (reason) => ({ allow: false, reason });

const VERCEL_VALUE_OPTS = new Set([
  "--scope",
  "-S",
  "--token",
  "-t",
  "--cwd",
  "--local-config",
  "-A",
  "--global-config",
  "-Q",
  "--team",
  "-T",
  "--target",
  "--environment",
  "--git-branch",
  "-e",
  "--env",
  "-b",
  "--build-env",
  "-m",
  "--meta",
  "--regions",
  "--archive",
]);
const VERCEL_PRODUCTION_SUBS = new Set([
  "promote",
  "rollback",
  "redeploy",
  "alias",
  "aliases",
  "remove",
  "rm",
  "domains",
  "domain",
  "dns",
  "certs",
  "cert",
]);

function optionValue(argv, names) {
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    for (const name of names) {
      if (a === name) return argv[i + 1] ?? "";
      if (a.startsWith(`${name}=`)) return a.slice(name.length + 1);
    }
  }
  return null;
}

function positionals(argv, valueOpts) {
  const out = [];
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--") {
      out.push(...argv.slice(i + 1));
      break;
    }
    if (a.startsWith("-")) {
      if (!a.includes("=") && valueOpts.has(a)) i++;
      continue;
    }
    out.push(a);
  }
  return out;
}

const isProduction = (v) => /^prod(uction)?$/i.test(v ?? "");
// Values of --target/--environment that are safe to name.
const SAFE_ENVIRONMENTS = new Set(["preview", "development"]);

export const NOT_ALLOWED_REASON =
  "Blocked: this subcommand is not on the guard's list for agent sessions in this repo (local builds, preview deploys and reads). Production steps run from merged main through the release gate.";
export const BUILT_REASON =
  "Blocked: the shell builds a word of this deploy command at run time ($(…), a variable, $'…', braces or a glob), so the guard can't check it. Write the command literally.";

// vercel: build; dev; deploy (or a bare `vercel [path]`) without a production
// target; env ls/pull and pull for preview or development; ls, inspect, logs,
// link, whoami, help. Every other subcommand is refused.
const VERCEL_READS = new Set([
  "build",
  "dev",
  "ls",
  "list",
  "inspect",
  "logs",
  "link",
  "whoami",
  "help",
]);

export function vercelVerdict(argv) {
  const lower = argv.map((a) => a.toLowerCase());
  if (lower.some((a) => /^--prod(uction)?(=.*)?$/.test(a)))
    return deny(PRODUCTION_REASON);
  const target = optionValue(lower, ["--target"]);
  if (target !== null && !SAFE_ENVIRONMENTS.has(target))
    return deny(PRODUCTION_REASON);
  const [sub, ...rest] = positionals(lower, VERCEL_VALUE_OPTS);
  if (sub === undefined || sub === "deploy") return null;
  if (VERCEL_READS.has(sub)) return null;
  if (sub === "env" || sub === "pull") {
    const envSub = sub === "env" ? rest[0] : "pull";
    if (!["ls", "list", "pull"].includes(envSub)) return deny(SECRETS_REASON);
    const named =
      optionValue(lower, ["--environment"]) ??
      (sub === "env" ? rest.slice(1).find((r) => !r.includes(".")) : undefined);
    // `pull` defaults to development; `ls` without a name lists production too.
    if (named === undefined || named === null) {
      return envSub === "pull" ? null : deny(SECRETS_REASON);
    }
    return SAFE_ENVIRONMENTS.has(named) ? null : deny(SECRETS_REASON);
  }
  // A path is an implicit deploy; a word is a subcommand that isn't listed.
  if (/[./]/.test(sub)) return null;
  return deny(
    VERCEL_PRODUCTION_SUBS.has(sub) || isProduction(sub)
      ? PRODUCTION_REASON
      : NOT_ALLOWED_REASON
  );
}

const WRANGLER_VALUE_OPTS = new Set([
  "-c",
  "--config",
  "-e",
  "--env",
  "--name",
  "--compatibility-date",
  "--account-id",
]);
// wrangler: dev, build, types, whoami, help, and d1/kv/r2 against local state.
const WRANGLER_READS = new Set(["dev", "build", "types", "whoami", "help"]);

export function wranglerVerdict(argv) {
  const lower = argv.map((a) => a.toLowerCase());
  if (lower.some((a) => a === "--remote" || a.startsWith("--remote=")))
    return deny(CLOUDFLARE_REASON);
  const [sub] = positionals(lower, WRANGLER_VALUE_OPTS);
  if (sub === undefined) {
    return lower.some((a) => ["--version", "-v", "--help", "-h"].includes(a))
      ? null
      : deny(NOT_ALLOWED_REASON);
  }
  if (WRANGLER_READS.has(sub)) return null;
  if (["d1", "kv", "r2"].includes(sub) && lower.includes("--local"))
    return null;
  return deny(CLOUDFLARE_REASON);
}

export function decide(command) {
  const hidden = hiddenReason(command, ["vercel", "wrangler"]);
  if (hidden) return deny(hidden);
  for (const { argv, marks } of commands(command)) {
    const head = toolName(argv[0] ?? "");
    if ((head === "vercel" || head === "wrangler") && marks.some(Boolean))
      return deny(BUILT_REASON);
    const verdict =
      head === "vercel"
        ? vercelVerdict(argv)
        : head === "wrangler"
          ? wranglerVerdict(argv)
          : null;
    if (verdict) return verdict;
  }
  return { allow: true };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  runHook(decide);
}
