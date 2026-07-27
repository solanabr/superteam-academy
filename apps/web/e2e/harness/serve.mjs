// E2E web-server entrypoint, launched by Playwright's `webServer.command`.
//
// Ordering matters and is controlled here (not left to Playwright's webServer
// array): a self-signed cert must exist before `next start` boots so its Node
// process can trust the mock over NODE_EXTRA_CA_CERTS. Sequence:
//   1. generate a fresh self-signed cert for 127.0.0.1 (openssl; no committed key)
//   2. start the mock Supabase server (HTTPS) and wait for it to accept connections
//   3. `next build` with the E2E env (unless E2E_NO_BUILD=1) — NEXT_PUBLIC_* are
//      inlined at build time, so the build MUST use the mock URL
//   4. `next start` with the same env + NODE_EXTRA_CA_CERTS
// Playwright then polls APP_BASE_URL. SIGTERM/SIGINT tears both children down.

import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import net from "node:net";
import {
  APP_PORT,
  MOCK_PORT,
  MOCK_SUPABASE_URL,
  ANON_KEY,
} from "./fixtures.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = join(here, "..", "..");

// ── 1. Cert ─────────────────────────────────────────────────────────────────
const certDir = mkdtempSync(join(tmpdir(), "e2e-supabase-cert-"));
const keyPath = join(certDir, "key.pem");
const certPath = join(certDir, "cert.pem");
const openssl = spawnSync(
  "openssl",
  [
    "req",
    "-x509",
    "-newkey",
    "rsa:2048",
    "-nodes",
    "-keyout",
    keyPath,
    "-out",
    certPath,
    "-days",
    "1",
    "-subj",
    "/CN=127.0.0.1",
    "-addext",
    "subjectAltName=IP:127.0.0.1,DNS:localhost",
  ],
  { stdio: "inherit" }
);
if (openssl.status !== 0) {
  console.error("[serve] openssl cert generation failed");
  process.exit(1);
}

// ── Shared env for build + start ─────────────────────────────────────────────
const appEnv = {
  ...process.env,
  NODE_ENV: "production",
  PORT: String(APP_PORT),
  NEXT_TELEMETRY_DISABLED: "1",
  NEXT_PUBLIC_SUPABASE_URL: MOCK_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: ANON_KEY,
  NEXT_PUBLIC_SOLANA_RPC_URL: "https://api.devnet.solana.com",
  // Mirror the CI unit-test env (ci.yml frontend job) so build-time page-data
  // collection has the public vars the app requires (event-decoder, etc.). A
  // shape-valid devnet program id — never used to send a real tx here.
  NEXT_PUBLIC_PROGRAM_ID: "7NeJaSRyb4Wxay3Tcd9bdpD7T3GWYUQSFyrhG8SgwE8V",
  NEXT_PUBLIC_SOLANA_NETWORK: "devnet",
  SUPABASE_SERVICE_ROLE_KEY: "e2e-service-role-not-a-secret",
  SOLANA_RPC_URL: "https://api.devnet.solana.com",
  // Trust the mock's self-signed cert for server-side (undici) fetches.
  NODE_EXTRA_CA_CERTS: certPath,
};

const children = [];
function shutdown(code = 0) {
  for (const c of children) {
    try {
      c.kill("SIGTERM");
    } catch {
      /* already gone */
    }
  }
  process.exit(code);
}
process.on("SIGTERM", () => shutdown(0));
process.on("SIGINT", () => shutdown(0));

function run(cmd, args, opts) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit", ...opts });
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))
    );
    child.on("error", reject);
  });
}

// Readiness by TCP connect, not HTTPS fetch: the mock's cert is self-signed and
// NODE_EXTRA_CA_CERTS is only honored at process start (too late to help a probe
// in THIS already-running process). A successful TCP connect proves the server
// is listening, which is all the ordering guarantee we need.
function waitForPort(port, host, label, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const socket = net.connect({ port, host });
      socket.once("connect", () => {
        socket.destroy();
        resolve();
      });
      socket.once("error", () => {
        socket.destroy();
        if (Date.now() > deadline) {
          reject(new Error(`[serve] ${label} not ready after ${timeoutMs}ms`));
        } else {
          setTimeout(attempt, 300);
        }
      });
    };
    attempt();
  });
}

async function main() {
  // ── 2. Mock Supabase ────────────────────────────────────────────────────
  const mock = spawn(process.execPath, [join(here, "mock-supabase.mjs")], {
    stdio: "inherit",
    env: {
      ...process.env,
      E2E_SSL_CERT: certPath,
      E2E_SSL_KEY: keyPath,
      // The probe below runs in THIS process; trust the cert here too.
      NODE_EXTRA_CA_CERTS: certPath,
    },
  });
  children.push(mock);
  await waitForPort(MOCK_PORT, "127.0.0.1", "mock supabase");

  // ── 3. Build (skippable in CI, which builds in its own cached step) ───────
  if (process.env.E2E_NO_BUILD !== "1") {
    console.log("[serve] next build (E2E env)…");
    await run("pnpm", ["exec", "next", "build"], { cwd: webRoot, env: appEnv });
  }

  // ── 4. Start ──────────────────────────────────────────────────────────────
  console.log(`[serve] next start on :${APP_PORT}…`);
  const app = spawn("pnpm", ["exec", "next", "start", "-p", String(APP_PORT)], {
    stdio: "inherit",
    cwd: webRoot,
    env: appEnv,
  });
  children.push(app);
  app.on("exit", (code) => shutdown(code ?? 0));
}

main().catch((err) => {
  console.error(err);
  shutdown(1);
});
