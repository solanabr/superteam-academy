"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AddressType, type BrowserSDK } from "@phantom/browser-sdk";
import type { Transaction, VersionedTransaction } from "@solana/web3.js";
import { createPhantomClient } from "@/lib/phantom/client";

/**
 * Phantom Connect state for the app (#985, epic #983).
 *
 * Wraps `@phantom/browser-sdk` by hand rather than using `@phantom/react-sdk`,
 * which needs React >= 19.0.1 while this app is on 18.3.1 (#989).
 *
 * The SDK touches `window` and talks to Phantom's auth service, so the client is
 * created lazily on mount and never during render or on the server.
 */

export type PhantomAuthProvider = "google" | "apple" | "injected";

export type PhantomConnectStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "error";

interface PhantomConnectValue {
  /** False when no app id is configured — render no Phantom UI at all. */
  enabled: boolean;
  status: PhantomConnectStatus;
  /** Connected Solana address, or null. */
  address: string | null;
  connect: (provider: PhantomAuthProvider) => Promise<void>;
  disconnect: () => Promise<void>;
  /**
   * Signs a transaction with the embedded wallet (#1004 follow-up). Sign-only
   * by design: the app submits through its own RPC connection, so the SDK's
   * network setting can never route a devnet transaction to mainnet or vice
   * versa. Rejects when no wallet is connected.
   */
  signTransaction: (
    transaction: Transaction
  ) => Promise<Transaction | VersionedTransaction>;
}

const PhantomConnectContext = createContext<PhantomConnectValue>({
  enabled: false,
  status: "idle",
  address: null,
  connect: async () => {},
  disconnect: async () => {},
  signTransaction: async () => {
    throw new Error("Phantom Connect is not available");
  },
});

/** Picks the Solana address; we request no other type (see lib/phantom/client). */
function solanaAddressOf(sdk: BrowserSDK): string | null {
  const match = sdk
    .getAddresses()
    .find((a) => a.addressType === AddressType.solana);
  return match?.address ?? null;
}

export function PhantomConnectProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const sdkRef = useRef<BrowserSDK | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [status, setStatus] = useState<PhantomConnectStatus>("idle");
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    const sdk = createPhantomClient();
    if (!sdk) return; // Gated off: no client, no listeners, no traffic.
    sdkRef.current = sdk;
    setEnabled(true);

    // `connect` is a redirect flow: the app remounts on the way back, so the
    // session is rehydrated through events + autoConnect rather than from
    // connect()'s return value, which never resolves in the redirecting tab.
    const onConnect = () => {
      setAddress(solanaAddressOf(sdk));
      setStatus("connected");
    };
    // A session lasts 7 days, and a learner can revoke the app from Phantom's
    // Settings → Connected Apps at any time. Both arrive as `disconnect`, and
    // must land us back in a clean signed-out state rather than a stuck spinner.
    const onDisconnect = () => {
      setAddress(null);
      setStatus("idle");
    };
    sdk.on("connect", onConnect);
    sdk.on("disconnect", onDisconnect);

    // Order matters — the SDK documents autoConnect as "should be called after
    // setting up event listeners", since it resolves an existing session and
    // emits `connect` synchronously enough to be missed otherwise.
    void sdk.autoConnect().catch((err: unknown) => {
      // No session to resume is the normal case for a first-time visitor, not
      // an error worth showing: stay idle so the sign-in options still render.
      console.debug("[PhantomConnect] no session to resume:", err);
    });

    return () => {
      sdk.off("connect", onConnect);
      sdk.off("disconnect", onDisconnect);
    };
  }, []);

  const connect = useCallback(async (provider: PhantomAuthProvider) => {
    const sdk = sdkRef.current;
    if (!sdk) return;
    setStatus("connecting");
    try {
      await sdk.connect({ provider });
      setAddress(solanaAddressOf(sdk));
      setStatus("connected");
    } catch (err) {
      // A failure BEFORE the redirect fires — closed Google popup, network
      // blip, Phantom outage — is entirely possible: connect() only truly stops
      // resolving once the tab actually navigates away.
      setAddress(null);
      setStatus("error");
      // RETHROW after recording state (PR #992 review). Swallowing here made
      // the AuthModal's catch dead code: its `loading` flag never reset, and
      // since the Dialog only closes when !loading, one pre-redirect failure
      // left the modal permanently stuck with every sign-in option disabled.
      // The provider keeps `status` for hook consumers; imperative callers get
      // the rejection they need to reset their own UI.
      throw err;
    }
  }, []);

  const signTransaction = useCallback(
    async (transaction: Transaction) => {
      const sdk = sdkRef.current;
      if (!sdk || !address) {
        throw new Error("Phantom wallet is not connected");
      }
      return sdk.solana.signTransaction(transaction);
    },
    [address]
  );

  const disconnect = useCallback(async () => {
    const sdk = sdkRef.current;
    if (!sdk) return;
    try {
      await sdk.disconnect();
    } finally {
      // Local state clears either way: a failed disconnect must not leave the UI
      // claiming a wallet the learner has already walked away from.
      setAddress(null);
      setStatus("idle");
    }
  }, []);

  return (
    <PhantomConnectContext.Provider
      value={{ enabled, status, address, connect, disconnect, signTransaction }}
    >
      {children}
    </PhantomConnectContext.Provider>
  );
}

export function usePhantomConnect(): PhantomConnectValue {
  return useContext(PhantomConnectContext);
}
