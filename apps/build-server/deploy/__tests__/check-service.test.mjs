import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { checkService, expectedFromEnv } from "../check-service.mjs";

const SCRIPT = fileURLToPath(new URL("../check-service.mjs", import.meta.url));
const FIXTURE = fileURLToPath(
  new URL("./fixtures/service.json", import.meta.url)
);

const MIN_SCALE = "autoscaling.knative.dev/minScale";
const NICS = "run.googleapis.com/network-interfaces";

const ENV = {
  EXPECT_SERVICE_ACCOUNT:
    "academy-build-sa@example-project.iam.gserviceaccount.com",
  EXPECT_SECRET: "academy-build-api-key",
  EXPECT_MIN_INSTANCES: "0",
  MIN_INSTANCES_SIGNOFF: "",
  EXPECT_NETWORK: "build-server-vpc",
  EXPECT_SUBNET: "build-server-subnet",
  EXPECT_NETWORK_TAG: "build-server-no-egress",
};
const EXPECTED = expectedFromEnv(ENV);

/** The good fixture, changed by `mutate`. */
function service(mutate = () => {}) {
  const copy = JSON.parse(readFileSync(FIXTURE, "utf8"));
  mutate(copy);
  return copy;
}
const annotations = (s) => s.spec.template.metadata.annotations;
const env = (s) => s.spec.template.spec.containers[0].env;
const apiKey = (s) => env(s).find((e) => e.name === "ACADEMY_API_KEY");
const setNic = (s, nic) => {
  annotations(s)[NICS] = JSON.stringify([nic]);
};
const NIC = {
  network: "build-server-vpc",
  subnetwork: "build-server-subnet",
  tags: ["build-server-no-egress"],
};

test("the declared service passes", () => {
  assert.deepEqual(checkService(service(), EXPECTED), []);
});

const rejected = [
  [
    "API key as a literal",
    (s) => {
      delete apiKey(s).valueFrom;
      apiKey(s).value = "not-a-real-key";
    },
    /literal value/,
  ],
  [
    "API key as both a literal and a secret",
    (s) => env(s).push({ name: "ACADEMY_API_KEY", value: "not-a-real-key" }),
    /set 2 times/,
  ],
  [
    "API key missing",
    (s) => env(s).splice(env(s).indexOf(apiKey(s)), 1),
    /set 0 times/,
  ],
  [
    "API key from another secret",
    (s) => {
      apiKey(s).valueFrom.secretKeyRef.name = "some-other-secret";
    },
    /refers to secret some-other-secret/,
  ],
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
    "CPU always allocated",
    (s) => {
      annotations(s)["run.googleapis.com/cpu-throttling"] = "false";
    },
    /cpu-throttling is false/,
  ],
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
    /no Direct VPC egress network interface/,
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
  [
    "traffic pinned to an older revision",
    (s) => {
      s.status.traffic = [
        { percent: 100, revisionName: "academy-build-server-00003-old" },
      ];
    },
    /traffic is not all on the latest revision/,
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
    const failures = checkService(service(mutate), EXPECTED);
    assert.ok(failures.length > 0, "expected a failure");
    assert.match(failures.join("\n"), message);
  });
}

test("reports every mismatch at once", () => {
  const failures = checkService(
    service((s) => {
      delete apiKey(s).valueFrom;
      apiKey(s).value = "not-a-real-key";
      annotations(s)[MIN_SCALE] = "1";
      annotations(s)["run.googleapis.com/cpu-throttling"] = "false";
      delete s.spec.template.spec.serviceAccountName;
      delete annotations(s)["run.googleapis.com/vpc-access-egress"];
      delete annotations(s)[NICS];
    }),
    EXPECTED
  );
  assert.equal(failures.length, 6, failures.join("\n"));
});

test("accepts the defaults Cloud Run leaves out", () => {
  const s = service((x) => {
    delete annotations(x)["run.googleapis.com/cpu-throttling"];
    annotations(x)[MIN_SCALE] = "0";
  });
  assert.deepEqual(checkService(s, EXPECTED), []);
});

test("accepts full resource paths for the network and subnet", () => {
  const s = service((x) =>
    setNic(x, {
      ...NIC,
      network: "projects/example-project/global/networks/build-server-vpc",
      subnetwork:
        "projects/example-project/regions/southamerica-east1/subnetworks/build-server-subnet",
    })
  );
  assert.deepEqual(checkService(s, EXPECTED), []);
});

test("a signed-off min instances value must match the service", () => {
  const signedOff = expectedFromEnv({
    ...ENV,
    EXPECT_MIN_INSTANCES: "1",
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

  const unsigned = expectedFromEnv({ ...ENV, EXPECT_MIN_INSTANCES: "1" });
  assert.match(checkService(one, unsigned).join("\n"), /has no sign-off/);
});

test("fails closed when an expectation is missing", () => {
  for (const key of Object.keys(ENV)) {
    if (key === "MIN_INSTANCES_SIGNOFF") continue;
    const failures = checkService(
      service(),
      expectedFromEnv({ ...ENV, [key]: "" })
    );
    assert.match(failures.join("\n"), /no expected value given/, key);
  }
});

test("rejects input that is not a service description", () => {
  for (const input of [null, {}, [], { spec: {} }, { kind: "Service" }]) {
    assert.match(
      checkService(input, EXPECTED).join("\n"),
      /not a Cloud Run service description/
    );
  }
});

function run(args, { input, env: extra = ENV } = {}) {
  return spawnSync(process.execPath, [SCRIPT, ...args], {
    input,
    encoding: "utf8",
    env: { PATH: process.env.PATH, ...extra },
  });
}

test("CLI: reads a file argument", () => {
  const result = run([FIXTURE]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /matches the deploy config/);
});

test("CLI: reads stdin", () => {
  const result = run([], { input: readFileSync(FIXTURE, "utf8") });
  assert.equal(result.status, 0, result.stderr);
});

test("CLI: exits 1 and lists the mismatches", () => {
  const bad = service((s) => {
    delete apiKey(s).valueFrom;
    apiKey(s).value = "not-a-real-key";
  });
  const result = run(["-"], { input: JSON.stringify(bad) });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /literal value/);
  assert.doesNotMatch(result.stderr, /not-a-real-key/);
});

test("CLI: exits 1 without the EXPECT_* variables", () => {
  const result = run([FIXTURE], { env: {} });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /no expected value given/);
});

test("CLI: exits 1 on unreadable input", () => {
  assert.equal(run([], { input: "not json" }).status, 1);
  assert.equal(run(["/nonexistent/service.json"]).status, 1);
});
