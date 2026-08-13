// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";

/**
 * A correct code must lead to visible progress, not a still form.
 *
 * After verifyOTP resolves, the slow part begins — MPC wallet creation, the
 * SIWS bridge, a reload — all outside this component. Learners watched a
 * silent form for several seconds and re-typed the code into a login that was
 * already succeeding; the finishing panel is what tells them to wait.
 */

const { verifyState } = vi.hoisted(() => ({
  verifyState: {
    deviceRegistrationRequired: false,
    verifyMock: vi.fn(),
  },
}));

vi.mock("@dynamic-labs-sdk/client", () => ({
  isDeviceRegistrationRequired: () => verifyState.deviceRegistrationRequired,
  logout: vi.fn(),
}));
vi.mock("@dynamic-labs-sdk/react-hooks", () => ({
  useSendEmailOTP: () => ({
    mutateAsync: vi.fn(),
    // Pre-seeded so the component renders the code step immediately.
    data: { email: "learner@example.com", verificationUUID: "uuid-1" },
    isPending: false,
    reset: vi.fn(),
  }),
  useUser: () => ({ data: undefined }),
  useVerifyOTP: () => ({
    mutateAsync: verifyState.verifyMock,
    isPending: false,
  }),
}));
vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));

import { DynamicEmailSignIn } from "../dynamic-email-sign-in";

function renderWithIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

async function submitCode() {
  // Expand past the collapsed "Continue with email" entry button; the
  // pre-seeded OTPVerification then lands the component on the code step.
  fireEvent.click(
    screen.getByRole("button", { name: messages.auth.continueWithEmail })
  );
  fireEvent.change(screen.getByLabelText(messages.auth.otpPlaceholder), {
    target: { value: "378517" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: messages.auth.verifyCode })
  );
  await waitFor(() => expect(verifyState.verifyMock).toHaveBeenCalled());
}

beforeEach(() => {
  vi.clearAllMocks();
  verifyState.deviceRegistrationRequired = false;
});

describe("DynamicEmailSignIn — after a correct code", () => {
  it("shows the setting-up-wallet panel while the handler finishes sign-in", async () => {
    verifyState.verifyMock.mockResolvedValue({ user: { userId: "u1" } });

    renderWithIntl(<DynamicEmailSignIn disabled={false} />);
    await submitCode();

    expect(
      await screen.findByText(messages.auth.settingUpWallet)
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.auth.settingUpWalletHint)
    ).toBeInTheDocument();
    // The code form is gone — nothing left to re-type into.
    expect(
      screen.queryByLabelText(messages.auth.otpPlaceholder)
    ).not.toBeInTheDocument();
  });

  it("prefers the device-registration panel when Dynamic requires it", async () => {
    verifyState.deviceRegistrationRequired = true;
    verifyState.verifyMock.mockResolvedValue({ user: { userId: "u1" } });

    renderWithIntl(<DynamicEmailSignIn disabled={false} />);
    await submitCode();

    expect(
      await screen.findByText(messages.auth.deviceCheckTitle)
    ).toBeInTheDocument();
    expect(
      screen.queryByText(messages.auth.settingUpWallet)
    ).not.toBeInTheDocument();
  });

  it("stays on the form and shows the error when the code is rejected", async () => {
    verifyState.verifyMock.mockRejectedValue(new Error("invalid token"));
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    renderWithIntl(<DynamicEmailSignIn disabled={false} />);
    await submitCode();

    expect(
      await screen.findByText(messages.auth.otpInvalid)
    ).toBeInTheDocument();
    expect(
      screen.queryByText(messages.auth.settingUpWallet)
    ).not.toBeInTheDocument();

    consoleError.mockRestore();
  });
});
