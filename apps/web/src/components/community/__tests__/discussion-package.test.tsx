// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import { useThreadContexts } from "@/hooks/use-thread-contexts";
import { ThreadCard } from "../thread-card";
import { ThreadFilters } from "../thread-filters";
import { ThreadComposer } from "../thread-composer";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const getCoursesByIds = vi.fn();
const getLessonsByIds = vi.fn();
vi.mock("@/lib/content/client-queries", () => ({
  getCoursesByIds: (ids: string[]) => getCoursesByIds(ids),
  getLessonsByIds: (ids: string[]) => getLessonsByIds(ids),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({ order: async () => ({ data: [] }) }),
    }),
  }),
}));

function renderWithIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

const author = { username: "ada", avatar_url: null, level: 3 };

function renderCard(
  overrides: Partial<Parameters<typeof ThreadCard>[0]> = {},
  onVote = vi.fn()
) {
  renderWithIntl(
    <ThreadCard
      id="t1"
      title="Why is my PDA seed wrong?"
      slug="why-pda"
      shortId="abc123"
      type="question"
      isSolved={false}
      isPinned={false}
      voteScore={4}
      userVote={null}
      answerCount={2}
      author={author}
      categorySlug="help"
      createdAt={new Date().toISOString()}
      onVote={onVote}
      {...overrides}
    />
  );
  return onVote;
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ThreadCard — dense row (#7)", () => {
  it("collapses voting to a single inline upvote toggle carrying the score", () => {
    const onVote = renderCard();
    const upvote = screen.getByRole("button", {
      name: messages.community.upvote,
    });

    // The score lives ON the toggle, not in a stacked rail — that rail is what
    // made every row tall.
    expect(upvote).toHaveTextContent("4");
    expect(
      screen.queryByRole("button", { name: messages.community.downvote })
    ).toBeNull();

    fireEvent.click(upvote);
    expect(onVote).toHaveBeenCalledWith(1);
  });

  it("un-votes on a second click of an already-upvoted row", () => {
    const onVote = renderCard({ userVote: 1 });
    fireEvent.click(
      screen.getByRole("button", { name: messages.community.upvote })
    );
    expect(onVote).toHaveBeenCalledWith(0);
  });

  it("renders no provenance chip without a resolved context", () => {
    renderCard();
    expect(screen.queryByRole("link", { name: /From lesson/ })).toBeNull();
  });

  it("links the provenance chip at the exact lesson (#8)", () => {
    renderCard({
      context: {
        courseTitle: "Solana 101",
        courseSlug: "solana-101",
        lessonTitle: "Accounts Are Just Bytes",
        lessonSlug: "accounts",
      },
    });
    const chip = screen.getByRole("link", { name: /From lesson/ });
    expect(chip).toHaveAttribute(
      "href",
      "/en/courses/solana-101/lessons/accounts"
    );
    expect(chip).toHaveTextContent("Solana 101");
    expect(chip).toHaveTextContent("Accounts Are Just Bytes");
  });

  it("falls back to the course when the lesson does not resolve", () => {
    renderCard({
      context: { courseTitle: "Solana 101", courseSlug: "solana-101" },
    });
    expect(screen.getByRole("link", { name: /From lesson/ })).toHaveAttribute(
      "href",
      "/en/courses/solana-101"
    );
  });
});

describe("ThreadFilters — Course questions scope (#8)", () => {
  it("is absent unless the caller opts in", () => {
    renderWithIntl(
      <ThreadFilters
        sort="latest"
        onSortChange={vi.fn()}
        type={undefined}
        onTypeChange={vi.fn()}
      />
    );
    expect(
      screen.queryByRole("button", {
        name: messages.community.filterCourseQuestions,
      })
    ).toBeNull();
  });

  it("toggles independently of the type pills", () => {
    const onCourseOnlyChange = vi.fn();
    const onTypeChange = vi.fn();
    renderWithIntl(
      <ThreadFilters
        sort="latest"
        onSortChange={vi.fn()}
        type="question"
        onTypeChange={onTypeChange}
        courseOnly={false}
        onCourseOnlyChange={onCourseOnlyChange}
        showCourseFilter
      />
    );
    const pill = screen.getByRole("button", {
      name: messages.community.filterCourseQuestions,
    });
    expect(pill).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(pill);
    expect(onCourseOnlyChange).toHaveBeenCalledWith(true);
    // Scope is a separate axis: flipping it never rewrites the type filter.
    expect(onTypeChange).not.toHaveBeenCalled();
  });
});

