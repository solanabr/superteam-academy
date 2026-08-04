import { test, expect } from "@playwright/test";
import { signInAsLearner } from "./harness/session";
import { LEARN_LOOP } from "./harness/fixtures.mjs";
import { answerQuizStepper } from "./harness/quiz";

// Spec 4 — The O-4 journey (#819): anonymous deep-link → do the work → claim
// moment → sign in → banked progress replays and the completion is recorded.
//
// This is the launch-critical funnel (LX-A4c): a visitor who lands mid-lesson
// from a share/deep-link can do the graded work while signed OUT, and must never
// lose it at the sign-in wall. The work is banked in localStorage and replayed
// server-side the moment they have an account.
//
// ── What this spec drives END-TO-END (the real implementation, not a mock of
//    it) ──────────────────────────────────────────────────────────────────────
//   • Anonymous access to a lesson deep-link (the route is public — not in
//     middleware's protectedPaths).
//   • The real QuizBlock reports its proof upward via ctx.setProof on selection.
//   • The real anonymous claim path: lesson-client's "Sign In to Track Progress"
//     button → openClaimAuth → bankCurrentLesson writes the EXACT proofs the
//     completion POST would carry into localStorage under the real bank key.
//   • The real "Later" affordance (auth-modal showLater/onLater) — the escape
//     that dismisses WITHOUT discarding the banked work (F4).
//   • The real replay: on sign-in, the globally-mounted BankedProgressReplay
//     (GamificationOverlays) sees the bank and POSTs /api/lessons/complete with
//     `replay: true` and the banked proofs; on success it clears the bank and
//     surfaces the "progress restored" toast.
//
// ── Where a leg falls back, and why (documented per the #819 brief) ───────────
//   • SIGN-IN itself: the harness has no real OAuth/SIWS provider (README:
//     "no real keys, no real JWT, no real wallet"). Every other e2e spec that
//     needs an authed session mints the @supabase/ssr session cookie directly
//     (harness/session.signInAsLearner) — getSession() reads it locally with no
//     network. We do the same to model the post-OAuth return: the learner banks
//     while anonymous, then the session appears and the page reloads, exactly as
//     the OAuth callback redirect back into the lesson would leave things. The
//     transition we assert on is the one we CAN own end-to-end: bank-while-anon
//     → session-present → replay-fires-with-the-banked-work.
//   • The CHAIN/route seam: as in learn-loop.spec, Playwright owns the
//     browser↔route seam and fulfils POST /api/lessons/complete. So this spec
//     asserts the CLIENT emits a correct replay request (marker + banked
//     proofs) and honours the response (bank cleared, toast). Whether the SERVER
//     honours the `replay: true` marker — the #459 volume-gate exemption — runs
//     server-side and cannot be observed through this mocked seam; it is covered,
//     observably, at the integration layer in
//     app/api/lessons/complete/__tests__/{gate,o4-replay-exemption}.test.ts.
//     Together the two layers close the loop: client SENDS replay:true (here),
//     server EXEMPTS on replay:true (integration).

const BANK_KEY = "superteam:progress-bank:v1";

interface BankedEntry {
  courseId: string;
  lessonId: string;
  proofs: Record<string, unknown>;
}

const readBank = (page: import("@playwright/test").Page) =>
  page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as unknown[]) : [];
  }, BANK_KEY);

