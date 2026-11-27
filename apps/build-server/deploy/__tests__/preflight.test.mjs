import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const SCRIPT = fileURLToPath(new URL("../preflight.sh", import.meta.url));

// The substitution defaults in cloudbuild.yaml, plus the required origin.
const DEFAULTS = {
  MIN_INSTANCES: "0",
  MIN_INSTANCES_SIGNOFF: "",
  VPC_NETWORK: "build-server-vpc",
  VPC_SUBNET: "build-server-subnet",
  VPC_EGRESS_TAG: "build-server-no-egress",
  ALLOWED_ORIGIN: "https://academy.example.com",
};

function preflight(overrides = {}) {
  return spawnSync("bash", [SCRIPT], {
    encoding: "utf8",
    env: { PATH: process.env.PATH, ...DEFAULTS, ...overrides },
  });
}

test("passes with the defaults and an origin", () => {
  const result = preflight();
  assert.equal(result.status, 0, result.stderr);
});

test("min instances above 0 needs a sign-off", () => {
  for (const signoff of ["", "   "]) {
    const result = preflight({
      MIN_INSTANCES: "1",
      MIN_INSTANCES_SIGNOFF: signoff,
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /_MIN_INSTANCES_SIGNOFF/);
  }

  const signed = preflight({
    MIN_INSTANCES: "1",
    MIN_INSTANCES_SIGNOFF: "owner 2026-01-01",
  });
  assert.equal(signed.status, 0, signed.stderr);
  assert.match(signed.stdout, /signed off: owner 2026-01-01/);
});

test("min instances must be a whole number", () => {
  for (const value of ["", "one", "-1", "1.5", "01", "1 "]) {
    const result = preflight({
      MIN_INSTANCES: value,
      MIN_INSTANCES_SIGNOFF: "owner 2026-01-01",
    });
    assert.equal(result.status, 1, `accepted '${value}'`);
  }
});

test("every VPC substitution is required", () => {
  for (const name of ["VPC_NETWORK", "VPC_SUBNET", "VPC_EGRESS_TAG"]) {
    for (const value of ["", " ", "a,b"]) {
      const result = preflight({ [name]: value });
      assert.equal(result.status, 1, `${name} accepted '${value}'`);
      assert.match(result.stderr, new RegExp(`_${name}`));
    }
  }
});

test("the origin is required and must be a bare https origin", () => {
  for (const value of [
    "",
    "academy.example.com",
    "http://academy.example.com",
    "https://academy.example.com/",
    "https://academy.example.com/en",
    "https://a.example.com,https://b.example.com",
    "*",
  ]) {
    const result = preflight({ ALLOWED_ORIGIN: value });
    assert.equal(result.status, 1, `accepted '${value}'`);
    assert.match(result.stderr, /_ALLOWED_ORIGIN/);
  }
  assert.equal(
    preflight({ ALLOWED_ORIGIN: "https://localhost:3000" }).status,
    0
  );
});

test("fails when nothing is set", () => {
  const result = spawnSync("bash", [SCRIPT], {
    encoding: "utf8",
    env: { PATH: process.env.PATH },
  });
  assert.equal(result.status, 1);
});
