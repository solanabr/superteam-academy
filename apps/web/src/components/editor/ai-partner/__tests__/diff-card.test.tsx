// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import type { CodeEdit } from "@/lib/ai/partner-types";
import { DiffCard } from "../diff-card";

const { trackEvent } = vi.hoisted(() => ({ trackEvent: vi.fn() }));
vi.mock("@/lib/analytics/index", () => ({ trackEvent }));

const check = {
  question: "Why?",
  options: ["A", "B", "C"] as [string, string, string],
};

// Applied to current "a", this yields the proposed buffer "a\nb" (a real
// newline): the edit path is search/replace, not a whole-file echo.
const ADD_B: CodeEdit[] = [{ search: "a", replace: "a\nb" }];

function renderWithIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

it("gates Accept behind a correct answer and only applies on the Accept click", async () => {
  const onAccept = vi.fn();
  const onVerify = vi
    .fn()
    .mockResolvedValueOnce({ correct: false, explanation: "because B" })
    .mockResolvedValueOnce({ correct: true, explanation: "because B" });

  renderWithIntl(
    <DiffCard
      current="a"
      edits={ADD_B}
      rationale="adds b"
      check={check}
      checkToken="tok"
      onVerify={onVerify}
      onAccept={onAccept}
      onReject={() => {}}
      stale={false}
    />
  );

  // The check is shown immediately; Accept starts locked.
  expect(screen.getByRole("button", { name: "A" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /accept/i })).toBeDisabled();

  // Wrong pick: verified, not applied, explanation shown, Accept stays locked.
  fireEvent.click(screen.getByRole("button", { name: "A" }));
  await waitFor(() => expect(onVerify).toHaveBeenCalledWith("tok", 0));
  expect(onAccept).not.toHaveBeenCalled();
  await screen.findByText(/because B/);
  expect(screen.getByRole("button", { name: /accept/i })).toBeDisabled();

  // Correct pick: unlocks Accept but does NOT apply the code yet.
  fireEvent.click(screen.getByRole("button", { name: "B" }));
  await waitFor(() => expect(onVerify).toHaveBeenCalledWith("tok", 1));
  expect(onAccept).not.toHaveBeenCalled();
  await waitFor(() =>
    expect(screen.getByRole("button", { name: /accept/i })).not.toBeDisabled()
  );

  // Only the explicit Accept click applies the reconstructed buffer.
  fireEvent.click(screen.getByRole("button", { name: /accept/i }));
  expect(onAccept).toHaveBeenCalledWith("a\nb");

  // After applying, the card confirms and retires the action buttons.
  expect(screen.getByText(/applied to your code/i)).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /accept/i })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /dismiss/i })
  ).not.toBeInTheDocument();
});

it("Accept is disabled when stale", () => {
  renderWithIntl(
    <DiffCard
      current="a"
      edits={[{ search: "a", replace: "b" }]}
      rationale=""
      check={check}
      checkToken="tok"
      onVerify={vi.fn()}
      onAccept={() => {}}
      onReject={() => {}}
      stale={true}
    />
  );
  expect(screen.getByRole("button", { name: /accept/i })).toBeDisabled();
});

