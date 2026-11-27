// Static checks on the deploy config. `problems()` pins cloudbuild.yaml to
// what check-service.mjs verifies after the deploy: any step or deploy flag
// that is added, dropped, repeated or changed is a problem. The mutation
// cases at the bottom keep it from going blind.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { DECLARED, validateInputs } from "../check-service.mjs";

const read = (name) =>
  readFileSync(new URL(`../${name}`, import.meta.url), "utf8");

/** Drops full-line comments and a comment after a closing quote. */
function stripComment(line) {
  if (/^\s*#/.test(line)) return "";
  return line.replace(/^(.*')\s+#.*$/, "$1");
}

/**
 * Reads the subset of YAML cloudbuild.yaml uses and throws on anything else.
 * The whole file is covered: four top-level keys; steps made of name, id,
 * entrypoint, dir, args and env, one single-quoted scalar per line; quoted
 * substitutions; plain `key: value` options. No key may repeat. A file in any
 * other shape fails here instead of slipping past the checks.
 */
function parseCloudbuild(text) {
  const steps = [];
  const substitutions = {};
  const options = {};
  const top = new Set();
  let timeout;
  let section = null;
  let step = null;
  let list = null;
  let stepKeys = null;

  // A YAML loader breaks lines on more than "\n" (a lone carriage return, for
  // one), and this parser does not. Refusing every other control or non-ASCII
  // character keeps the two readings of the file the same.
  const odd = /[^\x20-\x7e\n]/.exec(text);
  if (odd) {
    const line = text.slice(0, odd.index).split("\n").length;
    const code = odd[0].codePointAt(0).toString(16).padStart(4, "0");
    throw new Error(
      `character outside printable ASCII (U+${code}) on line ${line}`
    );
  }

  for (const raw of text.split("\n")) {
    const line = stripComment(raw).trimEnd();
    if (!line) continue;
    const unexpected = () => {
      throw new Error(`cloudbuild.yaml: unexpected line: ${raw}`);
    };
    // A key that appears twice would be read differently by different parsers.
    const once = (seen, key) => (seen.has(key) ? unexpected() : seen.add(key));
    let m;

    if (!line.startsWith(" ")) {
      if ((m = line.match(/^(steps|substitutions|options):$/))) {
        section = m[1];
      } else if ((m = line.match(/^timeout: '(.*)'$/))) {
        section = "timeout";
        timeout = m[1];
      } else {
        throw new Error(`cloudbuild.yaml: unexpected top-level line: ${raw}`);
      }
      once(top, section);
      step = null;
      list = null;
    } else if (section === "steps") {
      if ((m = line.match(/^ {2}- name: '(.*)'$/))) {
        step = { name: m[1], args: [], env: [] };
        steps.push(step);
        stepKeys = new Set();
        list = null;
      } else if (
        step &&
        (m = line.match(/^ {4}(id|entrypoint|dir): '(.*)'$/))
      ) {
        once(stepKeys, m[1]);
        step[m[1]] = m[2];
        list = null;
      } else if (step && (m = line.match(/^ {4}(args|env):$/))) {
        once(stepKeys, m[1]);
        list = step[m[1]];
      } else if (list && (m = line.match(/^ {6}- '(.*)'$/))) {
        list.push(m[1]);
      } else {
        unexpected();
      }
    } else if (section === "substitutions") {
      if (!(m = line.match(/^ {2}(_[A-Z0-9_]+): '(.*)'$/))) unexpected();
      if (m[1] in substitutions) unexpected();
      substitutions[m[1]] = m[2];
    } else if (section === "options") {
      if (!(m = line.match(/^ {2}([A-Za-z_]+): (\S.*)$/))) unexpected();
      if (m[1] in options) unexpected();
      options[m[1]] = m[2];
    } else {
      // Nothing nests under `timeout`.
      unexpected();
    }
  }
  return { steps, substitutions, options, timeout, top: [...top] };
}

/**
 * Splits a gcloud argument list into positionals and one flag map.
 * `--flag value` and `--flag=value` land on the same key; a flag given twice
 * is reported.
 */
function parseArgs(args) {
  const positionals = [];
  const flags = new Map();
  const repeated = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg.startsWith("--")) {
      positionals.push(arg);
      continue;
    }
    let flag = arg;
    let value = true;
    const eq = arg.indexOf("=");
    if (eq !== -1) {
      flag = arg.slice(0, eq);
      value = arg.slice(eq + 1);
    } else if (i + 1 < args.length && !args[i + 1].startsWith("--")) {
      value = args[++i];
    }
    if (flags.has(flag)) repeated.push(flag);
    flags.set(flag, value);
  }
  return { positionals, flags, repeated };
}

/** True when `words` appear in a row once every arg is split on spaces. */
function mentions(step, ...words) {
  const tokens = step.args.flatMap((arg) => arg.split(/[\s;&|"'`()]+/));
  return tokens.some((_, i) => words.every((w, j) => tokens[i + j] === w));
}

// Sample substitution values, to compare the rendered config with what
// check-service.mjs expects for the same values.
const SUBS = {
  PROJECT_ID: "example-project",
  _REGION: "europe-west12",
  _REPO: "some-repo",
  _SERVICE: "some-service",
  _TAG: "abc1234",
  _ALLOWED_ORIGIN: "https://academy.example.com",
  _MIN_INSTANCES: "3",
  _MIN_INSTANCES_SIGNOFF: "owner 2026-01-01",
};
const render = (value) =>
  typeof value === "string"
    ? value.replace(/\$\{([A-Z0-9_]+)\}/g, (whole, key) => SUBS[key] ?? whole)
    : value;
const { inputs: INPUTS, failures: INPUT_FAILURES } = validateInputs({
  PROJECT_ID: SUBS.PROJECT_ID,
  REGION: SUBS._REGION,
  REPO: SUBS._REPO,
  SERVICE: SUBS._SERVICE,
  TAG: SUBS._TAG,
  ALLOWED_ORIGIN: SUBS._ALLOWED_ORIGIN,
  MIN_INSTANCES: SUBS._MIN_INSTANCES,
  MIN_INSTANCES_SIGNOFF: SUBS._MIN_INSTANCES_SIGNOFF,
});
assert.deepEqual(INPUT_FAILURES, []);

const IMAGE = "${_REGION}-docker.pkg.dev/${PROJECT_ID}/${_REPO}/${_SERVICE}";
const SCRIPT = "apps/build-server/deploy/check-service.mjs";
// The same eight values go to the first step and the last.
const INPUT_ENV = [
  "PROJECT_ID=${PROJECT_ID}",
  "REGION=${_REGION}",
  "REPO=${_REPO}",
  "SERVICE=${_SERVICE}",
  "TAG=${_TAG}",
  "ALLOWED_ORIGIN=${_ALLOWED_ORIGIN}",
  "MIN_INSTANCES=${_MIN_INSTANCES}",
  "MIN_INSTANCES_SIGNOFF=${_MIN_INSTANCES_SIGNOFF}",
];
const GCLOUD = "gcr.io/cloud-builders/gcloud";
const DOCKER = "gcr.io/cloud-builders/docker";
const NODE = "node:22-slim";

/** Every step except `deploy`, exactly as it must appear. */
const FIXED_STEPS = {
  preflight: {
    name: NODE,
    id: "preflight",
    entrypoint: "node",
    args: [SCRIPT, "preflight"],
    env: INPUT_ENV,
  },
  build: {
    name: DOCKER,
    id: "build",
    args: ["build", "-t", `${IMAGE}:\${_TAG}`, "-t", `${IMAGE}:latest`, "."],
    env: [],
    dir: "apps/build-server",
  },
  push: {
    name: DOCKER,
    id: "push",
    args: ["push", "--all-tags", IMAGE],
    env: [],
  },
  "read-live": {
    name: GCLOUD,
    id: "read-live",
    entrypoint: "bash",
    args: ["apps/build-server/deploy/read-live.sh"],
    env: ["SERVICE=${_SERVICE}", "REGION=${_REGION}", "OUT_DIR=/workspace"],
  },
  verify: {
    name: NODE,
    id: "verify",
    entrypoint: "node",
    args: [
      SCRIPT,
      "verify",
      "/workspace/service.json",
      "/workspace/firewall-rules.json",
    ],
    env: INPUT_ENV,
  },
};
const STEP_ORDER = [
  "preflight",
  "build",
  "push",
  "deploy",
  "read-live",
  "verify",
];

/** The deploy step's flags, after rendering with SUBS. Nothing else is allowed. */
const DEPLOY_FLAGS = {
  "--image": INPUTS.image,
  "--region": SUBS._REGION,
  "--platform": "managed",
  "--cpu": DECLARED.cpu,
  "--memory": DECLARED.memory,
  "--timeout": String(DECLARED.timeoutSeconds),
  "--concurrency": String(DECLARED.concurrency),
  "--min-instances": SUBS._MIN_INSTANCES,
  "--min": "default",
  "--max-instances": String(DECLARED.maxInstances),
  "--cpu-boost": true,
  "--cpu-throttling": true,
  "--service-account": INPUTS.serviceAccount,
  "--network": DECLARED.network,
  "--subnet": DECLARED.subnet,
  "--network-tags": DECLARED.networkTag,
  "--vpc-egress": DECLARED.vpcEgress,
  "--no-invoker-iam-check": true,
  "--set-env-vars": Object.entries(INPUTS.env)
    .map(([key, value]) => `${key}=${value}`)
    .join(","),
  "--set-secrets": `ACADEMY_API_KEY=${DECLARED.secret}:${DECLARED.secretVersion}`,
};

const SUBSTITUTION_DEFAULTS = {
  _REGION: "southamerica-east1",
  _REPO: "academy-images",
  _SERVICE: "academy-build-server",
  _TAG: "latest",
  _ALLOWED_ORIGIN: "https://www.st.academy",
  _MIN_INSTANCES: "0",
  _MIN_INSTANCES_SIGNOFF: "",
};

const TOP_LEVEL = ["steps", "substitutions", "options", "timeout"];
const OPTIONS = { logging: "CLOUD_LOGGING_ONLY" };
const TIMEOUT = "1800s";

const same = (a, b) => {
  try {
    assert.deepEqual(a, b);
    return true;
  } catch {
    return false;
  }
};

/** Everything wrong with a cloudbuild.yaml, as messages. Empty when it is right. */
function problems(text) {
  let parsed;
  try {
    parsed = parseCloudbuild(text);
  } catch (error) {
    return [error.message];
  }
  const { steps, substitutions, options, timeout, top } = parsed;
  const found = [];

  // Outside the steps: these four top-level keys, these options, this timeout.
  // An option such as `env` would reach every step, the checking ones included.
  if (!same([...top].sort(), [...TOP_LEVEL].sort())) {
    found.push(`top-level keys are [${top.join(", ")}]`);
  }
  if (!same(options, OPTIONS)) {
    found.push(`options are ${JSON.stringify(options)}`);
  }
  if (timeout !== TIMEOUT) found.push(`timeout is ${timeout}`);

  // Steps: the fixed ones verbatim, plus exactly one deploy.
  const ids = steps.map((step) => step.id);
  if (!same(ids, STEP_ORDER)) {
    found.push(
      `steps are [${ids.join(", ")}], expected [${STEP_ORDER.join(", ")}]`
    );
  }
  for (const step of steps) {
    if (step.id !== "deploy" && !same(step, FIXED_STEPS[step.id])) {
      found.push(`step ${step.id} differs from the pinned step`);
    }
    // Only the deploy step may change the service, and only by `run deploy`.
    for (const words of [
      ["services", "update"],
      ["services", "replace"],
      ["services", "update-traffic"],
      ["services", "delete"],
      ["services", "set-iam-policy"],
      ["services", "add-iam-policy-binding"],
    ]) {
      if (mentions(step, ...words)) {
        found.push(`step ${step.id} runs \`${words.join(" ")}\``);
      }
    }
    if (step.id !== "deploy" && mentions(step, "run", "deploy")) {
      found.push(`step ${step.id} runs \`run deploy\``);
    }
  }

  // The deploy step: gcloud's own entrypoint, `run deploy SERVICE`, and the
  // exact flag set.
  const deploy = steps.find((step) => step.id === "deploy");
  if (!deploy) return [...found, "no deploy step"];
  if (deploy.name !== GCLOUD || deploy.entrypoint || deploy.dir) {
    found.push("the deploy step must run the gcloud builder directly");
  }
  if (deploy.env.length > 0) found.push("the deploy step takes no env");
  const { positionals, flags, repeated } = parseArgs(deploy.args);
  if (!same(positionals, ["run", "deploy", "${_SERVICE}"])) {
    found.push(`deploy positionals are [${positionals.join(" ")}]`);
  }
  for (const flag of repeated) found.push(`${flag} is passed more than once`);
  for (const [flag, value] of flags) {
    if (!(flag in DEPLOY_FLAGS)) {
      found.push(`${flag} is not a flag this deploy is expected to pass`);
    } else if (render(value) !== DEPLOY_FLAGS[flag]) {
      found.push(`${flag} is ${value}, expected ${DEPLOY_FLAGS[flag]}`);
    }
  }
  for (const flag of Object.keys(DEPLOY_FLAGS)) {
    if (!flags.has(flag)) found.push(`${flag} is missing`);
  }

  // Substitutions: these defaults, and each one used.
  if (!same(substitutions, SUBSTITUTION_DEFAULTS)) {
    found.push(
      `substitutions are ${JSON.stringify(substitutions)}, expected ${JSON.stringify(SUBSTITUTION_DEFAULTS)}`
    );
  }
  const used = new Set(
    steps
      .flatMap((step) => [...step.args, ...step.env])
      .flatMap((value) => value.match(/\$\{_[A-Z0-9_]+\}/g) ?? [])
  );
  for (const key of Object.keys(substitutions)) {
    // `gcloud builds submit` rejects a substitution that is defined but unused.
    if (!used.has(`\${${key}}`)) found.push(`${key} is defined but unused`);
  }
  for (const ref of used) {
    if (!(ref.slice(2, -1) in substitutions)) found.push(`${ref} is undefined`);
  }
  return found;
}

const text = read("cloudbuild.yaml");

test("cloudbuild.yaml is the pinned deploy", () => {
  assert.deepEqual(problems(text), []);
});

test("the pinned deploy keeps the required settings", () => {
  const { steps, substitutions } = parseCloudbuild(text);
  const { flags } = parseArgs(steps.find((s) => s.id === "deploy").args);
  // Scales to zero by default, capped at 2, CPU only during requests.
  assert.equal(flags.get("--min-instances"), "${_MIN_INSTANCES}");
  assert.equal(substitutions._MIN_INSTANCES, "0");
  assert.equal(flags.get("--max-instances"), "2");
  assert.equal(flags.get("--cpu-throttling"), true);
  assert.equal(flags.get("--cpu-boost"), true);
  // Identity, secret, egress: literals, not substitutions.
  assert.equal(
    flags.get("--service-account"),
    "academy-build-sa@${PROJECT_ID}.iam.gserviceaccount.com"
  );
  assert.equal(
    flags.get("--set-secrets"),
    "ACADEMY_API_KEY=academy-build-api-key:latest"
  );
  assert.equal(flags.get("--network"), "build-server-vpc");
  assert.equal(flags.get("--subnet"), "build-server-subnet");
  assert.equal(flags.get("--network-tags"), "build-server-no-egress");
  assert.equal(flags.get("--vpc-egress"), "all-traffic");
  // The build timeout ends before the web route's 295 s abort.
  assert.match(flags.get("--set-env-vars"), /(^|,)BUILD_TIMEOUT_SECS=240(,|$)/);
  assert.equal(flags.get("--timeout"), "300");
  assert.doesNotMatch(flags.get("--set-env-vars"), /ACADEMY_API_KEY/);
  assert.doesNotMatch(text, /_ACADEMY_API_KEY|_VPC_/);
});

// ── Mutations: each must be reported ─────────────────────────────────────────

const LAST_DEPLOY_ARG =
  "      - 'ACADEMY_API_KEY=academy-build-api-key:latest'\n";
const appendToDeploy = (...lines) =>
  text.replace(
    LAST_DEPLOY_ARG,
    LAST_DEPLOY_ARG + lines.map((line) => `      - '${line}'\n`).join("")
  );
const replace = (from, to) => {
  const found = from instanceof RegExp ? from.test(text) : text.includes(from);
  assert.ok(found, `text to mutate not found: ${from}`);
  return text.replace(from, to);
};
const OPTIONS_BLOCK = "options:\n  logging: CLOUD_LOGGING_ONLY\n";
const addStep = (yaml) =>
  replace("\nsubstitutions:\n", `${yaml}\nsubstitutions:\n`);

const mutations = [
  // The four lines that were appended after --set-secrets.
  [
    "--flag=value overriding egress",
    appendToDeploy("--vpc-egress=private-ranges-only"),
    /--vpc-egress is passed more than once/,
  ],
  [
    "--flag=value overriding the request timeout",
    appendToDeploy("--timeout=3600"),
    /--timeout is passed more than once/,
  ],
  [
    "--flag=value overriding the env vars",
    appendToDeploy("--set-env-vars=BUILD_TIMEOUT_SECS=3000"),
    /--set-env-vars is passed more than once/,
  ],
  [
    "--flag=value overriding max instances",
    appendToDeploy("--max-instances=50"),
    /--max-instances is passed more than once/,
  ],
  [
    "all four at once",
    appendToDeploy(
      "--vpc-egress=private-ranges-only",
      "--timeout=3600",
      "--set-env-vars=BUILD_TIMEOUT_SECS=3000",
      "--max-instances=50"
    ),
    /--vpc-egress is passed more than once[^]*--max-instances is passed more than once/,
  ],
  // Repeated and split differently.
  [
    "a flag repeated in two-argument form",
    appendToDeploy("--max-instances", "50"),
    /--max-instances is passed more than once/,
  ],
  [
    "a value changed in --flag=value form",
    replace(
      "      - '--timeout'\n      - '300'\n",
      "      - '--timeout=3600'\n"
    ),
    /--timeout is 3600, expected 300/,
  ],
  [
    "a stray positional",
    appendToDeploy("another-service"),
    /deploy positionals are \[run deploy \$\{_SERVICE\} another-service\]/,
  ],
  // Flags outside the allowlist.
  [
    "--no-cpu-throttling added",
    appendToDeploy("--no-cpu-throttling"),
    /--no-cpu-throttling is not a flag this deploy is expected to pass/,
  ],
  [
    "--cpu-throttling negated",
    replace("'--cpu-throttling'", "'--no-cpu-throttling'"),
    /--no-cpu-throttling is not a flag[^]*--cpu-throttling is missing/,
  ],
  [
    "--clear-network added",
    appendToDeploy("--clear-network"),
    /--clear-network is not a flag/,
  ],
  [
    "--update-env-vars instead of --set-env-vars",
    replace("'--set-env-vars'", "'--update-env-vars'"),
    /--update-env-vars is not a flag[^]*--set-env-vars is missing/,
  ],
  [
    "--allow-unauthenticated added",
    appendToDeploy("--allow-unauthenticated"),
    /--allow-unauthenticated is not a flag/,
  ],
  // Settings dropped or changed.
  [
    "min instances as a literal",
    replace(
      "      - '${_MIN_INSTANCES}'\n      - '--min'",
      "      - '1'\n      - '--min'"
    ),
    /--min-instances is 1, expected 3/,
  ],
  [
    "min instances default raised",
    replace("_MIN_INSTANCES: '0'", "_MIN_INSTANCES: '1'"),
    /substitutions are/,
  ],
  [
    "service account dropped",
    replace(
      "      - '--service-account'\n      - 'academy-build-sa@${PROJECT_ID}.iam.gserviceaccount.com'\n",
      ""
    ),
    /--service-account is missing/,
  ],
  [
    "secret dropped",
    replace(
      "      - '--set-secrets'\n      - 'ACADEMY_API_KEY=academy-build-api-key:latest'\n",
      ""
    ),
    /--set-secrets is missing/,
  ],
  [
    "API key as a literal env var",
    replace(
      "'ALLOWED_ORIGIN=${_ALLOWED_ORIGIN},",
      "'ACADEMY_API_KEY=abc,ALLOWED_ORIGIN=${_ALLOWED_ORIGIN},"
    ),
    /--set-env-vars is /,
  ],
  [
    "build timeout raised",
    replace("BUILD_TIMEOUT_SECS=240", "BUILD_TIMEOUT_SECS=300"),
    /--set-env-vars is /,
  ],
  [
    "network back to a substitution",
    replace("      - 'build-server-vpc'\n", "      - '${_VPC_NETWORK}'\n"),
    /--network is \$\{_VPC_NETWORK\}, expected build-server-vpc/,
  ],
  [
    "network tag dropped",
    replace("      - '--network-tags'\n      - 'build-server-no-egress'\n", ""),
    /--network-tags is missing/,
  ],
  [
    "egress for private ranges only",
    replace("      - 'all-traffic'\n", "      - 'private-ranges-only'\n"),
    /--vpc-egress is private-ranges-only/,
  ],
  [
    "origin default changed",
    replace(
      "_ALLOWED_ORIGIN: 'https://www.st.academy'",
      "_ALLOWED_ORIGIN: 'https://example.com'"
    ),
    /substitutions are/,
  ],
  [
    "origin as a literal in the deploy",
    replace(
      "'ALLOWED_ORIGIN=${_ALLOWED_ORIGIN},",
      "'ALLOWED_ORIGIN=https://www.st.academy,"
    ),
    /--set-env-vars is /,
  ],
  [
    "an unused substitution",
    replace("  _TAG: 'latest'\n", "  _TAG: 'latest'\n  _EXTRA: 'x'\n"),
    /_EXTRA is defined but unused/,
  ],
  // Other steps changing the service.
  [
    "`services` / `update` as separate args in a new step",
    addStep(
      "  - name: 'gcr.io/cloud-builders/gcloud'\n    id: 'tune'\n    args:\n      - 'run'\n      - 'services'\n      - 'update'\n      - '${_SERVICE}'\n      - '--no-cpu-throttling'\n"
    ),
    /step tune runs `services update`/,
  ],
  [
    "`services update` inside a bash -c string",
    addStep(
      "  - name: 'gcr.io/cloud-builders/gcloud'\n    id: 'tune'\n    entrypoint: 'bash'\n    args:\n      - '-c'\n      - 'gcloud run services update \"${_SERVICE}\" --clear-network'\n"
    ),
    /step tune runs `services update`/,
  ],
  [
    "update-traffic in a new step",
    addStep(
      "  - name: 'gcr.io/cloud-builders/gcloud'\n    id: 'traffic'\n    args:\n      - 'run'\n      - 'services'\n      - 'update-traffic'\n      - '${_SERVICE}'\n      - '--to-latest'\n"
    ),
    /step traffic runs `services update-traffic`/,
  ],
  [
    "a second deploy",
    addStep(
      "  - name: 'gcr.io/cloud-builders/gcloud'\n    id: 'again'\n    args:\n      - 'run'\n      - 'deploy'\n      - '${_SERVICE}'\n      - '--image'\n      - 'example/other:1'\n"
    ),
    /step again runs `run deploy`/,
  ],
  [
    "an unrelated extra step",
    addStep("  - name: 'ubuntu'\n    id: 'extra'\n    args:\n      - 'true'\n"),
    /steps are \[.*extra\]/,
  ],
  [
    "a substitution interpolated into a script",
    replace(
      "      - 'apps/build-server/deploy/read-live.sh'\n",
      "      - '-c'\n      - 'gcloud run services describe \"${_SERVICE}\" > /workspace/service.json'\n"
    ),
    /step read-live differs from the pinned step/,
  ],
  [
    "the verify step dropped",
    replace(/ {2}- name: 'node:22-slim'\n {4}id: 'verify'[^]*?\n\n/, "\n"),
    /steps are \[preflight, build, push, deploy, read-live\]/,
  ],
  [
    "the preflight step dropped",
    replace(/ {2}- name: 'node:22-slim'\n {4}id: 'preflight'[^]*?\n\n/, "\n"),
    /steps are \[build, push, deploy, read-live, verify\]/,
  ],
  [
    "an input missing from the verify step",
    text.replace(/(id: 'verify'[^]*?) {6}- 'TAG=\$\{_TAG\}'\n/, "$1"),
    /step verify differs from the pinned step/,
  ],
  [
    "double-quoted scalars",
    replace("'--cpu-boost'", '"--cpu-boost"'),
    /unexpected line/,
  ],
  // Outside the steps. NODE_OPTIONS set for every step would make the two
  // checking steps exit 0 without running.
  [
    "an env list under options",
    replace(
      OPTIONS_BLOCK,
      `${OPTIONS_BLOCK}  env:\n    - 'NODE_OPTIONS=--import=data:text/javascript,process.exit(0)'\n`
    ),
    /unexpected line: {3}env:/,
  ],
  [
    "an env list under options, on one line",
    replace(
      OPTIONS_BLOCK,
      `${OPTIONS_BLOCK}  env: ['NODE_OPTIONS=--import=data:text/javascript,process.exit(0)']\n`
    ),
    /options are \{"logging":"CLOUD_LOGGING_ONLY","env":/,
  ],
  [
    "options in flow style",
    replace(
      OPTIONS_BLOCK,
      "options: {logging: CLOUD_LOGGING_ONLY, env: ['NODE_OPTIONS=x']}\n"
    ),
    /unexpected top-level line: options: \{/,
  ],
  [
    "another option",
    replace(
      OPTIONS_BLOCK,
      `${OPTIONS_BLOCK}  substitutionOption: ALLOW_LOOSE\n`
    ),
    /options are /,
  ],
  [
    "options given twice",
    text + "\noptions:\n  env: ['NODE_OPTIONS=x']\n",
    /unexpected line: options:/,
  ],
  [
    "a top-level serviceAccount",
    text +
      "\nserviceAccount: 'projects/example-project/serviceAccounts/other@example-project.iam.gserviceaccount.com'\n",
    /unexpected top-level line: serviceAccount:/,
  ],
  [
    "top-level secrets",
    text +
      "\navailableSecrets:\n  secretManager:\n    - versionName: 'projects/x/secrets/y/versions/1'\n      env: 'X'\n",
    /unexpected top-level line: availableSecrets:/,
  ],
  ["options removed", replace(OPTIONS_BLOCK, ""), /top-level keys are/],
  [
    "the build timeout changed",
    replace("timeout: '1800s'", "timeout: '86400s'"),
    /timeout is 86400s/,
  ],
  // Per-step keys and env entries outside the expected set.
  [
    "NODE_OPTIONS on the verify step",
    text.replace(
      /(id: 'verify'[^]*?) {6}- 'PROJECT_ID=\$\{PROJECT_ID\}'\n/,
      "$1      - 'NODE_OPTIONS=--import=data:text/javascript,process.exit(0)'\n      - 'PROJECT_ID=${PROJECT_ID}'\n"
    ),
    /step verify differs from the pinned step/,
  ],
  [
    "NODE_OPTIONS on the preflight step",
    replace(
      "      - 'preflight'\n    env:\n",
      "      - 'preflight'\n    env:\n      - 'NODE_OPTIONS=--import=data:text/javascript,process.exit(0)'\n"
    ),
    /step preflight differs from the pinned step/,
  ],
  [
    "an env entry on the deploy step",
    replace(
      "    id: 'deploy'\n",
      "    id: 'deploy'\n    env:\n      - 'CLOUDSDK_RUN_REGION=elsewhere1'\n"
    ),
    /the deploy step takes no env/,
  ],
  [
    "an entrypoint on the deploy step",
    replace("    id: 'deploy'\n", "    id: 'deploy'\n    entrypoint: 'bash'\n"),
    /the deploy step must run the gcloud builder directly/,
  ],
  [
    "another builder image for the verify step",
    replace(
      "  - name: 'node:22-slim'\n    id: 'verify'",
      "  - name: 'example/node:22'\n    id: 'verify'"
    ),
    /step verify differs from the pinned step/,
  ],
  [
    "a step key outside the expected set",
    replace("    id: 'verify'\n", "    id: 'verify'\n    allowFailure: true\n"),
    /unexpected line: {5}allowFailure: true/,
  ],
  [
    "secretEnv on a step",
    replace(
      "    id: 'deploy'\n",
      "    id: 'deploy'\n    secretEnv:\n      - 'X'\n"
    ),
    /unexpected line: {5}secretEnv:/,
  ],
  [
    "args given twice on the deploy step",
    appendToDeploy("x").replace(
      "      - 'x'\n",
      "    args:\n      - 'run'\n      - 'deploy'\n      - 'other'\n"
    ),
    /unexpected line: {5}args:/,
  ],
  [
    "a substitution given twice",
    replace("  _TAG: 'latest'\n", "  _TAG: 'latest'\n  _TAG: 'other'\n"),
    /unexpected line: {3}_TAG: 'other'/,
  ],
  // A YAML loader ends a line at a lone carriage return; split("\n") does not,
  // so the rest of the line would ride along inside what looks like a comment.
  [
    "a carriage return hiding an option inside a comment",
    replace(
      OPTIONS_BLOCK,
      `${OPTIONS_BLOCK}  # note\r  env:\r    - 'NODE_OPTIONS=--import=data:text/javascript,process.exit(0)'\n`
    ),
    /character outside printable ASCII/,
  ],
  [
    "a carriage return hiding a deploy flag inside a comment",
    replace(
      LAST_DEPLOY_ARG,
      `${LAST_DEPLOY_ARG}      # note\r      - '--vpc-egress=private-ranges-only'\n`
    ),
    /character outside printable ASCII/,
  ],
  [
    "a no-break space before a comment marker",
    replace(OPTIONS_BLOCK, `${OPTIONS_BLOCK}\u00a0\u00a0#env: x\n`),
    /character outside printable ASCII/,
  ],
  [
    "a tab",
    replace(OPTIONS_BLOCK, `${OPTIONS_BLOCK}\t# note\n`),
    /character outside printable ASCII/,
  ],
];

for (const [name, mutated, message] of mutations) {
  test(`reports: ${name}`, () => {
    assert.notEqual(mutated, text, "the mutation changed nothing");
    assert.match(problems(mutated).join("\n"), message);
  });
}

// ── Scripts the steps run ────────────────────────────────────────────────────

const uncommented = (name) =>
  read(name)
    .split("\n")
    .filter((line) => !/^\s*#/.test(line))
    .join("\n");

test("read-live.sh only reads", () => {
  const calls = uncommented("read-live.sh").match(/gcloud[^\n|>]*/g) ?? [];
  assert.equal(calls.length, 2, calls.join("\n"));
  assert.match(calls[0], /^gcloud run services describe "\$\{SERVICE\}" /);
  assert.match(calls[1], /^gcloud compute firewall-rules list /);
});

test("deploy.sh only submits cloudbuild.yaml", () => {
  const script = uncommented("deploy.sh");
  assert.match(script, /gcloud builds submit/);
  assert.match(script, /apps\/build-server\/deploy\/cloudbuild\.yaml/);
  assert.doesNotMatch(script, /gcloud run|docker |ACADEMY_API_KEY/);
  // The tag, and the region when one is given. Everything else, the origin
  // included, keeps its default in cloudbuild.yaml.
  const passed = script.match(/(?<=[",])_[A-Z][A-Z0-9_]*(?==)/g);
  assert.deepEqual(passed, ["_TAG", "_REGION"]);
});
