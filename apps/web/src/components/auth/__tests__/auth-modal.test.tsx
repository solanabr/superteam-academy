// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import { publishAmbientWallet } from "@/lib/solana/ambient-wallet-store";
// Preloads the chunk AuthModal reaches through React.lazy. Without it every
// assertion on the dialog body races a cold transform of the module's graph
// (the Dynamic SDK), which under full-suite load blew past even a 10s
// findBy timeout — two of four runs, #1109 review. Importing the same
// specifier here puts it in the registry at collect time, so the lazy import
// resolves in a microtask and the default timeouts hold.
import "@/components/auth/auth-modal-body";
import { AuthModal } from "../auth-modal";

const dynamicState = vi.hoisted(() => ({
  enabled: false,
  redirectMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/dynamic/config", () => ({
  isDynamicEnabled: () => dynamicState.enabled,
  // Read through lib/dynamic/client by DynamicSocialSignIn's imperative
  // stale-session check (#1097); null = "no client", which is fine here.
  getDynamicEnvironmentId: () => null,
}));

vi.mock("@solana/wallet-adapter-react-ui", () => ({
  useWalletModal: () => ({ setVisible: vi.fn() }),
}));

// The real SDK reaches for browser APIs jsdom does not provide, and this suite
// is about the modal's own behaviour, not the email flow's.
vi.mock("@dynamic-labs-sdk/client", () => ({
  isDeviceRegistrationRequired: () => false,
  logout: vi.fn(),
  signInWithSocialRedirect: (...args: unknown[]) =>
    dynamicState.redirectMock(...args),
}));
vi.mock("@dynamic-labs-sdk/react-hooks", () => ({
  useSendEmailOTP: () => ({
    mutateAsync: vi.fn(),
    data: undefined,
    isPending: false,
    reset: vi.fn(),
  }),
  useUser: () => ({ data: undefined }),
  useVerifyOTP: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: { signInWithOAuth: vi.fn().mockResolvedValue({ error: null }) },
  })),
}));

vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));

function renderWithIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

// This suite models a (platform) route: the layout's provider stack is live
// in the ambient store (#1097). The scoped (marketing) path has its own
// suite, auth-modal-scoped-providers.test.tsx.
let unregisterAmbient: (() => void) | null = null;

const TITLE = messages.auth.signInTitle;
const DEFAULT_TRIGGER = messages.common.signIn;

beforeEach(() => {
  vi.clearAllMocks();
  dynamicState.enabled = false;
  dynamicState.redirectMock.mockResolvedValue(undefined);
  unregisterAmbient = publishAmbientWallet({
    connected: false,
    publicKey: null,
    disconnect: vi.fn(async () => {}),
    openWalletModal: vi.fn(),
  });
});

afterEach(() => {
  unregisterAmbient?.();
});

