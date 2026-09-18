// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import confetti from "canvas-confetti";
import messages from "@/messages/en.json";
import { resetCelebrationThrottleForTests } from "@/lib/gamification/celebration";
import {
  CertificatePopup,
  CERTIFICATE_POPUP_DURATION_MS,
  dispatchCertificateMinted,
} from "../certificate-popup";

// The 24-08 choreography rework made a mint WAIT for the reward queue to drain.
// OWNER REVERSAL 2026-09-18: rewards stack concurrently now, so there is nothing
// to wait for — the mint renders immediately, above the reward stack.

vi.mock("canvas-confetti", () => ({ default: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useParams: () => ({ locale: "en" }),
}));

const confettiMock = vi.mocked(confetti);

function renderPopup() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <CertificatePopup />
    </NextIntlClientProvider>
  );
}

function certCards(): Element[] {
  return Array.from(document.querySelectorAll(".popup-grad.cert"));
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  confettiMock.mockClear();
  resetCelebrationThrottleForTests();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("CertificatePopup", () => {
  it("plays the card and the confetti as soon as the mint lands", () => {
    renderPopup();
    act(() => dispatchCertificateMinted("cert-1"));

    expect(screen.getByText("Certificate Earned")).toBeDefined();
    expect(confettiMock).toHaveBeenCalled();
  });

  it("stacks two mints, newest on top", () => {
    renderPopup();
    act(() => {
      dispatchCertificateMinted("cert-1");
      dispatchCertificateMinted("cert-2");
    });

    expect(certCards()).toHaveLength(2);
  });

  it("dedupes the confetti when the same mint is observed twice (8s window)", () => {
    renderPopup();
    act(() => {
      dispatchCertificateMinted("cert-1");
      dispatchCertificateMinted("cert-1");
    });

    // One full-tier celebration: the burst plus its two timed side bursts.
    act(() => vi.advanceTimersByTime(500));
    expect(confettiMock).toHaveBeenCalledTimes(3);
  });

  it("clears the card after its beat", () => {
    renderPopup();
    act(() => dispatchCertificateMinted("cert-1"));

    act(() => vi.advanceTimersByTime(CERTIFICATE_POPUP_DURATION_MS));
    expect(certCards()).toHaveLength(0);
  });
});
