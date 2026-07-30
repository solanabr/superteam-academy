// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { Lesson, OpenEndedBlockData } from "@superteam-lms/types";
import messages from "@/messages/en.json";
import { OpenEndedBlock } from "../open-ended-block";
import type { BlockContext } from "../types";

const block: OpenEndedBlockData = {
  _type: "openEnded",
  key: "reflect",
  prompt: "What did you take away from this course?",
  maxWords: 250,
};

const lesson: Lesson = {
  _id: "lesson-1",
  title: "Lesson",
  slug: "lesson",
  blocks: [block],
};

function makeCtx(overrides: Partial<BlockContext> = {}): BlockContext {
  return {
    lesson,
    courseSlug: "course",
    courseId: "course-1",
    locale: "en",
    isEnrolled: true,
    isCompleted: false,
    xpReward: 30,
    earnedXp: null,
    onEnroll: vi.fn(),
    setProof: vi.fn(),
    setQuizAnswered: vi.fn(),
    aiSuppressed: true,
    capstoneAiOff: false,
    buildUuid: null,
    programKeypairSecret: null,
    resetBuild: vi.fn(),
    ...overrides,
  };
}

function renderWithIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

function textarea(): HTMLElement {
  return screen.getByLabelText(block.prompt);
}

function submitButton(): HTMLElement {
  return screen.getByRole("button");
}

function stubReflectFetch(reply: string | null, ok = true) {
  const fetchMock = vi.fn(async () => ({
    ok,
    json: async () => ({ seal: "seal-abc", reply }),
  }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("OpenEndedBlock — word limit (#848: maxWords counts words, not chars)", () => {
  it("shows the block's word cap and counts words", () => {
    renderWithIntl(<OpenEndedBlock block={block} ctx={makeCtx()} />);
    expect(screen.getByText("0/250")).toBeInTheDocument();

    fireEvent.change(textarea(), {
      target: { value: "five words of long reflection" },
    });
    expect(screen.getByText("5/250")).toBeInTheDocument();
  });

  it("defaults to 200 words when the block sets no maxWords", () => {
    const noCap: OpenEndedBlockData = { ...block, maxWords: null };
    renderWithIntl(<OpenEndedBlock block={noCap} ctx={makeCtx()} />);
    expect(screen.getByText("0/200")).toBeInTheDocument();
  });

  it("disables submit when empty or over the word cap — chars alone never trip it", () => {
    const tiny: OpenEndedBlockData = { ...block, maxWords: 20 };
    renderWithIntl(<OpenEndedBlock block={tiny} ctx={makeCtx()} />);
    expect(submitButton()).toBeDisabled();

    // One very long word: far over 200 CHARS, still 1/20 words → submittable.
    fireEvent.change(textarea(), { target: { value: "x".repeat(400) } });
    expect(screen.getByText("1/20")).toBeInTheDocument();
    expect(submitButton()).toBeEnabled();

    fireEvent.change(textarea(), {
      target: { value: Array(21).fill("word").join(" ") },
    });
    expect(screen.getByText("21/20")).toBeInTheDocument();
    expect(submitButton()).toBeDisabled();
  });
});

describe("OpenEndedBlock — seal + one-round AI reply", () => {
  it("records the seal as proof and renders the AI reply when present", async () => {
    stubReflectFetch("Nice reflection — the rails distinction is exactly it.");
    const setProof = vi.fn();
    renderWithIntl(
      <OpenEndedBlock block={block} ctx={makeCtx({ setProof })} />
    );

    fireEvent.change(textarea(), { target: { value: "my honest takeaway" } });
    fireEvent.click(submitButton());

    await waitFor(() =>
      expect(screen.getByText("Reflection recorded")).toBeInTheDocument()
    );
    expect(setProof).toHaveBeenCalledWith("reflect", "seal-abc");
    expect(screen.getByText("Feedback")).toBeInTheDocument();
    expect(
      screen.getByText("Nice reflection — the rails distinction is exactly it.")
    ).toBeInTheDocument();
  });

  it("still seals with no reply block when the AI reply is null (degraded/disabled)", async () => {
    stubReflectFetch(null);
    const setProof = vi.fn();
    renderWithIntl(
      <OpenEndedBlock block={block} ctx={makeCtx({ setProof })} />
    );

    fireEvent.change(textarea(), { target: { value: "my honest takeaway" } });
    fireEvent.click(submitButton());

    await waitFor(() =>
      expect(screen.getByText("Reflection recorded")).toBeInTheDocument()
    );
    expect(setProof).toHaveBeenCalledWith("reflect", "seal-abc");
    expect(screen.queryByText("Feedback")).not.toBeInTheDocument();
  });

  it("is one round only: after a reply, submit is disabled (no second round)", async () => {
    const fetchMock = stubReflectFetch("One round of feedback.");
    renderWithIntl(<OpenEndedBlock block={block} ctx={makeCtx()} />);

    fireEvent.change(textarea(), { target: { value: "my honest takeaway" } });
    fireEvent.click(submitButton());

    await waitFor(() =>
      expect(screen.getByText("One round of feedback.")).toBeInTheDocument()
    );
    const done = screen.getByRole("button", { name: /Reflection recorded/ });
    expect(done).toBeDisabled();
    fireEvent.click(done);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("shows the error state without recording proof when the POST fails", async () => {
    stubReflectFetch(null, false);
    const setProof = vi.fn();
    renderWithIntl(
      <OpenEndedBlock block={block} ctx={makeCtx({ setProof })} />
    );

    fireEvent.change(textarea(), { target: { value: "my honest takeaway" } });
    fireEvent.click(submitButton());

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "We couldn't record your reflection. Please try again."
      )
    );
    expect(setProof).not.toHaveBeenCalled();
  });
});