describe("AuthModal — one error placement (#1077)", () => {
  it("renders a Dynamic button failure at modal level, not inline under the button", async () => {
    dynamicState.enabled = true;
    dynamicState.redirectMock.mockRejectedValueOnce(new Error("no settings"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    renderWithIntl(<AuthModal open onOpenChange={() => {}} />);
    // findBy, not getBy: the body is still a React.lazy boundary, so it
    // lands one microtask after the dialog chrome.
    fireEvent.click(
      await screen.findByRole("button", {
        name: messages.auth.signInWithGoogle,
      })
    );

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(messages.auth.googleSignInFailed);
    // Modal-level style (text-sm), the same channel Supabase fallbacks use.
    expect(alert.className).toContain("text-sm");
    expect(screen.getAllByRole("alert")).toHaveLength(1);
  });

  it("clears the modal-level error when a new Dynamic attempt starts", async () => {
    dynamicState.enabled = true;
    dynamicState.redirectMock.mockRejectedValueOnce(new Error("no settings"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    renderWithIntl(<AuthModal open onOpenChange={() => {}} />);
    const googleButton = await screen.findByRole("button", {
      name: messages.auth.signInWithGoogle,
    });
    fireEvent.click(googleButton);
    await screen.findByRole("alert");

    // Next attempt resolves (never navigates in jsdom) — the stale error goes.
    fireEvent.click(googleButton);
    await waitFor(() =>
      expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    );
  });
});

describe("AuthModal — controlled mode (#556)", () => {
  it("opens programmatically via the open prop, without rendering a trigger button", async () => {
    renderWithIntl(<AuthModal open onOpenChange={() => {}} />);

    // findBy, not getBy: the body is still a React.lazy boundary, so it
    // lands one microtask after the dialog chrome.
    expect(await screen.findByText(TITLE, {})).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: DEFAULT_TRIGGER })
    ).not.toBeInTheDocument();
  });

  it("renders nothing while closed in controlled mode (no stray sign-in button)", () => {
    renderWithIntl(<AuthModal open={false} onOpenChange={() => {}} />);

    expect(screen.queryByText(TITLE)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: DEFAULT_TRIGGER })
    ).not.toBeInTheDocument();
  });

  it("reports close through onOpenChange", async () => {
    const onOpenChange = vi.fn();
    renderWithIntl(<AuthModal open onOpenChange={onOpenChange} />);

    fireEvent.keyDown(await screen.findByText(TITLE), { key: "Escape" });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("still supports a trigger alongside controlled state", () => {
    const onOpenChange = vi.fn();
    renderWithIntl(
      <AuthModal
        open={false}
        onOpenChange={onOpenChange}
        trigger={<button>Sign in to enroll</button>}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Sign in to enroll" }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });
});

describe("AuthModal — uncontrolled mode (unchanged)", () => {
  it("renders the default trigger and opens on click", async () => {
    renderWithIntl(<AuthModal />);

    const trigger = screen.getByRole("button", { name: DEFAULT_TRIGGER });
    expect(screen.queryByText(TITLE)).not.toBeInTheDocument();

    fireEvent.click(trigger);
    expect(await screen.findByText(TITLE)).toBeInTheDocument();
  });
});

describe("AuthModal — Later affordance (LX-A4b)", () => {
  it("shows the keep-progress framing, a Later button, and reassurance copy", async () => {
    renderWithIntl(<AuthModal open onOpenChange={() => {}} showLater />);

    expect(
      await screen.findByText(messages.auth.keepProgressTitle)
    ).toBeInTheDocument();
    // The Later button and reassurance copy live in the LAZY body (the title is
    // Dialog-header chrome, outside it) — hence findBy.
    expect(
      await screen.findByRole("button", { name: messages.auth.later })
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.auth.progressSavedLocally)
    ).toBeInTheDocument();
  });

  it("never uses discard/lose/delete language (F4) — progress is framed as kept", () => {
    const claimCopy = [
      messages.auth.keepProgressTitle,
      messages.auth.keepProgressSubtitle,
      messages.auth.later,
      messages.auth.progressSavedLocally,
    ]
      .join(" ")
      .toLowerCase();

    for (const forbidden of ["discard", "lose", "lost", "delete", "erase"]) {
      expect(claimCopy).not.toContain(forbidden);
    }
    expect(claimCopy).toContain("saved");
  });

  it("closes and calls onLater when Later is tapped", async () => {
    const onOpenChange = vi.fn();
    const onLater = vi.fn();
    renderWithIntl(
      <AuthModal open onOpenChange={onOpenChange} showLater onLater={onLater} />
    );

    fireEvent.click(
      await screen.findByRole("button", { name: messages.auth.later })
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onLater).toHaveBeenCalledTimes(1);
  });

  it("omits the Later affordance by default", async () => {
    renderWithIntl(<AuthModal open onOpenChange={() => {}} />);

    // Wait for the lazy body before asserting the button's absence.
    await screen.findByText(TITLE);
    expect(
      screen.queryByRole("button", { name: messages.auth.later })
    ).not.toBeInTheDocument();
  });
});
