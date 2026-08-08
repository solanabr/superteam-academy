// @vitest-environment jsdom
/* eslint-disable import/order -- vi.mock factories are hoisted above imports. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";

/**
 * PR #994 review, blocking finding: the walletAlreadyLinked copy was picked
 * from `mode` (which route ran) and shipped INVERTED — a learner whose fresh
 * wallet collided with another account was told everything worked. Copy now
 * follows the SITUATION KEY the server returns; these tests pin key → copy at
 * the component level, which the siws.ts tests could not (they only thread the
 * key through).
 */

const siws = vi.hoisted(() => ({
  run: vi.fn(),
}));
vi.mock("@/lib/phantom/siws", () => ({
  runPhantomSiws: siws.run,
}));

const hook = vi.hoisted(() => ({
  value: {
    enabled: true,
    status: "connected" as string,
    address: "SoLaNaAddr111" as string | null,
    connect: vi.fn(),
    disconnect: vi.fn(),
  },
}));
vi.mock("@/components/auth/phantom-connect-provider", () => ({
  usePhantomConnect: () => hook.value,
}));

// No Supabase session and no linked wallet — the clean first-visit path.
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: null } })) },
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: null }) }),
      }),
    }),
  }),
}));
vi.mock("@/lib/phantom/client", () => ({
  createPhantomClient: () => ({ solana: { signMessage: vi.fn() } }),
}));

import { PhantomAuthHandler } from "../phantom-auth-handler";

function renderHandler() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <PhantomAuthHandler />
    </NextIntlClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  hook.value = { ...hook.value, status: "connected", address: "SoLaNaAddr111" };
});

describe("PhantomAuthHandler — situation key → copy (#994 review)", () => {
  it("walletAlreadyLinked (someone else's wallet) renders the TAKEN copy, not reassurance", async () => {
    siws.run.mockResolvedValue({
      ok: false,
      reason: "walletAlreadyLinked",
      mode: "link",
    });

    renderHandler();

    // The dominant real-world 409: bridge() only links when the own profile
    // has no wallet, so a link-route 409 means the wallet belongs to someone
    // else. The inverted mapping showed "you'll keep using it" here.
    expect(await screen.findByRole("alert")).toHaveTextContent(
      messages.auth.phantomWalletTaken
    );
  });

  it("differentWalletLinked (own account has another wallet) renders the KEEP-USING-IT copy", async () => {
    siws.run.mockResolvedValue({
      ok: false,
      reason: "differentWalletLinked",
      mode: "signIn",
    });

    renderHandler();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      messages.auth.phantomAccountHasWallet
    );
  });

  it("declined stays silent AND leaves retry open — no reload required", async () => {
    siws.run.mockResolvedValue({
      ok: false,
      reason: "declined",
      mode: "signIn",
    });

    const { rerender } = renderHandler();
    await waitFor(() => expect(siws.run).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    // A retry click cycles the provider through connecting → connected with
    // the SAME address. Before the fix the handledAddress ref (set on first
    // attempt, never cleared) swallowed this cycle and the learner was stuck
    // until a full page reload.
    hook.value = { ...hook.value, status: "connecting" };
    rerender(
      <NextIntlClientProvider locale="en" messages={messages}>
        <PhantomAuthHandler />
      </NextIntlClientProvider>
    );
    hook.value = { ...hook.value, status: "connected" };
    rerender(
      <NextIntlClientProvider locale="en" messages={messages}>
        <PhantomAuthHandler />
      </NextIntlClientProvider>
    );

    await waitFor(() => expect(siws.run).toHaveBeenCalledTimes(2));
  });

  it("bridges a given successful address exactly once — the ref still guards the double-fire", async () => {
    // autoConnect + the connect event both deliver the same address; the ref
    // exists to stop that double prompt, and clearing-on-failure must not
    // break it.
    siws.run.mockImplementation(() => new Promise(() => {})); // in flight

    const { rerender } = renderHandler();
    await waitFor(() => expect(siws.run).toHaveBeenCalledTimes(1));

    rerender(
      <NextIntlClientProvider locale="en" messages={messages}>
        <PhantomAuthHandler />
      </NextIntlClientProvider>
    );

    expect(siws.run).toHaveBeenCalledTimes(1);
  });
});
