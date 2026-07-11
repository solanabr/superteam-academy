// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { ModerationClient } from "../moderation/moderation-client";
import messages from "@/messages/en.json";

// Render smoke only — FlagsPanel carries its own tests and fetches on mount,
// so it is stubbed with a hook that lets the test drive onCountChange.
const { onCountChangeRef } = vi.hoisted(() => ({
  onCountChangeRef: {
    current: undefined as ((count: number) => void) | undefined,
  },
}));

vi.mock("@/components/admin/flags-panel", () => ({
  FlagsPanel: ({ onCountChange }: { onCountChange?: (n: number) => void }) => {
    onCountChangeRef.current = onCountChange;
    return <div data-testid="flags-panel" />;
  },
}));

function renderClient() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ModerationClient />
    </NextIntlClientProvider>
  );
}

describe("ModerationClient (smoke)", () => {
  it("renders the i18n'd screen title and the flags panel, no badge at zero", () => {
    renderClient();
    expect(
      screen.getByRole("heading", { name: messages.admin.screens.moderation })
    ).toBeInTheDocument();
    expect(screen.getByTestId("flags-panel")).toBeInTheDocument();
    expect(screen.queryByText("3")).not.toBeInTheDocument();
  });

  it("shows the pending-flag badge when the panel reports a count", () => {
    renderClient();
    act(() => onCountChangeRef.current?.(3));
    expect(screen.getByText("3")).toBeInTheDocument();
    // ...and hides it again when the count drops back to zero.
    act(() => onCountChangeRef.current?.(0));
    expect(screen.queryByText("3")).not.toBeInTheDocument();
  });
});
