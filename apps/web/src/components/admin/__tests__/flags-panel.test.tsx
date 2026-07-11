// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { FlagsPanel } from "../flags-panel";
import messages from "@/messages/en.json";

const flag = {
  id: "flag-1",
  reason: "spam",
  details: null,
  createdAt: "2026-07-01T00:00:00.000Z",
  reporter: "alice",
  targetType: "thread" as const,
  preview: "reported post",
  url: null,
};

function renderPanel() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <FlagsPanel />
    </NextIntlClientProvider>
  );
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("FlagsPanel action-error paths", () => {
  it("shows the localized fetch-error string (not the raw server message) on a non-ok action", async () => {
    const fetchMock = vi
      .fn()
      // initial load (GET)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ flags: [flag] }),
      })
      // resolve action (POST) — server sends a raw error we must not surface
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: "boom: internal DB error" }),
      });
    vi.stubGlobal("fetch", fetchMock);

    renderPanel();
    await waitFor(() =>
      expect(screen.getByText(messages.admin.flags.resolve)).toBeInTheDocument()
    );

    fireEvent.click(screen.getByText(messages.admin.flags.resolve));

    await waitFor(() =>
      expect(
        screen.getByText(messages.admin.flags.errorFetch)
      ).toBeInTheDocument()
    );
    // The raw server message stays out of the DOM (console-only for devtools).
    expect(
      screen.queryByText(/boom: internal DB error/)
    ).not.toBeInTheDocument();
    expect(console.error).toHaveBeenCalled();
  });

  it("shows the localized network-error string when the action fetch throws", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ flags: [flag] }),
      })
      .mockRejectedValueOnce(new Error("offline"));
    vi.stubGlobal("fetch", fetchMock);

    renderPanel();
    await waitFor(() =>
      expect(screen.getByText(messages.admin.flags.dismiss)).toBeInTheDocument()
    );

    fireEvent.click(screen.getByText(messages.admin.flags.dismiss));

    await waitFor(() =>
      expect(
        screen.getByText(messages.admin.flags.errorNetwork)
      ).toBeInTheDocument()
    );
    expect(screen.queryByText(/offline/)).not.toBeInTheDocument();
  });
});
