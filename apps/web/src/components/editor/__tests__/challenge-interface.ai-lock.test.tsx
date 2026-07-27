// @vitest-environment jsdom
// AI Partner think-first lock wiring (#770): ChallengeInterface computes the
// per-lesson unlock moment and hands it to the AiPartnerPane as `unlockAt`. The
// open timestamp is persisted in localStorage so a reload cannot reset the
// timer, already-complete lessons are exempt (unlockAt === null), and a stored
// timestamp in the FUTURE (clock skew / tampering) is clamped so the lock can
// never outlast the 3-minute window. The pane's rendering of the countdown is
// covered in ai-partner/__tests__/ai-partner-pane.test.tsx; here we assert the
// timestamp math + persistence by capturing the prop the pane receives.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import { ChallengeInterface } from "../challenge-interface";

const AI_LOCK_MS = 3 * 60 * 1000;

vi.mock("../code-editor", async () => {
  const { forwardRef } = await import("react");
  return {
    CodeEditor: forwardRef(function CodeEditorMock() {
      return null;
    }),
    resetEditorStorage: vi.fn(),
  };
});

vi.mock("../output-panel", () => ({ OutputPanel: () => null }));
vi.mock("../challenge-runner", () => ({ ChallengeRunner: () => null }));

// Capture the unlockAt the pane is handed, instead of rendering the real pane.
vi.mock("../ai-partner/ai-partner-pane", async () => {
  const { createElement } = await import("react");
  return {
    AiPartnerPane: (props: { unlockAt?: number | null }) =>
      createElement("div", {
        "data-testid": "ai-pane",
        "data-unlockat": String(props.unlockAt),
      }),
  };
});

beforeEach(() => {
  window.localStorage.clear();
  // Sentinel observer that intersects immediately so the AI pane mounts on
  // render (the reveal-on-scroll is not what these tests exercise).
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      readonly root = null;
      readonly rootMargin = "";
      readonly thresholds: readonly number[] = [];
      constructor(private readonly cb: IntersectionObserverCallback) {}
      observe(): void {
        this.cb(
          [{ isIntersecting: true } as IntersectionObserverEntry],
          this as unknown as IntersectionObserver
        );
      }
      unobserve(): void {}
      disconnect(): void {}
      takeRecords(): IntersectionObserverEntry[] {
        return [];
      }
    }
  );
});

const LESSON_ID = "lesson-1";
const STORAGE_KEY = `challenge:ai-open:${LESSON_ID}`;

function renderInterface(props: { isAlreadyCompleted?: boolean } = {}) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ChallengeInterface
        lessonId={LESSON_ID}
        courseSlug="course"
        lessonSlug="lesson"
        initialCode=""
        language="typescript"
        tests={[]}
        hints={[]}
        xpReward={30}
        {...props}
      />
    </NextIntlClientProvider>
  );
}

function readUnlockAt(): number | null {
  const raw = screen.getByTestId("ai-pane").getAttribute("data-unlockat");
  return raw === "null" ? null : Number(raw);
}

describe("ChallengeInterface — AI think-first lock (#770)", () => {
  it("locks a fresh challenge for 3 minutes and persists the open moment", () => {
    const before = Date.now();
    renderInterface();
    const after = Date.now();

    const unlockAt = readUnlockAt();
    expect(unlockAt).not.toBeNull();
    // Opened ~now, so it unlocks ~now + 3 min.
    expect(unlockAt).toBeGreaterThanOrEqual(before + AI_LOCK_MS);
    expect(unlockAt).toBeLessThanOrEqual(after + AI_LOCK_MS);

    // The open moment was written so a reload can recover it.
    const stored = Number(window.localStorage.getItem(STORAGE_KEY));
    expect(stored).toBeGreaterThanOrEqual(before);
    expect(stored).toBeLessThanOrEqual(after);
  });

  it("resumes from the stored open moment across a reload (no reset)", () => {
    // Simulate a reload one minute into the lock: the timer must continue from
    // the stored timestamp, not restart, so ~2 minutes remain.
    const openedAt = Date.now() - 60 * 1000;
    window.localStorage.setItem(STORAGE_KEY, String(openedAt));

    renderInterface();

    // Exactly stored + 3 min — proves the stored value drove the math.
    expect(readUnlockAt()).toBe(openedAt + AI_LOCK_MS);
    // Unchanged: a valid past timestamp is not rewritten.
    expect(Number(window.localStorage.getItem(STORAGE_KEY))).toBe(openedAt);
  });

  it("exempts an already-completed lesson (no lock)", () => {
    renderInterface({ isAlreadyCompleted: true });
    expect(readUnlockAt()).toBeNull();
  });

  it("clamps a future stored timestamp so the lock cannot outlast 3 minutes", () => {
    // A clock-skewed / tampered future value must not lock the tutor forever.
    const future = Date.now() + 10 * 60 * 1000;
    window.localStorage.setItem(STORAGE_KEY, String(future));

    const before = Date.now();
    renderInterface();
    const after = Date.now();

    const unlockAt = readUnlockAt();
    expect(unlockAt).not.toBeNull();
    // Capped at now + 3 min — never future + 3 min.
    expect(unlockAt).toBeLessThanOrEqual(after + AI_LOCK_MS);
    expect(unlockAt).toBeGreaterThanOrEqual(before + AI_LOCK_MS);
    expect(unlockAt).toBeLessThan(future);

    // The bogus future value is self-healed back to ~now.
    const stored = Number(window.localStorage.getItem(STORAGE_KEY));
    expect(stored).toBeLessThanOrEqual(after);
    expect(stored).toBeGreaterThanOrEqual(before);
  });
});
