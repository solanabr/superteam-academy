"use client";

import bs58 from "bs58";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { sendInitLearner } from "@/lib/solana/init-learner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type WalletSessionResponse = {
  authenticated: boolean;
  user: {
    id: string;
    walletAddress: string;
    username: string;
  } | null;
};

type VerifyWalletResponse = {
  ok: boolean;
  user: WalletSessionResponse["user"];
};

/**
 * Auth status state machine:
 *
 *   idle ─── (wallet connects) ───► checking
 *   checking ─── (session found) ──► authenticated
 *   checking ─── (no session) ────► signing  (auto-prompt sign message)
 *   signing ─── (success) ────────► authenticated
 *   signing ─── (user rejected) ──► disconnected  (reset, ask to reconnect)
 *   signing ─── (network error) ──► signing  (auto-retry up to MAX_RETRIES)
 *   signing ─── (max retries) ────► disconnected
 *   authenticated ─── (logout) ───► disconnected
 *   disconnected ─── (connect) ───► checking
 */
type AuthStatus =
  | "idle"
  | "checking"
  | "signing"
  | "authenticated"
  | "disconnected";

type WalletAuthContextValue = {
  /** Convenience booleans derived from status */
  isLoading: boolean;
  isAuthenticated: boolean;
  user: WalletSessionResponse["user"];
  status: AuthStatus;
  /** Trigger the wallet modal + sign-in flow. Used by landing CTAs. */
  loginWithWallet: () => Promise<void>;
  logout: () => Promise<void>;
};

const WalletAuthContext = createContext<WalletAuthContextValue | undefined>(
  undefined,
);

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_AUTH_RETRIES = 3;
const RETRY_DELAY_MS = 1500;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isUserRejection(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes("rejected") ||
    msg.includes("user rejected") ||
    msg.includes("user denied") ||
    msg.includes("cancelled") ||
    (error as any).name === "WalletSignMessageError"
  );
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

type WalletAuthProviderProps = {
  children: ReactNode;
};

