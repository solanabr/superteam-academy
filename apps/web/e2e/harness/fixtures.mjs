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

// ── The catalog gate fixture (#711 regression, spec 2) ──────────────────────
// Rows shaped like the `public_onchain_deployments` view. `isSynced` (one place,
// lib/content/deployments.ts) makes a course visible iff status === "synced" AND
// is_active !== false. So:
//   • synced + active           → PRESENT in /courses
//   • synced + is_active:false  → ABSENT  (a DEACTIVATED course — the #711 leak)
//   • no row                    → ABSENT  (fail-closed)
// content_id values are real bundle course ids; the catalog renders their slugs.
// The public-alpha bundle carries exactly 2 courses (the track-1 ladder is
// parked under `_draft/` in academy-courses), so the fixture is one of each
// bucket: the flagship synced+active, the speedrun synced+is_active:false. That
// is the minimum that keeps the spec's two-directional assertion — a present set
// AND a deactivated absentee — and both rows are real live bundle courses, so
// neither side can pass because the id simply does not exist. (Nothing filters
// the catalog by language, so the PT-BR speedrun is absent for the is_active
// reason and no other.)
export const DEPLOYMENTS = [
  {
    content_id: "course-btc-to-sol-evolution",
    kind: "course",
    status: "synced",
    is_active: true,
    achievement_pda: null,
  },
  // The deactivated course. Must NOT appear in the catalog — this row is the
  // permanent guard that a deactivated course can never leak back in. It is a
  // real live bundle course, gated out only by is_active:false.
  {
    content_id: "course-solana-speedrun",
    kind: "course",
    status: "synced",
    is_active: false,
    achievement_pda: null,
  },
];

// Slugs the specs assert on (kept next to the ids they map to, so a bundle rename
// is caught here rather than silently passing).
export const ACTIVE_COURSE_SLUGS = ["btc-to-sol-evolution"];
export const DEACTIVATED_COURSE_SLUG = "solana-speedrun";

// The learn-loop target (specs 1 and 4): a quiz-only lesson (prose + quiz, no
// code block) in the active flagship. `answers` is the real answer key read off
// the compiled bundle — the correct option differs per question, so the stepper
// helper takes the pairs rather than one option letter for the whole quiz.
export const LEARN_LOOP = {
  courseId: "course-btc-to-sol-evolution",
  courseSlug: "btc-to-sol-evolution",
  lessonId: "lesson-b2s-hash-everything",
  lessonSlug: "hash-everything",
  answers: [
    ["q1", "b"],
    ["q2", "a"],
    ["q3", "c"],
  ],
};
