// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import { ThreadComposer } from "../thread-composer";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({ order: async () => ({ data: [] }) }),
    }),
  }),
}));

// Course-scoped so the category select stays out of the tab order — the
// radiogroup is the unit under test.
function renderComposer() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ThreadComposer defaultScope={{ courseId: "c" }} onCancel={vi.fn()} />
    </NextIntlClientProvider>
  );
}

const question = () =>
  screen.getByRole("radio", { name: messages.community.question });
const discussion = () =>
  screen.getByRole("radio", { name: messages.community.discussion });

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ThreadComposer type toggle — radiogroup keyboard contract (#971)", () => {
  it("is one tab stop: only the checked radio is tabbable", async () => {
    const user = userEvent.setup();
    renderComposer();

    expect(question()).toHaveAttribute("tabindex", "0");
    expect(discussion()).toHaveAttribute("tabindex", "-1");

    await user.tab();
    expect(question()).toHaveFocus();

    // The next Tab leaves the group entirely instead of visiting the
    // unchecked radio.
    await user.tab();
    expect(discussion()).not.toHaveFocus();
  });

  it("ArrowRight/ArrowDown move selection and focus forward", async () => {
    const user = userEvent.setup();
    renderComposer();

    await user.tab();
    await user.keyboard("{ArrowRight}");

    expect(discussion()).toHaveFocus();
    expect(discussion()).toHaveAttribute("aria-checked", "true");
    expect(question()).toHaveAttribute("aria-checked", "false");
    // Roving tabindex followed the selection.
    expect(discussion()).toHaveAttribute("tabindex", "0");
    expect(question()).toHaveAttribute("tabindex", "-1");

    // ArrowDown wraps from the last radio back to the first.
    await user.keyboard("{ArrowDown}");
    expect(question()).toHaveFocus();
    expect(question()).toHaveAttribute("aria-checked", "true");
  });

  it("ArrowLeft/ArrowUp move selection backward with wrap-around", async () => {
    const user = userEvent.setup();
    renderComposer();

    await user.tab();
    await user.keyboard("{ArrowLeft}");
    expect(discussion()).toHaveFocus();
    expect(discussion()).toHaveAttribute("aria-checked", "true");

    await user.keyboard("{ArrowUp}");
    expect(question()).toHaveFocus();
    expect(question()).toHaveAttribute("aria-checked", "true");
  });

  it("click still selects", async () => {
    const user = userEvent.setup();
    renderComposer();

    await user.click(discussion());
    expect(discussion()).toHaveAttribute("aria-checked", "true");
    expect(discussion()).toHaveAttribute("tabindex", "0");
  });
});
