#!/usr/bin/env node
// PreToolUse guard for Solana program writes (`solana program deploy`,
// `write-buffer`, `upgrade`, authority changes, `close`, and the program-v4
// equivalents). Read-only subcommands (show, dump) pass.
//
// The target cluster comes from -u/--url, or from the Solana CLI config when no
// flag is given (-C/--config, else ~/.config/solana/cli/config.yml). It allows
// only a Helius devnet RPC or a local validator. Mainnet is the owner's to run
// by hand, and any other endpoint (public devnet, unknown hosts) is refused.
// The resolved URL is never printed: it can carry an API key.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { basename, commands, runHook } from "./lib/shell.mjs";

const READ_ONLY = {
  program: new Set(["show", "dump", "help"]),
  "program-v4": new Set(["show", "dump", "download", "help"]),
};
// Global options that take a separate value, so their value isn't read as a subcommand.
const VALUE_OPTS = new Set([
  "-u",
  "--url",
  "-C",
  "--config",
  "-k",
  "--keypair",
  "--commitment",
  "--ws",
  "--output",
]);

const MONIKERS = {
  m: "mainnet",
  "mainnet-beta": "mainnet",
  mainnet: "mainnet",
  d: "public-devnet",
  devnet: "public-devnet",
  t: "testnet",
  testnet: "testnet",
  l: "local",
  localhost: "local",
};

const REASONS = {
  mainnet:
    "Blocked: this program write targets mainnet. Mainnet deploys, upgrades and authority changes need the owner's explicit confirmation and are run by the owner, not by Claude.",
  helius:
    "Blocked: program writes go only through a Helius devnet RPC (the public devnet endpoint has corrupted large deploys). Pass a Helius devnet URL with --url via an env var, or point the Solana CLI config at one.",
  unresolved:
    "Blocked: couldn't resolve the --url or --config value (it uses an env var that isn't set in Claude Code's own environment, or another shell expansion). Omit --url so the Solana CLI config is used, or export the variable before starting Claude Code.",
  noConfig:
    "Blocked: no --url given and the Solana CLI config couldn't be read, so the target cluster is unknown (the CLI's default is mainnet).",
};

const deny = (reason) => ({ allow: false, reason });

function programWrite(argv) {
  let sub = null;
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i];
    if (VALUE_OPTS.has(a)) {
      i++;
      continue;
    }
    if (a.startsWith("-")) continue;
    if (!sub) {
      if (!Object.hasOwn(READ_ONLY, a)) return false;
      sub = a;
      continue;
    }
    return !READ_ONLY[sub].has(a);
  }
  return false;
}

function urlAndConfig(argv) {
  let url = null;
  let config = null;
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-u" || a === "--url") url = argv[++i] ?? "";
    else if (a.startsWith("--url=")) url = a.slice(6);
    else if (/^-u[^-]/.test(a)) url = a.slice(2).replace(/^=/, "");
    else if (a === "-C" || a === "--config") config = argv[++i] ?? "";
    else if (a.startsWith("--config=")) config = a.slice(9);
  }
  return { url, config };
}

// Substitute $VAR and ${VAR} from Claude Code's environment, anywhere in the
// value (e.g. a Helius URL ending in ?api-key=$KEY). Returns null when a
// variable is unset or the value uses any other expansion: the guard can't
// know the target, so it fails closed.
function resolveVars(value, env) {
  let missing = false;
  const out = value.replace(
    /\$\{([A-Za-z_][A-Za-z0-9_]*)\}|\$([A-Za-z_][A-Za-z0-9_]*)/g,
    (_, braced, bare) => {
      const v = env[braced ?? bare];
      if (v === undefined || v === "") missing = true;
      return v ?? "";
    }
  );
  return missing || out.includes("$") ? null : out;
}

export function classify(url) {
  if (Object.hasOwn(MONIKERS, url)) return MONIKERS[url];
  let host;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return "unknown";
  }
  if (["localhost", "127.0.0.1", "[::1]", "::1", "0.0.0.0"].includes(host))
    return "local";
  if (host.includes("mainnet")) return "mainnet";
  if (
    (host.endsWith(".helius-rpc.com") || host.endsWith(".helius.xyz")) &&
    host.includes("devnet")
  )
    return "helius-devnet";
  if (host.includes("devnet")) return "public-devnet";
  return "unknown";
}

function configUrl(configPath, { readFile, env, cwd }) {
  const home = env.HOME || os.homedir();
  const file = configPath
    ? path.resolve(cwd, configPath.replace(/^~(?=\/|$)/, home))
    : path.join(home, ".config", "solana", "cli", "config.yml");
  let text;
  try {
    text = readFile(file, "utf8");
  } catch {
    return null;
  }
  const match = text.match(/^json_rpc_url:\s*["']?([^"'\r\n]+?)["']?\s*$/m);
  return match ? match[1] : null;
}

export function decide(
  command,
  { readFile = fs.readFileSync, env = process.env, cwd = process.cwd() } = {}
) {
  for (const { argv } of commands(command)) {
    if (basename(argv[0] ?? "") !== "solana" || !programWrite(argv)) continue;

    const { url: flagUrl, config } = urlAndConfig(argv);
    let url;
    if (flagUrl !== null) {
      url = resolveVars(flagUrl, env);
      if (url === null) return deny(REASONS.unresolved);
    } else {
      const configPath = config === null ? null : resolveVars(config, env);
      if (config !== null && configPath === null)
        return deny(REASONS.unresolved);
      url = configUrl(configPath, { readFile, env, cwd });
      if (url === null) return deny(REASONS.noConfig);
    }

    const cluster = classify(url);
    if (cluster === "mainnet") return deny(REASONS.mainnet);
    if (cluster !== "helius-devnet" && cluster !== "local")
      return deny(REASONS.helius);
  }
  return { allow: true };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  runHook(decide);
}
