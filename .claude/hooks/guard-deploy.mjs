#!/usr/bin/env node
// PreToolUse guard for production deploy tools. Blocks, in any runner form
// (npx, pnpx, bunx, bun x, pnpm dlx/exec, yarn, npm exec) and behind any
// wrapper:
//   - vercel: --prod, --target production, promote, rollback, redeploy, alias,
//     remove/rm, domains, dns, certs, and env or pull for the production
//     environment (those read or write production secrets);
//   - wrangler: deploy, publish, rollback, delete, versions deploy, pages
//     deploy/publish, secret, and anything with --remote;
//   - commands that hide either tool behind eval, a shell reading stdin, or
//     xargs.
// Preview deploys and local builds stay allowed. Production steps run from
// merged main through the release gate.

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

export function vercelVerdict(argv) {
  if (argv.some((a) => /^--prod(uction)?(=.*)?$/.test(a)))
    return deny(PRODUCTION_REASON);
  if (isProduction(optionValue(argv, ["--target"])))
    return deny(PRODUCTION_REASON);
  const [sub, ...rest] = positionals(argv, VERCEL_VALUE_OPTS);
  if (VERCEL_PRODUCTION_SUBS.has(sub)) return deny(PRODUCTION_REASON);
  if (sub === "env" || sub === "pull") {
    const envFlag = optionValue(argv, ["--environment"]);
    if (isProduction(envFlag) || rest.some(isProduction))
      return deny(SECRETS_REASON);
  }
  return null;
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
const WRANGLER_DENIED = new Set([
  "deploy",
  "publish",
  "rollback",
  "delete",
  "secret",
  "secrets-store",
]);

export function wranglerVerdict(argv) {
  if (argv.some((a) => a === "--remote" || a.startsWith("--remote=")))
    return deny(CLOUDFLARE_REASON);
  const [sub, second] = positionals(argv, WRANGLER_VALUE_OPTS);
  if (WRANGLER_DENIED.has(sub)) return deny(CLOUDFLARE_REASON);
  if (sub === "versions" && second === "deploy") return deny(CLOUDFLARE_REASON);
  if (sub === "pages" && (second === "deploy" || second === "publish"))
    return deny(CLOUDFLARE_REASON);
  return null;
}

export function decide(command) {
  const hidden = hiddenReason(command, ["vercel", "wrangler"]);
  if (hidden) return deny(hidden);
  for (const { argv } of commands(command)) {
    const head = toolName(argv[0] ?? "");
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
