// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { WalletMismatchWarning } from "../wallet-mismatch-warning";
import { truncateAddress } from "@/lib/utils";
import messages from "@/messages/en.json";

const LINKED = "B7o8NfV81HzjuZFWQTTx3Xdvh77Dqoajwib3kWEnvzJF";

function renderWarning(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe("WalletMismatchWarning", () => {
  it("warns on a connected-vs-linked mismatch and names the truncated linked wallet", () => {
    renderWarning(
      <WalletMismatchWarning variant="mismatch" linkedWallet={LINKED} />
    );
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("wallet mismatch");
    expect(alert).toHaveTextContent(truncateAddress(LINKED));
    // Informational, not blocking — copy tells the learner they can still deploy.
    expect(alert).toHaveTextContent(/still deploy/i);
  });

  it("warns when the connected wallet isn't linked at all", () => {
    renderWarning(
      <WalletMismatchWarning variant="unlinked" linkedWallet={null} />
    );
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("wallet not linked");
    expect(alert).toHaveTextContent(/still deploy/i);
  });
});
