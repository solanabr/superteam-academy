import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { checkService, validateInputs } from "../check-service.mjs";

const SCRIPT = fileURLToPath(new URL("../check-service.mjs", import.meta.url));
const FIXTURE = fileURLToPath(
  new URL("./fixtures/service.json", import.meta.url)
);
const FIREWALL = fileURLToPath(
  new URL("./fixtures/firewall-rules.json", import.meta.url)
);

const MIN_SCALE = "autoscaling.knative.dev/minScale";
const MAX_SCALE = "autoscaling.knative.dev/maxScale";
const THROTTLING = "run.googleapis.com/cpu-throttling";
const NICS = "run.googleapis.com/network-interfaces";

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
const inputsFor = (env) => validateInputs(env).inputs;
const INPUTS = inputsFor(ENV);

/** The good fixture, changed by `mutate`. */
function service(mutate = () => {}) {
  const copy = JSON.parse(readFileSync(FIXTURE, "utf8"));
  mutate(copy);
  return copy;
}
const annotations = (s) => s.spec.template.metadata.annotations;
const container = (s) => s.spec.template.spec.containers[0];
const env = (s) => container(s).env;
const envVar = (s, name) => env(s).find((e) => e.name === name);
const apiKey = (s) => envVar(s, "ACADEMY_API_KEY");
const setNic = (s, nic) => {
  annotations(s)[NICS] = JSON.stringify([nic]);
};
const NIC = {
  network: "build-server-vpc",
  subnetwork: "build-server-subnet",
  tags: ["build-server-no-egress"],
};
const OLD = "academy-build-server-00003-old";
const LATEST = "academy-build-server-00007-abc";

test("the declared service passes", () => {
  assert.deepEqual(checkService(service(), INPUTS), []);
});

