import assert from "node:assert/strict";
import { test } from "node:test";

import { classify, decide } from "../guard-solana.mjs";

const HELIUS_DEVNET =
  "https://devnet.helius-rpc.com/?api-key=00000000-test-key";
const HELIUS_MAINNET =
  "https://mainnet.helius-rpc.com/?api-key=00000000-test-key";

// A fake filesystem holding the Solana CLI config.
function fs(configs) {
  return (p) => {
    if (!(p in configs)) throw new Error("ENOENT");
    return `---\njson_rpc_url: "${configs[p]}"\nwebsocket_url: ""\nkeypair_path: /home/dev/.config/solana/id.json\n`;
  };
}
const DEFAULT_CONFIG = "/home/dev/.config/solana/cli/config.yml";
const deps = (configUrl, env = {}) => ({
  env: { HOME: "/home/dev", ...env },
  cwd: "/repo",
  readFile: configUrl === null ? fs({}) : fs({ [DEFAULT_CONFIG]: configUrl }),
});

const SO = "target/deploy/onchain_academy_pinocchio_fresh.so";

const cases = [
  // [command, config url or null, env, expected, label]
  [
    `solana program deploy ${SO} --url ${HELIUS_DEVNET}`,
    null,
    {},
    "allow",
    "Helius devnet via --url",
  ],
  [
    `solana program deploy ${SO} --url "$HELIUS_DEVNET_RPC"`,
    null,
    { HELIUS_DEVNET_RPC: HELIUS_DEVNET },
    "allow",
    "Helius devnet via env var",
  ],
  [
    `solana program deploy ${SO}`,
    HELIUS_DEVNET,
    {},
    "explicit",
    "Helius devnet from the CLI config is not trusted",
  ],
  [
    `solana program deploy ${SO} -u localhost`,
    null,
    {},
    "allow",
    "local validator moniker",
  ],
  [
    `solana program deploy ${SO} --url http://127.0.0.1:8899`,
    null,
    {},
    "allow",
    "local validator URL",
  ],
  [
    `solana program show 7NeJaSRyb4Wxay3Tcd9bdpD7T3GWYUQSFyrhG8SgwE8V -um`,
    null,
    {},
    "allow",
    "read-only on mainnet",
  ],
  [
    `solana program dump PROGRAM out.so --url mainnet-beta`,
    null,
    {},
    "allow",
    "dump is read-only",
  ],
  [
    `solana balance --url mainnet-beta`,
    null,
    {},
    "allow",
    "not a program write",
  ],
  [
    `solana config set --url devnet`,
    null,
    {},
    "notAllowed",
    "config set is not on the list",
  ],
  [`solana transfer RECIPIENT 1 -ud`, null, {}, "notAllowed", "transfer"],
  [`solana airdrop 1 -ud`, null, {}, "notAllowed", "airdrop"],

  [
    `solana program deploy ${SO} --url mainnet-beta`,
    null,
    {},
    "mainnet",
    "--url mainnet-beta",
  ],
  [`solana program deploy ${SO} -um`, null, {}, "mainnet", "-um"],
  [`solana program deploy ${SO} -u m`, null, {}, "mainnet", "-u m"],
  [
    `solana -u mainnet-beta program deploy ${SO}`,
    null,
    {},
    "mainnet",
    "global flag before the subcommand",
  ],
  [
    `solana program deploy ${SO} --url=https://api.mainnet-beta.solana.com`,
    null,
    {},
    "mainnet",
    "--url= mainnet URL",
  ],
  [
    `solana program deploy ${SO} --url ${HELIUS_MAINNET}`,
    null,
    {},
    "mainnet",
    "Helius mainnet",
  ],
  [
    `solana program deploy ${SO}`,
    "https://api.mainnet-beta.solana.com",
    {},
    "explicit",
    "mainnet from the CLI config",
  ],
  [
    `solana program upgrade BUFFER PROGRAM --url mainnet-beta`,
    null,
    {},
    "mainnet",
    "upgrade",
  ],
  [
    `solana program write-buffer ${SO} -um`,
    null,
    {},
    "mainnet",
    "write-buffer",
  ],
  [
    `solana program set-upgrade-authority PROGRAM --new-upgrade-authority X -um`,
    null,
    {},
    "mainnet",
    "authority change",
  ],
  [
    `solana program close PROGRAM --url mainnet-beta`,
    null,
    {},
    "mainnet",
    "close",
  ],
  [`solana program-v4 deploy ${SO} -um`, null, {}, "mainnet", "program-v4"],
  [
    `cd onchain-academy && solana program deploy ${SO} -um`,
    null,
    {},
    "tamper",
    "compound command after cd",
  ],
  [
    `sh -c 'solana program deploy ${SO} --url mainnet-beta'`,
    null,
    {},
    "mainnet",
    "inside sh -c",
  ],
  [
    `solana program deploy ${SO} \\\n  --url mainnet-beta`,
    null,
    {},
    "mainnet",
    "line continuation",
  ],

  [
    `solana program deploy ${SO} --url devnet`,
    null,
    {},
    "helius",
    "public devnet moniker",
  ],
  [`solana program deploy ${SO} -ud`, null, {}, "helius", "-ud"],
  [
    `solana program deploy ${SO} --url https://api.devnet.solana.com`,
    null,
    {},
    "helius",
    "public devnet URL",
  ],
  [
    `solana program deploy ${SO}`,
    "https://api.devnet.solana.com",
    {},
    "explicit",
    "public devnet from the CLI config",
  ],
  [
    `solana program deploy ${SO} --url https://rpc.example.org`,
    null,
    {},
    "helius",
    "unknown host",
  ],
  [
    `solana program close --buffers --url devnet`,
    null,
    {},
    "helius",
    "buffer close on public devnet",
  ],

  [
    `solana program deploy ${SO} --url "$UNSET_RPC"`,
    null,
    {},
    "unresolved",
    "unset env var",
  ],
  [
    `solana program deploy ${SO} --url "https://$HOST/x"`,
    null,
    { HOST: "devnet.helius-rpc.com" },
    "allow",
    "embedded host variable",
  ],
  [
    `solana program deploy ${SO} --url "https://devnet.helius-rpc.com/?api-key=$KEY"`,
    null,
    { KEY: "00000000-test-key" },
    "allow",
    "embedded key variable",
  ],
  [
    `solana program deploy ${SO} --url "https://devnet.helius-rpc.com/?api-key=\${KEY}"`,
    null,
    { KEY: "00000000-test-key" },
    "allow",
    "embedded braced key variable",
  ],
  [
    `solana program deploy ${SO} --url "https://devnet.helius-rpc.com/?api-key=$KEY"`,
    null,
    {},
    "unresolved",
    "embedded variable that isn't set",
  ],
  [
    `solana program deploy ${SO} --url "https://$NET.helius-rpc.com/?api-key=$KEY"`,
    null,
    { NET: "mainnet", KEY: "00000000-test-key" },
    "mainnet",
    "variable that resolves to mainnet",
  ],
  [
    `solana program deploy ${SO} --url "$(cat rpc.txt)"`,
    null,
    {},
    "unresolved",
    "command substitution in --url",
  ],
  [
    `pnpm exec solana program deploy ${SO} -um`,
    null,
    {},
    "mainnet",
    "pnpm exec wrapper",
  ],
  [`npx solana program deploy ${SO} -um`, null, {}, "mainnet", "npx wrapper"],
  [
    `git commit -m "$(cat <<'EOF'\nfix: don't drop the nonce\nEOF\n)" && solana program deploy x.so -um`,
    null,
    {},
    "mainnet",
    "deploy after a heredoc commit with an apostrophe",
  ],
  [
    `solana program deploy ${SO}`,
    null,
    {},
    "explicit",
    "no flag and no config file",
  ],
  [
    `HOME=/tmp/evil solana program deploy ${SO} --url ${HELIUS_DEVNET}`,
    null,
    {},
    "tamper",
    "HOME changed for the write",
  ],
  [
    `cp mainnet.yml ~/.config/solana/cli/config.yml && solana program deploy ${SO} --url ${HELIUS_DEVNET}`,
    null,
    {},
    "tamper",
    "config copied before the write",
  ],
  [
    `export SOLANA_CONFIG=x; solana program deploy ${SO} --url ${HELIUS_DEVNET}`,
    null,
    {},
    "tamper",
    "solana config env exported",
  ],
];

