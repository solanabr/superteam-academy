// @vitest-environment jsdom
import type { ReactElement } from "react";
import { createRef } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { DeploySaveStatus } from "../deploy-save-status";
import type { SaveStatus } from "@/lib/deploy/save-deployment";
import messages from "@/messages/en.json";

function renderStatus(status: SaveStatus | "idle", onRetry = vi.fn()) {
  const ref = createRef<HTMLDivElement>();
  const ui: ReactElement = (
    <NextIntlClientProvider locale="en" messages={messages}>
      <DeploySaveStatus ref={ref} status={status} onRetry={onRetry} />
    </NextIntlClientProvider>
  );
  return { onRetry, ...render(ui) };
}

describe("DeploySaveStatus", () => {
  it("renders nothing while idle", () => {
    const { container } = renderStatus("idle");
    expect(container).toBeEmptyDOMElement();
  });

  it("shows a polite recorded confirmation on saved", () => {
    renderStatus("saved");
    const region = screen.getByRole("status");
    expect(region).toHaveTextContent("Deployment recorded");
    expect(region).toHaveAttribute("aria-live", "polite");
  });

  it("surfaces a retryable failure as an alert with a working retry", () => {
    const { onRetry } = renderStatus("retryable");
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Deployment not recorded yet");
    fireEvent.click(screen.getByRole("button", { name: "Retry saving" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("surfaces a 400 rejection with the linked-wallet guidance and retry", () => {
    const { onRetry } = renderStatus("rejected");
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Couldn't record this deployment");
    expect(alert).toHaveTextContent(/linked to your account/i);
    fireEvent.click(screen.getByRole("button", { name: "Retry saving" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
