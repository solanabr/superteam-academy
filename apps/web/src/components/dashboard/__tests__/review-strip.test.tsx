// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import { ReviewStrip } from "../review-strip";

function renderWithIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

// #977 / #1096: the strip renders the ONE authoritative summary — the server
// shell's loadReviewDue runs the same buildReviewSession as the /review page
// and passes {count, titles} down as props.
describe("ReviewStrip (LX-B6 dashboard due-review slot)", () => {
  it("names due items and deep-links to /review", () => {
    renderWithIntl(
      <ReviewStrip count={3} titles={["PDAs", "CPIs", "Signers"]} />
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/en/review");
    expect(screen.getByText("3 due for review")).toBeInTheDocument();
    for (const title of ["PDAs", "CPIs", "Signers"]) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
  });

  it("collapses overflow past the first three titles", () => {
    renderWithIntl(
      <ReviewStrip count={5} titles={["A", "B", "C", "D", "E"]} />
    );
    expect(screen.getByText("+2 more")).toBeInTheDocument();
  });

  it("renders nothing when the queue is empty (no strip)", () => {
    const { container } = renderWithIntl(<ReviewStrip count={0} titles={[]} />);
    expect(container.querySelector("a")).toBeNull();
  });
});
