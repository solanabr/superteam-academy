// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import { AdminNav } from "../admin-nav";

const { usePathnameMock } = vi.hoisted(() => ({
  usePathnameMock: vi.fn<() => string>(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => usePathnameMock(),
}));

function renderWithIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

const nav = messages.admin.nav;

/** Stub the badge's `GET /api/admin/flags` with a given pending-flag count. */
function mockFlags(count: number) {
  const flags = Array.from({ length: count }, (_, i) => ({ id: `f${i}` }));
  const fetchMock = vi
    .fn()
    .mockResolvedValue({ ok: true, json: async () => ({ flags }) } as Response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  usePathnameMock.mockReset();
  usePathnameMock.mockReturnValue("/en/admin/status");
  mockFlags(0);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("AdminNav", () => {
  it("renders exactly the four section links pointing at locale-prefixed routes", () => {
    renderWithIntl(<AdminNav />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(4);

    expect(screen.getByRole("link", { name: nav.courses })).toHaveAttribute(
      "href",
      "/en/admin/courses"
    );
    expect(screen.getByRole("link", { name: nav.moderation })).toHaveAttribute(
      "href",
      "/en/admin/moderation"
    );
    expect(screen.getByRole("link", { name: nav.insights })).toHaveAttribute(
      "href",
      "/en/admin/insights"
    );
    expect(screen.getByRole("link", { name: nav.status })).toHaveAttribute(
      "href",
      "/en/admin/status"
    );
  });

  // #1136 folded Content into Courses; publish/deploy went the same way earlier.
  it("no longer offers the retired Publish / Deploy / Content entries", () => {
    renderWithIntl(<AdminNav />);
    const hrefs = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));
    expect(hrefs).not.toContain("/en/admin/publish");
    expect(hrefs).not.toContain("/en/admin/deploy");
    expect(hrefs).not.toContain("/en/admin/content");
  });

  it("labels the nav landmark from the admin namespace", () => {
    renderWithIntl(<AdminNav />);
    expect(
      screen.getByRole("navigation", { name: messages.admin.console.navLabel })
    ).toBeInTheDocument();
  });

  it("marks only the active route with aria-current=page", () => {
    usePathnameMock.mockReturnValue("/en/admin/courses");
    renderWithIntl(<AdminNav />);

    expect(screen.getByRole("link", { name: nav.courses })).toHaveAttribute(
      "aria-current",
      "page"
    );
    for (const label of [nav.moderation, nav.insights, nav.status]) {
      expect(screen.getByRole("link", { name: label })).not.toHaveAttribute(
        "aria-current"
      );
    }
  });

  it("keeps a sub-path of a section active (startsWith match)", () => {
    usePathnameMock.mockReturnValue("/en/admin/courses/some-detail");
    renderWithIntl(<AdminNav />);
    expect(screen.getByRole("link", { name: nav.courses })).toHaveAttribute(
      "aria-current",
      "page"
    );
  });

  it("shows a pending-flag badge on Moderation once the count fetch resolves", async () => {
    mockFlags(4);
    renderWithIntl(<AdminNav />);

    await waitFor(() => {
      const link = screen.getByRole("link", { name: /Moderation/ });
      expect(link).toHaveTextContent("4");
    });
    // The badge carries a pluralized, i18n'd accessible name.
    expect(screen.getByLabelText("4 pending flags")).toHaveTextContent("4");
    // The badge is scoped to Moderation, not other sections.
    expect(
      screen.getByRole("link", { name: nav.courses })
    ).not.toHaveTextContent("4");
  });

  it("renders no badge when there are zero pending flags", async () => {
    mockFlags(0);
    renderWithIntl(<AdminNav />);

    // Give the async fetch a chance to resolve, then assert nothing appeared.
    const link = await screen.findByRole("link", { name: nav.moderation });
    await waitFor(() =>
      expect(link.querySelector(".animate-pulse")).toBeNull()
    );
    expect(link).not.toHaveTextContent(/\d/);
    expect(
      screen.queryByLabelText(nav.pendingFlagsUnknown)
    ).not.toBeInTheDocument();
  });

  // #1132: a failed count used to collapse into a hidden badge, which is the
  // same thing the nav shows for "queue is clear" — the nav then corroborated
  // the panel's wrong all-clear.
  it("marks the count unknown (not zero, not hidden) when the count fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    renderWithIntl(<AdminNav />);

    await waitFor(() =>
      expect(screen.getByLabelText(nav.pendingFlagsUnknown)).toBeInTheDocument()
    );
    // Nav still renders its four links and never throws into the tree.
    expect(screen.getAllByRole("link")).toHaveLength(4);
    // The marker is scoped to Moderation and carries no count.
    expect(
      screen.getByRole("link", { name: /Moderation/ })
    ).not.toHaveTextContent(/\d/);
    // Ambient nav chrome, deliberately not a live region.
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("marks the count unknown when the count fetch returns non-ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({ ok: false, status: 401, json: async () => ({}) })
    );
    renderWithIntl(<AdminNav />);

    await waitFor(() =>
      expect(screen.getByLabelText(nav.pendingFlagsUnknown)).toBeInTheDocument()
    );
  });

  it("keeps the three badge states distinct: loading, resolved, failed", async () => {
    // Loading: a placeholder pill, and neither a count nor the unknown marker.
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));
    const { unmount } = renderWithIntl(<AdminNav />);
    const moderationLink = screen.getByRole("link", { name: nav.moderation });
    expect(moderationLink.querySelector(".animate-pulse")).not.toBeNull();
    expect(
      screen.queryByLabelText(nav.pendingFlagsUnknown)
    ).not.toBeInTheDocument();
    unmount();

    // Resolved with a count: the red count pill, no placeholder.
    mockFlags(2);
    renderWithIntl(<AdminNav />);
    await waitFor(() =>
      expect(screen.getByLabelText("2 pending flags")).toBeInTheDocument()
    );
    expect(
      screen
        .getByRole("link", { name: /Moderation/ })
        .querySelector(".animate-pulse")
    ).toBeNull();
    expect(
      screen.queryByLabelText(nav.pendingFlagsUnknown)
    ).not.toBeInTheDocument();
  });
});
