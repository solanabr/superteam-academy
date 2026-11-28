#!/usr/bin/env node
// PreToolUse guard for solana and anchor, as allow lists, in any letter case
// and behind any wrapper:
//   - solana: read-only subcommands, `program`/`program-v4` show and dump, and
//     program writes (deploy, write-buffer, upgrade, authority changes, close);
//   - anchor: build, expand, keys, new, init, clean, verify, account, localnet,
//     idl reads, and deploy-like commands (deploy, upgrade, migrate, test, idl
//     writes).
// A program write needs its cluster in the same command (`--url` for solana,
// `--provider.cluster` for anchor): a Helius devnet RPC or a local validator.
// Mainnet is the owner's to run by hand; public devnet and unknown hosts are
// refused. The CLI config and Anchor.toml are not trusted, and a command that
// changes directory, HOME, the tools' config env or a config file before a
// write is refused. Any word the shell builds (except the cluster value's env
// var) and every other subcommand are refused. The resolved URL is never
// printed: it can carry an API key.

import { pathToFileURL } from "node:url";

import { commands, hiddenReason, runHook, toolName } from "./lib/shell.mjs";

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
  localnet: "local",
  debug: "local",
};

const REASONS = {
  mainnet:
    "Blocked: this program write targets mainnet. Mainnet deploys, upgrades and authority changes need the owner's explicit confirmation and are run by the owner, not by Claude.",
  helius:
    "Blocked: program writes go only through a Helius devnet RPC (the public devnet endpoint has corrupted large deploys). Pass a Helius devnet URL with --url (solana) or --provider.cluster (anchor), through an env var.",
  unresolved:
    "Blocked: couldn't resolve the cluster value (it uses an env var that isn't set in Claude Code's own environment, or another shell expansion). Export the variable before starting Claude Code.",
  explicit:
    "Blocked: a program write needs its cluster in the same command: --url <Helius devnet URL> for solana, --provider.cluster <URL> for anchor. The CLI config and Anchor.toml are not trusted.",
  tamper:
    "Blocked: this command changes directory, HOME, the solana or anchor config environment, or a config file before a program write, so the guard can't trust what the write targets. Run the write on its own.",
  notAllowed:
    "Blocked: this solana or anchor subcommand is not on the guard's list for agent sessions (reads, local builds, and program writes to a Helius devnet or local cluster).",
  built:
    "Blocked: the shell builds a word of this solana or anchor command at run time ($(…), a variable, $'…', braces or a glob), so the guard can't check it. Write it literally; only the cluster value may use an env var.",
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
  const moniker = url.toLowerCase();
  if (Object.hasOwn(MONIKERS, moniker)) return MONIKERS[moniker];
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

// Anchor subcommands that write a program or its IDL on the target cluster.
const ANCHOR_WRITES = new Set(["deploy", "upgrade", "migrate", "test"]);
const ANCHOR_IDL_WRITES = new Set([
  "init",
  "upgrade",
  "write-buffer",
  "set-buffer",
  "set-authority",
  "erase-authority",
  "close",
]);
const ANCHOR_VALUE_OPTS = new Set([
  "-p",
  "--program-name",
  "--program-id",
  "--program-keypair",
  "-f",
  "--filepath",
  "--max-retries",
  "--new-authority",
  "--arch",
]);

function anchorWrite(argv) {
  const positionals = [];
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--") break;
    if (a.startsWith("-")) {
      if (
        !a.includes("=") &&
        (ANCHOR_VALUE_OPTS.has(a) || a.startsWith("--provider."))
      )
        i++;
      continue;
    }
    positionals.push(a);
  }
  const [sub, second] = positionals;
  if (sub === "idl") return ANCHOR_IDL_WRITES.has(second);
  // Tests send transactions to the provider cluster even with --skip-deploy.
  if (sub === "test") return true;
  return ANCHOR_WRITES.has(sub);
}

function anchorFlagCluster(argv) {
  let value = null;
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--provider.cluster") value = argv[++i] ?? "";
    else if (a.startsWith("--provider.cluster=")) value = a.slice(19);
  }
  return value;
}

function clusterVerdict(url) {
  const cluster = classify(url);
  if (cluster === "mainnet") return deny(REASONS.mainnet);
  if (cluster !== "helius-devnet" && cluster !== "local")
    return deny(REASONS.helius);
  return null;
}

