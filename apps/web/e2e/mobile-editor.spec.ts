import { test, expect, type Page } from "@playwright/test";
import { serveMonacoLocally } from "./harness/monaco";
import { CODE_LESSON } from "./harness/targets";

// Below lg the editor's flex parent has no definite height, so a CSS regression
// here collapses Monaco to a few pixels and only a rendered page shows it.
const MIN_USABLE_HEIGHT = 250;

async function openCodeLesson(page: Page) {
  await serveMonacoLocally(page);
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

const monacoHeight = async (
  monaco: Awaited<ReturnType<typeof openCodeLesson>>
) => (await monaco.boundingBox())?.height ?? 0;

// The toolbar's first button, whatever the lesson's language calls it.
const runButton = (page: Page) =>
  page.getByRole("button", { name: /^(Run Code|Build)$/ });

// A failed run with test results switches the panel to its Test Cases tab.
const outputPanel = (page: Page) =>
  page.getByRole("tabpanel", { name: /^(Output|Test Cases)/ });

// Is the button the top element at its centre, or is something over it?
const isUncovered = (page: Page) =>
  runButton(page).evaluate((el) => {
    const r = el.getBoundingClientRect();
    return el.contains(
      document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
    );
  });

const VIEWPORTS = [
  { width: 375, height: 812 },
  { width: 667, height: 375 },
  { width: 844, height: 390 },
  { width: 768, height: 1024 },
  { width: 1023, height: 768 },
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
      .poll(() => monacoHeight(monaco))
      .toBeGreaterThan(MIN_USABLE_HEIGHT);
  });
}

test("the editor keeps a real height in a browser without svh", async ({
  page,
}) => {
  // Make `svh` unknown to the CSS parser, which is what an older browser sees:
  // declarations using it drop and `@supports (height: 1svh)` turns false.
  await page.route("**/_next/static/css/**", async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace(/(\d)svh/g, "$1nosvh");
    await route.fulfill({ response, body });
  });
  await page.setViewportSize({ width: 375, height: 812 });
  const monaco = await openCodeLesson(page);
  await expect
    .poll(() => monacoHeight(monaco))
    .toBeGreaterThan(MIN_USABLE_HEIGHT);
});

test("a learner can type into the editor at 375px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const monaco = await openCodeLesson(page);

  await monaco.locator(".view-lines").click();
  await page.keyboard.press("Control+Home");
  await page.keyboard.type("// typed-at-375");

  await expect(monaco.locator(".view-lines")).toContainText("typed-at-375");
});

for (const viewport of [
  { width: 375, height: 812 },
  { width: 1023, height: 768 },
]) {
  test(`the go-to-editor link lands the Run button below the sticky bar at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    const monaco = await openCodeLesson(page);

    await page.getByRole("link", { name: "Go to editor" }).click();

    await expect(monaco).toBeInViewport();
    await expect(runButton(page)).toBeInViewport({ ratio: 1 });
    await expect.poll(() => isUncovered(page)).toBe(true);
  });
}

test("the go-to-editor link is hidden at lg", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await openCodeLesson(page);
  await expect(page.getByRole("link", { name: "Go to editor" })).toBeHidden();
});

for (const viewport of [
  { width: 375, height: 812 },
  { width: 667, height: 375 },
  { width: 844, height: 390 },
]) {
  test(`Run brings the output into view at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    // The verdict doesn't matter here, only that a result arrives: a failed
    // request reports through the same output panel as a passing run.
    await page.route(/\/api\/(rust\/execute|build-program)/, (route) =>
      route.abort()
    );
    await page.setViewportSize(viewport);
    await openCodeLesson(page);

    await runButton(page).click();

    const output = outputPanel(page);
    await expect(output).not.toContainText("Run your code");
    await expect(output).toBeInViewport({ ratio: 0.95 });
  });
}

test("Run doesn't move the viewport-locked layout at 1440px", async ({
  page,
}) => {
  await page.route(/\/api\/(rust\/execute|build-program)/, (route) =>
    route.abort()
  );
  await page.setViewportSize({ width: 1440, height: 900 });
  const monaco = await openCodeLesson(page);
  const before = await monacoHeight(monaco);

  await runButton(page).click();

  const output = outputPanel(page);
  await expect(output).not.toContainText("Run your code");
  await expect(output).toBeInViewport({ ratio: 0.95 });
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  expect(await monacoHeight(monaco)).toBe(before);
});
