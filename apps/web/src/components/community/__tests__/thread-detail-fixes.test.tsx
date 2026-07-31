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
import { ThreadDetailClient } from "@/app/[locale]/(platform)/community/[category-slug]/[thread-slug]/thread-detail-client";
import { AnswerCard } from "../answer-card";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const authUser = { id: "user-1" };
vi.mock("@/lib/auth/auth-provider", () => ({
  useAuth: () => ({ user: authUser }),
}));

vi.mock("@/hooks/use-vote", () => ({
  useVote: ({ initialScore }: { initialScore: number }) => ({
    score: initialScore,
    userVote: null,
    isVoting: false,
    handleVote: vi.fn(),
  }),
}));

const getCoursesByIds = vi.fn().mockResolvedValue([]);
const getLessonsByIds = vi.fn().mockResolvedValue([]);
vi.mock("@/lib/content/client-queries", () => ({
  getCoursesByIds: (ids: string[]) => getCoursesByIds(ids),
  getLessonsByIds: (ids: string[]) => getLessonsByIds(ids),
}));

function renderWithIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

const author = { username: "ada", avatar_url: null, level: 2 };

function makeAnswer(id: string, body: string, isAccepted = false) {
  return {
    id,
    body,
    is_accepted: isAccepted,
    vote_score: 0,
    author_id: "user-2",
    author,
    userVote: null,
    created_at: new Date().toISOString(),
  };
}

function makeThread(overrides: Record<string, unknown> = {}) {
  return {
    id: "t1",
    title: "Why is my PDA seed wrong?",
    body: "## A heading in the body\n\nAnd the actual question text.",
    type: "question",
    is_solved: false,
    is_pinned: false,
    is_locked: false,
    vote_score: 3,
    view_count: 10,
    answer_count: 0,
    author_id: "user-1",
    author,
    category: { id: "c", name: "Help", slug: "help" },
    course_id: null,
    lesson_id: null,
    userVote: null,
    answers: [],
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  getCoursesByIds.mockClear().mockResolvedValue([]);
  getLessonsByIds.mockClear().mockResolvedValue([]);
  global.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(cleanup);

describe("ThreadDetailClient — a posted answer appears immediately", () => {
  it("refetches after a successful post and renders the new answer", async () => {
    const before = makeThread();
    const after = makeThread({
      answer_count: 1,
      answers: [makeAnswer("a1", "Derive it with the full content id.")],
    });

    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === "POST") {
        return Promise.resolve({ ok: true, json: async () => ({ id: "a1" }) });
      }
      // First GET is the initial load; every later GET is the post-refetch.
      const body = fetchMock.mock.calls.some((c) => c[1]?.method === "POST")
        ? after
        : before;
      return Promise.resolve({ ok: true, json: async () => body });
    });

    renderWithIntl(<ThreadDetailClient shortId="abc" />);
    await screen.findByRole("heading", { name: /Why is my PDA seed wrong/ });

    fireEvent.change(
      screen.getByPlaceholderText(messages.community.writeAnswer),
      { target: { value: "Derive it with the full content id." } }
    );
    fireEvent.click(
      screen.getByRole("button", { name: messages.community.postAnswer })
    );

    expect(
      await screen.findByText("Derive it with the full content id.")
    ).toBeInTheDocument();
  });

  it("bypasses the HTTP cache on every read, so the refetch cannot be stale", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => makeThread() });
    renderWithIntl(<ThreadDetailClient shortId="abc" />);
    await screen.findByRole("heading", { name: /Why is my PDA seed wrong/ });

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.cache).toBe("no-store");
  });

  it("keeps the thread on screen during the refetch — no full-page spinner", async () => {
    let resolveRefetch: (value: unknown) => void = () => {};
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === "POST") {
        return Promise.resolve({ ok: true, json: async () => ({ id: "a1" }) });
      }
      if (fetchMock.mock.calls.some((c) => c[1]?.method === "POST")) {
        return new Promise((resolve) => {
          resolveRefetch = resolve;
        });
      }
      return Promise.resolve({ ok: true, json: async () => makeThread() });
    });

    renderWithIntl(<ThreadDetailClient shortId="abc" />);
    const title = await screen.findByRole("heading", {
      name: /Why is my PDA seed wrong/,
    });

    fireEvent.change(
      screen.getByPlaceholderText(messages.community.writeAnswer),
      { target: { value: "An answer body long enough." } }
    );
    fireEvent.click(
      screen.getByRole("button", { name: messages.community.postAnswer })
    );

    await waitFor(() =>
      expect(
        fetchMock.mock.calls.filter((c) => c[1]?.method !== "POST").length
      ).toBeGreaterThan(1)
    );
    // Still mounted while the refetch is in flight.
    expect(title).toBeInTheDocument();

    resolveRefetch({ ok: true, json: async () => makeThread() });
  });
});

