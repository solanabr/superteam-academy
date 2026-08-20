// @vitest-environment jsdom
import type { ReactElement } from "react";
import { useState } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import {
  publishAmbientWallet,
  setSiwsActive,
} from "@/lib/solana/ambient-wallet-store";
// Preloads the chunk AuthModal reaches through React.lazy — see auth-modal.test.tsx.
import "@/components/auth/auth-modal-body";
import { AuthModal } from "../auth-modal";

/**
 * The Solana button's handoff: a brief loading state, then close the dialog
 * and open the wallet-select modal of whichever stack is live (#1109 review).
 *
 * It runs on two timers, and both were unguarded. If the stack unregistered
 * inside the 600 ms window the picker never opened and the learner got no
 * error at all — they clicked Connect, saw a spinner, and the modal vanished.
 * If AuthModal unmounted inside it, the picker popped open unbidden on
 * whatever route they had moved to.
 */

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: { signInWithOAuth: vi.fn().mockResolvedValue({ error: null }) },
  })),
}));
vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));
vi.mock("@/lib/dynamic/config", () => ({
  isDynamicEnabled: () => false,
  getDynamicEnvironmentId: () => null,
}));

/** Controlled the way real callers drive it, so `setOpen(false)` lands. */
function ControlledModal() {
  const [open, setOpen] = useState(true);
  return (
    <>
      {/* Stands in for a controlled parent driving the dialog out from under
          the handoff — a route change, or the enroll flow giving up. Reached
          by testid, since Radix aria-hides everything outside an open modal. */}
      <button data-testid="outside-toggle" onClick={() => setOpen((v) => !v)}>
        toggle from outside
      </button>
      <AuthModal open={open} onOpenChange={setOpen} />
    </>
  );
}

function renderWithIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

const CONNECT_WALLET = messages.auth.connectSolanaWallet;

let openWalletModal: ReturnType<typeof vi.fn<() => void>>;
let unregister: (() => void) | null = null;
// Released in cleanup, never inline: the flag is module-level state, so a
// test that fails before its own release would leak it into every test after.
let releaseSiws: (() => void) | null = null;

function liveStack() {
  openWalletModal = vi.fn();
  unregister = publishAmbientWallet({
    connected: false,
    publicKey: null,
    disconnect: async () => {},
    openWalletModal,
  });
}

/** Runs the timers React's effects are waiting on, inside act(). */
async function advance(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
}

/**
 * Lets pending microtasks (React.lazy, state flushes) settle. `findBy*` is not
 * an option here: its waitFor polls on real timers, which fake timers freeze.
 */
async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

/** Opens the dialog, waits for the lazy body, and returns the Solana button. */
async function openAndFindWalletButton() {
  renderWithIntl(<ControlledModal />);
  return screen.findByRole("button", { name: CONNECT_WALLET });
}

beforeEach(() => {
  vi.clearAllMocks();
  liveStack();
});

afterEach(() => {
  unregister?.();
  unregister = null;
  releaseSiws?.();
  releaseSiws = null;
  vi.useRealTimers();
});

describe("AuthModal wallet handoff", () => {
  it("closes and opens the wallet picker on the happy path", async () => {
    const button = await openAndFindWalletButton();

    vi.useFakeTimers();
    fireEvent.click(button);
    await advance(400);
    expect(
      screen.queryByText(messages.auth.signInTitle)
    ).not.toBeInTheDocument();

    // The picker opens AFTER the close, so its timer has to outlive the body,
    // which unmounts with the dialog.
    expect(openWalletModal).not.toHaveBeenCalled();
    await advance(200);
    expect(openWalletModal).toHaveBeenCalledTimes(1);
  });

  it("reports a stack that vanished before the close, and keeps the dialog open", async () => {
    const button = await openAndFindWalletButton();

    vi.useFakeTimers();
    fireEvent.click(button);
    unregister?.();
    unregister = null;
    await advance(400);
    await flush();

    expect(screen.getByRole("alert")).toHaveTextContent(
      messages.auth.authFailed
    );
    expect(screen.getByText(messages.auth.signInTitle)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: CONNECT_WALLET })).toBeEnabled();
    await advance(400);
    expect(openWalletModal).not.toHaveBeenCalled();
  });

  it("re-opens with the failure when the stack vanishes inside the close window", async () => {
    const button = await openAndFindWalletButton();

    vi.useFakeTimers();
    fireEvent.click(button);
    await advance(400);
    unregister?.();
    unregister = null;
    await advance(200);
    await flush();

    expect(openWalletModal).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      messages.auth.authFailed
    );
    expect(screen.getByText(messages.auth.signInTitle)).toBeInTheDocument();
  });

  it("stands down when SIWS takes the screen mid-handoff", async () => {
    // autoConnect can reconnect a remembered wallet while this handoff is
    // still on its timers. The picker would then open ON TOP of the SIWS
    // overlay and bury its Retry and Dismiss — the exact bug this PR exists
    // to fix, re-created through a different modal.
    const button = await openAndFindWalletButton();

    vi.useFakeTimers();
    fireEvent.click(button);
    await advance(150);
    releaseSiws = setSiwsActive({});
    await advance(1000);

    expect(openWalletModal).not.toHaveBeenCalled();
    // The dialog still gets out of the way — that part is by design.
    expect(
      screen.queryByText(messages.auth.signInTitle)
    ).not.toBeInTheDocument();
  });

  it("leaves no error behind when the dialog closes mid-handoff", async () => {
    const button = await openAndFindWalletButton();

    vi.useFakeTimers();
    fireEvent.click(button);
    // Closed behind the handoff's back, and the stack goes with it.
    fireEvent.click(screen.getByTestId("outside-toggle"));
    unregister?.();
    unregister = null;
    await advance(1000);
    await flush();

    expect(openWalletModal).not.toHaveBeenCalled();

    // Re-opening must not greet the learner with an error written while they
    // were not looking.
    fireEvent.click(screen.getByTestId("outside-toggle"));
    vi.useRealTimers();
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("never pops the picker open after AuthModal unmounts", async () => {
    const { unmount } = renderWithIntl(<ControlledModal />);
    const button = await screen.findByRole("button", { name: CONNECT_WALLET });

    vi.useFakeTimers();
    fireEvent.click(button);
    await advance(400);
    // The learner navigates away with the handoff in flight.
    unmount();
    await advance(1000);

    expect(openWalletModal).not.toHaveBeenCalled();
  });
});
