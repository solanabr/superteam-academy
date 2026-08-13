// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";

/**
 * A leftover Dynamic session must be cleared before the email OTP is sent.
 *
 * `verifyOTP` routes on `client.user`: with a user present it becomes an
 * email-CHANGE on that stale account instead of a sign-in, the API rejects
 * it, and the learner sees "that code isn't right" for every code they type
 * — the exact loop this suite pins down. The form is strictly sign-in, so
 * the fix is to log the stale session out before sending the code.
 */

const { logoutMock, sendEmailOTPMock, userState } = vi.hoisted(() => ({
  logoutMock: vi.fn().mockResolvedValue(undefined),
  sendEmailOTPMock: vi.fn().mockResolvedValue(undefined),
  userState: { current: undefined as { userId: string } | undefined },
}));

vi.mock("@dynamic-labs-sdk/client", () => ({
  isDeviceRegistrationRequired: () => false,
  logout: logoutMock,
}));
vi.mock("@dynamic-labs-sdk/react-hooks", () => ({
  useSendEmailOTP: () => ({
    mutateAsync: sendEmailOTPMock,
    data: undefined,
    isPending: false,
    reset: vi.fn(),
  }),
  useUser: () => ({ data: userState.current }),
  useVerifyOTP: () => ({ mutateAsync: vi.fn(), isPending: false }),
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

async function expandAndSubmitEmail() {
  fireEvent.click(
    screen.getByRole("button", { name: messages.auth.continueWithEmail })
  );
  fireEvent.change(screen.getByLabelText(messages.auth.emailPlaceholder), {
    target: { value: "learner@example.com" },
  });
  fireEvent.click(screen.getByRole("button", { name: messages.auth.sendCode }));
  await waitFor(() => expect(sendEmailOTPMock).toHaveBeenCalled());
}

beforeEach(() => {
  vi.clearAllMocks();
  userState.current = undefined;
});

describe("DynamicEmailSignIn — stale Dynamic session", () => {
  it("logs a leftover session out BEFORE sending the OTP", async () => {
    userState.current = { userId: "stale-user" };

    renderWithIntl(<DynamicEmailSignIn disabled={false} />);
    await expandAndSubmitEmail();

    expect(logoutMock).toHaveBeenCalledTimes(1);
    // Order matters: sending first would still tie the verification to the
    // stale session that verifyOTP routes on.
    const [logoutOrder] = logoutMock.mock.invocationCallOrder;
    const [sendOrder] = sendEmailOTPMock.mock.invocationCallOrder;
    expect(logoutOrder).toBeDefined();
    expect(sendOrder).toBeDefined();
    expect(logoutOrder as number).toBeLessThan(sendOrder as number);
  });

  it("does not touch logout when no session exists", async () => {
    renderWithIntl(<DynamicEmailSignIn disabled={false} />);
    await expandAndSubmitEmail();

    expect(logoutMock).not.toHaveBeenCalled();
  });
});