export function WalletAuthProvider({ children }: WalletAuthProviderProps) {
  const { publicKey, signMessage, sendTransaction, connected, disconnect } =
    useWallet();
  const [status, setStatus] = useState<AuthStatus>("idle");
  const [user, setUser] = useState<WalletSessionResponse["user"]>(null);

  // Track which address we already completed auth for to avoid re-prompts
  const authedAddressRef = useRef<string | null>(null);
  const learnerInitRef = useRef<string | null>(null);
  // Guard against concurrent auth runs
  const authInFlightRef = useRef(false);

  // -----------------------------------------------------------------------
  // 1. Check existing session cookie via /api/auth/me
  // -----------------------------------------------------------------------
  const checkSession = useCallback(async (): Promise<WalletSessionResponse> => {
    const response = await fetch("/api/auth/me", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });
    return (await response.json()) as WalletSessionResponse;
  }, []);

  // -----------------------------------------------------------------------
  // 2. Full sign-in flow: nonce ► sign message ► verify – with retries
  // -----------------------------------------------------------------------
  const performSignIn = useCallback(
    async (walletAddress: string): Promise<VerifyWalletResponse> => {
      if (!signMessage) {
        throw new Error("This wallet does not support message signing.");
      }

      let lastError: Error | null = null;

      for (let attempt = 0; attempt < MAX_AUTH_RETRIES; attempt++) {
        try {
          // 2a. Get nonce
          const nonceRes = await fetch("/api/auth/wallet/nonce", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ address: walletAddress }),
          });
          if (!nonceRes.ok) throw new Error("Failed to generate wallet nonce.");

          const { message } = (await nonceRes.json()) as { message: string };
          const messageBytes = new TextEncoder().encode(message);

          // 2b. Sign
          let signedMessage: Uint8Array;
          try {
            signedMessage = await signMessage(messageBytes);
          } catch (signError: unknown) {
            // User explicitly rejected — do NOT retry
            if (isUserRejection(signError)) throw signError;
            throw signError;
          }
          const signature = bs58.encode(signedMessage);

          // 2c. Verify
          const verifyRes = await fetch("/api/auth/wallet/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              address: walletAddress,
              message,
              signature,
            }),
          });
          if (!verifyRes.ok)
            throw new Error("Wallet signature verification failed.");

          return (await verifyRes.json()) as VerifyWalletResponse;
        } catch (err) {
          // User rejection — propagate immediately, no retry
          if (isUserRejection(err)) throw err;

          lastError = err instanceof Error ? err : new Error(String(err));
          if (attempt < MAX_AUTH_RETRIES - 1) {
            await sleep(RETRY_DELAY_MS * (attempt + 1));
          }
        }
      }

      throw lastError ?? new Error("Authentication failed after retries.");
    },
    [signMessage],
  );

  // -----------------------------------------------------------------------
  // 3. Main auth orchestrator – called on wallet connect & manual login
  // -----------------------------------------------------------------------
  const authenticate = useCallback(
    async (options?: { forceSign?: boolean }) => {
      if (!publicKey || !connected) return;
      if (authInFlightRef.current) return;
      authInFlightRef.current = true;

      const walletAddress = publicKey.toBase58();

      try {
        // Check existing session first
        setStatus("checking");
        const session = await checkSession();

        if (
          session.authenticated &&
          session.user &&
          session.user.walletAddress === walletAddress &&
          !options?.forceSign
        ) {
          // Session still valid for this wallet
          setUser(session.user);
          setStatus("authenticated");
          authedAddressRef.current = walletAddress;
          return;
        }

        // No valid session — need to sign
        setStatus("signing");
        const result = await performSignIn(walletAddress);

        setUser(result.user ?? null);
        setStatus("authenticated");
        authedAddressRef.current = walletAddress;
      } catch (err) {
        // Reset on failure
        setUser(null);
        setStatus("disconnected");
        authedAddressRef.current = null;

        if (isUserRejection(err)) {
          // User chose not to sign — disconnect wallet cleanly
          try {
            await disconnect();
          } catch {
            /* ignore */
          }
        }
      } finally {
        authInFlightRef.current = false;
      }
    },
    [publicKey, connected, checkSession, performSignIn, disconnect],
  );

  // -----------------------------------------------------------------------
  // 4. loginWithWallet – public API used by CTAs & buttons
  // -----------------------------------------------------------------------
  const loginWithWallet = useCallback(async () => {
    // If wallet is already connected + authed, nothing to do
    if (status === "authenticated" && user) return;
    await authenticate({ forceSign: false });
  }, [status, user, authenticate]);

  // -----------------------------------------------------------------------
  // 5. logout
  // -----------------------------------------------------------------------
  const logout = useCallback(async () => {
    setStatus("checking");
    try {
      await fetch("/api/auth/wallet/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      /* best-effort */
    }
    setUser(null);
    setStatus("disconnected");
    authedAddressRef.current = null;
    learnerInitRef.current = null;
    try {
      if (connected) await disconnect();
    } catch {
      /* ignore */
    }
  }, [connected, disconnect]);

  // -----------------------------------------------------------------------
  // 6. React to wallet connect / disconnect
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!connected || !publicKey) {
      // Wallet disconnected externally
      if (status !== "idle") {
        setUser(null);
        setStatus("disconnected");
        authedAddressRef.current = null;
        learnerInitRef.current = null;
      }
      return;
    }

    const walletAddress = publicKey.toBase58();

    // If we switched wallets, reset
    if (
      authedAddressRef.current &&
      authedAddressRef.current !== walletAddress
    ) {
      setUser(null);
      setStatus("idle");
      authedAddressRef.current = null;
      learnerInitRef.current = null;
    }

    // Auto-authenticate on wallet connect
    if (authedAddressRef.current !== walletAddress) {
      void authenticate();
    }
  }, [connected, publicKey, status, authenticate]);

  // -----------------------------------------------------------------------
  // 7. Auto-init learner profile once authenticated
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!connected || !publicKey || !sendTransaction) return;
    if (status !== "authenticated" || !user) return;
    if (user.walletAddress !== publicKey.toBase58()) return;
    if (learnerInitRef.current === user.walletAddress) return;

    let cancelled = false;

    const run = async () => {
      try {
        const response = await fetch("/api/identity/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });
        if (!response.ok) return;
        const payload = (await response.json()) as {
          authenticated?: boolean;
          snapshot?: { chain?: { hasLearnerProfile?: boolean } } | null;
        };
        if (!payload.authenticated) return;
        if (payload.snapshot?.chain?.hasLearnerProfile) {
          learnerInitRef.current = user.walletAddress;
          return;
        }

        learnerInitRef.current = user.walletAddress;
        await sendInitLearner(sendTransaction, user.walletAddress);
      } catch {
        // Non-critical — learner profile can be retried later
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [connected, publicKey, sendTransaction, status, user]);

  // -----------------------------------------------------------------------
  // 8. Context value
  // -----------------------------------------------------------------------
  const isAuthenticated = status === "authenticated";
  const isLoading = status === "checking" || status === "signing";

  const value = useMemo<WalletAuthContextValue>(
    () => ({
      isLoading,
      isAuthenticated,
      user,
      status,
      loginWithWallet,
      logout,
    }),
    [isLoading, isAuthenticated, user, status, loginWithWallet, logout],
  );

  return (
    <WalletAuthContext.Provider value={value}>
      {children}
    </WalletAuthContext.Provider>
  );
}

export function useWalletAuth(): WalletAuthContextValue {
  const context = useContext(WalletAuthContext);
  if (!context) {
    throw new Error("useWalletAuth must be used within WalletAuthProvider.");
  }
  return context;
}
