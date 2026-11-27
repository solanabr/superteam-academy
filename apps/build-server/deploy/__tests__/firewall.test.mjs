import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { checkFirewall, DECLARED } from "../check-service.mjs";

const SCRIPT = fileURLToPath(new URL("../check-service.mjs", import.meta.url));
const FIXTURE = fileURLToPath(
  new URL("./fixtures/firewall-rules.json", import.meta.url)
);
const NETWORK =
  "https://www.googleapis.com/compute/v1/projects/example-project/global/networks/build-server-vpc";
const TAG = "build-server-no-egress";

/** The good fixture, changed by `mutate`. */
function rules(mutate = () => {}) {
  const copy = JSON.parse(readFileSync(FIXTURE, "utf8"));
  mutate(copy);
  return copy;
}
const deny = (list) => list.find((r) => r.name === "build-server-deny-egress");
const allow = (overrides = {}) => ({
  kind: "compute#firewall",
  name: "allow-egress",
  network: NETWORK,
  direction: "EGRESS",
  priority: 900,
  allowed: [{ IPProtocol: "tcp", ports: ["443"] }],
  destinationRanges: ["0.0.0.0/0"],
  disabled: false,
  ...overrides,
});

test("the declared rule passes", () => {
  assert.deepEqual(checkFirewall(rules()), []);
});

const NO_DENY = /no enabled EGRESS DENY rule/;
const rejected = [
  ["rule missing", (l) => l.splice(l.indexOf(deny(l)), 1), NO_DENY],
  ["no rules at all", (l) => l.splice(0), NO_DENY],
  ["rule disabled", (l) => (deny(l).disabled = true), NO_DENY],
  [
    "rule for tcp only",
    (l) => (deny(l).denied = [{ IPProtocol: "tcp" }]),
    NO_DENY,
  ],
  [
    "rule for all protocols but named ports",
    (l) => (deny(l).denied = [{ IPProtocol: "all", ports: ["443"] }]),
    NO_DENY,
  ],
  ["rule on another tag", (l) => (deny(l).targetTags = ["other-tag"]), NO_DENY],
  ["rule with no target tags", (l) => delete deny(l).targetTags, NO_DENY],
  [
    "rule to a narrower destination",
    (l) => (deny(l).destinationRanges = ["10.0.0.0/8"]),
    NO_DENY,
  ],
  [
    "rule from a narrower source",
    (l) => (deny(l).sourceRanges = ["10.8.0.0/28"]),
    NO_DENY,
  ],
  [
    "rule is an allow",
    (l) => {
      deny(l).allowed = deny(l).denied;
      delete deny(l).denied;
    },
    NO_DENY,
  ],
  ["rule is for ingress", (l) => (deny(l).direction = "INGRESS"), NO_DENY],
  [
    "rule on another network",
    (l) => (deny(l).network = deny(l).network.replace(/[^/]+$/, "default")),
    NO_DENY,
  ],
  [
    "competing allow on the tag at a higher priority",
    (l) => l.push(allow({ priority: 900, targetTags: [TAG] })),
    /allow-egress \(priority 900\) can allow egress/,
  ],
  [
    "competing allow for the whole network at a higher priority",
    (l) => l.push(allow({ priority: 0 })),
    /allow-egress \(priority 0\) can allow egress/,
  ],
  [
    "competing allow at the same priority",
    (l) => l.push(allow({ priority: 1000, targetTags: [TAG] })),
    /allow-egress \(priority 1000\) can allow egress/,
  ],
  [
    "competing allow with the default priority",
    (l) => l.push(allow({ priority: undefined })),
    /allow-egress \(priority 1000\) can allow egress/,
  ],
];

for (const [name, mutate, message] of rejected) {
  test(`rejects: ${name}`, () => {
    const failures = checkFirewall(rules(mutate));
    assert.ok(failures.length > 0, "expected a failure");
    assert.match(failures.join("\n"), message);
  });
}

const accepted = [
  [
    "an allow at a lower priority",
    (l) => l.push(allow({ priority: 1001, targetTags: [TAG] })),
  ],
  [
    "a network-wide allow at a lower priority",
    (l) => l.push(allow({ priority: 65534 })),
  ],
  [
    "a higher-priority allow for another tag only",
    (l) => l.push(allow({ priority: 100, targetTags: ["other-tag"] })),
  ],
  [
    "a higher-priority allow for a service account only",
    (l) =>
      l.push(
        allow({
          priority: 100,
          targetServiceAccounts: [
            "other@example-project.iam.gserviceaccount.com",
          ],
        })
      ),
  ],
  [
    "a disabled higher-priority allow",
    (l) => l.push(allow({ priority: 100, disabled: true })),
  ],
  [
    "a higher-priority ingress allow",
    (l) => l.push(allow({ priority: 100, direction: "INGRESS" })),
  ],
  [
    "the rule under another name",
    (l) => (deny(l).name = "deny-all-egress-for-build-server"),
  ],
  [
    "the rule with the tag among several",
    (l) => deny(l).targetTags.push("another-tag"),
  ],
  [
    "the rule with no destination ranges",
    (l) => delete deny(l).destinationRanges,
  ],
  [
    "the rule with the protocol in capitals",
    (l) => (deny(l).denied = [{ IPProtocol: "ALL" }]),
  ],
  [
    "a second, stricter deny in front",
    (l) =>
      l.push({ ...deny(l), name: "deny-first", priority: 10 }) &&
      l.push(allow({ priority: 500, targetTags: [TAG] })),
  ],
];

for (const [name, mutate] of accepted) {
  test(`accepts: ${name}`, () => {
    assert.deepEqual(checkFirewall(rules(mutate)), []);
  });
}

test("setup mode also requires the rule under its own name", () => {
  const options = { requireRule: DECLARED.firewallRule };
  assert.deepEqual(checkFirewall(rules(), options), []);

  const renamed = rules((l) => (deny(l).name = "some-other-name"));
  assert.match(
    checkFirewall(renamed, options).join("\n"),
    /build-server-deny-egress does not exist/
  );

  // Another rule satisfies the deny, but the named one has drifted.
  const drifted = rules((l) => {
    l.push({ ...deny(l), name: "deny-first", priority: 10 });
    deny(l).denied = [{ IPProtocol: "tcp" }];
  });
  assert.deepEqual(checkFirewall(drifted), []);
  assert.match(
    checkFirewall(drifted, options).join("\n"),
    /build-server-deny-egress is not an enabled EGRESS DENY rule/
  );
});

test("rejects input that is not a rule list", () => {
  for (const input of [null, {}, "x", { items: [] }]) {
    assert.match(
      checkFirewall(input).join("\n"),
      /not a list of firewall rules/
    );
  }
});

function run(args, input) {
  return spawnSync(process.execPath, [SCRIPT, ...args], {
    input,
    encoding: "utf8",
    env: { PATH: process.env.PATH },
  });
}

test("CLI firewall: file or stdin, exit code follows the check", () => {
  assert.equal(run(["firewall", FIXTURE]).status, 0);
  assert.equal(run(["firewall", "-"], readFileSync(FIXTURE, "utf8")).status, 0);
  assert.equal(run(["firewall"], readFileSync(FIXTURE, "utf8")).status, 0);

  const drifted = rules((l) => (deny(l).disabled = true));
  const result = run(["firewall", "-"], JSON.stringify(drifted));
  assert.equal(result.status, 1);
  assert.match(result.stderr, /build-server-deny-egress is not an enabled/);

  assert.equal(run(["firewall", "-"], "not json").status, 1);
});
