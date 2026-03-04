import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";

const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");
const PORT = Number(process.env.LIGHTHOUSE_PORT ?? 3300 + Math.floor(Math.random() * 500));
const BASE_URL = `http://localhost:${PORT}`;
const OUTPUT_DIR = path.join(process.cwd(), "..", "output", "lighthouse");

const ROUTES = [
  { id: "home", url: `${BASE_URL}/` },
  { id: "courses", url: `${BASE_URL}/en/courses` },
  { id: "lesson", url: `${BASE_URL}/en/courses/anchor-101/lessons/0` },
  { id: "profile", url: `${BASE_URL}/en/profile` },
];

function startServer() {
  return spawn(process.execPath, [nextBin, "start", "-p", String(PORT)], {
    cwd: process.cwd(),
    env: process.env,
    stdio: "pipe",
  });
}

async function waitForServer(timeoutMs = 60_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(`${BASE_URL}/en`);
      if (response.ok || response.status === 307 || response.status === 308) {
        return;
      }
    } catch {
      // Keep polling until timeout.
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error("Timed out waiting for Next.js server to start.");
}

function toPercent(score) {
  if (typeof score !== "number") return null;
  return Math.round(score * 100);
}

async function run() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  process.stdout.write(`Using Lighthouse server port ${PORT}\n`);

  const server = startServer();
  server.stdout.on("data", (chunk) => {
    const text = String(chunk);
    if (/ready|started server|Local:/i.test(text)) {
      process.stdout.write(text);
    }
  });
  server.stderr.on("data", (chunk) => {
    process.stderr.write(String(chunk));
  });

  let chrome;

  try {
    await waitForServer();

    chrome = await chromeLauncher.launch({
      chromeFlags: ["--headless", "--no-sandbox", "--disable-gpu"],
    });

    const summaries = [];

    for (const route of ROUTES) {
      const result = await lighthouse(route.url, {
        port: chrome.port,
        logLevel: "error",
        output: ["json", "html"],
        onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
        formFactor: "desktop",
        screenEmulation: {
          mobile: false,
          width: 1350,
          height: 940,
          deviceScaleFactor: 1,
          disabled: false,
        },
      });

      const [jsonReport, htmlReport] = result.report;
      await writeFile(path.join(OUTPUT_DIR, `${route.id}.json`), jsonReport);
      await writeFile(path.join(OUTPUT_DIR, `${route.id}.html`), htmlReport);

      const categories = result.lhr.categories;
      summaries.push({
        route: route.url,
        performance: toPercent(categories.performance?.score),
        accessibility: toPercent(categories.accessibility?.score),
        bestPractices: toPercent(categories["best-practices"]?.score),
        seo: toPercent(categories.seo?.score),
        lcpMs: result.lhr.audits["largest-contentful-paint"]?.numericValue ?? null,
        cls: result.lhr.audits["cumulative-layout-shift"]?.numericValue ?? null,
        inpMs:
          result.lhr.audits["interaction-to-next-paint"]?.numericValue ??
          result.lhr.audits["max-potential-fid"]?.numericValue ??
          null,
      });
    }

    const markdown = [
      "# Lighthouse Summary",
      "",
      `Generated: ${new Date().toISOString()}`,
      "",
      "| Route | Performance | Accessibility | Best Practices | SEO | LCP (ms) | INP/FID (ms) | CLS |",
      "|---|---:|---:|---:|---:|---:|---:|---:|",
      ...summaries.map(
        (s) =>
          `| ${s.route} | ${s.performance ?? "-"} | ${s.accessibility ?? "-"} | ${s.bestPractices ?? "-"} | ${s.seo ?? "-"} | ${s.lcpMs ? Math.round(s.lcpMs) : "-"} | ${s.inpMs ? Math.round(s.inpMs) : "-"} | ${typeof s.cls === "number" ? s.cls.toFixed(3) : "-"} |`,
      ),
      "",
    ].join("\n");

    await writeFile(path.join(OUTPUT_DIR, "SUMMARY.md"), markdown, "utf8");
    process.stdout.write(`${markdown}\n`);
  } finally {
    if (chrome) {
      try {
        await chrome.kill();
      } catch {
        // Windows can briefly lock LH temp files; non-fatal for report generation.
      }
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
