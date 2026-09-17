import { test, expect } from "@playwright/test";
import messages from "../src/messages/en.json";
import { signInAsLearner } from "./harness/session";
import { LEARN_LOOP } from "./harness/fixtures.mjs";

// Spec 4 — The O-4 journey (#819), as it stands after the quiz enrollment gate
// (#1240): anonymous deep-link → the graded surface is GATED → banked work
// still survives the sign-in wall and replays with `replay: true`.
//
// ── What changed, and why this spec was reshaped ──────────────────────────────
// The O-4 funnel used to let an anonymous visitor answer a QUIZ, bank the
// selections, and replay them after signing in. The enrollment gate (#1240)
// closes that specific door on purpose: a quiz now sits behind a blur + Enroll
// overlay for anyone not enrolled, so there is no anonymous quiz interaction
// left to drive — which is exactly the pointer-interception the pre-gate version
// of this spec started failing on. The gate is the intended behaviour, so the
// spec now asserts it (test 1) instead of fighting it.
//
// The banking→replay PLUMBING is untouched and still launch-critical, so it
// keeps its coverage (test 2). The anonymous-capture path that remains open is
// the CHALLENGE (code) block — its "tests passed → enroll" overlay still lets a
// signed-out visitor do the work first (challenge-interface.tsx, unchanged).
// There is no code-block e2e harness yet (no spec drives Monaco), so test 2
// SEEDS the bank the way a challenge would have populated it, then proves the
// half this spec uniquely owns: session-present → BankedProgressReplay fires a
// `replay: true` completion with the banked proofs → the bank clears (the
// durable "recorded" signal). The progress-restored TOAST is not asserted here
// — it is a 5s-lived node, racy to catch in a browser, and its whole
// outcome→toast mapping is now pinned deterministically in
// components/lessons/__tests__/banked-progress-replay.test.tsx. The
// bank-CAPTURE-via-real-interaction leg now belongs to a future challenge
// harness; the server's replay exemption stays covered at the integration layer
// (app/api/lessons/complete/__tests__/{gate,o4-replay-exemption}.test.ts).

const BANK_KEY = "superteam:progress-bank:v1";

const { quizEnrollTitle } = messages.lesson;
const { enrollNow } = messages.courses;

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

const lessonPath = `/en/courses/${LEARN_LOOP.courseSlug}/lessons/${LEARN_LOOP.lessonSlug}`;