describe("DiffCard additional behavior", () => {
  it("shows the comprehension check immediately", () => {
    renderWithIntl(
      <DiffCard
        current="a"
        edits={ADD_B}
        rationale="adds b"
        check={check}
        checkToken="tok"
        onVerify={vi.fn()}
        onAccept={() => {}}
        onReject={() => {}}
        stale={false}
      />
    );
    expect(screen.getByRole("button", { name: "A" })).toBeInTheDocument();
    expect(screen.getByText(check.question)).toBeInTheDocument();
  });

  it("calls onReject when Dismiss is clicked", () => {
    const onReject = vi.fn();
    renderWithIntl(
      <DiffCard
        current="a"
        edits={ADD_B}
        rationale="adds b"
        check={check}
        checkToken="tok"
        onVerify={vi.fn()}
        onAccept={() => {}}
        onReject={onReject}
        stale={false}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(onReject).toHaveBeenCalledTimes(1);
  });

  it("renders the rationale text", () => {
    renderWithIntl(
      <DiffCard
        current="a"
        edits={ADD_B}
        rationale="adds b for clarity"
        check={check}
        checkToken="tok"
        onVerify={vi.fn()}
        onAccept={() => {}}
        onReject={() => {}}
        stale={false}
      />
    );
    expect(screen.getByText("adds b for clarity")).toBeInTheDocument();
  });

  it("does not unlock Accept and stays retryable when onVerify throws", async () => {
    const onAccept = vi.fn();
    const onVerify = vi.fn().mockRejectedValue(new Error("network down"));
    renderWithIntl(
      <DiffCard
        current="a"
        edits={ADD_B}
        rationale="adds b"
        check={check}
        checkToken="tok"
        onVerify={onVerify}
        onAccept={onAccept}
        onReject={() => {}}
        stale={false}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "A" }));

    await waitFor(() => expect(onVerify).toHaveBeenCalled());
    expect(onAccept).not.toHaveBeenCalled();
    // Accept stays locked; the options remain retryable (not stuck disabled).
    expect(screen.getByRole("button", { name: /accept/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: "A" })).not.toBeDisabled();
  });

  it("disables option buttons while a verify is in flight", async () => {
    let resolveVerify!: (v: { correct: boolean; explanation: string }) => void;
    const onVerify = vi.fn(
      () =>
        new Promise<{ correct: boolean; explanation: string }>((resolve) => {
          resolveVerify = resolve;
        })
    );
    renderWithIntl(
      <DiffCard
        current="a"
        edits={ADD_B}
        rationale="adds b"
        check={check}
        checkToken="tok"
        onVerify={onVerify}
        onAccept={() => {}}
        onReject={() => {}}
        stale={false}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "A" }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "A" })).toBeDisabled()
    );

    resolveVerify({ correct: false, explanation: "nope" });
    await screen.findByText(/nope/);
  });

  it("degrades to a textual edit (no Accept, no check) when the edit does not apply", () => {
    const onAccept = vi.fn();
    renderWithIntl(
      <DiffCard
        current="totally different buffer"
        edits={[{ search: "NOT_IN_BUFFER", replace: "the replacement" }]}
        rationale="adds a guard"
        check={check}
        checkToken="tok"
        onVerify={vi.fn()}
        onAccept={onAccept}
        onReject={() => {}}
        stale={false}
      />
    );

    // The learner sees why it couldn't auto-apply plus the edit spelled out.
    expect(
      screen.getByText(/couldn't be applied automatically/i)
    ).toBeInTheDocument();
    expect(screen.getByText("NOT_IN_BUFFER")).toBeInTheDocument();
    expect(screen.getByText("the replacement")).toBeInTheDocument();
    expect(screen.getByText("adds a guard")).toBeInTheDocument();

    // No Accept (the buffer is never mutated from a failed edit) and no check;
    // the proposal can still be dismissed.
    expect(
      screen.queryByRole("button", { name: /^accept$/i })
    ).not.toBeInTheDocument();
    expect(screen.queryByText(check.question)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /dismiss/i })
    ).toBeInTheDocument();
    expect(onAccept).not.toHaveBeenCalled();
  });
});

// ── comprehension_check_answered (#866) ───────────────────────────────
// THE primary AI harm metric: first-attempt accuracy on the check that gates
// applying an AI-proposed patch. Asserted through the analytics facade so the
// payload shape (`trackComprehensionCheckAnswered` → `trackEvent`) is covered
// end to end, not just the helper call.

const EVENT_CTX = {
  lessonId: "lesson-anchor-pda",
  courseId: "course-solana-201",
  challengeKind: "rust" as const,
};

