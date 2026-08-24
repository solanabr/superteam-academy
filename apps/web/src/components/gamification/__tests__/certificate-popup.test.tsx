// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import confetti from "canvas-confetti";
import messages from "@/messages/en.json";
import {
  setRewardQueueLength,
  __resetRewardQueueStateForTests,
} from "@/lib/gamification/reward-queue-state";
import { resetCelebrationThrottleForTests } from "@/lib/gamification/celebration";
import {
  CertificatePopup,
  dispatchCertificateMinted,
} from "../certificate-popup";

// Choreography rework 24-08: the mint is the loudest moment on the platform and
// it arrives on its own Realtime insert, so it used to play UNDERNEATH a running
// stack of reward cards. It now waits for the reward queue to drain.

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

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  confettiMock.mockClear();
  __resetRewardQueueStateForTests();
  resetCelebrationThrottleForTests();
});

afterEach(() => {
  vi.useRealTimers();
  __resetRewardQueueStateForTests();
});

describe("CertificatePopup — deferral behind the reward queue", () => {
  it("holds the card AND the confetti while rewards are still playing", () => {
    renderPopup();
    act(() => setRewardQueueLength(2));

    act(() => dispatchCertificateMinted("cert-1"));

    expect(screen.queryByText("Certificate Earned")).toBeNull();
    expect(confettiMock).not.toHaveBeenCalled();
  });

  it("plays the moment as soon as the queue empties", () => {
    renderPopup();
    act(() => setRewardQueueLength(2));
    act(() => dispatchCertificateMinted("cert-1"));

    act(() => setRewardQueueLength(0));

    expect(screen.getByText("Certificate Earned")).toBeDefined();
    expect(confettiMock).toHaveBeenCalled();
  });

  it("plays immediately when nothing is queued", () => {
    renderPopup();
    act(() => dispatchCertificateMinted("cert-1"));

    expect(screen.getByText("Certificate Earned")).toBeDefined();
    expect(confettiMock).toHaveBeenCalled();
  });
});
