// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import { UserMenu } from "../user-menu";

const { fetchIsAdminMock } = vi.hoisted(() => ({
  fetchIsAdminMock: vi.fn<() => Promise<boolean>>(),
}));

vi.mock("@/lib/admin/client", () => ({
  fetchIsAdmin: fetchIsAdminMock,
}));

vi.mock("@solana/wallet-adapter-react", () => ({
  useWallet: () => ({ disconnect: vi.fn(), connected: false }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: { signOut: vi.fn().mockResolvedValue({ error: null }) },
  })),
}));

vi.mock("@/lib/dynamic/client", () => ({
  logoutDynamic: vi.fn().mockResolvedValue(undefined),
}));

function renderWithIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

function openMenu(): void {
  // Radix's DropdownMenuTrigger opens on pointerdown (not click) or on
  // Enter/Space keydown; jsdom has no real pointer events, so use the keyboard.
  fireEvent.keyDown(screen.getByRole("button", { name: "learner" }), {
    key: "Enter",
  });
}

const menuProps = {
  username: "learner",
  avatarUrl: null,
  walletAddress: null,
  locale: "en",
};

const ADMIN_LABEL = messages.nav.admin;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("UserMenu — Admin entry (cosmetic, server-driven)", () => {
  it("renders the Admin item linking to /{locale}/admin when /api/admin/me says true", async () => {
    fetchIsAdminMock.mockResolvedValue(true);

    renderWithIntl(<UserMenu {...menuProps} />);
    openMenu();

    const item = await screen.findByRole("menuitem", { name: ADMIN_LABEL });
    expect(item).toHaveAttribute("href", "/en/admin");
  });

  it("renders NO Admin item when the probe says false", async () => {
    fetchIsAdminMock.mockResolvedValue(false);

    renderWithIntl(<UserMenu {...menuProps} />);
    openMenu();

    // The rest of the menu is there…
    expect(
      await screen.findByRole("menuitem", { name: messages.common.settings })
    ).toBeInTheDocument();
    // …but not the Admin entry.
    expect(
      screen.queryByRole("menuitem", { name: ADMIN_LABEL })
    ).not.toBeInTheDocument();
  });

  it("stays admin-less when the probe rejects (fail closed, no crash)", async () => {
    fetchIsAdminMock.mockRejectedValue(new Error("network"));

    renderWithIntl(<UserMenu {...menuProps} />);
    openMenu();

    expect(
      await screen.findByRole("menuitem", { name: messages.common.settings })
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.queryByRole("menuitem", { name: ADMIN_LABEL })
      ).not.toBeInTheDocument();
    });
  });
});
