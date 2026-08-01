// @vitest-environment jsdom
import type { ReactElement } from "react";
import { it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import type { PartnerMessage } from "@/lib/ai/use-ai-partner";
import { MessageList } from "../message-list";

const trackProposeAccepted = vi.fn();
vi.mock("@/lib/analytics/events", () => ({
  trackProposeAccepted: (...args: unknown[]) => trackProposeAccepted(...args),
  trackComprehensionCheckAnswered: vi.fn(),
}));

function renderWithIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

const proposeMessages: PartnerMessage[] = [
  {
    role: "ai",
    response: {
      type: "propose",
      rationale: "adds b",
      edits: [{ search: "a", replace: "a\nb" }],
      check: {
        question: "Why?",
        options: ["A", "B", "C"],
      },
      checkToken: "tok",
    },
  },
];

it("renders a post-pass review with its summary and idiomatic notes", () => {
  const reviewMessages: PartnerMessage[] = [
    {
      role: "ai",
      response: {
        type: "review",
        summary: "Your solution passes and is clear.",
        notes: ["Use iter().sum().", "Rename n to count."],
      },
    },
  ];

  renderWithIntl(
    <MessageList
      messages={reviewMessages}
      onApply={() => {}}
      getCode={() => "a"}
      onVerify={vi.fn()}
    />
  );

  expect(
    screen.getByText("Your solution passes and is clear.")
  ).toBeInTheDocument();
  expect(screen.getByText("Use iter().sum().")).toBeInTheDocument();
  expect(screen.getByText("Rename n to count.")).toBeInTheDocument();
});

it("renders an already-idiomatic review (empty notes) with just the summary", () => {
  const reviewMessages: PartnerMessage[] = [
    {
      role: "ai",
      response: {
        type: "review",
        summary: "Already idiomatic — nothing to change.",
        notes: [],
      },
    },
  ];

  renderWithIntl(
    <MessageList
      messages={reviewMessages}
      onApply={() => {}}
      getCode={() => "a"}
      onVerify={vi.fn()}
    />
  );

  expect(
    screen.getByText("Already idiomatic — nothing to change.")
  ).toBeInTheDocument();
  // No list is rendered when there are no notes.
  expect(screen.queryByRole("list")).not.toBeInTheDocument();
});

// #947: Accept stays gated on the earned-Accept comprehension seal, and the
// accepted patch reports exactly one `propose_accepted`.
it("keeps Accept locked until the check is verified, then applies once and tracks once", async () => {
  const onApply = vi.fn();
  const onVerify = vi.fn(async () => ({ correct: true, explanation: "" }));
  trackProposeAccepted.mockReset();

  renderWithIntl(
    <MessageList
      messages={proposeMessages}
      onApply={onApply}
      getCode={() => "a"}
      onVerify={onVerify}
      eventCtx={{ lessonId: "l", courseId: "c", challengeKind: "js" }}
    />
  );

  const accept = screen.getByRole("button", {
    name: messages.aiPartner.diff.accept,
  });
  // Comprehension seal not yet passed: Accept is inert and nothing is applied.
  expect(accept).toBeDisabled();
  fireEvent.click(accept);
  expect(onApply).not.toHaveBeenCalled();
  expect(trackProposeAccepted).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole("button", { name: "A" }));
  await screen.findByText(messages.aiPartner.diff.checkCorrect);

  fireEvent.click(
    screen.getByRole("button", { name: messages.aiPartner.diff.accept })
  );
  expect(onApply).toHaveBeenCalledTimes(1);
  expect(onApply).toHaveBeenCalledWith("a\nb");
  // Exactly once per accepted propose — the card latches after its one Accept.
  expect(trackProposeAccepted).toHaveBeenCalledTimes(1);
  expect(trackProposeAccepted).toHaveBeenCalledWith({
    lessonId: "l",
    courseId: "c",
    challengeKind: "js",
  });
});

it("dismisses a proposal when Dismiss is clicked", () => {
  renderWithIntl(
    <MessageList
      messages={proposeMessages}
      onApply={() => {}}
      getCode={() => "a"}
      onVerify={vi.fn()}
    />
  );

  // The DiffCard's diff content is visible before dismissal.
  expect(screen.getByText("adds b")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));

  // The proposal (and its diff) is gone after dismissal.
  expect(screen.queryByText("adds b")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /dismiss/i })
  ).not.toBeInTheDocument();
});