test.describe("O-4 journey (anonymous → sign in → banked replay)", () => {
  test("anonymous work banks, survives the sign-in wall, and replays with replay:true", async ({
    page,
    context,
  }) => {
    // Own the browser↔route seam for the WHOLE test. Nothing should POST here
    // while anonymous (the anon path banks locally, never calls the route); the
    // only completion POST is the replay after sign-in. Capture every body so an
    // unexpected anonymous POST would be caught, and fulfil the success the route
    // would return once the on-chain tx lands.
    const completionBodies: Array<{
      lessonId?: string;
      courseId?: string;
      replay?: boolean;
      proofs?: Record<string, unknown>;
    }> = [];
    await page.route("**/api/lessons/complete", async (route) => {
      completionBodies.push(route.request().postDataJSON());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          alreadyCompleted: false,
          signature: "e2e-mock-replay-signature",
        }),
      });
    });

    // ── 1. Anonymous deep-link into the flagship lesson ──────────────────────
    // No session cookie is attached — this is a cold, signed-out visitor landing
    // mid-course, the O-4 entry condition.
    await page.goto(
      `/en/courses/${LEARN_LOOP.courseSlug}/lessons/${LEARN_LOOP.lessonSlug}`
    );

    // ── 2. Do the graded work while signed out ───────────────────────────────
    // Answer the retrieval quiz with its real answer key and check each one,
    // exercising the real QuizBlock — since #849 a stepper: answer → check →
    // next, one question at a time. Selecting the options is what drives
    // ctx.setProof → the proofs the bank will carry.
    await answerQuizStepper(page, LEARN_LOOP.answers);

    // Nothing has hit the completion route yet — an anonymous learner cannot
    // complete on-chain; the work only lives locally at this point.
    expect(completionBodies).toHaveLength(0);

    // ── 3. Claim moment: "Sign In to Track Progress" banks, then prompts ──────
    // This is the anonymous CTA (lesson-client, userId falsy). Clicking it runs
    // bankCurrentLesson BEFORE opening the modal — the modal's Later escape
    // relies on the work already being saved.
    await page
      .getByRole("button", { name: "Sign In to Track Progress" })
      .click();

    // The claim-moment modal is open with its "keep your progress" framing.
    await expect(
      page.getByRole("heading", { name: "Save your progress" })
    ).toBeVisible();

    // ── 4. Assert the work is BANKED (the real key, the real proofs) ─────────
    const banked = (await readBank(page)) as BankedEntry[];
    expect(banked).toHaveLength(1);
    const entry = banked[0]!;
    expect(entry).toMatchObject({
      courseId: LEARN_LOOP.courseId,
      lessonId: LEARN_LOOP.lessonId,
    });
    // The banked proofs are the real quiz submission, not an empty placeholder:
    // the QuizBlock's proof is `{ selections: { q1: ["a"], … } }`, keyed by the
    // block key. Assert the shape survived into storage.
    const proofsJson = JSON.stringify(entry.proofs);
    expect(Object.keys(entry.proofs).length).toBeGreaterThan(0);
    expect(proofsJson).toContain("selections");
    expect(proofsJson).toContain("q1");

    // ── 5. The "Later" affordance is present and non-destructive ─────────────
    // F4: the escape never implies the work is lost — it reassures it is kept.
    const laterButton = page.getByRole("button", { name: "Later" });
    await expect(laterButton).toBeVisible();
    await expect(
      page.getByText("No rush — your progress stays saved on this device.")
    ).toBeVisible();

    // Take the Later escape (the learner defers sign-in) and confirm the bank is
    // UNTOUCHED — dismissing must not discard.
    await laterButton.click();
    await expect(laterButton).toBeHidden();
    expect(await readBank(page)).toHaveLength(1);

    // ── 6. Sign in ───────────────────────────────────────────────────────────
    // The learner comes back and authenticates. The harness cannot run real
    // OAuth, so we mint the session the OAuth callback would have left (see the
    // header note) and reload into the lesson — the callback's own redirect
    // target. localStorage (the bank) survives the reload; the session now
    // exists, so the globally-mounted BankedProgressReplay will fire.
    await signInAsLearner(context);

    // Arm the assertion BEFORE the reload that triggers the replay: wait for the
    // completion POST that carries the replay marker.
    const replayRequest = page.waitForRequest((req) => {
      if (!req.url().includes("/api/lessons/complete")) return false;
      if (req.method() !== "POST") return false;
      try {
        return req.postDataJSON()?.replay === true;
      } catch {
        return false;
      }
    });

    await page.reload();

    // ── 7. The replay fires with `replay: true` and the banked work ──────────
    const replay = await replayRequest;
    const replayBody = replay.postDataJSON() as {
      lessonId: string;
      courseId: string;
      replay: boolean;
      proofs: Record<string, unknown>;
    };
    expect(replayBody).toMatchObject({
      lessonId: LEARN_LOOP.lessonId,
      courseId: LEARN_LOOP.courseId,
      replay: true,
    });
    // The replayed proofs are the ones banked while anonymous — the server
    // re-grades exactly what the learner produced, so replay grants nothing a
    // live completion wouldn't.
    expect(JSON.stringify(replayBody.proofs)).toContain("selections");

    // Exactly one completion POST happened, and it was the replay (marked). The
    // route handler pushes asynchronously (it can lag the waitForRequest above,
    // which resolves at request ISSUANCE), so poll for it — the assertion is the
    // steady state, never a race on handler timing.
    await expect.poll(() => completionBodies.length).toBe(1);
    expect(completionBodies[0]?.replay).toBe(true);

    // ── 8. Completion recorded → bank cleared + progress-restored surfaced ────
    // On the route's 200, replayBankedCompletions removes the entry (a success
    // never re-replays) and BankedProgressReplay raises the restore toast. The
    // cleared bank is the durable "recorded" signal; the toast is the learner-
    // facing confirmation their earned progress (and its XP) landed.
    await expect.poll(async () => (await readBank(page)).length).toBe(0);
    await expect(page.getByText("Restored 1 completed lesson")).toBeVisible();
  });
});
