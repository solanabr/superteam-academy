// @vitest-environment jsdom
import {
  describe,
  it,
  expect,
  vi,
  afterEach,
  beforeEach,
  beforeAll,
} from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { Lesson } from "@superteam-lms/types";
import messages from "@/messages/en.json";
import { LessonPageClient } from "../lesson-client";

vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));
vi.mock("@/lib/auth/auth-provider", () => ({
  useAuth: () => ({
    userId: "user-1",
    profile: { wallet_address: "wallet" },
    isLoading: false,
  }),
}));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: { id: "e" } }),
            eq: () => ({ maybeSingle: () => Promise.resolve({ data: null }) }),
          }),
        }),
      }),
    }),
  }),
}));
vi.mock("@/hooks/use-on-chain-enroll", () => ({
  useOnChainEnroll: () => ({
    isEnrolling: false,
    handleEnroll: vi.fn(),
    enrollError: null,
    reauthPrompt: null,
    isWalletResolving: false,
  }),
}));
vi.mock("@/components/community/thread-list", () => ({
  ThreadList: () => null,
}));
vi.mock("@/components/community/thread-composer", () => ({
  ThreadComposer: () => null,
}));
vi.mock("@/components/auth/auth-modal", () => ({
  AuthModal: ({ trigger }: { trigger?: React.ReactNode }) => <>{trigger}</>,
}));
vi.mock("@/components/wallet/linked-wallet-prompt", () => ({
  LinkedWalletPrompt: () => null,
}));
vi.mock("@/components/editor/code-editor", async () => {
  const React = await import("react");
  return {
    CodeEditor: React.forwardRef(function MockCodeEditor() {
      return React.createElement("textarea", { "data-testid": "editor" });
    }),
    resetEditorStorage: vi.fn(),
  };
});
vi.mock("@/components/editor/challenge-runner", async () => {
  const React = await import("react");
  return {
    ChallengeRunner: () =>
      React.createElement("div", { "data-testid": "runner" }),
  };
});
vi.mock("@/components/editor/ai-partner/ai-partner-pane", () => ({
  AiPartnerPane: () => null,
}));
vi.mock("@/components/editor/output-panel", () => ({
  OutputPanel: () => null,
}));
vi.mock("@/components/deploy/deploy-panel", () => ({
  DeployPanel: () => null,
}));

const lesson: Lesson = {
  _id: "lesson-1",
  title: "Your first Solana program",
  slug: "your-first-solana-program",
  blocks: [
    {
      _type: "code",
      key: "ping-program",
      language: "rust",
      buildType: "buildable",
      deployable: true,
      starter: "// starter",
      tests: [],
      hints: [],
    },
    {
      _type: "quiz",
      key: "check",
      questions: [
        {
          id: "q1",
          prompt: "What is a PDA?",
          multiSelect: false,
          options: [
            { id: "a", label: "A program-derived address", correct: true },
            { id: "b", label: "A private key", correct: false },
          ],
        },
      ],
    },
  ],
} as unknown as Lesson;

beforeAll(() => {
  class MockIntersectionObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  Object.defineProperty(globalThis, "IntersectionObserver", {
    writable: true,
    configurable: true,
    value: MockIntersectionObserver,
  });
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
});

// The quiz persists its answers per lesson+block, and a previous test's save
// effect can land after this clear — so wipe on both sides of every test.
beforeEach(() => {
  window.localStorage.clear();
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

function renderLesson() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <LessonPageClient
        lesson={lesson}
        allLessons={[
          { _id: "lesson-1", title: "L", slug: lesson.slug } as never,
        ]}
        locale="en"
        courseSlug="btc-to-sol-evolution"
        courseId="course-1"
        courseXpPerLesson={30}
      />
    </NextIntlClientProvider>
  );
}

function stubFetch() {
  const fetchMock = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          alreadyCompleted: false,
          signature: null,
        }),
    })
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function completionCall(
  fetchMock: ReturnType<typeof stubFetch>
): [string, RequestInit] | undefined {
  const calls = fetchMock.mock.calls as unknown as [string, RequestInit][];
  return calls.find(([url]) => url === "/api/lessons/complete");
}

async function answerTheQuiz() {
  await waitFor(() =>
    expect(screen.getByLabelText("A program-derived address")).toBeTruthy()
  );
  fireEvent.click(screen.getByLabelText("A program-derived address"));
  fireEvent.click(screen.getByRole("button", { name: "Check answer" }));
}

/** The deploy success card's Submit (#1231) — it asks the editor for one. */
function submitFromSuccessCard() {
  fireEvent(
    window,
    new CustomEvent("superteam:request-submit", {
      detail: { lessonId: "lesson-1" },
    })
  );
}

/** The editor toolbar's Submit, which posts the completion event directly. */
function submitFromToolbar() {
  fireEvent(
    window,
    new CustomEvent("superteam:lesson-complete", {
      detail: { lessonId: "lesson-1", submittedCode: "// mine" },
    })
  );
}

describe("lesson submit payload", () => {
  it("carries the quiz answers when the deploy success card asks for a submit", async () => {
    const fetchMock = stubFetch();
    renderLesson();
    await answerTheQuiz();
    submitFromSuccessCard();

    await waitFor(() => {
      const call = completionCall(fetchMock);
      expect(call).toBeTruthy();
      const body = JSON.parse(call![1].body as string);
      expect(body.proofs.check).toEqual({ selections: { q1: ["a"] } });
      expect(body.proofs["ping-program"]).toHaveProperty("code");
    });
  });

  it("builds the same payload from the editor toolbar's submit", async () => {
    const fetchMock = stubFetch();
    renderLesson();
    await answerTheQuiz();
    submitFromToolbar();

    await waitFor(() => {
      const call = completionCall(fetchMock);
      expect(call).toBeTruthy();
      const body = JSON.parse(call![1].body as string);
      expect(body.proofs.check).toEqual({ selections: { q1: ["a"] } });
      expect(body.proofs["ping-program"]).toEqual({ code: "// mine" });
    });
  });

  it("never posts a submit while a graded block is unfinished", async () => {
    const fetchMock = stubFetch();
    const rejected = vi.fn();
    window.addEventListener("superteam:lesson-complete-error", rejected);

    renderLesson();
    await waitFor(() =>
      expect(screen.getByLabelText("A program-derived address")).toBeTruthy()
    );
    submitFromSuccessCard();

    await waitFor(() => expect(rejected).toHaveBeenCalled());
    expect(completionCall(fetchMock)).toBeUndefined();
    window.removeEventListener("superteam:lesson-complete-error", rejected);
  });

  it("retires that rejection once the block it named is finished", async () => {
    stubFetch();
    const cleared = vi.fn();
    window.addEventListener("superteam:lesson-complete-reset", cleared);

    renderLesson();
    await waitFor(() =>
      expect(screen.getByLabelText("A program-derived address")).toBeTruthy()
    );
    submitFromSuccessCard();
    cleared.mockClear();
    await answerTheQuiz();

    await waitFor(() => expect(cleared).toHaveBeenCalled());
    window.removeEventListener("superteam:lesson-complete-reset", cleared);
  });
});
