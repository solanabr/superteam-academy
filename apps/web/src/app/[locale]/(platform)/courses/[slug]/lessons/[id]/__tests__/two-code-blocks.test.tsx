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
import { bankCompletion, readBank } from "@/lib/lessons/progress-bank";
import { LessonPageClient } from "../lesson-client";

const h = vi.hoisted(() => ({
  auth: {
    userId: "user-1" as string | null,
    profile: { wallet_address: "wallet" } as { wallet_address: string } | null,
    isLoading: false,
  },
  enrolled: true,
  trackEvent: vi.fn(),
  resetEditorStorage: vi.fn(),
}));

vi.mock("@/lib/analytics", () => ({ trackEvent: h.trackEvent }));
vi.mock("@/lib/auth/auth-provider", () => ({ useAuth: () => h.auth }));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve({ data: h.enrolled ? { id: "e" } : null }),
            eq: () => ({ maybeSingle: () => Promise.resolve({ data: null }) }),
          }),
        }),
      }),
    }),
  }),
}));
vi.mock("@/hooks/use-on-chain-enroll", () => ({
  // Mirrors the real hook's two outcomes: anonymous hands off to the claim
  // prompt, signed-in enrols.
  useOnChainEnroll: (opts: {
    onRequireAuth: () => void;
    onSuccess: () => void;
  }) => ({
    isEnrolling: false,
    handleEnroll: () =>
      h.auth.userId ? opts.onSuccess() : opts.onRequireAuth(),
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
  AuthModal: ({
    trigger,
    open,
    showLater,
  }: {
    trigger?: React.ReactNode;
    open?: boolean;
    showLater?: boolean;
  }) => (
    <>
      {trigger}
      {open ? (
        <div data-testid="claim-modal" data-show-later={String(!!showLater)} />
      ) : null}
    </>
  ),
}));
vi.mock("@/components/wallet/linked-wallet-prompt", () => ({
  LinkedWalletPrompt: () => null,
}));
vi.mock("@/components/editor/code-editor", async () => {
  const React = await import("react");
  return {
    CodeEditor: React.forwardRef(function MockCodeEditor(
      props: {
        initialCode: string;
        storageScope?: string;
        userId?: string | null;
        onChange?: (code: string) => void;
      },
      _ref
    ) {
      return React.createElement("textarea", {
        "data-testid": `editor:${props.initialCode}`,
        "data-storage-scope": props.storageScope,
        "data-user": props.userId ?? "signed-out",
        onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) =>
          props.onChange?.(e.target.value),
      });
    }),
    resetEditorStorage: h.resetEditorStorage,
  };
});
vi.mock("@/components/editor/challenge-runner", async () => {
  const React = await import("react");
  return {
    ChallengeRunner: (props: {
      starter?: string;
      onSubmit: () => void;
      isComplete: boolean;
      isJudging?: boolean;
    }) =>
      props.isComplete || props.isJudging
        ? null
        : React.createElement(
            "button",
            {
              "data-testid": `submit:${props.starter}`,
              onClick: props.onSubmit,
            },
            "Submit"
          ),
  };
});
vi.mock("@/components/editor/ai-partner/ai-partner-pane", () => ({
  AiPartnerPane: () => <div data-testid="ai-pane" />,
}));
vi.mock("@/components/editor/output-panel", () => ({
  OutputPanel: () => null,
}));
vi.mock("@/components/deploy/deploy-panel", () => ({
  DeployPanel: () => null,
}));

const PART_ONE = "// part one";
const PART_TWO = "// part two";

function codeBlock(key: string, starter: string) {
  return {
    _type: "code",
    key,
    language: "typescript",
    buildType: "standard",
    deployable: false,
    starter,
    tests: [],
    hints: [],
  };
}

const quiz = {
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
};

const twoBlocks = {
  _id: "lesson-1",
  title: "Two rungs",
  slug: "two-rungs",
  blocks: [codeBlock("first", PART_ONE), codeBlock("second", PART_TWO), quiz],
} as unknown as Lesson;

const twoBlocksNoQuiz = {
  ...twoBlocks,
  blocks: [codeBlock("first", PART_ONE), codeBlock("second", PART_TWO)],
} as unknown as Lesson;

const singleBlock = {
  _id: "lesson-1",
  title: "One rung",
  slug: "one-rung",
  blocks: [codeBlock("only", PART_ONE)],
} as unknown as Lesson;

function setDesktop(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

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
});

