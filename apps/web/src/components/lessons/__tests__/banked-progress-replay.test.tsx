// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import type { BankedCompletion } from "@/lib/lessons/progress-bank";
import type { ReplayOutcome } from "@/lib/lessons/replay-banked";

/**
 * The banked-replay → toast mapping (#819). `replayBankedCompletions` returns a
 * per-entry outcome; this component turns those outcomes into the learner-facing
 * toasts. The mapping had no test — the O-4 e2e used to assert only the
 * `completed` toast, and does so no longer (the toast is a 5s-lived node that is
 * racy to catch in a browser; the e2e now asserts the durable replay POST + bank
 * clear instead). This pins every branch deterministically: the replay layer is
 * mocked to hand back a fixed outcome set, the REAL ToastContainer renders, and
 * we assert exactly which toasts surface.
 */

const replay = vi.hoisted(() => ({ fn: vi.fn() }));

vi.mock("@/lib/lessons/replay-banked", () => ({
  replayBankedCompletions: replay.fn,
}));
// The component early-returns unless the bank is non-empty; keep it non-empty so
// `run()` reaches the mocked replay.
vi.mock("@/lib/lessons/progress-bank", () => ({
  hasBankedCompletions: () => true,
}));
// A signed-in learner: the replay effect only runs once a userId exists.
vi.mock("@/lib/auth/auth-provider", () => ({
  useAuth: () => ({ userId: "learner-1" }),
}));

import { ToastContainer } from "@/components/ui/toast-container";
import { BankedProgressReplay } from "../banked-progress-replay";

const entry = (over: Partial<BankedCompletion> = {}): BankedCompletion => ({
  courseId: "course-1",
  courseSlug: "course",
  lessonId: "lesson-1",
  lessonSlug: "lesson",
  lessonTitle: "Hash everything",
  proofs: {},
  bankedAt: Date.now(),
  ...over,
});

function renderReplay(): ReturnType<typeof render> {
  const ui: ReactElement = (
    <NextIntlClientProvider locale="en" messages={messages}>
      <BankedProgressReplay />
      <ToastContainer />
    </NextIntlClientProvider>
  );
  return render(ui);
}

beforeEach(() => {
  replay.fn.mockReset();
});
afterEach(cleanup);

describe("BankedProgressReplay — outcomes become toasts", () => {
  it("a completed replay surfaces the progress-restored toast, pluralized by count", async () => {
    const outcomes: ReplayOutcome[] = [
      { entry: entry({ lessonId: "l1" }), status: "completed" },
      { entry: entry({ lessonId: "l2" }), status: "completed" },
    ];
    replay.fn.mockResolvedValue(outcomes);

    renderReplay();

    // "Restored 2 completed lessons" — the plural branch, count from the number
    // of completed outcomes (not the total).
    expect(
      await screen.findByText("Restored 2 completed lessons")
    ).toBeInTheDocument();
  });

  it("count is the completed subset only — a mixed batch does not inflate it", async () => {
    replay.fn.mockResolvedValue([
      { entry: entry({ lessonId: "l1" }), status: "completed" },
      { entry: entry({ lessonId: "l2" }), status: "needsEnroll" },
      { entry: entry({ lessonId: "l3" }), status: "retry" },
    ] satisfies ReplayOutcome[]);

    renderReplay();

    // One completed → singular; the needsEnroll entry gets its own info toast.
    expect(
      await screen.findByText("Restored 1 completed lesson")
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/Enroll to save the lesson you completed/)
    ).toBeInTheDocument();
  });

  it("a needsRedo outcome warns per lesson, by title", async () => {
    replay.fn.mockResolvedValue([
      { entry: entry({ lessonTitle: "Sign and verify" }), status: "needsRedo" },
    ] satisfies ReplayOutcome[]);

    renderReplay();

    // The warning names the lesson so the learner knows what to redo in-app.
    expect(await screen.findByText(/Sign and verify/)).toBeInTheDocument();
    // …and it is NOT announced as a restored completion.
    expect(screen.queryByText(/Restored/)).not.toBeInTheDocument();
  });

  it("an all-retry batch (network/5xx) surfaces no toast — it will retry silently", async () => {
    replay.fn.mockResolvedValue([
      { entry: entry(), status: "retry", reason: "network" },
    ] satisfies ReplayOutcome[]);

    renderReplay();

    // Give the async run() a tick to resolve, then assert nothing was shown.
    await Promise.resolve();
    expect(screen.queryByText(/Restored/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Enroll to save/)).not.toBeInTheDocument();
  });
});
