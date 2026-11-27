#!/usr/bin/env node
// Last step of cloudbuild.yaml: checks the deployed Cloud Run service against
// what the deploy step declares.
//
//   gcloud run services describe SERVICE --region REGION --format=json \
//     | node check-service.mjs
//   node check-service.mjs service.json
//
// Expected values come from the EXPECT_* environment variables (see
// expectedFromEnv). Prints every mismatch and exits 1 if there is one.

import { readFileSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

const MIN_SCALE = "autoscaling.knative.dev/minScale";
const SERVICE_MIN_SCALE = "run.googleapis.com/minScale";
const CPU_THROTTLING = "run.googleapis.com/cpu-throttling";
const VPC_EGRESS = "run.googleapis.com/vpc-access-egress";
const NETWORK_INTERFACES = "run.googleapis.com/network-interfaces";
const API_KEY_VAR = "ACADEMY_API_KEY";

const REQUIRED = [
  "serviceAccount",
  "secret",
  "minInstances",
  "network",
  "subnet",
  "networkTag",
];

export function expectedFromEnv(env) {
  return {
    serviceAccount: env.EXPECT_SERVICE_ACCOUNT,
    secret: env.EXPECT_SECRET,
    minInstances: env.EXPECT_MIN_INSTANCES,
    minInstancesSignoff: env.MIN_INSTANCES_SIGNOFF,
    network: env.EXPECT_NETWORK,
    subnet: env.EXPECT_SUBNET,
    networkTag: env.EXPECT_NETWORK_TAG,
  };
}

/** An instance-count annotation as a number. Absent means 0. */
function instanceCount(value) {
  if (value === undefined || value === null || value === "") return 0;
  return /^\d+$/.test(String(value)) ? Number(value) : NaN;
}

/** gcloud accepts a bare name or a full resource path for networks. */
function baseName(ref) {
  return String(ref ?? "")
    .split("/")
    .pop();
}

/**
 * @param {object} service  parsed `gcloud run services describe --format=json`
 * @param {object} expected see expectedFromEnv
 * @returns {string[]} one message per mismatch; empty when the service matches
 */
export function checkService(service, expected) {
  const failures = [];

  for (const key of REQUIRED) {
    if (!String(expected?.[key] ?? "").trim()) {
      failures.push(`no expected value given for ${key}`);
    }
  }
  const template = service?.spec?.template;
  if (!template?.spec) {
    failures.push("input is not a Cloud Run service description");
  }
  if (failures.length > 0) return failures;

  const serviceAnnotations = service.metadata?.annotations ?? {};
  const annotations = template.metadata?.annotations ?? {};

  // Min instances: 0 unless a non-zero value was signed off.
  const wantMin = instanceCount(expected.minInstances);
  const gotMin = instanceCount(annotations[MIN_SCALE]);
  if (Number.isNaN(wantMin)) {
    failures.push(
      `expected min instances is not a number: ${expected.minInstances}`
    );
  } else {
    if (wantMin !== 0 && !String(expected.minInstancesSignoff ?? "").trim()) {
      failures.push(`min instances ${wantMin} has no sign-off`);
    }
    if (gotMin !== wantMin) {
      failures.push(
        `min instances is ${annotations[MIN_SCALE]}, expected ${wantMin}`
      );
    }
  }
  if (instanceCount(serviceAnnotations[SERVICE_MIN_SCALE]) !== 0) {
    failures.push(
      `service-level min instances is ${serviceAnnotations[SERVICE_MIN_SCALE]}, expected none`
    );
  }

  // CPU is allocated only while a request is served. Absent is the default.
  const throttling = annotations[CPU_THROTTLING];
  if (throttling !== undefined && throttling !== "true") {
    failures.push(`${CPU_THROTTLING} is ${throttling}, expected true`);
  }

  if (template.spec.serviceAccountName !== expected.serviceAccount) {
    failures.push(
      `service account is ${template.spec.serviceAccountName}, expected ${expected.serviceAccount}`
    );
  }

  // All egress through the VPC, on the tag the deny rule targets.
  if (annotations[VPC_EGRESS] !== "all-traffic") {
    failures.push(
      `${VPC_EGRESS} is ${annotations[VPC_EGRESS]}, expected all-traffic`
    );
  }
  let interfaces = [];
  try {
    interfaces = JSON.parse(annotations[NETWORK_INTERFACES] ?? "[]");
  } catch {
    failures.push(`${NETWORK_INTERFACES} is not valid JSON`);
  }
  if (!Array.isArray(interfaces) || interfaces.length === 0) {
    failures.push("no Direct VPC egress network interface");
  } else {
    for (const nic of interfaces) {
      if (baseName(nic?.network) !== expected.network) {
        failures.push(
          `network is ${nic?.network}, expected ${expected.network}`
        );
      }
      if (baseName(nic?.subnetwork) !== expected.subnet) {
        failures.push(
          `subnet is ${nic?.subnetwork}, expected ${expected.subnet}`
        );
      }
      const tags = Array.isArray(nic?.tags) ? nic.tags : [];
      if (!tags.includes(expected.networkTag)) {
        failures.push(
          `network tags are [${tags.join(", ")}], expected ${expected.networkTag}`
        );
      }
    }
  }

  // The API key is a Secret Manager reference, never a literal value.
  const keyVars = (template.spec.containers ?? [])
    .flatMap((container) => container.env ?? [])
    .filter((entry) => entry.name === API_KEY_VAR);
  if (keyVars.length !== 1) {
    failures.push(
      `${API_KEY_VAR} is set ${keyVars.length} times, expected once`
    );
  }
  for (const entry of keyVars) {
    const ref = entry.valueFrom?.secretKeyRef;
    if (entry.value !== undefined) {
      failures.push(`${API_KEY_VAR} is a literal value, expected a secret`);
    } else if (ref?.name !== expected.secret || !ref?.key) {
      failures.push(
        `${API_KEY_VAR} refers to secret ${ref?.name}, expected ${expected.secret}`
      );
    }
  }

  // The template checked above is only what serves if the latest revision is
  // ready and takes all traffic.
  const status = service.status ?? {};
  const latest = status.latestCreatedRevisionName;
  if (!latest || status.latestReadyRevisionName !== latest) {
    failures.push(`latest revision ${latest} is not ready`);
  }
  const serving = (status.traffic ?? []).filter(
    (target) => (target.percent ?? 0) > 0
  );
  if (
    serving.length === 0 ||
    serving.some((target) => target.revisionName !== latest)
  ) {
    failures.push(
      `traffic is not all on the latest revision ${latest}: ${JSON.stringify(serving)}`
    );
  }

  return failures;
}

function main() {
  const file = process.argv[2];
  let service;
  try {
    service = JSON.parse(readFileSync(file && file !== "-" ? file : 0, "utf8"));
  } catch (error) {
    console.error(`check-service: cannot read the service JSON: ${error}`);
    process.exitCode = 1;
    return;
  }
  const failures = checkService(service, expectedFromEnv(process.env));
  if (failures.length > 0) {
    console.error(
      "check-service: the service does not match the deploy config"
    );
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exitCode = 1;
    return;
  }
  console.log("check-service: the service matches the deploy config");
}

if (
  process.argv[1] &&
  realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main();
}
