// Deterministic E2E fixtures — the single source of truth shared by the mock
// Supabase server (harness) and the specs. Plain `.mjs` with no imports so both
// the Node harness and the Playwright specs (via a thin re-export) can read it.
//
// Everything here is fake by construction: no real keys, no real wallet, no real
// JWT. The learner "session" is a locally-minted cookie the specs attach; the
// mock server signs nothing and verifies nothing. See e2e/README.md.

// One port pair so the build-time-inlined NEXT_PUBLIC_SUPABASE_URL and the runtime
// server agree. 54329 for the mock, 3100 for the app under `next start`. The env
// overrides let two worktrees run the harness at once.
export const MOCK_PORT = Number(process.env.E2E_MOCK_PORT ?? 54329);
export const APP_PORT = Number(process.env.E2E_APP_PORT ?? 3100);
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
// the active one and the next bundle course is the deactivated one. Both skip
// `unlisted` courses: the catalog hides those anyway, so an unlisted active
// course could never be listed, and an unlisted deactivated one would be absent
// for the wrong reason. The answer key comes off the same bundle, so the loop
// answers correctly and keeps testing the graded path.
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

// Layout targets pick the worst case, so the check fails on the content that
// breaks a phone, and they stay independent: the inline-code lesson has no table,
// so a table fix can't turn that check green.
// In characters, roughly what overflows the widest phone the spec checks (430px).
// A smaller target would fit, and the check would pass without testing anything.
const LONG_TOKEN = 50;
const WIDE_TABLE = 50;
const TABLE = /(?:^\s*\|.*\|\s*$\n?)+/gm;
const proseOf = (lesson) =>
  lesson.blocks
    .filter((b) => b._type === "prose")
    .map((b) => b.src)
    .join("\n");
// What a table can't shrink below: the longest word of each column, summed.
const tableMinWidth = (lesson) =>
  Math.max(
    0,
    ...(proseOf(lesson).match(TABLE) ?? []).map((table) => {
      const columns = [];
      for (const row of table.trim().split("\n")) {
        row
          .split("|")
          .slice(1, -1)
          .forEach((cell, i) => {
            const longest = Math.max(
              ...cell
                .trim()
                .split(/\s+/)
                .map((word) => word.length)
            );
            columns[i] = Math.max(columns[i] ?? 0, longest);
          });
      }
      return columns.reduce((sum, width) => sum + width, 0);
    })
  );
const longestInlineToken = (lesson) =>
  Math.max(
    0,
    ...[
      ...proseOf(lesson)
        .replace(/```[\s\S]*?```/g, "")
        .matchAll(/`([^`\s]+)`/g),
    ].map((m) => m[1].length)
  );
const worst = (entries, score) =>
  entries.reduce(
    (best, entry) => (score(entry) > score(best) ? entry : best),
    entries[0]
  );
const wrongAnswerOf = (quiz) => {
  const [question] = quiz.questions;
  return [question.id, question.options.find((o) => !o.correct).id];
};
const lessonRef = (entry) =>
  entry
    ? {
        courseSlug: entry.course.slug.current,
        lessonSlug: entry.lesson.slug.current,
      }
    : null;

export function pickTargets(bundleCourses, lessons) {
  const courses = bundleCourses.filter((c) => c.unlisted !== true);
  const lessonsById = new Map(lessons.map((l) => [l._id, l]));
  const courseLessons = courses.flatMap((course) =>
    course.modules.flatMap((m) =>
      m.lessons.map((ref) => ({ course, lesson: lessonsById.get(ref._ref) }))
    )
  );
  const loop = courseLessons.find(({ lesson }) => quizOnly(lesson));
  if (!loop) throw new Error("e2e: no quiz-only lesson in the bundle");
  const deactivated = courses.find((c) => c._id !== loop.course._id);
  if (!deactivated) {
    throw new Error("e2e: the bundle needs a second listed course");
  }
  // The editor-layout target: a code lesson in a course that isn't the
  // deactivated one, which would 404. It may share the learn-loop course.
  const code = courseLessons.find(
    ({ course, lesson }) =>
      course._id !== deactivated._id &&
      lesson?.blocks?.some((b) => b._type === "code")
  );
  if (!code) throw new Error("e2e: no code lesson in the bundle");

  const reachable = courseLessons.filter(
    ({ course, lesson }) => course._id !== deactivated._id && lesson
  );
  const codeBlocks = ({ lesson }) =>
    lesson.blocks.filter((b) => b._type === "code").length;
  const reading = reachable.filter((entry) => codeBlocks(entry) === 0);
  const table = worst(
    reading.filter(({ lesson }) => tableMinWidth(lesson) >= WIDE_TABLE),
    ({ lesson }) => tableMinWidth(lesson)
  );
  const inlineCode = worst(
    reading.filter(
      ({ lesson }) =>
        tableMinWidth(lesson) === 0 && longestInlineToken(lesson) >= LONG_TOKEN
    ),
    ({ lesson }) => longestInlineToken(lesson)
  );
  const steppedQuizOf = (lesson) =>
    lesson.blocks.find((b) => b._type === "quiz" && b.questions.length > 1);
  const steppedQuiz = reading.find(({ lesson }) => steppedQuizOf(lesson));
  // One code block fills the viewport; two scroll. The quiz in the single-block
  // lesson is what used to escape its pane.
  const singleCode = reachable.find(
    (entry) =>
      codeBlocks(entry) === 1 &&
      entry.lesson.blocks.some((b) => b._type === "quiz")
  );
  const twoCode = reachable.find((entry) => codeBlocks(entry) > 1);
  const active = [
    ...new Set([
      loop.course,
      code.course,
      ...[table, inlineCode, steppedQuiz, singleCode, twoCode].flatMap(
        (entry) => (entry ? [entry.course] : [])
      ),
    ]),
  ];

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
      ...active.map((course) => ({
        content_id: course._id,
        kind: "course",
        status: "synced",
        is_active: true,
        achievement_pda: null,
      })),
      {
        content_id: deactivated._id,
        kind: "course",
        status: "synced",
        is_active: false,
        achievement_pda: null,
      },
    ],
    ACTIVE_COURSE_SLUGS: active.map((course) => course.slug.current),
    DEACTIVATED_COURSE_SLUG: deactivated.slug.current,
    // The editor-layout target (mobile-editor.spec.ts).
    CODE_LESSON: {
      courseSlug: code.course.slug.current,
      lessonSlug: code.lesson.slug.current,
    },
    // The layout targets (layout-overflow.spec.ts). Null when the bundle has no
    // such lesson, so a small fixture bundle doesn't have to carry every shape.
    LAYOUT_LESSONS: {
      table: lessonRef(table),
      inlineCode: lessonRef(inlineCode),
      steppedQuiz: steppedQuiz && {
        ...lessonRef(steppedQuiz),
        wrongAnswer: wrongAnswerOf(steppedQuizOf(steppedQuiz.lesson)),
      },
      singleCode: lessonRef(singleCode),
      twoCode: lessonRef(twoCode),
    },
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
