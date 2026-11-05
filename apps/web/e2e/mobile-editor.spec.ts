import { join } from "node:path";
import { test, expect, type Page } from "@playwright/test";
import { CODE_LESSON } from "./harness/targets";

// Below lg the editor's flex parent has no definite height, so a CSS regression
// here collapses Monaco to a few pixels and only a rendered page shows it.
const MIN_USABLE_HEIGHT = 300;

const MONACO_MIN = join(__dirname, "../node_modules/monaco-editor/min");

// Monaco's loader fetches from jsdelivr. Serve the same files from node_modules
// so a CDN outage can't fail this spec, and it can't skip either: every
// assertion below needs the mounted `.monaco-editor`, not the loading skeleton.
async function openCodeLesson(page: Page) {
  await page.route(
    /^https:\/\/cdn\.jsdelivr\.net\/npm\/monaco-editor@[^/]+\/min\//,
    (route) => {
      const path = new URL(route.request().url()).pathname.replace(
        /^\/npm\/monaco-editor@[^/]+\/min\//,
        ""
      );
      return route.fulfill({
        path: join(MONACO_MIN, path),
        headers: { "access-control-allow-origin": "*" },
      });
    }
  );
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

const VIEWPORTS = [
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
];

for (const viewport of VIEWPORTS) {
  test(`mounted editor is usable at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    const monaco = await openCodeLesson(page);
    await expect
      .poll(async () => (await monaco.boundingBox())?.height ?? 0)
      .toBeGreaterThan(MIN_USABLE_HEIGHT);
  });
}

test("a learner can type into the editor at 375px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const monaco = await openCodeLesson(page);

  await monaco.locator(".view-lines").click();
  await page.keyboard.press("Control+Home");
  await page.keyboard.type("// typed-at-375");

  await expect(monaco.locator(".view-lines")).toContainText("typed-at-375");
});

test("the go-to-editor link reaches the editor at 375px and is hidden at lg", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const monaco = await openCodeLesson(page);
  const link = page.getByRole("link", { name: "Go to editor" });

  await link.click();
  await expect(monaco).toBeInViewport();

  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(link).toBeHidden();
});