const rejected = [
  // API key
  [
    "API key as a literal",
    (s) => {
      delete apiKey(s).valueFrom;
      apiKey(s).value = "not-a-real-key";
    },
    /ACADEMY_API_KEY is a literal value/,
  ],
  [
    "API key as both a literal and a secret",
    (s) => env(s).push({ name: "ACADEMY_API_KEY", value: "not-a-real-key" }),
    /ACADEMY_API_KEY is set 2 times/,
  ],
  [
    "API key missing",
    (s) => env(s).splice(env(s).indexOf(apiKey(s)), 1),
    /ACADEMY_API_KEY is not set/,
  ],
  [
    "API key from another secret",
    (s) => {
      apiKey(s).valueFrom.secretKeyRef.name = "some-other-secret";
    },
    /ACADEMY_API_KEY refers to some-other-secret:latest/,
  ],
  [
    "API key pinned to another version than declared",
    (s) => {
      apiKey(s).valueFrom.secretKeyRef.key = "3";
    },
    /ACADEMY_API_KEY refers to academy-build-api-key:3/,
  ],

  // Literal environment
  [
    "build timeout changed",
    (s) => {
      envVar(s, "BUILD_TIMEOUT_SECS").value = "3000";
    },
    /BUILD_TIMEOUT_SECS is 3000, expected 240/,
  ],
  [
    "a declared variable missing",
    (s) => env(s).splice(env(s).indexOf(envVar(s, "CACHE_TTL_SECS")), 1),
    /CACHE_TTL_SECS is not set/,
  ],
  [
    "an undeclared literal variable",
    (s) => env(s).push({ name: "STALE_VAR", value: "1" }),
    /STALE_VAR is set but not declared/,
  ],
  [
    "an undeclared secret variable",
    (s) =>
      env(s).push({
        name: "OTHER_SECRET",
        valueFrom: { secretKeyRef: { name: "other", key: "latest" } },
      }),
    /OTHER_SECRET is set but not declared/,
  ],
  [
    "another origin",
    (s) => {
      envVar(s, "ALLOWED_ORIGIN").value = "https://elsewhere.example.com";
    },
    /ALLOWED_ORIGIN is https:\/\/elsewhere.example.com/,
  ],

  // Container and limits
  [
    "another image tag",
    (s) => {
      container(s).image = container(s).image.replace(":abc1234", ":latest");
    },
    /image is .*:latest, expected .*:abc1234/,
  ],
  [
    "a second container",
    (s) => s.spec.template.spec.containers.push({ image: "example/sidecar:1" }),
    /2 containers, expected 1/,
  ],
  [
    "request timeout changed",
    (s) => {
      s.spec.template.spec.timeoutSeconds = 3600;
    },
    /request timeout is 3600, expected 300/,
  ],
  [
    "concurrency changed",
    (s) => {
      s.spec.template.spec.containerConcurrency = 80;
    },
    /concurrency is 80, expected 2/,
  ],
  [
    "max instances changed",
    (s) => {
      annotations(s)[MAX_SCALE] = "50";
    },
    /max instances is 50, expected 2/,
  ],
  [
    "max instances unset",
    (s) => {
      delete annotations(s)[MAX_SCALE];
    },
    /max instances is undefined, expected 2/,
  ],
  [
    "CPU limit changed",
    (s) => {
      container(s).resources.limits.cpu = "8";
    },
    /cpu limit is 8, expected 4/,
  ],
  [
    "memory limit changed",
    (s) => {
      container(s).resources.limits.memory = "2Gi";
    },
    /memory limit is 2Gi, expected 8Gi/,
  ],

  // Scaling and CPU allocation
  [
    "min instances 1 without sign-off",
    (s) => {
      annotations(s)[MIN_SCALE] = "1";
    },
    /min instances is 1, expected 0/,
  ],
  [
    "service-level min instances",
    (s) => {
      s.metadata.annotations["run.googleapis.com/minScale"] = "1";
    },
    /service-level min instances is 1/,
  ],
  [
    "manual scaling",
    (s) => {
      s.metadata.annotations["run.googleapis.com/scalingMode"] = "manual";
      s.metadata.annotations["run.googleapis.com/manualInstanceCount"] = "1";
    },
    /scaling mode is manual, expected automatic/,
  ],
  [
    "manual scaling, in capitals",
    (s) => {
      s.metadata.annotations["run.googleapis.com/scalingMode"] = "MANUAL";
    },
    /scaling mode is MANUAL, expected automatic/,
  ],
  [
    "CPU always allocated",
    (s) => {
      annotations(s)[THROTTLING] = "false";
    },
    /cpu-throttling is false/,
  ],
  [
    "CPU always allocated, as gcloud writes it",
    (s) => {
      annotations(s)[THROTTLING] = "False";
    },
    /cpu-throttling is False/,
  ],

  // Identity
  [
    "another service account",
    (s) => {
      s.spec.template.spec.serviceAccountName =
        "123456789012-compute@developer.gserviceaccount.com";
    },
    /service account is 123456789012-compute/,
  ],
  [
    "no service account",
    (s) => {
      delete s.spec.template.spec.serviceAccountName;
    },
    /service account is undefined/,
  ],

  // Egress
  [
    "egress for private ranges only",
    (s) => {
      annotations(s)["run.googleapis.com/vpc-access-egress"] =
        "private-ranges-only";
    },
    /vpc-access-egress is private-ranges-only/,
  ],
  [
    "no VPC at all",
    (s) => {
      delete annotations(s)["run.googleapis.com/vpc-access-egress"];
      delete annotations(s)[NICS];
    },
    /0 Direct VPC network interfaces, expected 1/,
  ],
  [
    "VPC without the network tag",
    (s) => setNic(s, { ...NIC, tags: undefined }),
    /network tags are \[\]/,
  ],
  [
    "VPC with another tag",
    (s) => setNic(s, { ...NIC, tags: ["something-else"] }),
    /network tags are \[something-else\]/,
  ],
  [
    "VPC with a second tag next to the declared one",
    (s) => setNic(s, { ...NIC, tags: [...NIC.tags, "open-egress"] }),
    /network tags are \[build-server-no-egress, open-egress\]/,
  ],
  [
    "another network",
    (s) => setNic(s, { ...NIC, network: "default" }),
    /network is default/,
  ],
  [
    "another subnet",
    (s) => setNic(s, { ...NIC, subnetwork: "default" }),
    /subnet is default/,
  ],
  [
    "unreadable network annotation",
    (s) => {
      annotations(s)[NICS] = "{not json";
    },
    /not valid JSON/,
  ],

  // Traffic
  [
    "traffic pinned to an older revision",
    (s) => {
      s.status.traffic = [{ percent: 100, revisionName: OLD }];
    },
    /traffic entry names academy-build-server-00003-old/,
  ],
  [
    "a tagged 0% entry on an older revision",
    (s) => {
      s.status.traffic.push({
        percent: 0,
        revisionName: OLD,
        tag: "previous",
        url: "https://previous---academy-build-server-abc.a.run.app",
      });
    },
    /traffic entry names academy-build-server-00003-old \(tag previous\)/,
  ],
  [
    "a tagged entry with no percent on an older revision",
    (s) => {
      s.status.traffic.push({ revisionName: OLD, tag: "previous" });
    },
    /traffic entry names academy-build-server-00003-old \(tag previous\)/,
  ],
  [
    "a tagged older revision in the spec only",
    (s) => {
      s.spec.traffic.push({ revisionName: OLD, tag: "previous" });
    },
    /spec traffic entry names academy-build-server-00003-old/,
  ],
  [
    "a traffic split with an older revision",
    (s) => {
      s.status.traffic = [
        { percent: 90, revisionName: LATEST, latestRevision: true },
        { percent: 10, revisionName: OLD },
      ];
    },
    /traffic entry names academy-build-server-00003-old/,
  ],
  [
    "no traffic entries",
    (s) => {
      s.status.traffic = [];
    },
    /latest revision gets 0% of traffic/,
  ],
  [
    "latest revision not ready",
    (s) => {
      s.status.latestCreatedRevisionName = "academy-build-server-00008-new";
    },
    /is not ready/,
  ],
];

for (const [name, mutate, message] of rejected) {
  test(`rejects: ${name}`, () => {
    const failures = checkService(service(mutate), INPUTS);
    assert.ok(failures.length > 0, "expected a failure");
    assert.match(failures.join("\n"), message);
  });
}

