// guard-merge falls back to these job names when branch protection can't be
// read. Renaming a job without updating FALLBACK_REQUIRED would make every
// merge wait for a check that never reports, so pin the names here.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { FALLBACK_REQUIRED } from "../guard-merge.mjs";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  ".."
);
const workflows = ["ci.yml", "action-pin-guard.yml"]
  .map((f) =>
    fs.readFileSync(path.join(root, ".github", "workflows", f), "utf8")
  )
  .join("\n");

test("every fallback required check is a job name in the workflows", () => {
  for (const name of FALLBACK_REQUIRED) {
    assert.ok(
      workflows.split("\n").some((line) => line.trim() === `name: ${name}`),
      `no job named "${name}"`
    );
  }
});
