import { defineConfig, devices } from "@playwright/test";
import { APP_BASE_URL } from "./e2e/harness/fixtures.mjs";

// E2E for the critical learner paths (#781). Runs against a production build
// (`next build && next start`) fronted by a mock Supabase — see e2e/README.md.
// The whole harness (cert, mock, build, start) is orchestrated by serve.mjs so
// ordering is deterministic; Playwright only polls the app URL below.

const CI = !!process.env.CI;

export default defineConfig({
  testDir: "./e2e",
  // Only Playwright specs live here; the mock/harness are .mjs and excluded.
  testMatch: /.*\.spec\.ts$/,
  fullyParallel: true,
  forbidOnly: CI,
  // Deterministic-by-construction (mocked seams, auto-waiting assertions). One
  // retry in CI absorbs cold-start jitter only; a real failure still fails.
  retries: CI ? 1 : 0,
  workers: CI ? 2 : undefined,
  reporter: CI
    ? [["github"], ["html", { open: "never" }], ["list"]]
    : [["html", { open: "never" }], ["list"]],
  // Fail fast on a hung server rather than burning the CI budget.
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: APP_BASE_URL,
    // The mock Supabase serves a per-run self-signed cert.
    ignoreHTTPSErrors: true,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: CI ? "on-first-retry" : "off",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "node e2e/harness/serve.mjs",
    url: `${APP_BASE_URL}/en/courses`,
    reuseExistingServer: !CI,
    // The harness runs `next build` (cold on a fresh tree) + boots the mock +
    // `next start`. CI restores apps/web/.next/cache so the build stays
    // incremental; the specs themselves are seconds. Generous timeout covers a
    // cold cache.
    timeout: 240_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
