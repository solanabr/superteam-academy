// Static checks on the deploy config. They fail when cloudbuild.yaml stops
// declaring a setting the deploy relies on.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (name) =>
  readFileSync(new URL(`../${name}`, import.meta.url), "utf8");

/** Drops full-line comments and a comment after a closing quote. */
function stripComment(line) {
  if (/^\s*#/.test(line)) return "";
  return line.replace(/^(.*')\s+#.*$/, "$1");
}

/**
 * Reads the subset of YAML cloudbuild.yaml uses: one single-quoted scalar per
 * line. Any other shape under `steps` or `substitutions` throws, so a
 * reformatted file fails here instead of slipping past the assertions.
 */
function parseCloudbuild(text) {
  const steps = [];
  const substitutions = {};
  let section = null;
  let step = null;
  let list = null;

  for (const raw of text.split("\n")) {
    const line = stripComment(raw).trimEnd();
    if (!line) continue;
    let m;
    if ((m = line.match(/^([a-z_]+):/))) {
      section = m[1];
      step = null;
      list = null;
    } else if (section === "steps") {
      if ((m = line.match(/^ {2}- name: '(.*)'$/))) {
        step = { name: m[1], args: [], env: [] };
        steps.push(step);
        list = null;
      } else if (
        step &&
        (m = line.match(/^ {4}(id|entrypoint|dir): '(.*)'$/))
      ) {
        step[m[1]] = m[2];
        list = null;
      } else if (step && (m = line.match(/^ {4}(args|env):$/))) {
        list = step[m[1]];
      } else if (list && (m = line.match(/^ {6}- '(.*)'$/))) {
        list.push(m[1]);
      } else {
        throw new Error(`cloudbuild.yaml: unexpected line: ${raw}`);
      }
    } else if (section === "substitutions") {
      if (!(m = line.match(/^ {2}(_[A-Z0-9_]+): '(.*)'$/))) {
        throw new Error(`cloudbuild.yaml: unexpected line: ${raw}`);
      }
      substitutions[m[1]] = m[2];
    }
  }
  return { steps, substitutions };
}

/** `--flag value` pairs and bare `--flag`s from an args list. */
function flagsOf(args) {
  const flags = new Map();
  args.forEach((arg, i) => {
    if (!arg.startsWith("--")) return;
    assert.ok(!flags.has(arg), `${arg} is passed twice`);
    const next = args[i + 1];
    flags.set(arg, next !== undefined && !next.startsWith("--") ? next : true);
  });
  return flags;
}

const text = read("cloudbuild.yaml");
const uncommented = text.split("\n").map(stripComment).join("\n");
const { steps, substitutions } = parseCloudbuild(text);
const deploySteps = steps.filter(
  (s) => s.args[0] === "run" && s.args[1] === "deploy"
);
const flags = flagsOf(deploySteps[0]?.args ?? []);

test("one gcloud run deploy, and nothing updates the service after it", () => {
  assert.equal(deploySteps.length, 1);
  assert.equal(uncommented.match(/\brun\s+deploy\b/g), null);
  assert.doesNotMatch(uncommented, /services\s+update|update-traffic/);
});

test("scales to zero by default", () => {
  assert.equal(flags.get("--min-instances"), "${_MIN_INSTANCES}");
  assert.equal(substitutions._MIN_INSTANCES, "0");
  assert.equal(substitutions._MIN_INSTANCES_SIGNOFF, "");
  assert.equal(flags.get("--min"), "default");
  assert.equal(flags.get("--max-instances"), "2");
  assert.equal(flags.get("--cpu-boost"), true);
});

test("CPU is throttled outside requests", () => {
  assert.equal(flags.get("--cpu-throttling"), true);
  assert.doesNotMatch(uncommented, /--no-cpu-throttling/);
});

test("runs as the dedicated service account", () => {
  assert.equal(
    flags.get("--service-account"),
    "academy-build-sa@${PROJECT_ID}.iam.gserviceaccount.com"
  );
});

test("the API key is a secret reference, never a literal", () => {
  assert.equal(
    flags.get("--set-secrets"),
    "ACADEMY_API_KEY=academy-build-api-key:latest"
  );
  // --set-env-vars is what removes a literal ACADEMY_API_KEY left on the
  // service; --update-env-vars would keep it and make --set-secrets fail.
  assert.equal(typeof flags.get("--set-env-vars"), "string");
  assert.doesNotMatch(flags.get("--set-env-vars"), /ACADEMY_API_KEY/);
  assert.ok(!flags.has("--update-env-vars"));
  assert.ok(!flags.has("--update-secrets"));
  assert.doesNotMatch(text, /_ACADEMY_API_KEY/);
});

test("all egress goes through the VPC on the firewall tag", () => {
  assert.equal(flags.get("--network"), "${_VPC_NETWORK}");
  assert.equal(flags.get("--subnet"), "${_VPC_SUBNET}");
  assert.equal(flags.get("--network-tags"), "${_VPC_EGRESS_TAG}");
  assert.equal(flags.get("--vpc-egress"), "all-traffic");
  assert.equal(substitutions._VPC_NETWORK, "build-server-vpc");
  assert.equal(substitutions._VPC_SUBNET, "build-server-subnet");
  assert.equal(substitutions._VPC_EGRESS_TAG, "build-server-no-egress");
});

test("the build timeout ends before the request timeout", () => {
  const env = Object.fromEntries(
    flags
      .get("--set-env-vars")
      .split(",")
      .map((pair) => pair.split("="))
  );
  assert.equal(env.BUILD_TIMEOUT_SECS, "240");
  assert.equal(flags.get("--timeout"), "300");
  assert.ok(Number(env.BUILD_TIMEOUT_SECS) < 295);
});

test("the origin has no default", () => {
  assert.equal(substitutions._ALLOWED_ORIGIN, "");
  assert.match(
    flags.get("--set-env-vars"),
    /ALLOWED_ORIGIN=\$\{_ALLOWED_ORIGIN\}/
  );
});

test("preflight runs first and gets every value it validates", () => {
  const first = steps[0];
  assert.deepEqual(first.args, ["apps/build-server/deploy/preflight.sh"]);
  assert.deepEqual(first.env, [
    "MIN_INSTANCES=${_MIN_INSTANCES}",
    "MIN_INSTANCES_SIGNOFF=${_MIN_INSTANCES_SIGNOFF}",
    "VPC_NETWORK=${_VPC_NETWORK}",
    "VPC_SUBNET=${_VPC_SUBNET}",
    "VPC_EGRESS_TAG=${_VPC_EGRESS_TAG}",
    "ALLOWED_ORIGIN=${_ALLOWED_ORIGIN}",
  ]);
});

test("the service is read back and checked last", () => {
  const [describe, verify] = steps.slice(-2);
  assert.ok(steps.indexOf(describe) > steps.indexOf(deploySteps[0]));
  assert.match(describe.args.at(-1), /run services describe .*--format=json/);
  assert.deepEqual(verify.args, [
    "apps/build-server/deploy/check-service.mjs",
    "/workspace/service.json",
  ]);
  assert.deepEqual(verify.env, [
    "EXPECT_SERVICE_ACCOUNT=" + flags.get("--service-account"),
    "EXPECT_SECRET=academy-build-api-key",
    "EXPECT_MIN_INSTANCES=${_MIN_INSTANCES}",
    "MIN_INSTANCES_SIGNOFF=${_MIN_INSTANCES_SIGNOFF}",
    "EXPECT_NETWORK=${_VPC_NETWORK}",
    "EXPECT_SUBNET=${_VPC_SUBNET}",
    "EXPECT_NETWORK_TAG=${_VPC_EGRESS_TAG}",
  ]);
});

// `gcloud builds submit` rejects a substitution that is defined but unused,
// or used but undefined.
test("substitutions defined and substitutions used are the same set", () => {
  const used = new Set(uncommented.match(/\$\{_[A-Z0-9_]+\}/g));
  const defined = Object.keys(substitutions).map((key) => `\${${key}}`);
  assert.deepEqual([...used].sort(), defined.sort());
});

test("deploy.sh only submits cloudbuild.yaml", () => {
  const script = read("deploy.sh").split("\n").map(stripComment).join("\n");
  assert.match(script, /gcloud builds submit/);
  assert.match(script, /apps\/build-server\/deploy\/cloudbuild\.yaml/);
  assert.doesNotMatch(script, /gcloud run|docker |ACADEMY_API_KEY/);
});
