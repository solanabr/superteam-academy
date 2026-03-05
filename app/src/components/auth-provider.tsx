"use client";

import { createContext, useMemo } from "react";
import { PrivyProvider, usePrivy } from "@privy-io/react-auth";
import {
  toSolanaWalletConnectors,
  useWallets,
} from "@privy-io/react-auth/solana";
import { PublicKey } from "@solana/web3.js";
import { createSolanaRpc, createSolanaRpcSubscriptions } from "@solana/kit";
import type { ConnectedStandardSolanaWallet } from "@privy-io/react-auth/solana";
import type { User } from "@privy-io/react-auth";

const SOLANA_RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC ?? "https://api.devnet.solana.com";
const SOLANA_WS_URL = SOLANA_RPC_URL.replace("https://", "wss://").replace(
  "http://",
  "ws://",
);

const solanaDevnetRpc = {
  rpc: createSolanaRpc(SOLANA_RPC_URL),
  rpcSubscriptions: createSolanaRpcSubscriptions(SOLANA_WS_URL),
};

export interface AuthState {
  publicKey: PublicKey | null;
  connected: boolean;
  userId: string;
  user: User | null;
  login: () => void;
  logout: () => Promise<void>;
  solanaWallet: ConnectedStandardSolanaWallet | undefined;
  ready: boolean;
  authenticated: boolean;
}

const noop = () => {};
const noopAsync = () => Promise.resolve();

const defaultAuth: AuthState = {
  publicKey: null,
  connected: false,
  userId: "anonymous",
  user: null,
  login: noop,
  logout: noopAsync,
  solanaWallet: undefined,
  ready: true,
  authenticated: false,
};

export const AuthContext = createContext<AuthState>(defaultAuth);

const solanaConnectors = toSolanaWalletConnectors({
  shouldAutoConnect: true,
});

/** Inner component that reads Privy hooks and provides AuthContext */
function PrivyAuthBridge({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();

  const solanaWallet: ConnectedStandardSolanaWallet | undefined = wallets[0];
  const walletAddress = solanaWallet?.address;

  const publicKey = useMemo(() => {
    if (walletAddress) {
      try {
        return new PublicKey(walletAddress);
      } catch {
        return null;
      }
    }
    return null;
  }, [walletAddress]);

  // "connected" requires wallets to be ready, but "ready" only needs Privy SDK ready
  // so the login button can appear before wallet detection completes
  const connected = ready && authenticated && walletsReady && !!publicKey;
  const userId = publicKey?.toBase58() ?? user?.id ?? "anonymous";

  const value = useMemo(
    () => ({
      publicKey,
      connected,
      userId,
      user: user ?? null,
      login,
      logout,
      solanaWallet,
      ready,
      authenticated,
    }),
    [
      publicKey,
      connected,
      userId,
      user,
      login,
      logout,
      solanaWallet,
      ready,
      authenticated,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!appId) {
    // No Privy configured — provide default unauthenticated context
    return (
      <AuthContext.Provider value={defaultAuth}>
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#008c4C",
          logo: "/logo.png",
          landingHeader: "Superteam Academy",
          loginMessage: "Aprenda Solana. Ganhe XP. Conquiste credenciais.",
          walletChainType: "solana-only",
        },
        loginMethods: ["google", "github", "email", "wallet"],
        embeddedWallets: {
          solana: {
            createOnLogin: "users-without-wallets",
          },
        },
        externalWallets: {
          solana: {
            connectors: solanaConnectors,
          },
        },
        solana: {
          rpcs: {
            "solana:devnet": solanaDevnetRpc,
            "solana:mainnet": solanaDevnetRpc,
          },
        },
      }}
    >
      <PrivyAuthBridge>{children}</PrivyAuthBridge>
    </PrivyProvider>
  );
}
