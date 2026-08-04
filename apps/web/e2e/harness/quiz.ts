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
 *
 * `answers` is [questionId, optionId] pairs in the quiz's own order. Per-question
 * rather than one option letter for the whole quiz: real authored quizzes vary
 * which option is correct, and answering CORRECTLY is what keeps the loop
 * faithful — a wrong-but-checked answer would still flip the gate and quietly
 * stop testing the graded path.
 */
export async function answerQuizStepper(
  page: Page,
  answers: ReadonlyArray<readonly [string, string]>
): Promise<void> {
  for (let i = 0; i < answers.length; i++) {
    const [questionId, optionId] = answers[i]!;
    await page
      .locator(`input[name="${questionId}"][value="${optionId}"]`)
      .check();
    await page.getByRole("button", { name: quizCheck }).click();
    if (i < answers.length - 1) {
      await page.getByRole("button", { name: quizNext }).click();
    }
  }
}
