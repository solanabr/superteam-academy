import { describe, it, expect, vi, afterEach } from "vitest";
import {
  publishAmbientWallet,
  getAmbientWallet,
  getAmbientStackCount,
  setWalletReturnCaptureActive,
  getWalletReturnCaptureActive,
  clearWalletReturnCapture,
  subscribeAmbientWallet,
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

  it("a same-owner re-publish never transits through null (NEW-3)", () => {
    const owner = {};
    const first = fake();
    const second = fake();
    const observed: (AmbientWalletState | null)[] = [];
    const unsubscribe = subscribeAmbientWallet(() =>
      observed.push(getAmbientWallet())
    );

    const unregister1 = publishAmbientWallet(first, owner);
    const unregister2 = publishAmbientWallet(second, owner);

    expect(observed).toEqual([first, second]);
    expect(getAmbientStackCount()).toBe(1);

    // The superseded publish's unregister is inert…
    unregister1();
    expect(getAmbientWallet()).toBe(second);
    // …while the current one really unregisters.
    unregister2();
    expect(getAmbientWallet()).toBeNull();
    expect(getAmbientStackCount()).toBe(0);
    unsubscribe();
  });

  it("tracks the live stack count", () => {
    expect(getAmbientStackCount()).toBe(0);
    const unregisterA = publishAmbientWallet(fake());
    const unregisterB = publishAmbientWallet(fake());
    expect(getAmbientStackCount()).toBe(2);
    unregisterA();
    expect(getAmbientStackCount()).toBe(1);
    unregisterB();
    expect(getAmbientStackCount()).toBe(0);
  });

  it("clearWalletReturnCapture re-opens sign-in after a failed capture (NEW-1)", () => {
    setWalletReturnCaptureActive();
    expect(getWalletReturnCaptureActive()).toBe(true);
    clearWalletReturnCapture();
    expect(getWalletReturnCaptureActive()).toBe(false);
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
