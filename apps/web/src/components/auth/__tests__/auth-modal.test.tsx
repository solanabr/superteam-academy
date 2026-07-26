// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { AuthModal } from "../auth-modal";
import messages from "@/messages/en.json";

vi.mock("@solana/wallet-adapter-react-ui", () => ({
  useWalletModal: () => ({ setVisible: vi.fn() }),
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
