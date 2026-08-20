// @vitest-environment jsdom
/* eslint-disable import/order -- vi.mock factories are hoisted above imports. */
import type { ReactElement } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";

/**
 * The SIWS overlay must escape the Header (#1109 follow-up).
 *
 * Since #1097 the provider stack — and with it WalletAuthHandler — mounts
 * under the Header on marketing routes, inside a bar carrying
 * `backdrop-blur-md`. A non-`none` backdrop-filter is a containing block for
 * `position: fixed` descendants, so an in-tree `fixed inset-0` overlay is
 * clipped to the 57px nav strip: the spinner renders as a band across the nav
 * and the error branch squeezes the failure message plus Retry/Dismiss into
 * it, while the page behind stays interactive.
 *
 * jsdom does no layout, so this asserts the STRUCTURE that fix depends on:
 * the overlay is a child of document.body, not of whatever tree the handler
 * was mounted in. Rendering it in-tree fails both assertions.
 */

const walletState = vi.hoisted(() => ({
  signMessage: vi.fn(async () => new Uint8Array([1, 2, 3])),
}));

vi.mock("@solana/wallet-adapter-react", () => ({
  useWallet: () => ({
    connected: true,
    publicKey: {
      toBase58: () => "TestWa11etPubkey1111111111111111111111111111",
    },
    signMessage: walletState.signMessage,
    signIn: undefined,
  }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: async () => ({ data: { user: null } }) },
  }),
}));

import { WalletAuthHandler } from "../wallet-auth-handler";

const HOST = "clipping-host";

function renderUnderHeaderLikeHost(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {/* Stands in for header.tsx's `relative bg-transparent backdrop-blur-md`
          wrapper: the element that becomes the containing block. */}
      <div data-testid={HOST} className="relative backdrop-blur-md">
        {ui}
      </div>
    </NextIntlClientProvider>
  );
}

function expectPortalled(overlay: HTMLElement): void {
  expect(screen.getByTestId(HOST)).not.toContainElement(overlay);
  expect(overlay.parentElement).toBe(document.body);
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("WalletAuthHandler overlay placement", () => {
  it("portals the signing-in overlay out of its mount tree", async () => {
    // The nonce request never settles, so the overlay stays on "authenticating".
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise<Response>(() => {}))
    );

    renderUnderHeaderLikeHost(<WalletAuthHandler />);

    const overlay = await screen.findByTestId("siws-overlay");
    expect(overlay).toHaveTextContent(messages.auth.signingIn);
    expectPortalled(overlay);
  });

  it("portals the error overlay, so the failure message and Retry are not trapped in the nav", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : String(input);
        if (url.includes("/api/auth/nonce")) {
          return {
            ok: true,
            json: async () => ({ nonce: "test-nonce", domain: "localhost" }),
          } as Response;
        }
        return {
          ok: false,
          json: async () => ({ error: "serverError" }),
        } as Response;
      })
    );

    renderUnderHeaderLikeHost(<WalletAuthHandler />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(messages.auth.authFailed);
    expect(
      screen.getByRole("button", { name: messages.auth.retry })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: messages.auth.dismiss })
    ).toBeInTheDocument();
    expectPortalled(screen.getByTestId("siws-overlay"));
  });
});
