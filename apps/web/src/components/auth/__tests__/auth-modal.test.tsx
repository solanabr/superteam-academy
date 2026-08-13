// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import { AuthModal } from "../auth-modal";

vi.mock("@solana/wallet-adapter-react-ui", () => ({
  useWalletModal: () => ({ setVisible: vi.fn() }),
}));

// The real SDK reaches for browser APIs jsdom does not provide, and this suite
// is about the modal's own behaviour, not the email flow's.
vi.mock("@dynamic-labs-sdk/client", () => ({
  isDeviceRegistrationRequired: () => false,
  logout: vi.fn(),
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

const TITLE = messages.auth.signInTitle;
const DEFAULT_TRIGGER = messages.common.signIn;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AuthModal — controlled mode (#556)", () => {
  it("opens programmatically via the open prop, without rendering a trigger button", () => {
    renderWithIntl(<AuthModal open onOpenChange={() => {}} />);

    expect(screen.getByText(TITLE)).toBeInTheDocument();
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

  it("reports close through onOpenChange", () => {
    const onOpenChange = vi.fn();
    renderWithIntl(<AuthModal open onOpenChange={onOpenChange} />);

    fireEvent.keyDown(screen.getByText(TITLE), { key: "Escape" });
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
  it("renders the default trigger and opens on click", () => {
    renderWithIntl(<AuthModal />);

    const trigger = screen.getByRole("button", { name: DEFAULT_TRIGGER });
    expect(screen.queryByText(TITLE)).not.toBeInTheDocument();

    fireEvent.click(trigger);
    expect(screen.getByText(TITLE)).toBeInTheDocument();
  });
});

describe("AuthModal — Later affordance (LX-A4b)", () => {
  it("shows the keep-progress framing, a Later button, and reassurance copy", () => {
    renderWithIntl(<AuthModal open onOpenChange={() => {}} showLater />);

    expect(
      screen.getByText(messages.auth.keepProgressTitle)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: messages.auth.later })
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

  it("closes and calls onLater when Later is tapped", () => {
    const onOpenChange = vi.fn();
    const onLater = vi.fn();
    renderWithIntl(
      <AuthModal open onOpenChange={onOpenChange} showLater onLater={onLater} />
    );

    fireEvent.click(screen.getByRole("button", { name: messages.auth.later }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onLater).toHaveBeenCalledTimes(1);
  });

  it("omits the Later affordance by default", () => {
    renderWithIntl(<AuthModal open onOpenChange={() => {}} />);

    expect(
      screen.queryByRole("button", { name: messages.auth.later })
    ).not.toBeInTheDocument();
  });
});
