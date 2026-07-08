// @vitest-environment jsdom
import type { ReactElement } from "react";
import { it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { MessageList } from "../message-list";
import messages from "@/messages/en.json";
import type { PartnerMessage } from "@/lib/ai/use-ai-partner";

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
      proposedCode: "a\nb",
      check: {
        question: "Why?",
        options: ["A", "B", "C"],
      },
      checkToken: "tok",
    },
  },
];

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