describe("ThreadDetailClient — provenance chip", () => {
  it("renders under the title when the thread came from a lesson", async () => {
    getCoursesByIds.mockResolvedValue([
      { _id: "c1", title: "Solana 101", slug: "solana-101" },
    ]);
    getLessonsByIds.mockResolvedValue([
      { _id: "l1", title: "Accounts", slug: "accounts" },
    ]);
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => makeThread({ course_id: "c1", lesson_id: "l1" }),
    });

    renderWithIntl(<ThreadDetailClient shortId="abc" />);

    const chip = await screen.findByRole("link", { name: /From lesson/ });
    expect(chip).toHaveAttribute(
      "href",
      "/en/courses/solana-101/lessons/accounts"
    );
  });

  it("renders no chip for an unscoped thread, and asks for no titles", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => makeThread() });

    renderWithIntl(<ThreadDetailClient shortId="abc" />);
    await screen.findByRole("heading", { name: /Why is my PDA seed wrong/ });

    expect(screen.queryByRole("link", { name: /From lesson/ })).toBeNull();
    expect(getCoursesByIds).not.toHaveBeenCalled();
  });

  it("steps the body's authored headings below the page title", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => makeThread() });
    const { container } = renderWithIntl(<ThreadDetailClient shortId="abc" />);
    await screen.findByRole("heading", { name: /Why is my PDA seed wrong/ });

    // An authored `##` must not out-shout the question's own h1.
    const prose = container.querySelector(".prose");
    expect(prose?.querySelector("h2")?.textContent).toBe(
      "A heading in the body"
    );
    expect(prose?.className).toContain("prose-h2:");
    expect(prose?.className).toContain("prose-h1:text-base");
  });
});

describe("AnswerCard — accept control", () => {
  function renderCard(opts: {
    isThreadAuthor: boolean;
    currentUserId?: string;
    isAccepted?: boolean;
  }) {
    const onAccept = vi.fn();
    renderWithIntl(
      <AnswerCard
        answer={makeAnswer("a1", "Body text.", opts.isAccepted ?? false)}
        isThreadAuthor={opts.isThreadAuthor}
        currentUserId={opts.currentUserId}
        onVote={vi.fn()}
        onAccept={onAccept}
      />
    );
    return onAccept;
  }

  it("carries a VISIBLE label, not a bare floating checkmark", () => {
    const onAccept = renderCard({
      isThreadAuthor: true,
      currentUserId: "user-1",
    });
    const button = screen.getByRole("button", {
      name: messages.community.acceptThisAnswer,
    });
    // Previously an icon-only glyph whose only label was aria-label.
    expect(button).toHaveTextContent(messages.community.acceptThisAnswer);
    fireEvent.click(button);
    expect(onAccept).toHaveBeenCalledTimes(1);
  });

  it("is hidden from anyone who is not the thread author", () => {
    renderCard({ isThreadAuthor: false, currentUserId: "user-1" });
    expect(
      screen.queryByRole("button", {
        name: messages.community.acceptThisAnswer,
      })
    ).toBeNull();
  });

  it("is hidden on the thread author's OWN answer", () => {
    renderCard({ isThreadAuthor: true, currentUserId: "user-2" });
    expect(
      screen.queryByRole("button", {
        name: messages.community.acceptThisAnswer,
      })
    ).toBeNull();
  });

  it("reads as pressed once accepted", () => {
    renderCard({
      isThreadAuthor: true,
      currentUserId: "user-1",
      isAccepted: true,
    });
    expect(
      screen.getByRole("button", { name: messages.community.acceptedAnswer })
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("renders the answer body markdown", () => {
    renderWithIntl(
      <AnswerCard
        answer={makeAnswer("a1", "Use **checked_add** here.\n\nSecond para.")}
        isThreadAuthor={false}
        onVote={vi.fn()}
        onAccept={vi.fn()}
      />
    );
    expect(screen.getByText("checked_add").tagName).toBe("STRONG");
    expect(screen.getByText("Second para.")).toBeInTheDocument();
  });
});
