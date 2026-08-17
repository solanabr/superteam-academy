// @vitest-environment jsdom
/* eslint-disable import/order -- setup must precede importing the component. */
import type { ReactElement } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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

// #977: the strip reads the ONE authoritative endpoint (/api/review/due,
// which runs the same buildReviewSession as the /review page) rather than
// re-deriving a count client-side with a weaker resolution rule.
const fetchMock = vi.fn<typeof fetch>();

function dueResponse(titles: string[]) {
  fetchMock.mockResolvedValue(
    new Response(JSON.stringify({ count: titles.length, titles }), {
      status: 200,
      headers: { "content-type": "application/json" },
    })
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ReviewStrip (LX-B6 dashboard due-review slot)", () => {
  it("names due items and deep-links to /review", async () => {
    dueResponse(["PDAs", "CPIs", "Signers"]);
    renderWithIntl(<ReviewStrip userId="user-1" />);

    const link = await screen.findByRole("link");
    expect(link).toHaveAttribute("href", "/en/review");
    expect(fetchMock).toHaveBeenCalledWith("/api/review/due");
    expect(screen.getByText("3 due for review")).toBeInTheDocument();
    for (const title of ["PDAs", "CPIs", "Signers"]) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
  });

  it("collapses overflow past the first three titles", async () => {
    dueResponse(["A", "B", "C", "D", "E"]);
    renderWithIntl(<ReviewStrip userId="user-1" />);
    await screen.findByRole("link");
    expect(screen.getByText("+2 more")).toBeInTheDocument();
  });

  it("renders nothing when the queue is empty (no strip)", async () => {
    dueResponse([]);
    const { container } = renderWithIntl(<ReviewStrip userId="user-1" />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(container.querySelector("a")).toBeNull();
  });

  it("renders nothing when the endpoint errors", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 500 }));
    const { container } = renderWithIntl(<ReviewStrip userId="user-1" />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(container.querySelector("a")).toBeNull();
  });

  it("does not query before the user id resolves", () => {
    renderWithIntl(<ReviewStrip userId={null} />);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
