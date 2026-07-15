// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { ContentTabs } from "../content-tabs";
import messages from "@/messages/en.json";

function renderTabs() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ContentTabs
        questsSlot={<div>quests-content</div>}
        achievementsSlot={<div>achievements-content</div>}
        pathsSlot={<div>paths-content</div>}
      />
    </NextIntlClientProvider>
  );
}

describe("ContentTabs", () => {
  it("renders the three sub-view tabs (Quests / Achievements / Paths)", () => {
    renderTabs();
    expect(screen.getByRole("tab", { name: "Quests" })).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "Achievements" })
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Paths" })).toBeInTheDocument();
  });

  it("shows the Achievements sub-view by default", () => {
    renderTabs();
    expect(screen.getByText("achievements-content")).toBeInTheDocument();
  });

  it("switches to the Quests sub-view on click", () => {
    renderTabs();
    // Radix's TabsTrigger selects on `mousedown` (not `click`) — see
    // @radix-ui/react-tabs's TabsTrigger implementation.
    fireEvent.mouseDown(screen.getByRole("tab", { name: "Quests" }));
    expect(screen.getByText("quests-content")).toBeInTheDocument();
  });

  it("switches to the Paths sub-view on click", () => {
    renderTabs();
    fireEvent.mouseDown(screen.getByRole("tab", { name: "Paths" }));
    expect(screen.getByText("paths-content")).toBeInTheDocument();
  });
});
