/* eslint-disable @typescript-eslint/no-require-imports */
const { spawn } = require("node:child_process");
const { mkdir, writeFile } = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require("playwright");
const nextBin = require.resolve("next/dist/bin/next");

const PORT = Number(process.env.OVERFLOW_AUDIT_PORT || 4400 + Math.floor(Math.random() * 500));
const BASE_URL = `http://localhost:${PORT}`;
const OUTPUT_DIR = path.join(process.cwd(), "..", "output", "mobile-overflow");

const ROUTES = [
  "/en",
  "/en/courses",
  "/en/courses/anchor-101/lessons/0",
  "/en/profile",
  "/en/dashboard",
  "/en/leaderboard",
  "/en/settings",
];

function startServer() {
  return spawn(process.execPath, [nextBin, "start", "-p", String(PORT)], {
    cwd: process.cwd(),
    env: process.env,
    stdio: "pipe",
  });
}

async function waitForServer(timeoutMs = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${BASE_URL}/en`);
      if (res.ok || res.status === 307 || res.status === 308) return;
    } catch {
      // poll
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("Timed out waiting for app server.");
}

async function run() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  console.log(`Using overflow audit server port ${PORT}`);

  const server = startServer();
  server.stdout.on("data", (chunk) => {
    const text = String(chunk);
    if (/ready|started server|Local:/i.test(text)) process.stdout.write(text);
  });

  let browser;
  const results = [];
  let pass = true;

  try {
    await waitForServer();
    browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 375, height: 812 } });

    for (const route of ROUTES) {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle" });
      const metrics = await page.evaluate(() => ({
        htmlScrollWidth: document.documentElement.scrollWidth,
        bodyScrollWidth: document.body.scrollWidth,
        viewportWidth: window.innerWidth,
      }));
      const hasOverflow =
        metrics.htmlScrollWidth > metrics.viewportWidth ||
        metrics.bodyScrollWidth > metrics.viewportWidth;
      pass = pass && !hasOverflow;
      results.push({ route, ...metrics, hasOverflow });
      await page.screenshot({
        path: path.join(
          OUTPUT_DIR,
          `${route.replace(/\//g, "_").replace(/^_/, "") || "root"}-375.png`,
        ),
        fullPage: true,
      });
    }

    const markdown = [
      "# Mobile Overflow Audit (375px)",
      "",
      `Generated: ${new Date().toISOString()}`,
      `Overall: ${pass ? "PASS" : "FAIL"}`,
      "",
      "| Route | htmlScrollWidth | bodyScrollWidth | viewportWidth | Overflow |",
      "|---|---:|---:|---:|---|",
      ...results.map(
        (r) =>
          `| ${r.route} | ${r.htmlScrollWidth} | ${r.bodyScrollWidth} | ${r.viewportWidth} | ${r.hasOverflow ? "YES" : "NO"} |`,
      ),
      "",
    ].join("\n");

    await writeFile(path.join(OUTPUT_DIR, "SUMMARY.md"), markdown, "utf8");
    await writeFile(path.join(OUTPUT_DIR, "SUMMARY.json"), JSON.stringify(results, null, 2), "utf8");
    console.log(markdown);
    if (!pass) process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    if (process.platform === "win32") {
      spawn("taskkill", ["/pid", String(server.pid), "/t", "/f"], {
        stdio: "ignore",
        shell: false,
      });
    } else {
      server.kill("SIGTERM");
    }
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
