import { test, expect } from "@playwright/test";
import { signInAsLearner } from "./harness/session";
import { LEARN_LOOP } from "./harness/fixtures.mjs";
import { answerQuizStepper } from "./harness/quiz";

// Spec 1 — Learn loop.
//
// Signed-in learner opens an enrolled course, works a quiz-only lesson
// (`lesson-bfsp-on-chain-state`, answer key: option "a" for every question),
// clicks Mark as Complete, and the UI reaches the completed state.
//
// Mock boundaries (see e2e/README.md for the full map):
//   • Session: a locally-minted Supabase cookie (no network, no secret).
//   • Supabase reads (profile/enrollment/progress): the mock server — the
//     learner is enrolled and has NOT completed this lesson.
//   • The on-chain send: mocked at the route boundary. Playwright owns the
//     browser↔route seam and fulfils POST /api/lessons/complete; the chain seam
//     inside the route is the unit suites' job (#751). This asserts the browser
//     posts the right body and renders completion on success.

test.describe("learn loop", () => {
  test("signed-in learner completes a quiz-only lesson and sees the completed state", async ({
    page,
    context,
  }) => {
    await signInAsLearner(context);

    // Own the browser↔route seam: capture the completion POST and return the
    // success the route would return once the on-chain tx lands.
    let completionBody: { lessonId?: string; courseId?: string } | null = null;
    await page.route("**/api/lessons/complete", async (route) => {
      completionBody = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          signature: "e2e-mock-signature",
        }),
      });
    });

    await page.goto(
      `/en/courses/${LEARN_LOOP.courseSlug}/lessons/${LEARN_LOOP.lessonSlug}`
    );

    // Work the retrieval quiz: option "a" is correct for every question. Grading
    // is server-side (mocked here); answering exercises the real quiz UI so the
    // "learn loop" is faithful, not a bare button click. Since #849 the quiz is
    // a stepper — answer → check → next, one question at a time.
    await answerQuizStepper(page, ["q1", "q2", "q3", "q4"]);

    // The complete button only renders for a signed-in, enrolled learner — its
    // presence is itself the "enrolled course" assertion. Auto-waits for the
    // enrollment effect to resolve against the mock.
    const completeButton = page.getByRole("button", {
      name: "Mark as Complete",
    });
    await expect(completeButton).toBeEnabled();
    await completeButton.click();

    // Completed state: the button flips to "Lesson Complete!". This is the
    // durable UI signal handleComplete sets on a successful POST.
    await expect(
      page.getByRole("button", { name: "Lesson Complete!" })
    ).toBeVisible();

    // And the browser sent the right request across the seam we own.
    expect(completionBody).toMatchObject({
      lessonId: LEARN_LOOP.lessonId,
      courseId: LEARN_LOOP.courseId,
    });
  });
});
