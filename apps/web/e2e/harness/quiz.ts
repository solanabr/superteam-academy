import type { Page } from "@playwright/test";
// Accessible names come from the real locale bundle — the specs must track the
// i18n keys (lesson.quizCheck / lesson.quizNext), not drift on raw strings.
import messages from "../../src/messages/en.json";

const { quizCheck, quizNext } = messages.lesson;

/**
 * Work the quiz block the way a learner does since the stepper redesign
 * (#849): one question is mounted at a time, so for each question — select
 * the answer, click Check, then advance with Next (no Next after the last).
 * Exercises the real QuizBlock: selection drives ctx.setProof, Check drives
 * the per-question verdict, and checking every question flips the block's
 * answered gate.
 */
export async function answerQuizStepper(
  page: Page,
  questionIds: readonly string[],
  optionValue = "a"
): Promise<void> {
  for (let i = 0; i < questionIds.length; i++) {
    await page
      .locator(`input[name="${questionIds[i]}"][value="${optionValue}"]`)
      .check();
    await page.getByRole("button", { name: quizCheck }).click();
    if (i < questionIds.length - 1) {
      await page.getByRole("button", { name: quizNext }).click();
    }
  }
}
