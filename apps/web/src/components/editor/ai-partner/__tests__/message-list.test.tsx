// @vitest-environment jsdom
import type { ReactElement } from "react";
import { it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import type { PartnerMessage } from "@/lib/ai/use-ai-partner";
import { MessageList } from "../message-list";

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