describe("comprehension_check_answered", () => {
  beforeEach(() => {
    trackEvent.mockClear();
  });

  it("fires attempt 1 with the wrong verdict, then attempt 2 on the retry", async () => {
    const onVerify = vi
      .fn()
      .mockResolvedValueOnce({ correct: false, explanation: "because B" })
      .mockResolvedValueOnce({ correct: true, explanation: "because B" });

    renderWithIntl(
      <DiffCard
        current="a"
        edits={ADD_B}
        rationale="adds b"
        check={check}
        checkToken="tok"
        onVerify={onVerify}
        onAccept={() => {}}
        onReject={() => {}}
        stale={false}
        eventCtx={EVENT_CTX}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "A" }));
    await waitFor(() =>
      expect(trackEvent).toHaveBeenCalledWith("comprehension_check_answered", {
        lessonId: "lesson-anchor-pda",
        courseId: "course-solana-201",
        correct: false,
        attempt: 1,
      })
    );

    // Retries are free and unlimited: the second answer still fires, carrying
    // the running counter so remediation depth is measurable.
    fireEvent.click(screen.getByRole("button", { name: "B" }));
    await waitFor(() =>
      expect(trackEvent).toHaveBeenCalledWith("comprehension_check_answered", {
        lessonId: "lesson-anchor-pda",
        courseId: "course-solana-201",
        correct: true,
        attempt: 2,
      })
    );
    expect(trackEvent).toHaveBeenCalledTimes(2);
  });

  it("fires attempt 1 with correct:true when the first answer is right", async () => {
    const onVerify = vi
      .fn()
      .mockResolvedValue({ correct: true, explanation: "yes" });

    renderWithIntl(
      <DiffCard
        current="a"
        edits={ADD_B}
        rationale="adds b"
        check={check}
        checkToken="tok"
        onVerify={onVerify}
        onAccept={() => {}}
        onReject={() => {}}
        stale={false}
        eventCtx={EVENT_CTX}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "B" }));
    await waitFor(() =>
      expect(trackEvent).toHaveBeenCalledWith("comprehension_check_answered", {
        lessonId: "lesson-anchor-pda",
        courseId: "course-solana-201",
        correct: true,
        attempt: 1,
      })
    );
  });

  it("restarts the attempt counter for a NEW check instance (new seal token)", async () => {
    const onVerify = vi
      .fn()
      .mockResolvedValue({ correct: false, explanation: "nope" });

    const card = (token: string) => (
      <DiffCard
        current="a"
        edits={ADD_B}
        rationale="adds b"
        check={check}
        checkToken={token}
        onVerify={onVerify}
        onAccept={() => {}}
        onReject={() => {}}
        stale={false}
        eventCtx={EVENT_CTX}
      />
    );

    const { rerender } = renderWithIntl(card("tok-1"));
    fireEvent.click(screen.getByRole("button", { name: "A" }));
    await waitFor(() => expect(trackEvent).toHaveBeenCalledTimes(1));
    expect(trackEvent).toHaveBeenLastCalledWith(
      "comprehension_check_answered",
      expect.objectContaining({ attempt: 1 })
    );

    // A new proposed patch mints a new seal — a different check, so the
    // first-attempt denominator must count it as attempt 1, not attempt 2.
    rerender(
      <NextIntlClientProvider locale="en" messages={messages}>
        {card("tok-2")}
      </NextIntlClientProvider>
    );
    fireEvent.click(screen.getByRole("button", { name: "A" }));
    await waitFor(() => expect(trackEvent).toHaveBeenCalledTimes(2));
    expect(trackEvent).toHaveBeenLastCalledWith(
      "comprehension_check_answered",
      expect.objectContaining({ attempt: 1 })
    );
  });

  it("does not fire when no check is rendered (the edit did not apply)", async () => {
    renderWithIntl(
      <DiffCard
        current="totally different buffer"
        edits={[{ search: "NOT_IN_BUFFER", replace: "x" }]}
        rationale="adds a guard"
        check={check}
        checkToken="tok"
        onVerify={vi.fn()}
        onAccept={() => {}}
        onReject={() => {}}
        stale={false}
        eventCtx={EVENT_CTX}
      />
    );

    expect(screen.queryByText(check.question)).not.toBeInTheDocument();
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it("does not count a failed verify round trip as a wrong answer", async () => {
    const onVerify = vi
      .fn()
      .mockResolvedValueOnce({ correct: false, explanation: "", failed: true })
      .mockResolvedValueOnce({ correct: false, explanation: "because B" });

    renderWithIntl(
      <DiffCard
        current="a"
        edits={ADD_B}
        rationale="adds b"
        check={check}
        checkToken="tok"
        onVerify={onVerify}
        onAccept={() => {}}
        onReject={() => {}}
        stale={false}
        eventCtx={EVENT_CTX}
      />
    );

    // Transport failure: no verdict, so no event and no attempt consumed.
    fireEvent.click(screen.getByRole("button", { name: "A" }));
    await waitFor(() => expect(onVerify).toHaveBeenCalledTimes(1));
    expect(trackEvent).not.toHaveBeenCalled();

    // The learner's next real answer is still their FIRST attempt.
    fireEvent.click(screen.getByRole("button", { name: "A" }));
    await waitFor(() =>
      expect(trackEvent).toHaveBeenCalledWith("comprehension_check_answered", {
        lessonId: "lesson-anchor-pda",
        courseId: "course-solana-201",
        correct: false,
        attempt: 1,
      })
    );
  });
});
