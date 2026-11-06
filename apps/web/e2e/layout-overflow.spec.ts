import { test, expect, type Locator, type Page } from "@playwright/test";
import ptBR from "../src/messages/pt-BR.json";
import en from "../src/messages/en.json";
import es from "../src/messages/es.json";
import { serveMonacoLocally } from "./harness/monaco";
import { signInAsLearner } from "./harness/session";
import { LAYOUT_LESSONS } from "./harness/targets";

const MESSAGES = { "pt-BR": ptBR, en, es };
const LOCALES = ["pt-BR", "en", "es"] as const;
const { table, inlineCode, steppedQuiz, singleCode, twoCode } = LAYOUT_LESSONS;

const lessonPath = (
  locale: string,
  lesson: { courseSlug: string; lessonSlug: string } | null
) => {
  if (!lesson) throw new Error("e2e: the bundle lacks a layout target");
  return `/${locale}/courses/${lesson.courseSlug}/lessons/${lesson.lessonSlug}`;
};

// A session is only known once the client has read it, and the signed-in header
// is the wider one, so measure after this.
const signedInHeader = (page: Page) =>
  expect(
    page.locator("header").getByRole("button", { name: "e2e-learner" })
  ).toBeVisible();
const signedOutHeader = (page: Page, locale: keyof typeof MESSAGES) =>
  expect(
    page
      .locator("header")
      .getByRole("button", { name: MESSAGES[locale].common.signIn })
  ).toBeVisible();

/**
 * On a phone, content wider than the screen widens the layout viewport rather
 * than scrolling, so `innerWidth` has to be checked along with `scrollWidth`.
 */
async function expectNoSidewaysScroll(page: Page, width: number) {
  const measured = await page.evaluate(() => {
    window.scrollTo({ left: 200, behavior: "instant" });
    return {
      innerWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      scrollX: window.scrollX,
    };
  });
  expect(measured).toEqual({
    innerWidth: width,
    scrollWidth: width,
    scrollX: 0,
  });
}

/**
 * Does a tap anywhere on the control reach it? Checks its centre and just inside
 * each edge, so a neighbour over half of it counts. Measured at full scroll, the
 * furthest a learner can go; centring it first would hide a fixed bar over it. A
 * control the page has scrolled past comes back only as far as the sticky bars.
 */
async function expectTappableAtFullScroll(control: Locator, name: string) {
  const measured = await control.evaluate((el) => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "instant",
    });
    const barBottom = Math.max(
      ...[...document.querySelectorAll("header, [class*='sticky']")].map(
        (bar) => bar.getBoundingClientRect().bottom
      )
    );
    const top = el.getBoundingClientRect().top;
    if (top < barBottom) {
      window.scrollBy({ top: top - barBottom, behavior: "instant" });
    }
    const rect = el.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const points = {
      centre: [x, y],
      left: [rect.left + 2, y],
      right: [rect.right - 2, y],
      top: [x, rect.top + 2],
      bottom: [x, rect.bottom - 2],
    };
    return {
      covered: Object.entries(points)
        .filter(([, [px, py]]) => {
          const hit = document.elementFromPoint(px!, py!);
          return !hit || !el.contains(hit);
        })
        .map(([where]) => where),
      insideScreen: rect.left >= 0 && rect.right <= window.innerWidth,
    };
  });
  expect(measured, name).toEqual({ covered: [], insideScreen: true });
}

const PHONES = [
  { width: 320, height: 568 },
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
];

