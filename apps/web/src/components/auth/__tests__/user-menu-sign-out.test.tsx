// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import { isTabLeaving } from "@/lib/lessons/tab-leaving";
import { UserMenu } from "../user-menu";

const h = vi.hoisted(() => ({
  leavingAtSignOut: null as boolean | null,
}));

vi.mock("@/lib/admin/client", () => ({
  fetchIsAdmin: vi.fn().mockResolvedValue(false),
}));
vi.mock("@solana/wallet-adapter-react", () => ({
  useWallet: () => ({ disconnect: vi.fn(), connected: false }),
}));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signOut: vi.fn(async () => {
        h.leavingAtSignOut = isTabLeaving();
        return { error: null };
      }),
    },
  }),
}));
vi.mock("@/lib/dynamic/client", () => ({
  logoutDynamic: vi.fn().mockResolvedValue(undefined),
}));

describe("UserMenu sign-out", () => {
  // A lesson page reloads when the signed-in learner changes under it; this
  // tab's own sign-out navigates away by itself, and a reload would cancel it.
  it("marks the tab as leaving before it signs out", async () => {
    const realLocation = window.location;
    Object.defineProperty(window, "location", {
      value: { ...realLocation, href: "" },
      writable: true,
    });
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <UserMenu
          username="learner"
          avatarUrl={null}
          walletAddress={null}
          locale="en"
        />
      </NextIntlClientProvider>
    );
    fireEvent.keyDown(screen.getByRole("button", { name: "learner" }), {
      key: "Enter",
    });
    fireEvent.click(
      await screen.findByRole("menuitem", { name: messages.common.signOut })
    );

    await waitFor(() => expect(h.leavingAtSignOut).not.toBeNull());
    expect(h.leavingAtSignOut).toBe(true);
    Object.defineProperty(window, "location", {
      value: realLocation,
      writable: true,
    });
  });
});
