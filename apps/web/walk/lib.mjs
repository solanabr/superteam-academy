// Shared constants and helpers for the walk stack (docs/WALK-ENV.md).
//
// The walk stack is a local Supabase stack plus a build-server stub. It has its
// own project id and ports, so it cannot clash with another local Supabase
// stack on the same machine, and it never uses a production value.

import { spawnSync } from "node:child_process";
import { createHmac } from "node:crypto";
import { existsSync, lstatSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const WEB_ROOT = join(here, "..");
export const REPO_ROOT = join(WEB_ROOT, "..", "..");

/** Generated files, all git-ignored. */
export const WALK_DIR = join(WEB_ROOT, ".walk");
export const ENV_FILE = join(WEB_ROOT, ".env.walk");

/** Pinned, so every session pulls the same service images. */
export const SUPABASE_CLI = "supabase@2.120.0";
export const PROJECT_ID = "academy-walk";

// The repo's supabase/config.toml and other local stacks use 5432x.
export const PORTS = {
  api: 55421,
  db: 55422,
  shadowDb: 55420,
  pooler: 55429,
  studio: 55423,
  inbucket: 55424,
  app: 3210,
  buildStub: 3211,
};

export const SUPABASE_URL = `http://127.0.0.1:${PORTS.api}`;
export const APP_URL = `http://localhost:${PORTS.app}`;
export const BUILD_STUB_URL = `http://127.0.0.1:${PORTS.buildStub}`;
export const DEVNET_RPC = "https://api.devnet.solana.com";

/** The course and lesson the seeded learner is enrolled in. */
export const PILOT = {
  courseId: "course-btc-to-sol-evolution",
  courseSlug: "btc-to-sol-evolution",
  lessonSlug: "your-first-solana-program",
};

export const USERS = {
  learner: { email: "test-learner@example.com", username: "test-learner" },
  admin: { email: "test-admin@example.com", username: "test-admin" },
};

export function fail(message) {
  console.error(`[walk] ${message}`);
  process.exit(1);
}

/** Run the pinned Supabase CLI against the generated working directory. */
export function supabase(args, { capture = false, hideStdout = false } = {}) {
  const result = spawnSync(
    "npx",
    ["--yes", SUPABASE_CLI, ...args, "--workdir", WALK_DIR],
    {
      stdio: capture
        ? ["ignore", "pipe", "pipe"]
        : ["ignore", hideStdout ? "ignore" : "inherit", "inherit"],
      encoding: "utf8",
      env: {
        ...process.env,
        DO_NOT_TRACK: "1",
        SUPABASE_TELEMETRY_DISABLED: "1",
      },
    }
  );
  if (result.error)
    fail(`could not run the Supabase CLI: ${result.error.message}`);
  return result;
}

/**
 * The running stack's URL and keys, read from the stack itself. Null when the
 * stack is not running.
 */
export function stackStatus() {
  if (!existsSync(join(WALK_DIR, "supabase", "config.toml"))) return null;
  const result = supabase(["status", "-o", "env"], { capture: true });
  if (result.status !== 0) return null;
  const values = parseEnv(result.stdout);
  if (!values.API_URL || !values.ANON_KEY || !values.SERVICE_ROLE_KEY) {
    return null;
  }
  return {
    url: values.API_URL,
    anonKey: values.ANON_KEY,
    serviceRoleKey: values.SERVICE_ROLE_KEY,
  };
}

export function requireStack() {
  const status = stackStatus();
  if (!status)
    fail("the walk stack is not running. Run: pnpm --filter web walk up");
  if (status.url !== SUPABASE_URL) {
    fail(`the stack answers on ${status.url}, expected ${SUPABASE_URL}`);
  }
  return status;
}

/** Parse KEY=value lines. Values may be double-quoted. */
export function parseEnv(text) {
  const values = {};
  for (const line of text.split("\n")) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (!match) continue;
    values[match[1]] = match[2].replace(/^"(.*)"$/, "$1");
  }
  return values;
}

export function readEnvFile() {
  if (!existsSync(ENV_FILE)) {
    fail("apps/web/.env.walk is missing. Run: pnpm --filter web walk up");
  }
  return parseEnv(readFileSync(ENV_FILE, "utf8"));
}

/** True for a file, a directory or a link, including a link to nothing. */
export function pathExists(path) {
  try {
    lstatSync(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * A test user's password. Derived from the local stack's service-role key, so
 * every worktree gets the same one and none is stored or printed.
 */
export function userPassword(serviceRoleKey, email) {
  return createHmac("sha256", serviceRoleKey)
    .update(`walk:${email}`)
    .digest("base64url");
}
