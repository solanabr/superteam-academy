// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import { AuthTriggerButton } from "../auth-modal";

vi.mock("@/hooks/use-social-return-pending", () => ({
  useSocialReturnPending: () => true,
}));

const renderButton = (compactPending?: boolean) =>
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <AuthTriggerButton label="Sign In" compactPending={compactPending} />
    </NextIntlClientProvider>
  );

describe("AuthTriggerButton while signing in", () => {
  it("keeps the words for screen readers but drops them on a phone when compact", () => {
    renderButton(true);
    const text = screen.getByText(messages.auth.signingIn);
    expect(text).toHaveClass("max-sm:sr-only");
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("shows the words at every width by default", () => {
    renderButton();
    expect(screen.getByText(messages.auth.signingIn)).not.toHaveClass(
      "max-sm:sr-only"
    );
  });
});
