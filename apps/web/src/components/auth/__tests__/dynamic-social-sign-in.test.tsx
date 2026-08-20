// @vitest-environment jsdom
/* eslint-disable import/order -- vi.mock factories are hoisted above imports. */
import type { ReactElement } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";

/**
 * Sibling of the email form's stale-session suite, and the same failure with a
 * different shape: `processSocialCallback` branches on `client.user`, so with a
 * leftover Dynamic session the click becomes a credential LINK on that account
 * rather than a sign-in. One parameterized suite covers every provider the
 * unified component serves.
 */

const { logoutMock, redirectMock, userState } = vi.hoisted(() => ({
  logoutMock: vi.fn().mockResolvedValue(undefined),
  redirectMock: vi.fn().mockResolvedValue(undefined),
  userState: { current: undefined as { userId: string } | undefined },
}));

vi.mock("@dynamic-labs-sdk/client", () => ({
  logout: logoutMock,
  signInWithSocialRedirect: redirectMock,
}));
vi.mock("@dynamic-labs-sdk/react-hooks", () => ({
  useUser: () => ({ data: userState.current }),
}));
vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));

import { DynamicSocialSignIn } from "../dynamic-social-sign-in";

function renderWithIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  userState.current = undefined;
});

describe.each([
  {
    provider: "google" as const,
    label: messages.auth.signInWithGoogle,
    failure: messages.auth.googleSignInFailed,
  },
  {
    provider: "github" as const,
    label: messages.auth.signInWithGitHub,
    failure: messages.auth.githubSignInFailed,
  },
])("DynamicSocialSignIn ($provider)", ({ provider, label, failure }) => {
  it("starts the redirect flow back to the current page", async () => {
    renderWithIntl(
      <DynamicSocialSignIn
        provider={provider}
        disabled={false}
        onError={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: label }));

    await waitFor(() =>
      expect(redirectMock).toHaveBeenCalledWith({
        provider,
        redirectUrl: window.location.href,
      })
    );
    expect(logoutMock).not.toHaveBeenCalled();
  });

  it("clears a leftover Dynamic session BEFORE redirecting", async () => {
    userState.current = { userId: "stale-user" };

    renderWithIntl(
      <DynamicSocialSignIn
        provider={provider}
        disabled={false}
        onError={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: label }));

    await waitFor(() => expect(redirectMock).toHaveBeenCalled());
    const [logoutOrder] = logoutMock.mock.invocationCallOrder;
    const [redirectOrder] = redirectMock.mock.invocationCallOrder;
    expect(logoutOrder as number).toBeLessThan(redirectOrder as number);
  });

  it("lifts a translated error to onError when the redirect cannot start (#1077: the parent owns the one error placement)", async () => {
    redirectMock.mockRejectedValueOnce(new Error("no project settings"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const onError = vi.fn();

    renderWithIntl(
      <DynamicSocialSignIn
        provider={provider}
        disabled={false}
        onError={onError}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: label }));

    // Cleared at click time, then the failure — and NO inline alert of its own.
    expect(onError).toHaveBeenCalledWith(null);
    await waitFor(() => expect(onError).toHaveBeenCalledWith(failure));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
