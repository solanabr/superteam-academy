import { join } from "node:path";
import { test, expect, type Page } from "@playwright/test";
import { CODE_LESSON } from "./harness/targets";

const MONACO_MIN = join(__dirname, "../node_modules/monaco-editor/min");
const CDN_MONACO =
  /^https:\/\/cdn\.jsdelivr\.net\/npm\/monaco-editor@[^/]+\/min\//;

// Everything under cdn.jsdelivr.net is answered locally: Monaco from
// node_modules, anything else with a stub that would flag itself if it ran.
async function serveCdnLocally(page: Page) {
  await page.route("https://cdn.jsdelivr.net/**", (route) => {
    const url = route.request().url();
    const headers = { "access-control-allow-origin": "*" };
    if (!CDN_MONACO.test(url)) {
      return route.fulfill({
        headers,
        contentType: "text/javascript",
        body: "window.__foreignScriptRan = true;",
      });
    }
    return route.fulfill({
      headers,
      path: join(MONACO_MIN, url.replace(CDN_MONACO, "")),
    });
  });
}

async function collectViolations(page: Page) {
  await page.addInitScript(() => {
    const seen: string[] = [];
    Object.assign(window, { __cspViolations: seen });
    document.addEventListener("securitypolicyviolation", (event) => {
      seen.push(`${event.effectiveDirective} ${event.blockedURI}`);
    });
  });
}

const violations = (page: Page) =>
  page.evaluate(
    () => (window as unknown as { __cspViolations: string[] }).__cspViolations
  );

async function openCodeLesson(page: Page) {
  await serveCdnLocally(page);
  await collectViolations(page);
  await page.goto(
    `/en/courses/${CODE_LESSON.courseSlug}/lessons/${CODE_LESSON.lessonSlug}`
  );
  const monaco = page
    .getByRole("group", { name: "Code editor" })
    .first()
    .locator(".monaco-editor");
  await expect(monaco).toBeAttached({ timeout: 20_000 });
  return monaco;
}

const loadScript = (page: Page, src: string) =>
  page.evaluate(
    (url) =>
      new Promise<string>((resolve) => {
        const script = document.createElement("script");
        script.src = url;
        script.onload = () => resolve("loaded");
        script.onerror = () => resolve("blocked");
        document.head.append(script);
      }),
    src
  );

test("Monaco loads under the page CSP without a violation", async ({
  page,
}) => {
  const monaco = await openCodeLesson(page);

  await monaco.locator(".view-lines").click();
  await page.keyboard.press("Control+Home");
  await page.keyboard.type("// typed-under-csp");

  await expect(monaco.locator(".view-lines")).toContainText("typed-under-csp");
  expect(await violations(page)).toEqual([]);
});

test("the page CSP refuses other jsdelivr scripts", async ({ page }) => {
  await openCodeLesson(page);

  for (const src of [
    "https://cdn.jsdelivr.net/npm/other-package@1.0.0/index.js",
    "https://cdn.jsdelivr.net/gh/someone/repo@main/index.js",
  ]) {
    expect(await loadScript(page, src), src).toBe("blocked");
  }

  expect(
    await page.evaluate(
      () => "__foreignScriptRan" in (window as unknown as object)
    )
  ).toBe(false);
  expect(await violations(page)).toContain(
    "script-src-elem https://cdn.jsdelivr.net/npm/other-package@1.0.0/index.js"
  );
});
