// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import { UserMenu } from "../user-menu";

vi.mock("@/lib/admin/client", () => ({
  fetchIsAdmin: vi.fn().mockResolvedValue(false),
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

const WALLET = "8kMziL5e3qEWhp1nQHEiYLRypymyBVTXNxgZXyQwhbSo";

describe("UserMenu — header pill", () => {
  it("shows the account name, not the wallet", () => {
    renderWithIntl(
      <UserMenu
        username="SandwichedGeyser"
        avatarUrl={null}
        walletAddress={WALLET}
        locale="en"
      />
    );

    const trigger = screen.getByRole("button", { name: "SandwichedGeyser" });
    expect(within(trigger).getByText("SandwichedGeyser")).toBeInTheDocument();
    expect(within(trigger).queryByText("8kMz...hbSo")).toBeNull();
  });

  it("shows the name for an account with no wallet linked", () => {
    renderWithIntl(
      <UserMenu
        username="brave-anchor-9000"
        avatarUrl={null}
        walletAddress={null}
        locale="en"
      />
    );

    const trigger = screen.getByRole("button", { name: "brave-anchor-9000" });
    expect(within(trigger).getByText("brave-anchor-9000")).toBeInTheDocument();
  });
});
