// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { DeployLegend } from "../courses/deploy-legend";
import messages from "@/messages/en.json";

function renderWithIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

const legend = messages.admin.coursesScreen.legend;

describe("DeployLegend disclosure", () => {
  it("renders collapsed by default: title trigger shown, body hidden", () => {
    renderWithIntl(<DeployLegend />);
    const trigger = screen.getByRole("button", { name: legend.title });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    // The reference body (headings, per-state copy) is not mounted while collapsed.
    expect(screen.queryByText(legend.onChainHeading)).not.toBeInTheDocument();
    expect(screen.queryByText(legend.description)).not.toBeInTheDocument();
  });

  it("reveals the legend body and flips aria-expanded on toggle", () => {
    renderWithIntl(<DeployLegend />);
    const trigger = screen.getByRole("button", { name: legend.title });

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(legend.onChainHeading)).toBeInTheDocument();
    expect(screen.getByText(legend.driftHeading)).toBeInTheDocument();
    expect(screen.getByText(legend.immutableTitle)).toBeInTheDocument();

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText(legend.onChainHeading)).not.toBeInTheDocument();
  });
});
