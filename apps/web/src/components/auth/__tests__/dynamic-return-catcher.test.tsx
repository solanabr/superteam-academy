// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import {
  getWalletReturnCaptureActive,
  publishAmbientWallet,
} from "@/lib/solana/ambient-wallet-store";
import { DynamicReturnCatcher } from "../dynamic-return-catcher";

/**
 * NEW-1 (#1097 review): the catcher sets the capture flag synchronously when
 * it decides to mount the scoped stack. If that lazy chunk then FAILS to
 * load (stale chunk after a deploy), nothing would ever register to clear
 * the flag — every sign-in trigger would stay disabled at "Signing in…" and
 * an uncaught layout-level throw would take out the route. The boundary must
 * swallow the failure, clear the flag, and log.
 */

const { logErrorMock } = vi.hoisted(() => ({ logErrorMock: vi.fn() }));

vi.mock("@/lib/dynamic/config", () => ({
  isDynamicEnabled: () => true,
}));
vi.mock("@/lib/logging", () => ({ logError: logErrorMock }));
// The chunk load itself fails: the factory throwing makes the dynamic import
// (and therefore React.lazy) reject.
vi.mock("@/components/auth/scoped-auth-providers", () => {
  throw new Error("chunk load failed");
});

function setUrl(search: string) {
  window.history.replaceState({}, "", `/${search}`);
}

beforeEach(() => {
  vi.clearAllMocks();
  // React logs caught boundary errors; keep the output readable.
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  setUrl("");
  // Reset the capture flag (a registration clears it) and leave the store empty.
  publishAmbientWallet({
    connected: false,
    publicKey: null,
    disconnect: async () => {},
    openWalletModal: () => {},
  })();
  vi.restoreAllMocks();
});

describe("DynamicReturnCatcher chunk failure (NEW-1)", () => {
  it("clears the capture flag, logs, and never escalates to the route", async () => {
    setUrl("?dynamicOauthState=s&dynamicOauthCode=c");

    const { container } = render(<DynamicReturnCatcher />);

    // The decision sets the flag before any chunk resolves…
    expect(getWalletReturnCaptureActive()).toBe(true);

    // …and the failed load clears it via the boundary instead of throwing.
    await waitFor(() => expect(getWalletReturnCaptureActive()).toBe(false));
    expect(logErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        errorId: "dynamic-return-catcher.chunk-failed",
      })
    );
    // Headless recovery: nothing rendered, route intact.
    expect(container).toBeEmptyDOMElement();
  });

  it("stays inert (no flag, no import) on an ordinary page load", () => {
    setUrl("");
    const { container } = render(<DynamicReturnCatcher />);
    expect(getWalletReturnCaptureActive()).toBe(false);
    expect(container).toBeEmptyDOMElement();
  });
});
