#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const ENV_LOCAL = path.join(ROOT, ".env.local");
const ENV_EXAMPLE = path.join(ROOT, ".env.example");

const GROUPS = [
  {
    name: "OAuth (deployed verification blockers)",
    keys: [
      "NEXTAUTH_URL",
      "NEXTAUTH_SECRET",
      "GOOGLE_CLIENT_ID",
      "GOOGLE_CLIENT_SECRET",
      "GITHUB_CLIENT_ID",
      "GITHUB_CLIENT_SECRET",
    ],
  },
  {
    name: "Analytics / Observability",
    keys: [
      "NEXT_PUBLIC_GA_MEASUREMENT_ID",
      "NEXT_PUBLIC_CLARITY_PROJECT_ID",
      "NEXT_PUBLIC_SENTRY_DSN",
    ],
  },
  {
    name: "CMS / Content",
    keys: [
      "NEXT_PUBLIC_SANITY_PROJECT_ID",
      "NEXT_PUBLIC_SANITY_DATASET",
      "SANITY_API_READ_TOKEN",
    ],
  },
  {
    name: "Core Chain Connectivity",
    keys: [
      "NEXT_PUBLIC_RPC_URL",
      "NEXT_PUBLIC_PROGRAM_ID",
      "NEXT_PUBLIC_XP_MINT",
    ],
  },
];

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return new Map();
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  const map = new Map();

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIndex = line.indexOf("=");
    if (eqIndex <= 0) continue;

    const key = line.slice(0, eqIndex).trim();
    const value = line.slice(eqIndex + 1).trim();
    map.set(key, value);
  }

  return map;
}

function isSet(value) {
  if (value == null) return false;
  const normalized = String(value).trim();
  return normalized.length > 0;
}

function sourceValue(key, localMap, exampleMap) {
  if (isSet(process.env[key])) return { value: process.env[key], source: "process" };
  if (isSet(localMap.get(key))) return { value: localMap.get(key), source: ".env.local" };
  if (isSet(exampleMap.get(key))) return { value: exampleMap.get(key), source: ".env.example" };
  return { value: "", source: "missing" };
}

const localMap = parseEnvFile(ENV_LOCAL);
const exampleMap = parseEnvFile(ENV_EXAMPLE);

const checks = GROUPS.map((group) => {
  const entries = group.keys.map((key) => {
    const resolved = sourceValue(key, localMap, exampleMap);
    return {
      key,
      set: isSet(resolved.value),
      source: resolved.source,
    };
  });

  const missing = entries.filter((entry) => !entry.set).map((entry) => entry.key);
  return {
    group: group.name,
    ready: missing.length === 0,
    missing,
    entries,
  };
});

const allMissing = checks.flatMap((check) => check.missing);
const summary = {
  timestamp: new Date().toISOString(),
  ready: allMissing.length === 0,
  missingCount: allMissing.length,
  missing: allMissing,
  checks,
};

const asJson = process.argv.includes("--json");
if (asJson) {
  console.log(JSON.stringify(summary, null, 2));
} else {
  console.log(`Env Audit @ ${summary.timestamp}`);
  console.log(summary.ready ? "Overall: READY" : "Overall: BLOCKED");
  console.log("");

  for (const check of checks) {
    const badge = check.ready ? "READY" : "BLOCKED";
    console.log(`[${badge}] ${check.group}`);
    for (const entry of check.entries) {
      const state = entry.set ? "set" : "missing";
      console.log(`  - ${entry.key}: ${state} (${entry.source})`);
    }
    if (!check.ready) {
      console.log(`  Missing: ${check.missing.join(", ")}`);
    }
    console.log("");
  }
}

process.exit(summary.ready ? 0 : 1);
