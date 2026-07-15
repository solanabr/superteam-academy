// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { PinStatusBadge } from "../pin-status-badge";
import messages from "@/messages/en.json";

function renderBadge() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <PinStatusBadge />
    </NextIntlClientProvider>
  );
}

function mockPinFetch(ok: boolean, body: unknown = {}) {
  const fetchMock = vi
    .fn()
    .mockResolvedValue({ ok, json: async () => body } as Response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("PinStatusBadge — reuses GET /api/admin/publish/pin, no new endpoint", () => {
  it("shows 'Bundle pinned' when up to date", async () => {
    const fetchMock = mockPinFetch(true, {
      verdict: { state: "up_to_date", commitsBehind: 0 },
    });
    renderBadge();

    await waitFor(() => {
      expect(screen.getByText("Bundle pinned")).toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/admin/publish/pin");
  });

  it("shows the commits-behind count when drifted", async () => {
    mockPinFetch(true, {
      verdict: { state: "behind", commitsBehind: 4 },
    });
    renderBadge();

    await waitFor(() => {
      expect(screen.getByText("4 commits behind")).toBeInTheDocument();
    });
  });

  it("falls back to a generic drifted label when the commit count is unknown", async () => {
    mockPinFetch(true, {
      verdict: { state: "behind", commitsBehind: null },
    });
    renderBadge();

    await waitFor(() => {
      expect(screen.getByText("Bundle drifted")).toBeInTheDocument();
    });
  });

  it("shows 'Pin status unavailable' when the route 503s", async () => {
    mockPinFetch(false);
    renderBadge();

    await waitFor(() => {
      expect(screen.getByText("Pin status unavailable")).toBeInTheDocument();
    });
  });
});
