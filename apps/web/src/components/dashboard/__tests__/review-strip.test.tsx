// @vitest-environment jsdom
/* eslint-disable import/order -- vi.mock calls must precede importing the component. */
import type { ReactElement } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { DueReviewItem } from "@/lib/review/due-items";
import type { LessonSummary } from "@/lib/content/queries";
import messages from "@/messages/en.json";

const { getDueReviewItems, getLessonsByIds } = vi.hoisted(() => ({
  getDueReviewItems: vi.fn<() => Promise<DueReviewItem[]>>(),
  getLessonsByIds: vi.fn<() => Promise<LessonSummary[]>>(),
}));

vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({}) }));
vi.mock("@/lib/review/due-items", async () => {
  const actual = await vi.importActual<typeof import("@/lib/review/due-items")>(
    "@/lib/review/due-items"
  );
  return { ...actual, getDueReviewItems };
});
vi.mock("@/lib/content/client-queries", () => ({ getLessonsByIds }));

import { ReviewStrip } from "../review-strip";

function renderWithIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

const due = (k: string): DueReviewItem => ({
  item_key: k,
  box: 1,
  due_at: "2026-07-26T00:00:00Z",
  lapses: 0,
});
const lesson = (id: string, title: string): LessonSummary => ({
  _id: id,
  title,
  slug: id,
});

beforeEach(() => vi.clearAllMocks());

describe("ReviewStrip (LX-B6 dashboard due-review slot)", () => {
  it("names due items and deep-links to /review", async () => {
    getDueReviewItems.mockResolvedValue([due("l1"), due("l2"), due("l3")]);
    getLessonsByIds.mockResolvedValue([
      lesson("l1", "PDAs"),
      lesson("l2", "CPIs"),
      lesson("l3", "Signers"),
    ]);
    renderWithIntl(<ReviewStrip userId="user-1" />);

    const link = await screen.findByRole("link");
    expect(link).toHaveAttribute("href", "/en/review");
    expect(screen.getByText("3 due for review")).toBeInTheDocument();
    // Titles render as individual list rows now, not a joined line.
    for (const title of ["PDAs", "CPIs", "Signers"]) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
  });

  it("collapses overflow past the first three titles", async () => {
    getDueReviewItems.mockResolvedValue(
      ["l1", "l2", "l3", "l4", "l5"].map(due)
    );
    getLessonsByIds.mockResolvedValue([
      lesson("l1", "A"),
      lesson("l2", "B"),
      lesson("l3", "C"),
      lesson("l4", "D"),
      lesson("l5", "E"),
    ]);
    renderWithIntl(<ReviewStrip userId="user-1" />);
    await screen.findByRole("link");
    expect(screen.getByText("+2 more")).toBeInTheDocument();
  });

  it("renders nothing when the queue is empty (no strip)", async () => {
    getDueReviewItems.mockResolvedValue([]);
    const { container } = renderWithIntl(<ReviewStrip userId="user-1" />);
    await waitFor(() => expect(getDueReviewItems).toHaveBeenCalled());
    expect(container.querySelector("a")).toBeNull();
  });

  it("does not query before the user id resolves", () => {
    renderWithIntl(<ReviewStrip userId={null} />);
    expect(getDueReviewItems).not.toHaveBeenCalled();
  });
});
