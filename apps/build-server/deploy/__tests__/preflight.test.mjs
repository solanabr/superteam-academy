// The first build step and the last one validate the substitutions with the
// same function, so a value the first accepts is never rejected by the last.

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { validateInputs } from "../check-service.mjs";

const SCRIPT = fileURLToPath(new URL("../check-service.mjs", import.meta.url));

const ENV = {
  PROJECT_ID: "example-project",
  REGION: "southamerica-east1",
  REPO: "academy-images",
  SERVICE: "academy-build-server",
  TAG: "abc1234",
  ALLOWED_ORIGIN: "https://academy.example.com",
  MIN_INSTANCES: "0",
  MIN_INSTANCES_SIGNOFF: "",
};
const failures = (overrides = {}) =>
  validateInputs({ ...ENV, ...overrides }).failures;

function preflight(env) {
  return spawnSync(process.execPath, [SCRIPT, "preflight"], {
    encoding: "utf8",
    env: { PATH: process.env.PATH, ...env },
  });
}

test("passes with the defaults and an origin", () => {
  assert.deepEqual(failures(), []);
  assert.equal(preflight(ENV).status, 0);
});

test("min instances above 0 needs a sign-off", () => {
  for (const signoff of [
    "",
    "   ",
    " ", // non-breaking space
    " ​", // em space, zero-width space
    "---",
    "\t",
  ]) {
    const result = failures({
      MIN_INSTANCES: "1",
      MIN_INSTANCES_SIGNOFF: signoff,
    });
    assert.match(result.join("\n"), /_MIN_INSTANCES_SIGNOFF/, `'${signoff}'`);
  }
  assert.deepEqual(
    failures({ MIN_INSTANCES: "1", MIN_INSTANCES_SIGNOFF: "owner 2026-01-01" }),
    []
  );
});

test("a sign-off cannot carry control characters into the log", () => {
  const result = failures({
    MIN_INSTANCES: "1",
    MIN_INSTANCES_SIGNOFF: "owner\npreflight ok",
  });
  assert.match(result.join("\n"), /_MIN_INSTANCES_SIGNOFF/);
});

test("min instances must be a whole number", () => {
  for (const value of ["", "one", "-1", "1.5", "01", "1 ", "0x1", undefined]) {
    const result = failures({
      MIN_INSTANCES: value,
      MIN_INSTANCES_SIGNOFF: "owner 2026-01-01",
    });
    assert.match(result.join("\n"), /_MIN_INSTANCES /, `accepted '${value}'`);
  }
});

test("the origin is required and must be a bare https origin", () => {
  for (const value of [
    "",
    undefined,
    "academy.example.com",
    "http://academy.example.com",
    "https://academy.example.com/",
    "https://academy.example.com/en",
    "https://a.example.com,https://b.example.com",
    "https://academy.example.com,BUILD_TIMEOUT_SECS=3000",
    "*",
  ]) {
    const result = failures({ ALLOWED_ORIGIN: value });
    assert.match(result.join("\n"), /_ALLOWED_ORIGIN/, `accepted '${value}'`);
  }
  assert.deepEqual(failures({ ALLOWED_ORIGIN: "https://localhost:3000" }), []);
});

test("names that reach a command line have a fixed shape", () => {
  const bad = {
    SERVICE: ["", "x; rm -rf /", 'a" --region "b', "$(id)", "Academy", "a b"],
    REGION: ["", "us-central1 --project other", "southamerica", "$(id)"],
    REPO: ["", "repo/other", "a b", "$(id)"],
    TAG: ["", "a b", "a:b", "-x", "$(id)", "a/b"],
    PROJECT_ID: ["", "x", "a b", "$(id)"],
  };
  const messageFor = {
    SERVICE: /_SERVICE/,
    REGION: /_REGION/,
    REPO: /_REPO/,
    TAG: /_TAG/,
    PROJECT_ID: /PROJECT_ID/,
  };
  for (const [name, values] of Object.entries(bad)) {
    for (const value of values) {
      assert.match(
        failures({ [name]: value }).join("\n"),
        messageFor[name],
        `${name} accepted '${value}'`
      );
    }
  }
  assert.deepEqual(
    failures({ TAG: "v1.2.3_rc-1", REGION: "europe-west12" }),
    []
  );
});

test("derives the image and the service account from the inputs", () => {
  const { inputs } = validateInputs(ENV);
  assert.equal(
    inputs.image,
    "southamerica-east1-docker.pkg.dev/example-project/academy-images/academy-build-server:abc1234"
  );
  assert.equal(
    inputs.serviceAccount,
    "academy-build-sa@example-project.iam.gserviceaccount.com"
  );
  assert.equal(inputs.minInstances, 0);
});

test("CLI preflight: exit code and output", () => {
  const empty = preflight({});
  assert.equal(empty.status, 1);
  assert.match(empty.stderr, /_ALLOWED_ORIGIN/);

  const unsigned = preflight({ ...ENV, MIN_INSTANCES: "1" });
  assert.equal(unsigned.status, 1);
  assert.match(unsigned.stderr, /_MIN_INSTANCES_SIGNOFF/);

  const signed = preflight({
    ...ENV,
    MIN_INSTANCES: "1",
    MIN_INSTANCES_SIGNOFF: "owner 2026-01-01",
  });
  assert.equal(signed.status, 0, signed.stderr);
  assert.match(signed.stdout, /signed off: owner 2026-01-01/);
});
