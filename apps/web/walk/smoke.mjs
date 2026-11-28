// Check the running walk app in a headless browser. Also a template for a
// walk script: sign in, open a page, look at it.
//
// It checks that the test learner is signed in and enrolled on the pilot
// lesson, that the editor mounts, that a build goes through the stub and comes
// back with diagnostics, and that only the test admin passes the admin check.

import { chromium } from "@playwright/test";
import { APP_URL, PILOT, USERS, fail } from "./lib.mjs";
import { sessionCookies } from "./session.mjs";

// The first load compiles the page in `next dev`, which is slow on a busy machine.
const PAGE_TIMEOUT_MS = 5 * 60_000;
const LESSON_URL = `${APP_URL}/en/courses/${PILOT.courseSlug}/lessons/${PILOT.lessonSlug}`;

function ok(message) {
  console.log(`[walk] ok: ${message}`);
}

async function openAs(browser, role) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  await context.addCookies(await sessionCookies(role));
  const page = await context.newPage();
  page.setDefaultTimeout(PAGE_TIMEOUT_MS);
  return page;
}

async function checkLesson(browser) {
  const page = await openAs(browser, "learner");
  // The page reads the enrollment row with the learner's own session.
  const enrollmentRead = page.waitForResponse(
    (response) => response.url().includes("/rest/v1/enrollments"),
    { timeout: PAGE_TIMEOUT_MS }
  );
  const response = await page.goto(LESSON_URL, { timeout: PAGE_TIMEOUT_MS });
  if (response?.status() !== 200) {
    fail(`lesson page answered ${response?.status()}: is the app running?`);
  }

  await page
    .getByText(USERS.learner.username, { exact: true })
    .first()
    .waitFor();
  ok(`signed in as ${USERS.learner.username}`);

  const rows = await (await enrollmentRead).json().catch(() => null);
  if (!Array.isArray(rows) || !rows[0]?.id) {
    fail("the learner has no enrollment row for the course");
  }
  ok(`enrolled in ${PILOT.courseSlug}`);

  await page.locator(".monaco-editor").first().waitFor();
  ok("editor mounted");

  const buildAnswer = page.waitForResponse(
    (r) => r.url().endsWith("/api/build-program"),
    { timeout: PAGE_TIMEOUT_MS }
  );
  await page.getByRole("button", { name: "Build", exact: true }).click();
  const build = await (await buildAnswer).json().catch(() => null);
  if (!build || build.success !== false || !(build.diagnostics?.length > 0)) {
    fail(`build did not return diagnostics: ${JSON.stringify(build)}`);
  }
  await page.locator(".monaco-editor .squiggly-error").first().waitFor();
  ok(
    `build stub returned ${build.diagnostics.length} diagnostics, marked in the editor`
  );
  await page.context().close();
}

async function checkAdmin(browser) {
  const adminPage = await openAs(browser, "admin");
  const asAdmin = await adminPage.goto(`${APP_URL}/en/admin`);
  if (asAdmin?.status() !== 200) {
    fail(`/en/admin answered ${asAdmin?.status()} for the test admin`);
  }
  await adminPage.context().close();

  const learnerPage = await openAs(browser, "learner");
  const asLearner = await learnerPage.goto(`${APP_URL}/en/admin`);
  if (asLearner?.status() !== 404) {
    fail(
      `/en/admin answered ${asLearner?.status()} for the test learner, expected 404`
    );
  }
  await learnerPage.context().close();
  ok("admin check passes for the test admin only");
}

export async function smoke() {
  const browser = await chromium.launch();
  try {
    await checkLesson(browser);
    await checkAdmin(browser);
  } finally {
    await browser.close();
  }
}
