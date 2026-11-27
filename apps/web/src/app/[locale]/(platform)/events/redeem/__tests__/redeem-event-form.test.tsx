// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import { RedeemEventForm } from "../redeem-event-form";

const auth = vi.hoisted(() => ({
  value: { user: { id: "user-1" } as unknown, isLoading: false },
}));

vi.mock("@/lib/auth/auth-provider", () => ({
  useAuth: () => auth.value,
}));
vi.mock("@/components/auth/auth-modal", () => ({
  AuthModal: ({ trigger }: { trigger: ReactElement }) => trigger,
  AuthTriggerButton: ({ label }: { label: string }) => <button>{label}</button>,
}));

const fetchMock = vi.fn();

function renderForm(code = "ABCD-1234") {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <RedeemEventForm initialCode={code} />
    </NextIntlClientProvider>
  );
}

function respond(status: number, body: unknown) {
  fetchMock.mockResolvedValue(new Response(JSON.stringify(body), { status }));
}

const EVENT = {
  achievementId: "event-breakpoint-ab12c",
  name: "Breakpoint",
  description: "Opening night",
  imageUrl: "/api/events/image/event-breakpoint-ab12c",
  startsAt: "2026-11-20T18:00:00.000Z",
  xpReward: 100,
};

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  auth.value = { user: { id: "user-1" }, isLoading: false };
});

describe("RedeemEventForm", () => {
  it("asks a signed-out visitor to sign in instead of showing the form", () => {
    auth.value = { user: null, isLoading: false };
    renderForm();
    expect(
      screen.getByText(messages.events.signInToRedeem)
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(messages.events.codeLabel)).toBeNull();
  });

  it("prefills the code from the link and posts it", async () => {
    respond(200, { event: EVENT, walletLinked: true });
    renderForm("K7QX-M4PZ");

    expect(screen.getByLabelText(messages.events.codeLabel)).toHaveValue(
      "K7QX-M4PZ"
    );
    fireEvent.click(
      screen.getByRole("button", { name: messages.events.redeemButton })
    );

    expect(
      await screen.findByText(messages.events.successTitle)
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/events/redeem",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ code: "K7QX-M4PZ" }),
      })
    );
    expect(screen.getByText("Breakpoint")).toBeInTheDocument();
    expect(
      screen.getByText(messages.events.successMinting)
    ).toBeInTheDocument();
  });

  it("tells a learner without a wallet that attendance is saved and how to get the NFT", async () => {
    respond(200, { event: EVENT, walletLinked: false });
    renderForm();
    fireEvent.click(
      screen.getByRole("button", { name: messages.events.redeemButton })
    );

    expect(
      await screen.findByText(messages.events.successNoWallet)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: messages.events.linkWallet })
    ).toHaveAttribute("href", "/en/settings?tab=account");
  });

  it.each([
    [404, { error: "invalidCode" }, messages.events.errorInvalidCode],
    [409, { error: "alreadyRedeemed" }, messages.events.errorAlreadyRedeemed],
    [409, { error: "notReady" }, messages.events.errorNotReady],
    [500, { error: "redeemFailed" }, messages.events.errorGeneric],
  ])("shows the %i %j error", async (status, body, text) => {
    respond(status, body);
    renderForm();
    fireEvent.click(
      screen.getByRole("button", { name: messages.events.redeemButton })
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(text);
  });

  it("names the closing date of an expired code", async () => {
    respond(410, { error: "ended", endsAt: "2026-11-10T18:00:00.000Z" });
    renderForm();
    fireEvent.click(
      screen.getByRole("button", { name: messages.events.redeemButton })
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /expired on .*2026/
    );
  });
});
