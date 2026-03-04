#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");

const isLocalWindows = process.platform === "win32" && process.env.CI !== "true";
const buildArgs = ["build"];

if (isLocalWindows) {
  // Local Windows has intermittent EPERM during full generate step.
  // Compile mode keeps local release gating unblocked; CI/Linux still runs full build.
  buildArgs.push("--experimental-build-mode", "compile");
}

const result = spawnSync(process.execPath, [nextBin, ...buildArgs], {
  stdio: "inherit",
  env: process.env,
});

if (result.error) {
  console.error("[build-safe] failed to execute next build:", result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
