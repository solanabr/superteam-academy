// @vitest-environment jsdom
/* eslint-disable import/order -- vi.mock factories are hoisted above imports. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";

const sdkMock = vi.hoisted(() => {
  const listeners = new Map<string, Set<(d?: unknown) => void>>();
  return {
    listeners,
    client: null as unknown,
    autoConnect: vi.fn(async () => {}),
    connect: vi.fn(async () => {}),
    disconnect: vi.fn(async () => {}),
    signTransaction: vi.fn(async (tx: unknown) => tx),
    addresses: [] as Array<{ addressType: string; address: string }>,
    emit(event: string) {
      listeners.get(event)?.forEach((cb) => cb());
    },
    reset() {
      listeners.clear();
      this.addresses = [];
      this.autoConnect.mockClear();
      this.connect.mockClear();
      this.disconnect.mockClear();
      this.signTransaction.mockClear();
    },
  };
});

vi.mock("@phantom/browser-sdk", () => ({
  AddressType: { solana: "Solana", ethereum: "Ethereum" },
}));

vi.mock("@/lib/phantom/client", () => ({
  createPhantomClient: () =>
    sdkMock.client === null
      ? null
      : {
          autoConnect: sdkMock.autoConnect,
          connect: sdkMock.connect,
          disconnect: sdkMock.disconnect,
          getAddresses: () => sdkMock.addresses,
          on: (e: string, cb: () => void) => {
            if (!sdkMock.listeners.has(e)) sdkMock.listeners.set(e, new Set());
            sdkMock.listeners.get(e)!.add(cb);
          },
          off: (e: string, cb: () => void) => {
            sdkMock.listeners.get(e)?.delete(cb);
          },
          solana: { signTransaction: sdkMock.signTransaction },
        },
}));

import {
  PhantomConnectProvider,
  usePhantomConnect,
} from "../phantom-connect-provider";

function Probe() {
  const { enabled, status, address } = usePhantomConnect();
  return (
    <div>
      <span data-testid="enabled">{String(enabled)}</span>
      <span data-testid="status">{status}</span>
      <span data-testid="address">{address ?? "none"}</span>
    </div>
  );
}

function renderProvider() {
  return render(
    <PhantomConnectProvider>
      <Probe />
    </PhantomConnectProvider>
  );
}

beforeEach(() => {
  sdkMock.reset();
  sdkMock.client = {};
});

describe("PhantomConnectProvider (#985)", () => {
  it("stays disabled and touches no SDK when the feature is gated off", async () => {
    sdkMock.client = null;

    renderProvider();

    expect(screen.getByTestId("enabled")).toHaveTextContent("false");
    // Gated off must mean no auth-service traffic at all, not just hidden UI.
    expect(sdkMock.autoConnect).not.toHaveBeenCalled();
  });

  it("calls autoConnect to resume an existing session", async () => {
    renderProvider();

    await waitFor(() => expect(sdkMock.autoConnect).toHaveBeenCalled());
    expect(screen.getByTestId("enabled")).toHaveTextContent("true");
  });

  // connect() is a redirect flow: this tab navigates away and its promise never
  // resolves, so the address can only arrive via the `connect` event on the way
  // back. Reading it from connect()'s return value would strand the UI.
  it("picks up the Solana address from the connect event after the redirect", async () => {
    renderProvider();
    await waitFor(() => expect(sdkMock.autoConnect).toHaveBeenCalled());

    sdkMock.addresses = [
      { addressType: "Ethereum", address: "0xdead" },
      { addressType: "Solana", address: "SoLaNaAddr111" },
    ];
    act(() => sdkMock.emit("connect"));

    await waitFor(() =>
      expect(screen.getByTestId("address")).toHaveTextContent("SoLaNaAddr111")
    );
    expect(screen.getByTestId("status")).toHaveTextContent("connected");
  });

  // 7-day expiry and "Revoke permissions" in Phantom both arrive as `disconnect`.
  it("returns to a clean idle state on disconnect, never a stuck spinner", async () => {
    renderProvider();
    await waitFor(() => expect(sdkMock.autoConnect).toHaveBeenCalled());

    sdkMock.addresses = [{ addressType: "Solana", address: "SoLaNaAddr111" }];
    act(() => sdkMock.emit("connect"));
    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("connected")
    );

    sdkMock.addresses = [];
    act(() => sdkMock.emit("disconnect"));

    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("idle")
    );
    expect(screen.getByTestId("address")).toHaveTextContent("none");
  });

  it("stays idle when there is no session to resume — the first-time visitor case", async () => {
    sdkMock.autoConnect.mockRejectedValueOnce(new Error("no session"));

    renderProvider();

    await waitFor(() => expect(sdkMock.autoConnect).toHaveBeenCalled());
    // A rejected autoConnect is the normal first-visit path, so the sign-in
    // options must still render rather than the UI showing an error.
    expect(screen.getByTestId("status")).toHaveTextContent("idle");
    expect(screen.getByTestId("enabled")).toHaveTextContent("true");
  });
});

describe("PhantomConnectProvider — signTransaction (walletless enrolment)", () => {
  function SignProbe() {
    const { signTransaction } = usePhantomConnect();
    return (
      <button
        onClick={() => {
          void signTransaction({} as never).then(
            () => {
              document.title = "signed";
            },
            () => {
              document.title = "sign-rejected";
            }
          );
        }}
      >
        sign
      </button>
    );
  }

  it("rejects when no wallet is connected", async () => {
    render(
      <PhantomConnectProvider>
        <SignProbe />
      </PhantomConnectProvider>
    );
    await waitFor(() => expect(sdkMock.autoConnect).toHaveBeenCalled());

    screen.getByRole("button", { name: "sign" }).click();

    await waitFor(() => expect(document.title).toBe("sign-rejected"));
    expect(sdkMock.signTransaction).not.toHaveBeenCalled();
  });

  it("delegates to the SDK's Solana chain once connected", async () => {
    render(
      <PhantomConnectProvider>
        <SignProbe />
      </PhantomConnectProvider>
    );
    await waitFor(() => expect(sdkMock.autoConnect).toHaveBeenCalled());

    sdkMock.addresses = [{ addressType: "Solana", address: "SoLaNaAddr111" }];
    act(() => sdkMock.emit("connect"));

    screen.getByRole("button", { name: "sign" }).click();

    await waitFor(() => expect(document.title).toBe("signed"));
    expect(sdkMock.signTransaction).toHaveBeenCalledTimes(1);
  });
});

describe("PhantomConnectProvider — connect() rejection (#992 review)", () => {
  function ConnectProbe() {
    const { status, connect } = usePhantomConnect();
    return (
      <div>
        <span data-testid="status2">{status}</span>
        <button
          onClick={() => {
            // Swallow here the way a caller's catch would — the assertion is
            // that the rejection REACHES this handler at all.
            void connect("google").catch(() => {
              document.title = "caller-saw-rejection";
            });
          }}
        >
          go
        </button>
      </div>
    );
  }

  it("rethrows to the caller AND records error status — never swallows", async () => {
    sdkMock.connect.mockRejectedValueOnce(new Error("popup closed"));

    render(
      <PhantomConnectProvider>
        <ConnectProbe />
      </PhantomConnectProvider>
    );
    await waitFor(() => expect(sdkMock.autoConnect).toHaveBeenCalled());

    screen.getByRole("button", { name: "go" }).click();

    // Both halves of the contract: hook consumers see `status: "error"`, and
    // imperative callers get the rejection they need to reset their own UI
    // (the AuthModal's loading flag — a swallowed error left it stuck forever).
    await waitFor(() =>
      expect(screen.getByTestId("status2")).toHaveTextContent("error")
    );
    await waitFor(() => expect(document.title).toBe("caller-saw-rejection"));
  });
});
