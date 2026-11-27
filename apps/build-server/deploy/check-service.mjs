#!/usr/bin/env node
// What cloudbuild.yaml declares for the build server, and the checks that hold
// a deploy to it. One file, so the first build step, the last one and
// setup-gcp.sh all apply the same rules.
//
//   node check-service.mjs preflight
//     Validates the substitutions (read from the environment) before the build.
//
//   node check-service.mjs verify <service.json|-> <firewall-rules.json|->
//     After the deploy: checks the output of
//       gcloud run services describe SERVICE --region REGION --format=json
//       gcloud compute firewall-rules list --format=json
//     against DECLARED and the same substitutions.
//
//   node check-service.mjs firewall [firewall-rules.json|-]
//     The firewall half only, and the rule must exist under its own name.
//
// Each command prints every mismatch and exits 1 if there is one.

import { readFileSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * The fixed part of the deploy. cloudbuild.yaml passes these as literals, and
 * __tests__/cloudbuild.test.mjs fails when the two disagree.
 */
export const DECLARED = Object.freeze({
  serviceAccount: "academy-build-sa",
  secret: "academy-build-api-key",
  secretVersion: "latest",
  network: "build-server-vpc",
  subnet: "build-server-subnet",
  networkTag: "build-server-no-egress",
  firewallRule: "build-server-deny-egress",
  vpcEgress: "all-traffic",
  cpu: "4",
  memory: "8Gi",
  timeoutSeconds: 300,
  concurrency: 2,
  maxInstances: 2,
  // Literal environment, after ALLOWED_ORIGIN. BUILD_TIMEOUT_SECS stays under
  // the web route's 295 s abort and the 300 s request timeout.
  env: Object.freeze({
    MAX_CONCURRENT_BUILDS: "2",
    BUILD_TIMEOUT_SECS: "240",
    CACHE_TTL_SECS: "1800",
    LOG_FORMAT: "json",
    RUST_LOG: "info",
  }),
});

const API_KEY_VAR = "ACADEMY_API_KEY";

const MIN_SCALE = "autoscaling.knative.dev/minScale";
const MAX_SCALE = "autoscaling.knative.dev/maxScale";
const SERVICE_MIN_SCALE = "run.googleapis.com/minScale";
const SCALING_MODE = "run.googleapis.com/scalingMode";
const CPU_THROTTLING = "run.googleapis.com/cpu-throttling";
const VPC_EGRESS = "run.googleapis.com/vpc-access-egress";
const NETWORK_INTERFACES = "run.googleapis.com/network-interfaces";

// ── Inputs ───────────────────────────────────────────────────────────────────

// [environment variable, name shown in messages, shape, hint]
const INPUT_SHAPES = [
  [
    "PROJECT_ID",
    "PROJECT_ID",
    /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/,
    "a project id",
  ],
  ["REGION", "_REGION", /^[a-z]+-[a-z]+[0-9]+$/, "a region, like us-central1"],
  ["REPO", "_REPO", /^[a-z]([a-z0-9-]{0,61}[a-z0-9])?$/, "a repository name"],
  [
    "SERVICE",
    "_SERVICE",
    /^[a-z]([a-z0-9-]{0,47}[a-z0-9])?$/,
    "a service name",
  ],
  ["TAG", "_TAG", /^[A-Za-z0-9_][A-Za-z0-9_.-]{0,127}$/, "an image tag"],
  [
    "ALLOWED_ORIGIN",
    "_ALLOWED_ORIGIN",
    // The server matches the Origin header exactly: scheme and host only.
    /^https:\/\/[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?(:[0-9]+)?$/,
    "an https origin with no path, like https://academy.example.com",
  ],
  ["MIN_INSTANCES", "_MIN_INSTANCES", /^(0|[1-9][0-9]*)$/, "a whole number"],
];

/**
 * Validates the per-deploy values and derives what the deploy should produce
 * from them. Both `preflight` and `verify` call this, so they cannot disagree.
 *
 * @param {Record<string, string | undefined>} env
 * @returns {{ inputs: object, failures: string[] }}
 */
export function validateInputs(env) {
  const failures = [];
  const value = {};
  for (const [key, label, shape, hint] of INPUT_SHAPES) {
    value[key] = env[key] ?? "";
    if (!shape.test(value[key])) {
      failures.push(`${label} must be ${hint} (got '${value[key]}')`);
    }
  }

  // A sign-off names who approved it and when: at least one letter or digit,
  // and nothing that could break a log line.
  const signoff = env.MIN_INSTANCES_SIGNOFF ?? "";
  if (/[\u0000-\u001f\u007f]/.test(signoff)) {
    failures.push("_MIN_INSTANCES_SIGNOFF must not contain control characters");
  } else if (value.MIN_INSTANCES !== "0" && !/[A-Za-z0-9]/.test(signoff)) {
    failures.push(
      `_MIN_INSTANCES=${value.MIN_INSTANCES} keeps instances running between builds: ` +
        "set _MIN_INSTANCES_SIGNOFF to who approved it and when"
    );
  }

  const inputs = {
    service: value.SERVICE,
    region: value.REGION,
    image: `${value.REGION}-docker.pkg.dev/${value.PROJECT_ID}/${value.REPO}/${value.SERVICE}:${value.TAG}`,
    serviceAccount: `${DECLARED.serviceAccount}@${value.PROJECT_ID}.iam.gserviceaccount.com`,
    env: { ALLOWED_ORIGIN: value.ALLOWED_ORIGIN, ...DECLARED.env },
    minInstances: Number(value.MIN_INSTANCES),
    minInstancesSignoff: signoff,
  };
  return { inputs, failures };
}

// ── Service ──────────────────────────────────────────────────────────────────

/** An instance-count annotation as a number. Absent means 0. */
function instanceCount(value) {
  if (value === undefined || value === null || value === "") return 0;
  return /^\d+$/.test(String(value)) ? Number(value) : NaN;
}

/** gcloud accepts a bare name or a full resource path or URL. */
function baseName(ref) {
  return String(ref ?? "")
    .split("/")
    .pop();
}

/** "4" and "4000m" are the same CPU limit. */
function milliCpu(value) {
  const m = String(value ?? "").match(/^(\d+)(m?)$/);
  return m ? Number(m[1]) * (m[2] ? 1 : 1000) : NaN;
}

/** "8Gi" and "8192Mi" are the same memory limit. */
function bytes(value) {
  const units = {
    "": 1,
    Ki: 2 ** 10,
    Mi: 2 ** 20,
    Gi: 2 ** 30,
    K: 1e3,
    M: 1e6,
    G: 1e9,
  };
  const m = String(value ?? "").match(/^(\d+)(Ki|Mi|Gi|K|M|G)?$/);
  return m ? Number(m[1]) * units[m[2] ?? ""] : NaN;
}

/**
 * @param {object} service parsed `gcloud run services describe --format=json`
 * @param {object} inputs  from validateInputs
 * @returns {string[]} one message per mismatch; empty when the service matches
 */
export function checkService(service, inputs) {
  const template = service?.spec?.template;
  if (!template?.spec || !Array.isArray(template.spec.containers)) {
    return ["input is not a Cloud Run service description"];
  }
  const failures = [];
  const expect = (what, got, want) => {
    if (got !== want) failures.push(`${what} is ${got}, expected ${want}`);
  };
  const serviceAnnotations = service.metadata?.annotations ?? {};
  const annotations = template.metadata?.annotations ?? {};
  const spec = template.spec;

  // Container: the image this build pushed, and the declared limits.
  if (spec.containers.length !== 1) {
    failures.push(`${spec.containers.length} containers, expected 1`);
  }
  const container = spec.containers[0] ?? {};
  expect("image", container.image, inputs.image);
  const limits = container.resources?.limits ?? {};
  if (milliCpu(limits.cpu) !== milliCpu(DECLARED.cpu)) {
    failures.push(`cpu limit is ${limits.cpu}, expected ${DECLARED.cpu}`);
  }
  if (bytes(limits.memory) !== bytes(DECLARED.memory)) {
    failures.push(
      `memory limit is ${limits.memory}, expected ${DECLARED.memory}`
    );
  }
  expect("request timeout", spec.timeoutSeconds, DECLARED.timeoutSeconds);
  expect("concurrency", spec.containerConcurrency, DECLARED.concurrency);

  // Scaling: min 0 unless a non-zero value was signed off, max as declared.
  if (
    instanceCount(annotations[MAX_SCALE]) !== DECLARED.maxInstances ||
    !(MAX_SCALE in annotations)
  ) {
    failures.push(
      `max instances is ${annotations[MAX_SCALE]}, expected ${DECLARED.maxInstances}`
    );
  }
  if (instanceCount(annotations[MIN_SCALE]) !== inputs.minInstances) {
    failures.push(
      `min instances is ${annotations[MIN_SCALE]}, expected ${inputs.minInstances}`
    );
  }
  if (instanceCount(serviceAnnotations[SERVICE_MIN_SCALE]) !== 0) {
    failures.push(
      `service-level min instances is ${serviceAnnotations[SERVICE_MIN_SCALE]}, expected none`
    );
  }
  // Manual scaling keeps a fixed number of instances, whatever the minimum.
  const scalingMode = serviceAnnotations[SCALING_MODE];
  if (String(scalingMode ?? "").toLowerCase() === "manual") {
    failures.push(`scaling mode is ${scalingMode}, expected automatic`);
  }

  // CPU is allocated only while a request is served. Absent is the default,
  // and gcloud writes the value as "True".
  const throttling = annotations[CPU_THROTTLING];
  if (throttling !== undefined && String(throttling).toLowerCase() !== "true") {
    failures.push(`${CPU_THROTTLING} is ${throttling}, expected true`);
  }

  expect("service account", spec.serviceAccountName, inputs.serviceAccount);

  // All egress through the VPC, carrying the declared tag and no other.
  expect(VPC_EGRESS, annotations[VPC_EGRESS], DECLARED.vpcEgress);
  let interfaces = [];
  try {
    interfaces = JSON.parse(annotations[NETWORK_INTERFACES] ?? "[]");
  } catch {
    failures.push(`${NETWORK_INTERFACES} is not valid JSON`);
  }
  if (!Array.isArray(interfaces) || interfaces.length !== 1) {
    const count = Array.isArray(interfaces) ? interfaces.length : 0;
    failures.push(`${count} Direct VPC network interfaces, expected 1`);
  } else {
    const [nic] = interfaces;
    if (baseName(nic?.network) !== DECLARED.network) {
      failures.push(`network is ${nic?.network}, expected ${DECLARED.network}`);
    }
    if (baseName(nic?.subnetwork) !== DECLARED.subnet) {
      failures.push(
        `subnet is ${nic?.subnetwork}, expected ${DECLARED.subnet}`
      );
    }
    const tags = Array.isArray(nic?.tags) ? nic.tags : [];
    if (tags.length !== 1 || tags[0] !== DECLARED.networkTag) {
      failures.push(
        `network tags are [${tags.join(", ")}], expected [${DECLARED.networkTag}]`
      );
    }
  }

  // Environment: exactly the declared literals, plus the API key as a Secret
  // Manager reference. Values are never printed for the key.
  const entries = container.env ?? [];
  const named = (name) => entries.filter((entry) => entry.name === name);
  for (const [name, want] of Object.entries(inputs.env)) {
    const found = named(name);
    if (found.length === 0) {
      failures.push(`${name} is not set, expected ${want}`);
    } else if (found.length > 1) {
      failures.push(`${name} is set ${found.length} times`);
    } else if (found[0].value !== want) {
      failures.push(`${name} is ${found[0].value}, expected ${want}`);
    }
  }
  const wantRef = `${DECLARED.secret}:${DECLARED.secretVersion}`;
  const keyVars = named(API_KEY_VAR);
  if (keyVars.length === 0) {
    failures.push(`${API_KEY_VAR} is not set, expected secret ${wantRef}`);
  } else if (keyVars.length > 1) {
    failures.push(`${API_KEY_VAR} is set ${keyVars.length} times`);
  } else {
    const ref = keyVars[0].valueFrom?.secretKeyRef;
    if (keyVars[0].value !== undefined || !ref) {
      failures.push(
        `${API_KEY_VAR} is a literal value, expected secret ${wantRef}`
      );
    } else if (`${ref.name}:${ref.key}` !== wantRef) {
      failures.push(
        `${API_KEY_VAR} refers to ${ref.name}:${ref.key}, expected ${wantRef}`
      );
    }
  }
  const declaredNames = new Set([...Object.keys(inputs.env), API_KEY_VAR]);
  for (const name of new Set(entries.map((entry) => entry.name))) {
    if (!declaredNames.has(name)) {
      failures.push(`${name} is set but not declared`);
    }
  }

  // Traffic: the template checked above is what serves only if the latest
  // revision is ready and no entry, tagged or not, names another revision.
  const status = service.status ?? {};
  const latest = status.latestCreatedRevisionName;
  if (!latest || status.latestReadyRevisionName !== latest) {
    failures.push(`latest revision ${latest} is not ready`);
  }
  const tagOf = (target) => (target.tag ? ` (tag ${target.tag})` : "");
  let percent = 0;
  for (const target of status.traffic ?? []) {
    if (target.revisionName !== latest) {
      failures.push(
        `traffic entry names ${target.revisionName}${tagOf(target)}, expected only ${latest}`
      );
    } else {
      percent += target.percent ?? 0;
    }
  }
  for (const target of service.spec.traffic ?? []) {
    if (!target.latestRevision && target.revisionName !== latest) {
      failures.push(
        `spec traffic entry names ${target.revisionName}${tagOf(target)}, expected only ${latest}`
      );
    }
  }
  if (percent !== 100) {
    failures.push(`latest revision gets ${percent}% of traffic, expected 100%`);
  }

  return failures;
}

// ── Firewall ─────────────────────────────────────────────────────────────────

const DEFAULT_PRIORITY = 1000;
const priorityOf = (rule) => rule.priority ?? DEFAULT_PRIORITY;
const listOf = (value) => (Array.isArray(value) ? value : []);

/** An enabled EGRESS DENY of every protocol to every address, for the tag. */
function deniesAllEgress(rule) {
  const destinations = listOf(rule.destinationRanges);
  return (
    rule.direction === "EGRESS" &&
    rule.disabled !== true &&
    listOf(rule.allowed).length === 0 &&
    listOf(rule.denied).some(
      (entry) =>
        String(entry?.IPProtocol).toLowerCase() === "all" &&
        listOf(entry?.ports).length === 0
    ) &&
    (destinations.length === 0 || destinations.includes("0.0.0.0/0")) &&
    listOf(rule.sourceRanges).length === 0 &&
    listOf(rule.targetTags).includes(DECLARED.networkTag)
  );
}

/**
 * An enabled EGRESS ALLOW that the tagged service could match: it targets the
 * tag, the whole network, or a service account. How a service-account target
 * applies to this service is not established, so every such rule counts,
 * whichever account it names. Only a rule limited to other tags is left out.
 */
function couldAllowEgress(rule) {
  const tags = listOf(rule.targetTags);
  const accounts = listOf(rule.targetServiceAccounts);
  return (
    rule.direction === "EGRESS" &&
    rule.disabled !== true &&
    listOf(rule.allowed).length > 0 &&
    (tags.includes(DECLARED.networkTag) ||
      accounts.length > 0 ||
      tags.length === 0)
  );
}

/**
 * Checks the VPC firewall rules of the declared network: egress from the
 * declared tag is denied, and no allow rule sits at the same or a higher
 * priority. IPv4 only: the deny rule is matched on 0.0.0.0/0, which assumes
 * an IPv4-only subnet. Firewall policies above the VPC are not read.
 *
 * @param {object[]} rules parsed `gcloud compute firewall-rules list --format=json`
 * @param {{ requireRule?: string }} [options] also require this rule, by name,
 *   to be the deny rule
 * @returns {string[]}
 */
export function checkFirewall(rules, { requireRule } = {}) {
  if (!Array.isArray(rules)) return ["input is not a list of firewall rules"];
  const failures = [];
  const onNetwork = rules.filter(
    (rule) => baseName(rule?.network) === DECLARED.network
  );
  const shape = `enabled EGRESS DENY rule for all protocols to 0.0.0.0/0 on tag ${DECLARED.networkTag}`;

  if (requireRule) {
    const named = onNetwork.find((rule) => rule.name === requireRule);
    if (!named) {
      failures.push(
        `firewall rule ${requireRule} does not exist on network ${DECLARED.network}`
      );
    } else if (!deniesAllEgress(named)) {
      failures.push(`firewall rule ${requireRule} is not an ${shape}`);
    }
  }

  const denies = onNetwork.filter(deniesAllEgress);
  if (denies.length === 0) {
    failures.push(`no ${shape} on network ${DECLARED.network}`);
    return failures;
  }
  // A lower number wins. An allow at the same number is reported too.
  const denyPriority = Math.min(...denies.map(priorityOf));
  for (const rule of onNetwork.filter(couldAllowEgress)) {
    if (priorityOf(rule) <= denyPriority) {
      failures.push(
        `firewall rule ${rule.name} (priority ${priorityOf(rule)}) can allow egress ` +
          `ahead of the deny rule (priority ${denyPriority})`
      );
    }
  }
  return failures;
}

// ── CLI ──────────────────────────────────────────────────────────────────────

const readJson = (file) =>
  JSON.parse(readFileSync(file && file !== "-" ? file : 0, "utf8"));

function report(command, failures, ok) {
  if (failures.length > 0) {
    console.error(`check-service ${command}: failed`);
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exitCode = 1;
    return;
  }
  console.log(`check-service ${command}: ${ok}`);
}

function main([command, ...args]) {
  try {
    if (command === "preflight") {
      const { inputs, failures } = validateInputs(process.env);
      report(command, failures, "the substitutions are valid");
      if (failures.length === 0 && inputs.minInstances !== 0) {
        console.log(
          `min instances ${inputs.minInstances}, signed off: ${inputs.minInstancesSignoff}`
        );
      }
    } else if (command === "verify" && args.length === 2) {
      const { inputs, failures } = validateInputs(process.env);
      if (failures.length === 0) {
        failures.push(...checkService(readJson(args[0]), inputs));
        failures.push(...checkFirewall(readJson(args[1])));
      }
      report(command, failures, "the service matches the deploy config");
    } else if (command === "firewall" && args.length <= 1) {
      report(
        command,
        checkFirewall(readJson(args[0]), {
          requireRule: DECLARED.firewallRule,
        }),
        `${DECLARED.firewallRule} denies egress for ${DECLARED.networkTag}`
      );
    } else {
      console.error(
        "usage: check-service.mjs preflight\n" +
          "       check-service.mjs verify <service.json|-> <firewall-rules.json|->\n" +
          "       check-service.mjs firewall [firewall-rules.json|-]"
      );
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(
      `check-service ${command}: cannot read the input: ${error.message}`
    );
    process.exitCode = 1;
  }
}

if (
  process.argv[1] &&
  realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main(process.argv.slice(2));
}
