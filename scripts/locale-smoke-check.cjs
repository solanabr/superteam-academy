/* eslint-disable @typescript-eslint/no-require-imports */
const { spawn } = require("node:child_process");
const { mkdir, writeFile } = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require("playwright");
const nextBin = require.resolve("next/dist/bin/next");

const PORT = Number(process.env.LOCALE_SMOKE_PORT || 3800 + Math.floor(Math.random() * 500));
const BASE_URL = `http://localhost:${PORT}`;
const OUTPUT_DIR = path.join(process.cwd(), "..", "output", "locale-smoke");

const LOCALES = ["en", "pt-BR", "es"];
const ROUTES = ["", "/courses", "/leaderboard", "/dashboard", "/profile", "/settings"];
const HARD_FAIL_PATTERNS = [
  "MISSING_MESSAGE",
  "IntlError",
  "translation missing",
  "Missing translation",
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
  console.log(`Using locale smoke server port ${PORT}`);

  const server = startServer();
  server.stdout.on("data", (chunk) => {
    const text = String(chunk);
    if (/ready|started server|Local:/i.test(text)) process.stdout.write(text);
  });
  server.stderr.on("data", (chunk) => process.stderr.write(String(chunk)));

  let browser;
  const summary = [];
  let overallPass = true;

  try {
    await waitForServer();
    browser = await chromium.launch();

    for (const locale of LOCALES) {
      const context = await browser.newContext({ locale: locale === "pt-BR" ? "pt-BR" : locale });
      const page = await context.newPage();
      const pageErrors = [];
      const consoleErrors = [];

      page.on("pageerror", (err) => pageErrors.push(err.message));
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });

      let localePass = true;
      const visited = [];

      for (const route of ROUTES) {
        const url = `${BASE_URL}/${locale}${route}`;
        const response = await page.goto(url, { waitUntil: "networkidle" });
        const status = response ? response.status() : 0;
        visited.push({ route: `/${locale}${route || ""}`, status });
        if (!response || status >= 400) localePass = false;

        const bodyText = await page.locator("body").innerText();
        if (HARD_FAIL_PATTERNS.some((pattern) => bodyText.includes(pattern))) {
          localePass = false;
        }
      }

      const navCourses = await page.locator(`a[href="/${locale}/courses"]`).count();
      const navLeaderboard = await page.locator(`a[href="/${locale}/leaderboard"]`).count();
      const navDashboard = await page.locator(`a[href="/${locale}/dashboard"]`).count();
      if (navCourses < 1 || navLeaderboard < 1 || navDashboard < 1) {
        localePass = false;
      }

      await page.screenshot({
        path: path.join(OUTPUT_DIR, `${locale}-home.png`),
        fullPage: true,
      });

      if (pageErrors.length > 0 || consoleErrors.length > 0) {
        localePass = false;
      }

      summary.push({
        locale,
        pass: localePass,
        visited,
        pageErrors,
        consoleErrors,
      });
      overallPass = overallPass && localePass;

      await context.close();
    }

    const markdown = [
      "# Locale Smoke Check",
      "",
      `Generated: ${new Date().toISOString()}`,
      `Overall: ${overallPass ? "PASS" : "FAIL"}`,
      "",
      "| Locale | Result | Routes checked | Console/Page errors |",
      "|---|---|---:|---:|",
      ...summary.map(
        (row) =>
          `| ${row.locale} | ${row.pass ? "PASS" : "FAIL"} | ${row.visited.length} | ${row.consoleErrors.length + row.pageErrors.length} |`,
      ),
      "",
      "## Route Status",
      ...summary.flatMap((row) => [
        "",
        `### ${row.locale}`,
        ...row.visited.map((v) => `- ${v.route}: ${v.status}`),
        ...(row.consoleErrors.length
          ? ["- Console errors:", ...row.consoleErrors.map((e) => `  - ${e}`)]
          : []),
        ...(row.pageErrors.length
          ? ["- Page errors:", ...row.pageErrors.map((e) => `  - ${e}`)]
          : []),
      ]),
      "",
    ].join("\n");

    await writeFile(path.join(OUTPUT_DIR, "SUMMARY.md"), markdown, "utf8");
    await writeFile(path.join(OUTPUT_DIR, "SUMMARY.json"), JSON.stringify(summary, null, 2), "utf8");
    console.log(markdown);

    if (!overallPass) {
      process.exitCode = 1;
    }
  } finally {
    if (browser) {
      await browser.close();
    }
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
