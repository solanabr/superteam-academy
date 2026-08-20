import { describe, it, expect, vi, afterEach } from "vitest";
import {
  publishAmbientWallet,
  getAmbientWallet,
  setWalletReturnCaptureActive,
  getWalletReturnCaptureActive,
  type AmbientWalletState,
} from "../ambient-wallet-store";

const fake = (): AmbientWalletState => ({
  connected: false,
  publicKey: null,
  disconnect: vi.fn(async () => {}),
  openWalletModal: vi.fn(),
});

afterEach(() => {
  // Leave the store empty (a publish also clears the capture flag).
  publishAmbientWallet(fake())();
});

describe("ambient wallet store (#1097)", () => {
  it("publishes and unregisters", () => {
    const state = fake();
    const unregister = publishAmbientWallet(state);
    expect(getAmbientWallet()).toBe(state);
    unregister();
    expect(getAmbientWallet()).toBeNull();
  });

  it("a stale unregister never wipes a newer registration", () => {
    const first = fake();
    const second = fake();
    const unregisterFirst = publishAmbientWallet(first);
    const unregisterSecond = publishAmbientWallet(second);

    // The first stack unmounts AFTER the second took over (route-group
    // crossing): the live registration must survive.
    unregisterFirst();
    expect(getAmbientWallet()).toBe(second);

    unregisterSecond();
    expect(getAmbientWallet()).toBeNull();
  });

  it("the capture flag opens the window and any registration closes it", () => {
    expect(getWalletReturnCaptureActive()).toBe(false);
    setWalletReturnCaptureActive();
    expect(getWalletReturnCaptureActive()).toBe(true);

    const unregister = publishAmbientWallet(fake());
    expect(getWalletReturnCaptureActive()).toBe(false);
    unregister();
    // Unregistering does not re-open the window.
    expect(getWalletReturnCaptureActive()).toBe(false);
  });
});