describe("useThreadContexts — id → title resolution (#8)", () => {
  function Probe({
    threads,
  }: {
    threads: Parameters<typeof useThreadContexts>[0];
  }) {
    const contexts = useThreadContexts(threads);
    return (
      <ul>
        {[...contexts.entries()].map(([id, ctx]) => (
          <li key={id} data-testid={id}>
            {ctx.courseTitle}
            {ctx.lessonTitle ? ` > ${ctx.lessonTitle}` : ""}
          </li>
        ))}
      </ul>
    );
  }

  beforeEach(() => {
    getCoursesByIds.mockReset();
    getLessonsByIds.mockReset();
  });

  it("resolves course + lesson titles and skips unscoped threads", async () => {
    getCoursesByIds.mockResolvedValue([
      { _id: "c1", title: "Solana 101", slug: "solana-101" },
    ]);
    getLessonsByIds.mockResolvedValue([
      { _id: "l1", title: "Accounts", slug: "accounts" },
    ]);

    render(
      <Probe
        threads={[
          { id: "t1", course_id: "c1", lesson_id: "l1" },
          { id: "t2", course_id: null, lesson_id: null },
        ]}
      />
    );

    expect(await screen.findByTestId("t1")).toHaveTextContent(
      "Solana 101 > Accounts"
    );
    expect(screen.queryByTestId("t2")).toBeNull();
    // Ids are batched and de-duplicated, never fetched one thread at a time.
    expect(getCoursesByIds).toHaveBeenCalledTimes(1);
  });

  it("degrades to the course when the lesson id no longer resolves", async () => {
    getCoursesByIds.mockResolvedValue([
      { _id: "c1", title: "Solana 101", slug: "solana-101" },
    ]);
    getLessonsByIds.mockResolvedValue([]);

    render(
      <Probe threads={[{ id: "t1", course_id: "c1", lesson_id: "gone" }]} />
    );

    expect(await screen.findByTestId("t1")).toHaveTextContent("Solana 101");
    expect(screen.getByTestId("t1")).not.toHaveTextContent(">");
  });

  it("drops the chips (never the threads) when the lookup fails", async () => {
    getCoursesByIds.mockRejectedValue(new Error("offline"));
    getLessonsByIds.mockResolvedValue([]);

    render(
      <Probe threads={[{ id: "t1", course_id: "c1", lesson_id: "l1" }]} />
    );

    await waitFor(() => expect(getCoursesByIds).toHaveBeenCalled());
    expect(screen.queryByTestId("t1")).toBeNull();
  });
});

describe("ThreadComposer — inline vs modal submit (#6, #5)", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  function fill() {
    fireEvent.change(screen.getByLabelText(messages.community.titleLabel), {
      target: { value: "How do I derive this PDA?" },
    });
    fireEvent.change(
      screen.getByPlaceholderText(messages.community.detailsPlaceholder),
      { target: { value: "I keep getting a seed mismatch on enrollment." } }
    );
  }

  it("posts the lesson scope and stays put when onCreated is supplied", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ slug: "how-do-i-derive-this-pda" }),
    });
    const onCreated = vi.fn();

    renderWithIntl(
      <ThreadComposer
        defaultScope={{ courseId: "course-1", lessonId: "lesson-2" }}
        onCancel={vi.fn()}
        onCreated={onCreated}
      />
    );
    fill();
    fireEvent.click(
      screen.getByRole("button", { name: messages.community.post })
    );

    await waitFor(() => expect(onCreated).toHaveBeenCalled());

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(String(init.body));
    expect(body.courseId).toBe("course-1");
    expect(body.lessonId).toBe("lesson-2");
    // Course-scoped threads never carry a category, and inline posting must not
    // navigate away from the lesson.
    expect(body.categoryId).toBeUndefined();
    expect(push).not.toHaveBeenCalled();
  });

  it("navigates to the new thread when no onCreated handler is given (modal path)", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ slug: "how-do-i-derive-this-pda" }),
    });

    renderWithIntl(
      <ThreadComposer
        defaultScope={{ courseId: "course-1" }}
        onCancel={vi.fn()}
      />
    );
    fill();
    fireEvent.click(
      screen.getByRole("button", { name: messages.community.post })
    );

    await waitFor(() =>
      expect(push).toHaveBeenCalledWith(
        "/community/general/how-do-i-derive-this-pda"
      )
    );
  });

  it("keeps Post disabled until the length rules pass", () => {
    renderWithIntl(
      <ThreadComposer defaultScope={{ courseId: "c" }} onCancel={vi.fn()} />
    );
    const post = screen.getByRole("button", { name: messages.community.post });
    expect(post).toBeDisabled();
    fill();
    expect(post).toBeEnabled();
  });

  it("shows a current-colour ring spinner while submitting, never .sol-spinner", async () => {
    let release: (value: unknown) => void = () => {};
    fetchMock.mockReturnValue(
      new Promise((resolve) => {
        release = resolve;
      })
    );

    const { container } = renderWithIntl(
      <ThreadComposer defaultScope={{ courseId: "c" }} onCancel={vi.fn()} />
    );
    fill();
    fireEvent.click(
      screen.getByRole("button", { name: messages.community.post })
    );

    await waitFor(() =>
      expect(container.querySelector(".animate-spin")).not.toBeNull()
    );
    const spinner = container.querySelector(".animate-spin");
    // The old `.sol-spinner` painted a dark track + XP-yellow head, which read
    // as a foreign artefact on the green primary button.
    expect(container.querySelector(".sol-spinner")).toBeNull();
    expect(spinner?.className).toContain("border-current");
    expect(spinner?.className).toContain("border-t-transparent");

    release({ ok: true, json: async () => ({ slug: "s" }) });
  });

  it("surfaces the server error and re-enables the button", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Rate limited" }),
    });

    renderWithIntl(
      <ThreadComposer defaultScope={{ courseId: "c" }} onCancel={vi.fn()} />
    );
    fill();
    fireEvent.click(
      screen.getByRole("button", { name: messages.community.post })
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("Rate limited");
    expect(
      screen.getByRole("button", { name: messages.community.post })
    ).toBeEnabled();
  });
});