test("never prints a literal API key", () => {
  const failures = checkService(
    service((s) => {
      delete apiKey(s).valueFrom;
      apiKey(s).value = "not-a-real-key";
    }),
    INPUTS
  );
  assert.doesNotMatch(failures.join("\n"), /not-a-real-key/);
});

test("reports every mismatch at once", () => {
  const failures = checkService(
    service((s) => {
      delete apiKey(s).valueFrom;
      apiKey(s).value = "not-a-real-key";
      annotations(s)[MIN_SCALE] = "1";
      annotations(s)[THROTTLING] = "false";
      delete s.spec.template.spec.serviceAccountName;
      delete annotations(s)["run.googleapis.com/vpc-access-egress"];
      delete annotations(s)[NICS];
    }),
    INPUTS
  );
  assert.equal(failures.length, 6, failures.join("\n"));
});

test("accepts the forms Cloud Run and gcloud use for the same value", () => {
  for (const mutate of [
    (s) => delete annotations(s)[THROTTLING],
    (s) => (annotations(s)[THROTTLING] = "True"),
    (s) => (annotations(s)[THROTTLING] = "TRUE"),
    (s) => (annotations(s)[MIN_SCALE] = "0"),
    (s) => (container(s).resources.limits.cpu = "4000m"),
    (s) => (container(s).resources.limits.memory = "8192Mi"),
    (s) =>
      setNic(s, {
        ...NIC,
        network: "projects/example-project/global/networks/build-server-vpc",
        subnetwork:
          "projects/example-project/regions/southamerica-east1/subnetworks/build-server-subnet",
      }),
    // A tag on the latest revision adds no other revision.
    (s) =>
      s.status.traffic.push({ percent: 0, revisionName: LATEST, tag: "live" }),
  ]) {
    assert.deepEqual(checkService(service(mutate), INPUTS), []);
  }
});

test("a signed-off min instances value must match the service", () => {
  const signedOff = inputsFor({
    ...ENV,
    MIN_INSTANCES: "1",
    MIN_INSTANCES_SIGNOFF: "owner 2026-01-01",
  });
  const one = service((s) => {
    annotations(s)[MIN_SCALE] = "1";
  });
  assert.deepEqual(checkService(one, signedOff), []);
  assert.match(
    checkService(service(), signedOff).join("\n"),
    /min instances is undefined, expected 1/
  );
});

test("rejects input that is not a service description", () => {
  for (const input of [null, {}, [], { spec: {} }, { kind: "Service" }]) {
    assert.match(
      checkService(input, INPUTS).join("\n"),
      /not a Cloud Run service description/
    );
  }
});

// ── CLI ──────────────────────────────────────────────────────────────────────

function run(args, { input, env: extra = ENV } = {}) {
  return spawnSync(process.execPath, [SCRIPT, ...args], {
    input,
    encoding: "utf8",
    env: { PATH: process.env.PATH, ...extra },
  });
}

test("CLI verify: reads the service and the firewall rules from files", () => {
  const result = run(["verify", FIXTURE, FIREWALL]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /matches the deploy config/);
});

test("CLI verify: reads the service from stdin", () => {
  const result = run(["verify", "-", FIREWALL], {
    input: readFileSync(FIXTURE, "utf8"),
  });
  assert.equal(result.status, 0, result.stderr);
});

test("CLI verify: exits 1 and lists the mismatches", () => {
  const bad = service((s) => {
    delete apiKey(s).valueFrom;
    apiKey(s).value = "not-a-real-key";
  });
  const result = run(["verify", "-", FIREWALL], {
    input: JSON.stringify(bad),
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /literal value/);
  assert.doesNotMatch(result.stderr, /not-a-real-key/);
});

test("CLI verify: exits 1 when the firewall rules do not deny egress", () => {
  const result = run(["verify", FIXTURE, "-"], { input: "[]" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /no enabled EGRESS DENY rule/);
});

test("CLI verify: exits 1 without the firewall rules", () => {
  const result = run(["verify", FIXTURE]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /usage/i);
});

test("CLI verify: exits 1 when the inputs are missing or malformed", () => {
  const none = run(["verify", FIXTURE, FIREWALL], { env: {} });
  assert.equal(none.status, 1);
  assert.match(none.stderr, /PROJECT_ID/);

  const unsigned = run(["verify", FIXTURE, FIREWALL], {
    env: { ...ENV, MIN_INSTANCES: "1" },
  });
  assert.equal(unsigned.status, 1);
  assert.match(unsigned.stderr, /_MIN_INSTANCES_SIGNOFF/);
});

test("CLI verify: exits 1 on unreadable input", () => {
  assert.equal(run(["verify", "-", FIREWALL], { input: "not json" }).status, 1);
  assert.equal(run(["verify", "/nonexistent.json", FIREWALL]).status, 1);
  assert.equal(run(["verify", FIXTURE, "/nonexistent.json"]).status, 1);
});

test("CLI: exits 1 on an unknown command", () => {
  assert.equal(run([]).status, 1);
  assert.equal(run([FIXTURE]).status, 1);
});