for (const viewport of PHONES) {
  test.describe(`${viewport.width}px`, () => {
    test.use({ viewport, isMobile: true, hasTouch: true });

    test("a wide table scrolls inside its own box", async ({ page }) => {
      await page.goto(lessonPath("pt-BR", table));
      await signedOutHeader(page, "pt-BR");
      await expect(page.locator(".prose table").first()).toBeVisible();
      await expectNoSidewaysScroll(page, viewport.width);
      const scroller = page.getByRole("region", {
        name: ptBR.lesson.tableScrollLabel,
      });
      expect(
        await scroller.first().evaluate((el) => {
          el.scrollLeft = 40;
          return el.scrollLeft;
        }),
        "the widest table should reach past the screen and scroll"
      ).toBeGreaterThan(0);
    });

    test("a long inline token wraps", async ({ page }) => {
      await page.goto(lessonPath("pt-BR", inlineCode));
      await signedOutHeader(page, "pt-BR");
      await expect(page.locator(".prose p code").first()).toBeVisible();
      await expectNoSidewaysScroll(page, viewport.width);
    });

    test("the catalog's filter rails stay on screen", async ({
      page,
      context,
    }) => {
      await signInAsLearner(context);
      await page.goto("/pt-BR/courses");
      await signedInHeader(page);
      // The status rail only exists signed in, which makes this the longest row.
      await expect(
        page.getByRole("group", { name: ptBR.courses.status })
      ).toBeVisible();
      await expectNoSidewaysScroll(page, viewport.width);
    });

    test("the dashboard fits", async ({ page, context }) => {
      await signInAsLearner(context);
      await page.goto("/pt-BR/dashboard");
      await signedInHeader(page);
      await expect(
        page.getByRole("link", { name: ptBR.dashboard.reviewNow })
      ).toBeVisible();
      await expectNoSidewaysScroll(page, viewport.width);
    });
  });
}

for (const width of [320, 390]) {
  test.describe(`a wrong answer at ${width}px`, () => {
    test.use({
      viewport: { width, height: 700 },
      isMobile: true,
      hasTouch: true,
    });

    // Spanish has the longest labels on these buttons.
    test("keeps the quiz's buttons on screen", async ({ page, context }) => {
      const copy = es.lesson;
      await signInAsLearner(context);
      await page.goto(lessonPath("es", steppedQuiz));
      await signedInHeader(page);
      const [questionId, optionId] = steppedQuiz!.wrongAnswer;
      await page
        .locator(`input[name="${questionId}"][value="${optionId}"]`)
        .check();
      await page.getByRole("button", { name: copy.quizCheck }).click();
      const next = page.getByRole("button", { name: copy.quizNext });
      await expect(next).toBeVisible();

      await expectNoSidewaysScroll(page, width);
      await expectTappableAtFullScroll(
        page.getByRole("button", { name: copy.quizCheck }),
        "check"
      );
      await expectTappableAtFullScroll(next, "next");

      // Previous is disabled on the first question, and a disabled button lets
      // a tap through, so measure it from the second.
      await next.click();
      await expectTappableAtFullScroll(
        page.getByRole("button", { name: copy.quizPrev }),
        "previous"
      );
    });
  });
}

/** Every header control, as drawn: none may sit on another or be covered. */
async function expectHeaderControlsApart(page: Page) {
  const controls = page
    .locator("header")
    .locator("a:visible, button:visible, .beta-tag:visible, .nav-pill:visible");
  const rects = await controls.evaluateAll((els) =>
    els.map((el) => {
      const { left, right } = el.getBoundingClientRect();
      const name =
        el.getAttribute("aria-label") ??
        el.querySelector("img")?.getAttribute("alt") ??
        el.textContent;
      return { left, right, name };
    })
  );
  expect(rects.length).toBeGreaterThan(2);
  const sorted = rects.sort((a, b) => a.left - b.left);
  for (const [i, rect] of sorted.slice(1).entries()) {
    const previous = sorted[i]!;
    expect(
      rect.left,
      `${rect.name} should clear ${previous.name}`
    ).toBeGreaterThanOrEqual(previous.right);
  }
  for (const control of await controls.all()) {
    await expectTappableAtFullScroll(
      control,
      (await control.getAttribute("aria-label")) ?? "control"
    );
  }
}

