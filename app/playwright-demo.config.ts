import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e/demo",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3098",
    viewport: { width: 1920, height: 1080 },
    colorScheme: "dark",
    video: { mode: "on", size: { width: 1920, height: 1080 } },
    launchOptions: { slowMo: 100 },
    trace: "off",
  },
  projects: [
    {
      name: "demo",
      use: { browserName: "chromium" },
    },
  ],
  webServer: {
    command: "NEXT_PUBLIC_DEMO_MODE=true npx next dev -p 3098",
    url: "http://localhost:3098",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
