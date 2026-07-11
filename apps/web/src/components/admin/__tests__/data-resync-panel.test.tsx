// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { DataResyncPanel } from "../data-resync-panel";
import messages from "@/messages/en.json";

function renderPanel() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <DataResyncPanel />
    </NextIntlClientProvider>
  );
}

function typeWalletAndResync() {
  fireEvent.change(
    screen.getByPlaceholderText(messages.admin.resync.walletPlaceholder),
    { target: { value: "SomeWallet1111111111111111111111111111111" } }
  );
  fireEvent.click(screen.getByText(messages.admin.resync.resync));
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("DataResyncPanel action-error paths", () => {
  it("shows the localized fetch-error string (not the raw server message) on a non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: "boom: bad wallet" }),
      })
    );

    renderPanel();
    typeWalletAndResync();

    await waitFor(() =>
      expect(
        screen.getByText(messages.admin.resync.errorFetch)
      ).toBeInTheDocument()
    );
    expect(screen.queryByText(/boom: bad wallet/)).not.toBeInTheDocument();
    expect(console.error).toHaveBeenCalled();
  });

  it("shows the localized network-error string when the fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    renderPanel();
    typeWalletAndResync();

    await waitFor(() =>
      expect(
        screen.getByText(messages.admin.resync.errorNetwork)
      ).toBeInTheDocument()
    );
    expect(screen.queryByText(/offline/)).not.toBeInTheDocument();
  });
});
