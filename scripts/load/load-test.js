/**
 * Superteam Academy — read-path load test (k6)
 * Readiness item G8.
 *
 * ============================================================================
 *  SAFETY — READ THIS BEFORE RUNNING
 * ============================================================================
 *  - This script ONLY issues GET requests against PUBLIC, read-only paths.
 *    It never writes, authenticates, mints XP, touches the chain, or mutates
 *    any data. Do not add non-GET requests to this file.
 *  - It defaults to http://localhost:3000. To target another environment you
 *    MUST set BASE_URL explicitly.
 *  - NEVER point this at production. Load-testing prod can trip rate limits,
 *    skew analytics, exhaust Supabase/Helius quotas, and page on-call.
 *    Run it against localhost or a dedicated STAGING deploy only.
 * ============================================================================
 *
 * Usage:
 *   # Local dev server (default target)
 *   k6 run scripts/load/load-test.js
 *
 *   # Staging (explicit URL required; no trailing slash)
 *   BASE_URL=https://academy-staging.example.com k6 run scripts/load/load-test.js
 *
 *   # Optional overrides
 *   LOCALE=pt-BR COURSE_SLUG=intro-to-solana BASE_URL=... k6 run scripts/load/load-test.js
 *
 * See scripts/load/README.md for install + interpretation notes.
 */

import http from "k6/http";
import { check, group, sleep } from "k6";

// --- Config (env-driven, safe defaults) -------------------------------------

const BASE_URL = (__ENV.BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
const LOCALE = __ENV.LOCALE || "en";
// Fallback course slug used only if setup() can't discover one from the sitemap.
const FALLBACK_COURSE_SLUG = __ENV.COURSE_SLUG || "";

// Fail fast if someone fat-fingers a prod-looking host without meaning to.
// This is a guard rail, not a security control — override with ALLOW_PROD=1
// if you genuinely intend to target one of these (you almost never do).
const PROD_HOST_PATTERNS = [
  /(^|\.)solarium\.courses$/i,
  /superteam-academy-web\.vercel\.app$/i,
];
if (__ENV.ALLOW_PROD !== "1") {
  let host = "";
  try {
    // k6 has no URL global; extract host cheaply.
    host = BASE_URL.replace(/^https?:\/\//i, "").split("/")[0].split(":")[0];
  } catch (_e) {
    host = "";
  }
  for (const re of PROD_HOST_PATTERNS) {
    if (re.test(host)) {
      throw new Error(
        `Refusing to run against what looks like production (${host}). ` +
          `This load test is for localhost or staging only. ` +
          `If you REALLY mean it, set ALLOW_PROD=1 — but you almost certainly do not.`
      );
    }
  }
}

// --- Test options -----------------------------------------------------------

export const options = {
  // Ramping virtual users: warm up, hold, cool down.
  stages: [
    { duration: "30s", target: 50 }, // ramp 0 -> 50 VUs
    { duration: "1m", target: 50 }, // hold at 50 VUs
    { duration: "30s", target: 0 }, // ramp down to 0
  ],
  thresholds: {
    // 95th-percentile latency budget across all requests.
    http_req_duration: ["p(95)<800"],
    // Overall error budget: fewer than 2% failed requests.
    http_req_failed: ["rate<0.02"],
    // Per-endpoint latency budgets (tagged via the `name` below).
    "http_req_duration{name:landing}": ["p(95)<800"],
    "http_req_duration{name:courses_list}": ["p(95)<1000"],
    "http_req_duration{name:course_detail}": ["p(95)<1200"],
    "http_req_duration{name:leaderboard_api}": ["p(95)<600"],
    "http_req_duration{name:community}": ["p(95)<1000"],
    "http_req_duration{name:sitemap}": ["p(95)<800"],
  },
};

// --- Setup: discover a real course slug from the public sitemap -------------

export function setup() {
  let courseSlug = FALLBACK_COURSE_SLUG;

  const res = http.get(`${BASE_URL}/sitemap.xml`, {
    tags: { name: "sitemap_setup" },
  });

  if (res.status === 200 && typeof res.body === "string") {
    // Sitemap entries look like: .../<locale>/courses/<slug>
    const re = new RegExp(`/${LOCALE}/courses/([^<\\s/]+)`);
    const match = re.exec(res.body);
    if (match && match[1]) {
      courseSlug = match[1];
    }
  }

  return { courseSlug };
}

// --- GET helper (read-only) -------------------------------------------------

function getPath(path, name) {
  const res = http.get(`${BASE_URL}${path}`, { tags: { name } });
  check(res, {
    [`${name}: status is 2xx/3xx`]: (r) => r.status >= 200 && r.status < 400,
  });
  return res;
}

// --- Main VU flow (public reads only) ---------------------------------------

export default function (data) {
  group("landing", () => {
    getPath(`/${LOCALE}`, "landing");
  });
  sleep(1);

  group("courses list", () => {
    getPath(`/${LOCALE}/courses`, "courses_list");
  });
  sleep(1);

  group("course detail", () => {
    if (data && data.courseSlug) {
      getPath(`/${LOCALE}/courses/${data.courseSlug}`, "course_detail");
    }
  });
  sleep(1);

  group("leaderboard api", () => {
    getPath(`/api/leaderboard?timeframe=weekly`, "leaderboard_api");
  });
  sleep(1);

  group("community", () => {
    getPath(`/${LOCALE}/community`, "community");
  });
  sleep(1);

  group("sitemap", () => {
    getPath(`/sitemap.xml`, "sitemap");
  });
  sleep(1);
}
