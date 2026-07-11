// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { AdminNav } from "../admin-nav";
import messages from "@/messages/en.json";

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

    expect(screen.getByRole("link", { name: nav.publish })).toHaveAttribute(
      "href",
      "/en/admin/publish"
    );
    expect(screen.getByRole("link", { name: nav.deploy })).toHaveAttribute(
      "href",
      "/en/admin/deploy"
    );
    expect(screen.getByRole("link", { name: nav.moderation })).toHaveAttribute(
      "href",
      "/en/admin/moderation"
    );
    expect(screen.getByRole("link", { name: nav.status })).toHaveAttribute(
      "href",
      "/en/admin/status"
    );
  });

  it("labels the nav landmark from the admin namespace", () => {
    renderWithIntl(<AdminNav />);
    expect(
      screen.getByRole("navigation", { name: messages.admin.console.navLabel })
    ).toBeInTheDocument();
  });

  it("marks only the active route with aria-current=page", () => {
    usePathnameMock.mockReturnValue("/en/admin/deploy");
    renderWithIntl(<AdminNav />);

    expect(screen.getByRole("link", { name: nav.deploy })).toHaveAttribute(
      "aria-current",
      "page"
    );
    for (const label of [nav.publish, nav.moderation, nav.status]) {
      expect(screen.getByRole("link", { name: label })).not.toHaveAttribute(
        "aria-current"
      );
    }
  });

  it("keeps a sub-path of a section active (startsWith match)", () => {
    usePathnameMock.mockReturnValue("/en/admin/deploy/some-detail");
    renderWithIntl(<AdminNav />);
    expect(screen.getByRole("link", { name: nav.deploy })).toHaveAttribute(
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
    // The badge is scoped to Moderation, not other sections.
    expect(
      screen.getByRole("link", { name: nav.deploy })
    ).not.toHaveTextContent("4");
  });

  it("renders no badge when there are zero pending flags", async () => {
    mockFlags(0);
    renderWithIntl(<AdminNav />);

    // Give the async fetch a chance to resolve, then assert nothing appeared.
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(
      screen.getByRole("link", { name: nav.moderation })
    ).toBeInTheDocument();
  });

  it("hides the badge (and never throws) when the count fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    renderWithIntl(<AdminNav />);

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    // Nav still renders its four links; the badge simply never shows.
    expect(screen.getAllByRole("link")).toHaveLength(4);
    expect(
      screen.getByRole("link", { name: nav.moderation })
    ).toBeInTheDocument();
  });
});
