"use client";

import { create } from "zustand";

type WalletKind = "phantom" | "backpack" | "solflare";
type WalletPublicKey = { toBase58: () => string };

type BrowserWalletProvider = {
  isConnected?: boolean;
  publicKey?: WalletPublicKey;
  connect: () => Promise<{ publicKey: WalletPublicKey }>;
  disconnect: () => Promise<void>;
  signMessage?: (message: Uint8Array) => Promise<Uint8Array>;
  signTransaction?: (tx: unknown) => Promise<{ serialize: () => Uint8Array }>;
  signAndSendTransaction?: (
    tx: unknown,
    options?: { preflightCommitment?: "processed" | "confirmed" | "finalized" },
  ) => Promise<{ signature: string } | string>;
};

type WalletStore = {
  connected: boolean;
  walletAddress: string | null;
  walletKind: WalletKind | null;
  setConnection: (connected: boolean, walletAddress: string | null, walletKind?: WalletKind | null) => void;
  init: () => void;
  connect: (kind: WalletKind) => Promise<void>;
  disconnect: () => Promise<void>;
  submitDevnetEnrollmentTransaction: (courseId: string) => Promise<string>;
};

type SolanaWeb3Runtime = {
  Connection: new (endpoint: string, commitment?: string) => {
    getLatestBlockhash: (commitment?: string) => Promise<{ blockhash: string; lastValidBlockHeight: number }>;
    sendRawTransaction: (rawTx: Uint8Array) => Promise<string>;
    confirmTransaction: (
      args: { signature: string; blockhash: string; lastValidBlockHeight: number },
      commitment?: string,
    ) => Promise<unknown>;
  };
  PublicKey: new (value: string) => unknown;
  SystemProgram: {
    transfer: (args: { fromPubkey: unknown; toPubkey: unknown; lamports: number }) => unknown;
  };
  Transaction: new () => {
    feePayer?: unknown;
    recentBlockhash?: string;
    add: (...items: unknown[]) => unknown;
  };
};

function getProvider(kind: WalletKind): BrowserWalletProvider | null {
  if (typeof window === "undefined") return null;
  const providerMap: Record<WalletKind, BrowserWalletProvider | null> = {
    phantom: (window as unknown as { phantom?: { solana?: BrowserWalletProvider } }).phantom?.solana ?? null,
    backpack: (window as unknown as { backpack?: BrowserWalletProvider }).backpack ?? null,
    solflare: (window as unknown as { solflare?: BrowserWalletProvider }).solflare ?? null,
  };
  return providerMap[kind];
}

function getSolanaWeb3Runtime(): SolanaWeb3Runtime {
  if (typeof window === "undefined") {
    throw new Error("Solana runtime unavailable on server");
  }
  const runtime = (window as unknown as { solanaWeb3?: SolanaWeb3Runtime }).solanaWeb3;
  if (!runtime) {
    throw new Error("Solana web3 runtime not loaded yet");
  }
  return runtime;
}

export const useWalletStore = create<WalletStore>((set, get) => ({
  connected: false,
  walletAddress: null,
  walletKind: null,
  setConnection: (connected, walletAddress, walletKind = null) => {
    set({ connected, walletAddress, walletKind });
  },
  init: () => {
    const kinds: WalletKind[] = ["phantom", "backpack", "solflare"];
    for (const kind of kinds) {
      const provider = getProvider(kind);
      if (provider?.isConnected && provider.publicKey) {
        set({
          connected: true,
          walletAddress: provider.publicKey.toBase58(),
          walletKind: kind,
        });
        return;
      }
    }
  },
  connect: async (kind) => {
    const provider = getProvider(kind);
    if (!provider) {
      throw new Error(`${kind} wallet not found in browser`);
    }
    const response = await provider.connect();
    set({
      connected: true,
      walletAddress: response.publicKey.toBase58(),
      walletKind: kind,
    });
  },
  disconnect: async () => {
    const { walletKind } = get();
    if (!walletKind) return;
    const provider = getProvider(walletKind);
    await provider?.disconnect();
    set({
      connected: false,
      walletAddress: null,
      walletKind: null,
    });
  },
  submitDevnetEnrollmentTransaction: async (courseId) => {
    void courseId;
    const { walletKind, walletAddress } = get();
    if (!walletKind || !walletAddress) {
      throw new Error("Wallet not connected");
    }
    const provider = getProvider(walletKind);
    if (!provider) {
      throw new Error("Wallet provider unavailable");
    }
    const solanaWeb3 = getSolanaWeb3Runtime();
    const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
    const connection = new solanaWeb3.Connection(endpoint, "confirmed");
    const from = new solanaWeb3.PublicKey(walletAddress);
    const tx = new solanaWeb3.Transaction();
    tx.add(
      solanaWeb3.SystemProgram.transfer({
        fromPubkey: from,
        toPubkey: from,
        lamports: 1,
      }),
    );
    tx.feePayer = from;
    const latest = await connection.getLatestBlockhash("confirmed");
    tx.recentBlockhash = latest.blockhash;

    if (provider.signAndSendTransaction) {
      const result = await provider.signAndSendTransaction(tx, { preflightCommitment: "confirmed" });
      const signature = typeof result === "string" ? result : result.signature;
      await connection.confirmTransaction(
        { signature, blockhash: latest.blockhash, lastValidBlockHeight: latest.lastValidBlockHeight },
        "confirmed",
      );
      return signature;
    }
    if (!provider.signTransaction) {
      throw new Error("Wallet does not support transaction signing");
    }
    const signed = await provider.signTransaction(tx);
    const signature = await connection.sendRawTransaction(signed.serialize());
    await connection.confirmTransaction(
      { signature, blockhash: latest.blockhash, lastValidBlockHeight: latest.lastValidBlockHeight },
      "confirmed",
    );
    return signature;
  },
}));
