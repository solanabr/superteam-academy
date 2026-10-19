// Deterministic E2E fixtures — the single source of truth shared by the mock
// Supabase server (harness) and the specs. Plain `.mjs` with no imports so both
// the Node harness and the Playwright specs (via a thin re-export) can read it.
//
// Everything here is fake by construction: no real keys, no real wallet, no real
// JWT. The learner "session" is a locally-minted cookie the specs attach; the
// mock server signs nothing and verifies nothing. See e2e/README.md.

// Fixed ports so the build-time-inlined NEXT_PUBLIC_SUPABASE_URL and the runtime
// server agree. 54329 for the mock, 3100 for the app under `next start`.
export const MOCK_PORT = 54329;
export const APP_PORT = 3100;
export const MOCK_SUPABASE_URL = `https://127.0.0.1:${MOCK_PORT}`;
export const APP_BASE_URL = `http://127.0.0.1:${APP_PORT}`;

// A shape-valid anon key. Not a JWT and not verified anywhere in the harness.
export const ANON_KEY = "e2e-anon-key-not-a-secret";

// The mocked learner. `id` is a fixed UUID; `walletAddress` only needs to be a
// non-empty string — it is read client-side to flip `hasLinkedWallet` true and
// is never parsed as a PublicKey (the on-chain seam is mocked at the route).
export const LEARNER = {
  id: "00000000-0000-0000-0000-0000000000e2",
  email: "e2e-learner@example.com",
  username: "e2e-learner",
  walletAddress: "E2ELearnerWa11etAddreSSxxxxxxxxxxxxxxxxxxxxxx",
};

// ── Targets, picked from the committed bundle ───────────────────────────────
// The specs run against whatever content.lock pins, so they never name a course
// or lesson. `pickTargets` is pure (this file stays import-free); the mock and
// the specs each read the bundle and call it, so both sides agree.
//
// The learn-loop target is the first lesson (bundle course order, then module
// order) the loop can finish by answering one quiz: prose plus exactly one quiz
// of single-answer questions, nothing else that gates completion. Its course is
// the active one and the next bundle course is the deactivated one. The answer
// key comes off the same bundle, so the loop answers correctly and keeps testing
// the graded path.
function quizOnly(lesson) {
  const blocks = lesson?.blocks ?? [];
  const quizzes = blocks.filter((b) => b._type === "quiz");
  return (
    quizzes.length === 1 &&
    blocks.every((b) => b._type === "prose" || b._type === "quiz") &&
    quizzes[0].questions.every(
      (q) => !q.multiSelect && q.options.filter((o) => o.correct).length === 1
    )
  );
}

export function pickTargets(courses, lessons) {
  const lessonsById = new Map(lessons.map((l) => [l._id, l]));
  const loop = courses
    .flatMap((course) =>
      course.modules.flatMap((m) =>
        m.lessons.map((ref) => ({ course, lesson: lessonsById.get(ref._ref) }))
      )
    )
    .find(({ lesson }) => quizOnly(lesson));
  if (!loop) throw new Error("e2e: no quiz-only lesson in the bundle");
  const deactivated = courses.find((c) => c._id !== loop.course._id);
  if (!deactivated) throw new Error("e2e: the bundle needs a second course");

  return {
    // The catalog gate (#711 regression, spec 2). Rows shaped like the
    // `public_onchain_deployments` view. `isSynced` (lib/content/deployments.ts)
    // makes a course visible iff status === "synced" AND is_active !== false:
    //   • synced + active           → PRESENT in /courses
    //   • synced + is_active:false  → ABSENT  (a DEACTIVATED course — the #711 leak)
    //   • no row                    → ABSENT  (fail-closed)
    // One of each keeps the spec's two-directional assertion, and both are real
    // bundle courses, so neither side can pass because the id does not exist.
    DEPLOYMENTS: [
      {
        content_id: loop.course._id,
        kind: "course",
        status: "synced",
        is_active: true,
        achievement_pda: null,
      },
      {
        content_id: deactivated._id,
        kind: "course",
        status: "synced",
        is_active: false,
        achievement_pda: null,
      },
    ],
    ACTIVE_COURSE_SLUGS: [loop.course.slug.current],
    DEACTIVATED_COURSE_SLUG: deactivated.slug.current,
    // The learn-loop target (specs 1 and 4).
    LEARN_LOOP: {
      courseId: loop.course._id,
      courseSlug: loop.course.slug.current,
      lessonId: loop.lesson._id,
      lessonSlug: loop.lesson.slug.current,
      lessonTitle: loop.lesson.title,
      answers: loop.lesson.blocks
        .find((b) => b._type === "quiz")
        .questions.map((q) => [q.id, q.options.find((o) => o.correct).id]),
    },
  };
}