beforeEach(() => {
  window.localStorage.clear();
  vi.clearAllMocks();
  h.auth.userId = "user-1";
  h.auth.profile = { wallet_address: "wallet" };
  h.auth.isLoading = false;
  h.enrolled = true;
  setDesktop(false);
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.unstubAllGlobals();
  document.body.style.overflow = "";
});

function renderLesson(lesson: Lesson) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <LessonPageClient
        lesson={lesson}
        allLessons={[
          { _id: "lesson-1", title: "L", slug: lesson.slug } as never,
        ]}
        locale="en"
        courseSlug="payments"
        courseId="course-1"
        courseXpPerLesson={30}
      />
    </NextIntlClientProvider>
  );
}

function stubFetch(ok = true, status = 200, reason?: string) {
  const fetchMock = vi.fn(() =>
    Promise.resolve({
      ok,
      status,
      json: () =>
        Promise.resolve(
          ok
            ? { success: true, alreadyCompleted: false, signature: null }
            : { error: "denied", reason }
        ),
    })
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

type FetchMock = ReturnType<typeof stubFetch>;

function completionCalls(fetchMock: FetchMock): [string, RequestInit][] {
  return (fetchMock.mock.calls as unknown as [string, RequestInit][]).filter(
    ([url]) => url === "/api/lessons/complete"
  );
}

function postedProofs(fetchMock: FetchMock, callIndex = 0) {
  const call = completionCalls(fetchMock)[callIndex];
  return JSON.parse(call![1].body as string).proofs as Record<string, unknown>;
}

/** Lets the enrolment/progress read settle, so isEnrolled is what the test set. */
async function flushAuthRead() {
  await waitFor(() =>
    expect(screen.getByTestId(`editor:${PART_ONE}`)).toBeTruthy()
  );
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function answerTheQuiz() {
  await waitFor(() =>
    expect(screen.getByLabelText("A program-derived address")).toBeTruthy()
  );
  fireEvent.click(screen.getByLabelText("A program-derived address"));
  fireEvent.click(screen.getByRole("button", { name: "Check answer" }));
}

function submit(starter: string) {
  fireEvent.click(screen.getByTestId(`submit:${starter}`));
}

function verdictOf(starter: string) {
  return screen
    .getByTestId(`editor:${starter}`)
    .closest(".verdict-card")
    ?.getAttribute("data-verdict");
}

describe("a lesson with two code blocks", () => {
  it("posts the completion once, with both proofs, only after both parts are submitted", async () => {
    const fetchMock = stubFetch();
    renderLesson(twoBlocks);
    await flushAuthRead();
    await answerTheQuiz();

    submit(PART_ONE);
    await screen.findByText(/Submit part 2 to complete this lesson/);
    expect(completionCalls(fetchMock)).toHaveLength(0);
    expect(h.trackEvent).not.toHaveBeenCalledWith(
      "lesson_completed",
      expect.anything()
    );
    // The waiting part stays editable and is not presented as judged.
    expect(verdictOf(PART_ONE)).toBe("idle");

    submit(PART_TWO);
    await waitFor(() => expect(completionCalls(fetchMock)).toHaveLength(1));
    expect(postedProofs(fetchMock)).toEqual({
      first: { code: PART_ONE },
      second: { code: PART_TWO },
      check: { selections: { q1: ["a"] } },
    });
    await waitFor(() =>
      expect(h.trackEvent).toHaveBeenCalledWith(
        "lesson_completed",
        expect.objectContaining({ lessonId: "lesson-1" })
      )
    );
  });

  it("accepts the parts in either order", async () => {
    const fetchMock = stubFetch();
    renderLesson(twoBlocksNoQuiz);
    await flushAuthRead();

    submit(PART_TWO);
    await screen.findByText(/Submit part 1 to complete this lesson/);
    expect(completionCalls(fetchMock)).toHaveLength(0);

    submit(PART_ONE);
    await waitFor(() => expect(completionCalls(fetchMock)).toHaveLength(1));
    expect(postedProofs(fetchMock)).toEqual({
      first: { code: PART_ONE },
      second: { code: PART_TWO },
    });
  });

  it("refuses a bare completion event while a part is unsubmitted", async () => {
    const fetchMock = stubFetch();
    const rejected = vi.fn();
    window.addEventListener("superteam:lesson-complete-error", rejected);
    renderLesson(twoBlocksNoQuiz);
    await flushAuthRead();

    fireEvent(
      window,
      new CustomEvent("superteam:lesson-complete", {
        detail: {
          lessonId: "lesson-1",
          blockKey: "first",
          submittedCode: PART_ONE,
        },
      })
    );

    await waitFor(() => expect(rejected).toHaveBeenCalled());
    expect(completionCalls(fetchMock)).toHaveLength(0);
    window.removeEventListener("superteam:lesson-complete-error", rejected);
  });

  it("withdraws a submitted part when its code changes, so the POST never carries stale code", async () => {
    const fetchMock = stubFetch();
    renderLesson(twoBlocksNoQuiz);
    await flushAuthRead();

    submit(PART_ONE);
    await screen.findByText(/Submit part 2 to complete this lesson/);

    fireEvent.change(screen.getByTestId(`editor:${PART_ONE}`), {
      target: { value: "// part one, edited" },
    });
    submit(PART_TWO);
    await screen.findByText(/Submit part 1 to complete this lesson/);
    expect(completionCalls(fetchMock)).toHaveLength(0);

    submit(PART_ONE);
    await waitFor(() => expect(completionCalls(fetchMock)).toHaveLength(1));
    expect(postedProofs(fetchMock).first).toEqual({
      code: "// part one, edited",
    });
  });

  it("rejects only the last part when the quiz is unfinished, and keeps the first part's save", async () => {
    const fetchMock = stubFetch();
    renderLesson(twoBlocks);
    await flushAuthRead();

    submit(PART_ONE);
    await screen.findByText(/Submit part 2 to complete this lesson/);
    submit(PART_TWO);

    await waitFor(() => expect(verdictOf(PART_TWO)).toBe("rejected"));
    expect(verdictOf(PART_ONE)).toBe("idle");
    expect(completionCalls(fetchMock)).toHaveLength(0);

    await answerTheQuiz();
    await waitFor(() => expect(verdictOf(PART_TWO)).toBe("idle"));
    submit(PART_TWO);
    await waitFor(() => expect(completionCalls(fetchMock)).toHaveLength(1));
    expect(Object.keys(postedProofs(fetchMock)).sort()).toEqual([
      "check",
      "first",
      "second",
    ]);
  });

  it("shows a server rejection on both editors, since it doesn't say which block failed", async () => {
    const fetchMock = stubFetch(false, 403, "challenge_failed");
    renderLesson(twoBlocksNoQuiz);
    await flushAuthRead();

    submit(PART_ONE);
    await screen.findByText(/Submit part 2 to complete this lesson/);
    submit(PART_TWO);

    await waitFor(() => expect(verdictOf(PART_TWO)).toBe("rejected"));
    expect(verdictOf(PART_ONE)).toBe("rejected");
    expect(completionCalls(fetchMock)).toHaveLength(1);
  });

  it("keeps the proofs through a retry, so a transient failure costs one click", async () => {
    const fetchMock = stubFetch(false, 503);
    renderLesson(twoBlocksNoQuiz);
    await flushAuthRead();

    submit(PART_ONE);
    await screen.findByText(/Submit part 2 to complete this lesson/);
    submit(PART_TWO);
    await waitFor(() => expect(verdictOf(PART_TWO)).toBe("rejected"));

    fireEvent.click(screen.getAllByRole("button", { name: "Try again" })[1]!);
    submit(PART_TWO);
    await waitFor(() => expect(completionCalls(fetchMock)).toHaveLength(2));
    expect(postedProofs(fetchMock, 1)).toEqual({
      first: { code: PART_ONE },
      second: { code: PART_TWO },
    });
  });

  it("shows one accepted card, on the part that finished the lesson, and locks both", async () => {
    stubFetch();
    renderLesson(twoBlocksNoQuiz);
    await flushAuthRead();

    submit(PART_ONE);
    await screen.findByText(/Submit part 2 to complete this lesson/);
    submit(PART_TWO);

    await waitFor(() => expect(verdictOf(PART_TWO)).toBe("accepted"));
    expect(verdictOf(PART_ONE)).toBe("accepted");
    expect(await screen.findAllByTestId("accepted-verdict")).toHaveLength(1);
    expect(screen.queryByText(/to complete this lesson/)).toBeNull();
  });

  it("asks an unenrolled learner to enrol only once, on the last part, then completes", async () => {
    h.enrolled = false;
    const fetchMock = stubFetch();
    renderLesson(twoBlocksNoQuiz);
    await flushAuthRead();

    submit(PART_ONE);
    await screen.findByText(/Submit part 2 to complete this lesson/);
    expect(screen.queryByRole("button", { name: "Enroll Now" })).toBeNull();

    submit(PART_TWO);
    fireEvent.click(await screen.findByRole("button", { name: "Enroll Now" }));

    await waitFor(() => expect(completionCalls(fetchMock)).toHaveLength(1));
    expect(postedProofs(fetchMock)).toEqual({
      first: { code: PART_ONE },
      second: { code: PART_TWO },
    });
  });

  it("banks both proofs for an anonymous learner, and never a partial set", async () => {
    h.auth.userId = null;
    h.auth.profile = null;
    stubFetch();
    renderLesson(twoBlocksNoQuiz);
    await waitFor(() =>
      expect(screen.getByTestId(`editor:${PART_ONE}`)).toBeTruthy()
    );

    submit(PART_ONE);
    await screen.findByText(/Submit part 2 to complete this lesson/);
    expect(readBank()).toEqual([]);

    submit(PART_TWO);
    fireEvent.click(await screen.findByRole("button", { name: "Enroll Now" }));

    await waitFor(() => expect(readBank()).toHaveLength(1));
    expect(readBank()[0]!.proofs).toEqual({
      first: { code: PART_ONE },
      second: { code: PART_TWO },
    });
  });

  it("opens the editors once sign-in resolves, for that user", async () => {
    h.auth.isLoading = true;
    const { rerender } = renderLesson(twoBlocksNoQuiz);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.queryByTestId(`editor:${PART_ONE}`)).toBeNull();

    h.auth.isLoading = false;
    rerender(
      <NextIntlClientProvider locale="en" messages={messages}>
        <LessonPageClient
          lesson={twoBlocksNoQuiz}
          allLessons={[
            {
              _id: "lesson-1",
              title: "L",
              slug: twoBlocksNoQuiz.slug,
            } as never,
          ]}
          locale="en"
          courseSlug="payments"
          courseId="course-1"
          courseXpPerLesson={30}
        />
      </NextIntlClientProvider>
    );
    await flushAuthRead();

    for (const starter of [PART_ONE, PART_TWO]) {
      expect(
        screen.getByTestId(`editor:${starter}`).getAttribute("data-user")
      ).toBe("user-1");
    }
  });

  it("opens a signed-out learner's editors as signed out", async () => {
    h.auth.userId = null;
    renderLesson(singleBlock);
    await flushAuthRead();

    expect(
      screen.getByTestId(`editor:${PART_ONE}`).getAttribute("data-user")
    ).toBe("signed-out");
  });

  it("gives each editor its own storage scope and reset", async () => {
    stubFetch();
    renderLesson(twoBlocksNoQuiz);
    await flushAuthRead();

    expect(
      screen
        .getByTestId(`editor:${PART_ONE}`)
        .getAttribute("data-storage-scope")
    ).toBe("first");
    expect(
      screen
        .getByTestId(`editor:${PART_TWO}`)
        .getAttribute("data-storage-scope")
    ).toBe("second");

    fireEvent.click(screen.getAllByRole("button", { name: "Reset Code" })[1]!);
    expect(h.resetEditorStorage).toHaveBeenCalledTimes(1);
    expect(h.resetEditorStorage).toHaveBeenCalledWith(
      "lesson-1",
      "second",
      "user-1"
    );
  });

  it("gives each part a viewport-tall section instead of squeezing both into one viewport", async () => {
    setDesktop(true);
    stubFetch();
    const { container } = renderLesson(twoBlocksNoQuiz);
    await flushAuthRead();

    const root = container.firstElementChild as HTMLElement;
    expect(root.className).not.toContain("lg:h-[calc(100dvh-60px)]");
    const sections = container.querySelectorAll("section[data-code-part]");
    expect(sections).toHaveLength(2);
    for (const section of sections) {
      expect(section.className).toContain("lg:h-[calc(100dvh-60px)]");
    }
    // The page has to scroll to reach the second editor.
    expect(document.body.style.overflow).not.toBe("hidden");
  });

  it("offers a jump to the other part from each part's strip", async () => {
    const scrollTo = vi.fn();
    vi.stubGlobal("scrollTo", scrollTo);
    stubFetch();
    renderLesson(twoBlocksNoQuiz);
    await flushAuthRead();

    expect(screen.getByText("Part 1 of 2")).toBeTruthy();
    expect(screen.getByText("Part 2 of 2")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Go to part 2" }));
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });

  describe("the jump between parts", () => {
    function stubLayout() {
      vi.spyOn(
        HTMLElement.prototype,
        "getBoundingClientRect"
      ).mockImplementation(function (this: HTMLElement) {
        const top = this.matches("section[data-code-part]")
          ? 1000
          : this.matches(".verdict-card")
            ? 38000
            : 0;
        return { top } as DOMRect;
      });
    }

    afterEach(() => vi.restoreAllMocks());

    it("lands on the section under the fixed header at lg", async () => {
      setDesktop(true);
      const scrollTo = vi.fn();
      vi.stubGlobal("scrollTo", scrollTo);
      stubFetch();
      renderLesson(twoBlocksNoQuiz);
      await flushAuthRead();
      stubLayout();

      fireEvent.click(screen.getByRole("button", { name: "Go to part 2" }));
      expect(scrollTo).toHaveBeenCalledWith(
        expect.objectContaining({ top: 1000 - 60 })
      );
    });

    it("lands on the editor, clear of the sticky top bar, below lg", async () => {
      setDesktop(false);
      const scrollTo = vi.fn();
      vi.stubGlobal("scrollTo", scrollTo);
      stubFetch();
      renderLesson(twoBlocksNoQuiz);
      await flushAuthRead();
      stubLayout();

      fireEvent.click(screen.getByRole("button", { name: "Go to part 1" }));
      expect(scrollTo).toHaveBeenCalledWith(
        expect.objectContaining({ top: 38000 - 112 })
      );
    });
  });

  it("posts once when both parts wait at the enroll prompt and enrolment lands", async () => {
    h.enrolled = false;
    const fetchMock = stubFetch();
    renderLesson(twoBlocksNoQuiz);
    await flushAuthRead();

    submit(PART_ONE);
    await screen.findByText(/Submit part 2 to complete this lesson/);
    submit(PART_TWO);
    await screen.findByRole("button", { name: "Enroll Now" });
    submit(PART_ONE);
    const prompts = await screen.findAllByRole("button", {
      name: "Enroll Now",
    });
    expect(prompts).toHaveLength(2);

    fireEvent.click(prompts[0]!);

    await waitFor(() => expect(verdictOf(PART_TWO)).toBe("accepted"));
    expect(completionCalls(fetchMock)).toHaveLength(1);
    expect(
      h.trackEvent.mock.calls.filter(([name]) => name === "lesson_completed")
    ).toHaveLength(1);
  });

  describe("the claim prompt for an anonymous learner", () => {
    const EDITED = "// part one, edited";

    async function bothPartsAtThePrompt() {
      h.auth.userId = null;
      h.auth.profile = null;
      stubFetch();
      renderLesson(twoBlocksNoQuiz);
      await waitFor(() =>
        expect(screen.getByTestId(`editor:${PART_ONE}`)).toBeTruthy()
      );
      submit(PART_ONE);
      await screen.findByText(/Submit part 2 to complete this lesson/);
      submit(PART_TWO);
      return screen.findByRole("button", { name: "Enroll Now" });
    }

    function edit() {
      fireEvent.change(screen.getByTestId(`editor:${PART_ONE}`), {
        target: { value: EDITED },
      });
    }

    function claimModal() {
      return screen.findByTestId("claim-modal");
    }

    afterEach(() => vi.restoreAllMocks());

    it("promises saved work when the bank holds every part", async () => {
      fireEvent.click(await bothPartsAtThePrompt());
      expect((await claimModal()).dataset.showLater).toBe("true");
      expect(readBank()).toHaveLength(1);
    });

    it("promises nothing after a part is withdrawn, because nothing was banked", async () => {
      const enroll = await bothPartsAtThePrompt();
      edit();
      fireEvent.click(enroll);

      expect((await claimModal()).dataset.showLater).toBe("false");
      expect(readBank()).toEqual([]);
    });

    it("drops an older bank entry when the lesson can't be banked as it stands", async () => {
      const enroll = await bothPartsAtThePrompt();
      edit();
      bankCompletion({
        courseId: "course-1",
        courseSlug: "payments",
        lessonId: "lesson-1",
        lessonSlug: "two-rungs",
        lessonTitle: "Two rungs",
        proofs: { first: { code: PART_ONE }, second: { code: PART_TWO } },
      });
      fireEvent.click(enroll);

      await claimModal();
      expect(readBank()).toEqual([]);
    });

    it("drops the bank entry as soon as a banked part is edited", async () => {
      fireEvent.click(await bothPartsAtThePrompt());
      await claimModal();
      expect(readBank()).toHaveLength(1);

      edit();
      expect(readBank()).toEqual([]);
    });

    it("promises nothing when the bank write fails", async () => {
      const enroll = await bothPartsAtThePrompt();
      const setItem = Storage.prototype.setItem;
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (
        this: Storage,
        key: string,
        value: string
      ) {
        if (key === "superteam:progress-bank:v1") throw new Error("quota");
        setItem.call(this, key, value);
      });
      fireEvent.click(enroll);

      expect((await claimModal()).dataset.showLater).toBe("false");
    });
  });

  it("keeps the tutor off the second part, whose context the partner route can't load", async () => {
    stubFetch();
    renderLesson(twoBlocksNoQuiz);
    await flushAuthRead();

    expect(screen.getAllByTestId("ai-pane")).toHaveLength(1);
  });
});

describe("a change of signed-in learner with the lesson open", () => {
  // Another tab's sign-out or sign-in reaches this one without a reload.
  function becomes(
    view: ReturnType<typeof renderLesson>,
    userId: string | null
  ) {
    h.auth.userId = userId;
    view.rerender(
      <NextIntlClientProvider locale="en" messages={messages}>
        <LessonPageClient
          lesson={twoBlocksNoQuiz}
          allLessons={[
            {
              _id: "lesson-1",
              title: "L",
              slug: twoBlocksNoQuiz.slug,
            } as never,
          ]}
          locale="en"
          courseSlug="payments"
          courseId="course-1"
          courseXpPerLesson={30}
        />
      </NextIntlClientProvider>
    );
  }

  async function aSubmitsPartOne() {
    const fetchMock = stubFetch();
    const view = renderLesson(twoBlocksNoQuiz);
    await flushAuthRead();
    fireEvent.change(screen.getByTestId(`editor:${PART_ONE}`), {
      target: { value: "// A's part one" },
    });
    submit(PART_ONE);
    await screen.findByText(/Submit part 2 to complete this lesson/);
    return { fetchMock, view };
  }

  const carriesA = (fetchMock: FetchMock) =>
    completionCalls(fetchMock).some(([, init]) =>
      String(init.body).includes("A's part one")
    );

  it("doesn't carry a submitted part over to the next learner", async () => {
    const { fetchMock, view } = await aSubmitsPartOne();

    becomes(view, "user-2");
    await flushAuthRead();
    submit(PART_TWO);

    await screen.findByText(/Submit part 1 to complete this lesson/);
    expect(completionCalls(fetchMock)).toHaveLength(0);

    submit(PART_ONE);
    await waitFor(() => expect(completionCalls(fetchMock)).toHaveLength(1));
    expect(postedProofs(fetchMock)).toEqual({
      first: { code: PART_ONE },
      second: { code: PART_TWO },
    });
  });

  it("doesn't bank a signed-in learner's part for whoever signs in next", async () => {
    const { fetchMock, view } = await aSubmitsPartOne();

    becomes(view, null);
    await flushAuthRead();
    submit(PART_TWO);
    await screen.findByText(/Submit part 1 to complete this lesson/);
    submit(PART_ONE);
    fireEvent.click(await screen.findByRole("button", { name: "Enroll Now" }));
    await screen.findByTestId("claim-modal");

    expect(carriesA(fetchMock)).toBe(false);
    expect(readBank()).toHaveLength(1);
    expect(readBank()[0]!.proofs).toEqual({
      first: { code: PART_ONE },
      second: { code: PART_TWO },
    });
  });
});

describe("a lesson with one code block stays as it was", () => {
  it("completes on its one submit, with the proof under the block key", async () => {
    const fetchMock = stubFetch();
    renderLesson(singleBlock);
    await flushAuthRead();

    submit(PART_ONE);
    await waitFor(() => expect(completionCalls(fetchMock)).toHaveLength(1));
    expect(postedProofs(fetchMock)).toEqual({ only: { code: PART_ONE } });
  });

  it("still accepts a completion event without a block key", async () => {
    const fetchMock = stubFetch();
    renderLesson(singleBlock);
    await flushAuthRead();

    fireEvent(
      window,
      new CustomEvent("superteam:lesson-complete", {
        detail: { lessonId: "lesson-1", submittedCode: "// mine" },
      })
    );
    await waitFor(() => expect(completionCalls(fetchMock)).toHaveLength(1));
    expect(postedProofs(fetchMock)).toEqual({ only: { code: "// mine" } });
  });

  it("still promises saved work to an anonymous learner", async () => {
    h.auth.userId = null;
    h.auth.profile = null;
    stubFetch();
    renderLesson(singleBlock);
    await waitFor(() =>
      expect(screen.getByTestId(`editor:${PART_ONE}`)).toBeTruthy()
    );

    submit(PART_ONE);
    fireEvent.click(await screen.findByRole("button", { name: "Enroll Now" }));

    const modal = await screen.findByTestId("claim-modal");
    expect(modal.dataset.showLater).toBe("true");
    expect(readBank()[0]!.proofs).toEqual({ only: { code: PART_ONE } });
  });

  it("keeps the lesson-only storage key, the viewport lock and no part strip", async () => {
    setDesktop(true);
    stubFetch();
    const { container } = renderLesson(singleBlock);
    await flushAuthRead();

    expect(
      screen
        .getByTestId(`editor:${PART_ONE}`)
        .hasAttribute("data-storage-scope")
    ).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Reset Code" }));
    expect(h.resetEditorStorage.mock.calls[0]?.[0]).toBe("lesson-1");
    expect(h.resetEditorStorage.mock.calls[0]?.[1]).toBeUndefined();
    expect(h.resetEditorStorage.mock.calls[0]?.[2]).toBe("user-1");

    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain("lg:h-[calc(100dvh-60px)]");
    expect(document.body.style.overflow).toBe("hidden");
    expect(container.querySelector("section[data-code-part]")).toBeNull();
    expect(screen.queryByText(/^Part \d of \d$/)).toBeNull();
  });
});
