// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { PublishPinClient } from "../courses/publish-pin-client";
import messages from "@/messages/en.json";

interface PinResponse {
  pin: { sha: string; counts: Record<string, number>; compiledAt?: string };
  head: { sha: string; checks: string };
  verdict: {
    state: string;
    commitsBehind: number | null;
    headChecks: string;
    warnRedHead: boolean;
  };
  repos: { content: string; app: string };
}

const PIN = "401c7df1035061337dd209ea8a8c7272d3223cbc";
const HEAD = "b".repeat(40);

const upToDate: PinResponse = {
  pin: { sha: PIN, counts: { courses: 6, lessons: 76 } },
  head: { sha: PIN, checks: "success" },
  verdict: {
    state: "up_to_date",
    commitsBehind: 0,
    headChecks: "success",
    warnRedHead: false,
  },
  repos: {
    content: "solanabr/courses-academy",
    app: "solanabr/superteam-academy",
  },
};

const drifted: PinResponse = {
  pin: { sha: PIN, counts: { courses: 6, lessons: 76 } },
  head: { sha: HEAD, checks: "success" },
  verdict: {
    state: "behind",
    commitsBehind: 3,
    headChecks: "success",
    warnRedHead: false,
  },
  repos: {
    content: "solanabr/courses-academy",
    app: "solanabr/superteam-academy",
  },
};

const driftedRedHead: PinResponse = {
  ...drifted,
  head: { sha: HEAD, checks: "failure" },
  verdict: { ...drifted.verdict, headChecks: "failure", warnRedHead: true },
};

function renderWithIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

function mockFetch(body: PinResponse, ok = true): void {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok,
      json: async () => body,
    })
  );
}

describe("PublishPinClient", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("shows 'up to date' and hides the prepare-PR section when the pin matches HEAD", async () => {
    mockFetch(upToDate);
    renderWithIntl(<PublishPinClient />);
    await waitFor(() =>
      expect(
        screen.getByText(messages.admin.publishPin.upToDate)
      ).toBeInTheDocument()
    );
    expect(
      screen.queryByText(messages.admin.publishPin.prepare.title)
    ).not.toBeInTheDocument();
  });

  it("shows the manual prepare-PR steps immediately (primary path, no disclosure) with the one-line diff + PR link", async () => {
    mockFetch(drifted);
    renderWithIntl(<PublishPinClient />);
    await screen.findByText(messages.admin.publishPin.prepare.title);
    // The drift count and the manual 3-step block are both visible up front —
    // there is no one-click publish path anymore, so nothing is tucked away.
    expect(screen.getByText("3 commits behind HEAD")).toBeInTheDocument();
    expect(screen.getByText(/"sha": "401c7df/)).toBeInTheDocument();
    const prLink = screen.getByRole("link", {
      name: messages.admin.publishPin.preparePrLink,
    });
    expect(prLink).toHaveAttribute(
      "href",
      expect.stringContaining("solanabr/superteam-academy/compare/main")
    );
  });

  it("warns loudly when HEAD's CI is red, inside the prepare-PR block", async () => {
    mockFetch(driftedRedHead);
    renderWithIntl(<PublishPinClient />);
    await waitFor(() =>
      expect(
        screen.getByText(messages.admin.publishPin.prepare.redHeadWarning)
      ).toBeInTheDocument()
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("copies the compile command to the clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    mockFetch(drifted);
    renderWithIntl(<PublishPinClient />);
    await screen.findByText(messages.admin.publishPin.prepare.title);
    fireEvent.click(screen.getByText(messages.admin.publishPin.copyCommand));
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(
        "pnpm --filter web compile-content"
      )
    );
  });

  it("shows the unavailable banner on a non-ok response", async () => {
    mockFetch(upToDate, false);
    renderWithIntl(<PublishPinClient />);
    await waitFor(() =>
      expect(
        screen.getByText(messages.admin.publishPin.unavailable)
      ).toBeInTheDocument()
    );
  });
});