// Every width where a header rule changes, on both sides of it. Resizing one
// page instead of reopening it keeps this to one load per locale.
const HEADER_WIDTHS = [
  {
    isMobile: true,
    widths: [320, 340, 359, 360, 375, 390, 399, 400, 430, 639, 640, 768, 1023],
  },
  { isMobile: false, widths: [1024, 1279, 1280, 1399, 1400, 1440, 1920] },
];

async function atWidth(page: Page, width: number) {
  await page.setViewportSize({ width, height: 800 });
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(resolve))
  );
}

for (const { isMobile, widths } of HEADER_WIDTHS) {
  test.describe(`header from ${widths[0]}px to ${widths.at(-1)}px`, () => {
    test.use({
      viewport: { width: widths[0]!, height: 800 },
      isMobile,
      hasTouch: isMobile,
    });

    for (const locale of LOCALES) {
      test(`controls stay apart, signed out, ${locale}`, async ({ page }) => {
        await page.goto(`/${locale}/courses`);
        await signedOutHeader(page, locale);
        const themeToggle = page
          .locator("header")
          .getByRole("button", { name: MESSAGES[locale].a11y.toggleTheme });
        for (const width of widths) {
          await atWidth(page, width);
          await test.step(`${width}px`, async () => {
            await expectHeaderControlsApart(page);
            if (isMobile) await expectNoSidewaysScroll(page, width);
            // It only gives way to the one label too long to sit beside it.
            const givesWay =
              width < 360 && MESSAGES[locale].common.signIn.length > 8;
            await (givesWay
              ? expect(themeToggle).toBeHidden()
              : expect(themeToggle).toBeVisible());
          });
        }
      });

      test(`controls stay apart, signed in, ${locale}`, async ({
        page,
        context,
      }) => {
        await signInAsLearner(context);
        await page.goto(`/${locale}/courses`);
        await signedInHeader(page);
        // The chip starts at zero and fills in once the total arrives.
        if (!isMobile) {
          await expect(
            page.locator("header .nav-pill").locator(".nav-pill-num")
          ).toBeAttached();
        }
        for (const width of widths) {
          await atWidth(page, width);
          await test.step(`${width}px`, async () => {
            await expectHeaderControlsApart(page);
            if (isMobile) await expectNoSidewaysScroll(page, width);
          });
        }
      });
    }
  });
}

/** Past the gate, because the gate's own clip contains what this checks for. */
async function openEnrolledCodeLesson(
  page: Page,
  lesson: { courseSlug: string; lessonSlug: string } | null
) {
  await serveMonacoLocally(page);
  await page.goto(lessonPath("en", lesson));
  await signedInHeader(page);
  await expect(page.getByRole("radio").first()).toBeVisible();
  await expect(page.locator(".monaco-editor").first()).toBeAttached({
    timeout: 20_000,
  });
}

for (const viewport of [
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
]) {
  test.describe(`code lesson at ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });

    test("one code block fills the viewport and the page can't scroll", async ({
      page,
      context,
    }) => {
      await signInAsLearner(context);
      await openEnrolledCodeLesson(page, singleCode);
      const measured = await page.evaluate(() => {
        window.scrollTo({ top: 99_999, behavior: "instant" });
        return {
          documentHeight: document.documentElement.scrollHeight,
          scrollY: window.scrollY,
        };
      });
      expect(measured).toEqual({
        documentHeight: viewport.height,
        scrollY: 0,
      });
    });

    test("two code blocks scroll by exactly their own height", async ({
      page,
      context,
    }) => {
      await signInAsLearner(context);
      await openEnrolledCodeLesson(page, twoCode);
      const { documentHeight, sectionsBottom } = await page.evaluate(() => {
        const sections = [...document.querySelectorAll("[data-code-part]")];
        return {
          documentHeight: document.documentElement.scrollHeight,
          sectionsBottom:
            sections.at(-1)!.getBoundingClientRect().bottom + window.scrollY,
        };
      });
      expect(documentHeight).toBeGreaterThan(viewport.height);
      // The platform shell's padding is all that may follow the last editor.
      expect(documentHeight - sectionsBottom).toBeLessThanOrEqual(80);
    });
  });
}