test.describe("O-4 journey (anonymous gate → sign in → banked replay)", () => {
  test("an anonymous visitor meets the enrollment gate — the quiz is not workable while signed out", async ({
    page,
  }) => {
    // Any completion POST while anonymous is a bug: capture the seam so an
    // unexpected call is caught rather than silently swallowed.
    const completionBodies: unknown[] = [];
    await page.route("**/api/lessons/complete", async (route) => {
      completionBodies.push(route.request().postDataJSON());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    // Cold, signed-out visitor landing mid-course from a share/deep-link — the
    // O-4 entry condition. The route is public, so the page renders.
    await page.goto(lessonPath);

    // The quiz is present but GATED: the enroll overlay names itself and carries
    // the one action a signed-out visitor has here.
    await expect(page.getByText(quizEnrollTitle)).toBeVisible();
    await expect(page.getByRole("button", { name: enrollNow })).toBeVisible();

    // The gated quiz is display-only: aria-hidden lifts its own controls out of
    // the accessibility tree, so the quiz's "Check answer" button — reachable in
    // the pre-gate flow — is not an accessible button at all. This is the same
    // guarantee the unit test pins, asserted here against the real rendered page.
    await expect(
      page.getByRole("button", { name: messages.lesson.quizCheck })
    ).toHaveCount(0);

    // The quiz is still in the DOM (the visitor sees its shape through the
    // blur) but lives inside the aria-hidden, inert subtree — so its question
    // inputs are present yet walled off, not removed. Assert both: the options
    // exist, and they sit under the aria-hidden gate wrapper.
    const [firstQuestionId] = LEARN_LOOP.answers[0]!;
    const gatedGroup = page.locator(
      `div[aria-hidden="true"] input[name="${firstQuestionId}"]`
    );
    await expect(gatedGroup.first()).toBeAttached();

    // Nothing was completed: an anonymous visitor cannot reach the graded path.
    expect(completionBodies).toHaveLength(0);
  });

  test("banked work survives the sign-in wall and replays with replay:true", async ({
    page,
    context,
  }) => {
    // Own the browser↔route seam for the whole test. The only completion POST we
    // expect is the replay after sign-in; capture every body and fulfil the
    // success the route would return once the on-chain tx lands.
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

    // ── 1. Anonymous visitor on the lesson (gated), with work banked from the
    //    still-open capture path ────────────────────────────────────────────
    // Seed the bank the way a signed-out CHALLENGE completion would have (the
    // anonymous path the gate leaves open): the exact `proofs` payload the live
    // POST would carry, framed as "saved on this device" until sign-in. The
    // proofs are opaque to the replay — it forwards them verbatim and the server
    // re-grades — so a synthetic-but-well-formed entry exercises the plumbing
    // faithfully. Set on the real origin so it is the real localStorage the
    // replay reads.
    await page.goto(lessonPath);
    const bankedProofs = {
      "challenge-block": { code: "// banked while anon" },
    };
    await page.evaluate(
      ({ key, entry }) => {
        window.localStorage.setItem(key, JSON.stringify([entry]));
      },
      {
        key: BANK_KEY,
        entry: {
          courseId: LEARN_LOOP.courseId,
          courseSlug: LEARN_LOOP.courseSlug,
          lessonId: LEARN_LOOP.lessonId,
          lessonSlug: LEARN_LOOP.lessonSlug,
          lessonTitle: "Hash everything",
          proofs: bankedProofs,
          bankedAt: Date.now(),
        },
      }
    );
    // Precondition: the work is banked and no completion has fired yet.
    expect((await readBank(page)) as BankedEntry[]).toHaveLength(1);
    expect(completionBodies).toHaveLength(0);

    // ── 2. Sign in ───────────────────────────────────────────────────────────
    // The harness has no real OAuth/SIWS provider (README: no real keys/JWT/
    // wallet), so — as every authed spec does — mint the @supabase/ssr session
    // cookie the OAuth callback would have left, then reload into the lesson (the
    // callback's own redirect target). localStorage (the bank) survives the
    // reload; the session now exists, so the globally-mounted
    // BankedProgressReplay fires.
    await signInAsLearner(context);

    // Arm the assertion BEFORE the reload that triggers the replay.
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

    // ── 3. The replay fires with `replay: true` and the banked work ──────────
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
    // The replayed proofs are exactly what was banked — the server re-grades
    // what the learner produced, so replay grants nothing a live completion
    // wouldn't.
    expect(replayBody.proofs).toEqual(bankedProofs);

    // ── 4. Completion recorded → exactly one POST, and the bank is cleared ───
    // These are the DURABLE signals of a recorded completion and they never
    // revert, so they are what this spec asserts. The route handler pushes
    // asynchronously, so poll for the steady state.
    await expect.poll(() => completionBodies.length).toBe(1);
    expect(completionBodies[0]?.replay).toBe(true);

    // On the route's 200, replayBankedCompletions removed the entry — a success
    // never re-replays on the next sign-in. The cleared bank IS the "recorded"
    // signal; it is durable, unlike the progress-restored toast, which lives 5s
    // and is racy to catch in a browser. That toast — and the rest of the
    // outcome→toast mapping (needsEnroll, needsRedo) — is covered
    // deterministically in
    // components/lessons/__tests__/banked-progress-replay.test.tsx.
    await expect.poll(async () => (await readBank(page)).length).toBe(0);
  });
});
