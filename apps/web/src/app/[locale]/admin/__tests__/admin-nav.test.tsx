// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
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

beforeEach(() => {
  usePathnameMock.mockReset();
  usePathnameMock.mockReturnValue("/en/admin/status");
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
});
