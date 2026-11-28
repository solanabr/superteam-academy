// Start the app for a walk: `next dev` on the walk port, with the build stub,
// and with apps/web/.env.walk as the only source of app configuration.
//
// Next.js loads .env, .env.local, .env.development and .env.development.local
// from the app directory by itself. One of those in this checkout would put
// real values (a production database, real keys) into a walk, so this refuses
// to start when any of them exists. Walk from a worktree that has none.

import { spawn } from "node:child_process";
import { join } from "node:path";
import {
  APP_URL,
  DEVNET_RPC,
  PORTS,
  SUPABASE_URL,
  WEB_ROOT,
  fail,
  pathExists,
  readEnvFile,
} from "./lib.mjs";
import { startBuildStub } from "./build-stub.mjs";

const AUTO_LOADED = [
  ".env",
  ".env.local",
  ".env.development",
  ".env.development.local",
];

// What the child keeps from the caller's shell. Nothing else is passed on, so
// an exported key in the shell cannot reach the app.
const SHELL_KEEP = [
  "PATH",
  "HOME",
  "USER",
  "LOGNAME",
  "SHELL",
  "TMPDIR",
  "LANG",
  "LC_ALL",
  "TERM",
  "COLORTERM",
];

export function dev() {
  const found = AUTO_LOADED.filter((name) => pathExists(join(WEB_ROOT, name)));
  if (found.length > 0) {
    fail(
      `refusing to start: apps/web has ${found.join(", ")}. Next.js would load it, ` +
        "and a walk must never run with the owner's env file or a production value. " +
        "Run the walk from a git worktree that has no such file."
    );
  }

  const env = readEnvFile();
  if (env.NEXT_PUBLIC_SUPABASE_URL !== SUPABASE_URL) {
    fail(`.env.walk does not point at the walk stack (${SUPABASE_URL})`);
  }
  if (
    env.SOLANA_RPC_URL !== DEVNET_RPC ||
    env.NEXT_PUBLIC_SOLANA_RPC_URL !== DEVNET_RPC ||
    env.NEXT_PUBLIC_SOLANA_NETWORK !== "devnet"
  ) {
    fail(".env.walk is not on public devnet");
  }

  const stub = startBuildStub({ apiKey: env.BUILD_SERVER_API_KEY });

  const childEnv = { NEXT_TELEMETRY_DISABLED: "1" };
  for (const name of SHELL_KEEP) {
    if (process.env[name] !== undefined) childEnv[name] = process.env[name];
  }
  Object.assign(childEnv, env);

  console.log(`[walk] starting the app on ${APP_URL}`);
  const next = spawn(
    join(WEB_ROOT, "node_modules", ".bin", "next"),
    // Loopback only: the app is not served to the local network.
    ["dev", "-H", "127.0.0.1", "-p", String(PORTS.app)],
    { cwd: WEB_ROOT, env: childEnv, stdio: "inherit" }
  );

  const stop = (code) => {
    stub.close();
    if (!next.killed) next.kill("SIGTERM");
    process.exit(code);
  };
  next.on("exit", (code) => stop(code ?? 0));
  next.on("error", (error) => {
    console.error(`[walk] could not start next: ${error.message}`);
    stop(1);
  });
  process.on("SIGINT", () => stop(0));
  process.on("SIGTERM", () => stop(0));
}
