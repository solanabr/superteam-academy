"use client";

import { useCallback, useEffect, useRef } from "react";
import { useWallet } from "@/lib/wallet/context";
import { useWalletAuth } from "@/lib/hooks/use-wallet-auth";

/**
 * Deferred authentication hook. Wraps write actions with wallet + auth gating:
 *   - If authenticated → run action immediately
 *   - If connected but no session → trigger sign-in, then run action
 *   - If not connected → open wallet gateway, wait for connect + sign, then run
 */
export function useRequireAuth() {
  const { connected, publicKey, signMessage } = useWallet();
  const { isAuthenticated, authenticate, state } = useWalletAuth();
  const pendingAction = useRef<(() => void | Promise<void>) | null>(null);
  const awaitingConnect = useRef(false);
  const awaitingAuth = useRef(false);

  // When wallet connects and we were waiting for it → trigger auth
  useEffect(() => {
    if (awaitingConnect.current && connected && publicKey && signMessage) {
      awaitingConnect.current = false;
      awaitingAuth.current = true;
      authenticate();
    }
  }, [connected, publicKey, signMessage, authenticate]);

  // When auth completes and we have a pending action → run it
  useEffect(() => {
    if (awaitingAuth.current && isAuthenticated && pendingAction.current) {
      awaitingAuth.current = false;
      const action = pendingAction.current;
      pendingAction.current = null;
      action();
    }
  }, [isAuthenticated]);

  // If auth fails or user rejects → clear pending action
  useEffect(() => {
    if ((state === "error" || state === "idle") && awaitingAuth.current) {
      awaitingAuth.current = false;
      pendingAction.current = null;
    }
  }, [state]);

  const requireAuth = useCallback(
    async (action: () => void | Promise<void>) => {
      // Already authenticated — run immediately
      if (isAuthenticated) {
        await action();
        return;
      }

      // Store the action for deferred execution
      pendingAction.current = action;

      if (connected && publicKey && signMessage) {
        // Connected but no session — sign first
        awaitingAuth.current = true;
        authenticate();
      } else {
        // Not connected — open wallet gateway
        awaitingConnect.current = true;
        window.dispatchEvent(new Event("open-wallet-gateway"));
      }
    },
    [connected, publicKey, signMessage, isAuthenticated, authenticate],
  );

  return { requireAuth, isAuthenticated };
}
