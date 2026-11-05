import { test, expect, type Page } from "@playwright/test";

// The bottom nav is position:fixed and /start is a marketing route, so the page
// has to reserve its own space for it. Without that, a tap on the last control
// opened Community instead. Measured at full scroll because that is the best a
// learner can do; centring the control first hides the bug.
const PHONES = [
  { width: 320, height: 568 },
  { width: 360, height: 640 },
  { width: 360, height: 800 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  // Landscape is past `sm`, so it also covers the larger padding step.
  { width: 844, height: 390 },
];

async function lastControlAtFullScroll(page: Page) {
  return page.evaluate(() => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "instant",
    });
    const nav = document.querySelector("nav.mobile-bottom-nav");
    const flow = [...document.querySelectorAll("main")].at(-1);
    // Lowest on screen, not last in the DOM: screen 3 reverses its buttons.
    const last = [...(flow?.querySelectorAll("button, a") ?? [])]
      .sort(
        (a, b) =>
          a.getBoundingClientRect().bottom - b.getBoundingClientRect().bottom
      )
      .at(-1);
    if (!nav || !last) return null;
    const rect = last.getBoundingClientRect();
    const hit = document.elementFromPoint(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2
    );
    return {
      bottom: rect.bottom,
      navTop: nav.getBoundingClientRect().top,
      tappable: !!hit && last.contains(hit),
    };
  });
}

async function expectLastControlClearOfNav(page: Page, screen: string) {
  const control = await lastControlAtFullScroll(page);
  expect(control, `${screen}: nav and control should render`).not.toBeNull();
  expect(control!.tappable, `${screen}: a tap should reach the control`).toBe(
    true
  );
  expect(
    control!.bottom,
    `${screen}: nothing under the nav`
  ).toBeLessThanOrEqual(control!.navTop);
}

test.describe("/start clears the bottom nav", () => {
  for (const viewport of PHONES) {
    for (const locale of ["en", "pt-BR", "es"]) {
      test.describe(() => {
        test.use({ viewport });

        test(`${viewport.width}x${viewport.height} ${locale}`, async ({
          page,
        }) => {
          await page.goto(`/${locale}/start`);
          // `.last()` is the intake's own <main>, inside the layout's.
          const flow = page.locator("main").last();
          const buttons = flow.locator("button");
          const notice = flow.locator("aside");

          await expect(buttons).toHaveCount(3);
          await expectLastControlClearOfNav(page, "experience");

          // "Haven't written code yet" adds the notice to every later screen,
          // the longest case. A click before hydration does nothing, so retry.
          await expect(async () => {
            if (!(await notice.isVisible())) await buttons.nth(2).click();
            await expect(notice).toBeVisible({ timeout: 1_000 });
          }).toPass();
          await expectLastControlClearOfNav(page, "notice");

          await buttons.last().click();
          await expect(page.getByRole("progressbar")).toHaveAttribute(
            "aria-valuenow",
            "3"
          );
          await expectLastControlClearOfNav(page, "interests");

          await buttons.last().click();
          await expect(page.getByRole("progressbar")).toHaveAttribute(
            "aria-valuenow",
            "4"
          );
          await expectLastControlClearOfNav(page, "final");
        });
      });
    }
  }

  test.describe(() => {
    test.use({ viewport: { width: 1024, height: 768 } });

    test("from lg up the nav is gone and so is the padding", async ({
      page,
    }) => {
      await page.goto("/en/start");
      await expect(page.locator("nav.mobile-bottom-nav")).toBeHidden();
      await expect(page.locator("main").last()).toHaveCSS(
        "padding-bottom",
        "48px"
      );
    });
  });
});