// Read-only solana subcommands. Program writes are handled apart; every other
// subcommand (transfer, airdrop, stake and vote writes, config set, …) is refused.
const SOLANA_READS = new Set([
  "address",
  "balance",
  "account",
  "block",
  "block-height",
  "block-production",
  "block-time",
  "blocks",
  "catchup",
  "cluster-date",
  "cluster-version",
  "confirm",
  "decode-transaction",
  "epoch",
  "epoch-info",
  "fees",
  "find-program-derived-address",
  "first-available-block",
  "genesis-hash",
  "gossip",
  "help",
  "largest-accounts",
  "leader-schedule",
  "logs",
  "nonce",
  "nonce-account",
  "rent",
  "slot",
  "stake-account",
  "stake-history",
  "stakes",
  "supply",
  "transaction-count",
  "transaction-history",
  "validators",
  "vote-account",
]);
// Anchor subcommands that build or read. Deploy-like ones are handled apart.
const ANCHOR_READS = new Set([
  "build",
  "expand",
  "keys",
  "new",
  "init",
  "clean",
  "verify",
  "account",
  "localnet",
  "help",
]);
const ANCHOR_IDL_READS = new Set(["build", "parse", "type", "fetch"]);

function firstPositionals(argv, valueOpts, isValueOpt = () => false) {
  const out = [];
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--") break;
    if (a.startsWith("-")) {
      if (!a.includes("=") && (valueOpts.has(a) || isValueOpt(a))) i++;
      continue;
    }
    out.push(a.toLowerCase());
  }
  return out;
}

// The index of a cluster option's value in argv, so its env var may resolve.
function valueIndex(argv, names) {
  for (let i = 1; i < argv.length; i++) {
    if (names.includes(argv[i])) return i + 1;
    if (names.some((n) => argv[i].startsWith(`${n}=`))) return i;
    if (names.includes("-u") && /^-u[^-]/.test(argv[i])) return i;
  }
  return -1;
}

const CONFIG_ENV =
  /^(HOME|XDG_CONFIG_HOME|SOLANA_[A-Z0-9_]*|ANCHOR_[A-Z0-9_]*)$/;
const CONFIG_PATH = /config\.ya?ml|anchor\.toml|\.config\/solana/i;
const FILE_WRITERS = new Set([
  "cp",
  "mv",
  "ln",
  "tee",
  "install",
  "rsync",
  "dd",
  "sed",
  "perl",
]);

// A command line that moves the ground under a program write: it changes
// directory, sets HOME or the tools' config env, or writes a config file.
function tampers(list, raw) {
  if (/>\s*\S*(config\.ya?ml|anchor\.toml)/i.test(raw)) return true;
  return list.some(({ argv, assigns }) => {
    const head = toolName(argv[0] ?? "");
    if (["cd", "pushd", "popd"].includes(head)) return true;
    if (assigns.some((a) => CONFIG_ENV.test(a.split("=")[0]))) return true;
    if (["export", "declare", "typeset", "setenv"].includes(head))
      if (argv.slice(1).some((a) => CONFIG_ENV.test(a.split("=")[0])))
        return true;
    return (
      FILE_WRITERS.has(head) && argv.slice(1).some((a) => CONFIG_PATH.test(a))
    );
  });
}

function writeVerdict(value, env) {
  if (value === null) return deny(REASONS.explicit);
  const url = resolveVars(value, env);
  if (url === null) return deny(REASONS.unresolved);
  return clusterVerdict(url);
}

export function decide(command, { env = process.env } = {}) {
  const hidden = hiddenReason(command, ["solana", "anchor"]);
  if (hidden) return deny(hidden);
  const list = commands(command);
  for (const { argv, marks } of list) {
    const head = toolName(argv[0] ?? "");
    if (head !== "solana" && head !== "anchor") continue;

    const valueAt =
      head === "solana"
        ? valueIndex(argv, ["-u", "--url"])
        : valueIndex(argv, ["--provider.cluster"]);
    if (marks.some((m, k) => m && k !== valueAt)) return deny(REASONS.built);

    if (head === "solana") {
      const [sub, second] = firstPositionals(argv, VALUE_OPTS);
      if (programWrite(argv)) {
        if (tampers(list, command)) return deny(REASONS.tamper);
        const verdict = writeVerdict(urlAndConfig(argv).url, env);
        if (verdict) return verdict;
        continue;
      }
      if (sub === undefined || SOLANA_READS.has(sub)) continue;
      if (Object.hasOwn(READ_ONLY, sub) && READ_ONLY[sub].has(second)) continue;
      return deny(REASONS.notAllowed);
    }

    const [sub, second] = firstPositionals(argv, ANCHOR_VALUE_OPTS, (a) =>
      a.startsWith("--provider.")
    );
    if (anchorWrite(argv)) {
      if (tampers(list, command)) return deny(REASONS.tamper);
      const verdict = writeVerdict(anchorFlagCluster(argv), env);
      if (verdict) return verdict;
      continue;
    }
    if (sub === undefined || ANCHOR_READS.has(sub)) continue;
    if (sub === "idl" && ANCHOR_IDL_READS.has(second)) continue;
    return deny(REASONS.notAllowed);
  }
  return { allow: true };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  runHook(decide);
}