const PATTERNS = {
  mainnet: /mainnet/,
  helius: /Helius devnet/,
  unresolved: /couldn't resolve/,
  explicit: /in the same command/,
  tamper: /changes directory, HOME/,
  notAllowed: /not on the guard's list/,
};

for (const [cmd, configUrl, env, expected, label] of cases) {
  test(`${expected === "allow" ? "allows" : "blocks"}: ${label}`, () => {
    const v = decide(cmd, deps(configUrl, env));
    if (expected === "allow") {
      assert.deepEqual(v, { allow: true }, cmd);
    } else {
      assert.equal(v.allow, false, cmd);
      assert.match(v.reason, PATTERNS[expected]);
    }
    if (v.reason)
      assert.doesNotMatch(
        v.reason,
        /api-key|helius-rpc\.com|test-key/,
        "reason must not echo the URL"
      );
  });
}

test("a -C config is not trusted for a write either", () => {
  const v = decide(`solana program deploy ${SO} -C alt.yml`, deps(null));
  assert.equal(v.allow, false);
  assert.match(v.reason, /in the same command/);
});

test("classify", () => {
  assert.equal(classify("m"), "mainnet");
  assert.equal(classify("toString"), "unknown");
  assert.equal(classify(HELIUS_DEVNET), "helius-devnet");
  assert.equal(classify("not a url"), "unknown");
});
