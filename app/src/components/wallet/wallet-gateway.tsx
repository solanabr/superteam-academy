"use client";

import { useState, useCallback, useEffect } from "react";
import { useWallet, type Wallet } from "@/lib/wallet/context";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { X } from "lucide-react";

interface WalletGatewayProps {
  isOpen: boolean;
  onClose: () => void;
}

// Known wallet brand colors
const WALLET_COLORS: Record<string, string> = {
  Phantom: "#AB9FF2",
  Backpack: "#E33E3F",
  Solflare: "#F6851B",
  "Trust Wallet": "#0500FF",
  Coinbase: "#0052FF",
};

function getWalletColor(name: string): string {
  return WALLET_COLORS[name] ?? "#666";
}

export function WalletGateway({ isOpen, onClose }: WalletGatewayProps) {
  const { wallets, select, connect, connecting, connected, wallet } =
    useWallet();
  const [pendingWallet, setPendingWallet] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter to detected/installed wallets, fallback to all if none detected
  const detected = wallets.filter(
    (w) =>
      w.readyState === WalletReadyState.Installed ||
      w.readyState === WalletReadyState.Loadable,
  );
  const displayWallets = detected.length > 0 ? detected : wallets;

  // Step 1: user clicks → select the wallet (state update, async by nature)
  const handleConnect = useCallback(
    (w: Wallet) => {
      setPendingWallet(w.adapter.name);
      select(w.adapter.name);
    },
    [select],
  );

  // Step 2: once the wallet adapter picks up the selection, call connect()
  useEffect(() => {
    if (
      pendingWallet &&
      wallet &&
      wallet.adapter.name === pendingWallet &&
      !connected &&
      !connecting
    ) {
      connect().catch(() => {
        setPendingWallet(null);
      });
    }
  }, [pendingWallet, wallet, connected, connecting, connect]);

  // Step 3: once connected, close the modal
  useEffect(() => {
    if (connected && pendingWallet) {
      setPendingWallet(null);
      onClose();
    }
  }, [connected, pendingWallet, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  return (
    <div
      className="fixed inset-0 z-[500] bg-[#050505] flex items-center justify-center"
      style={{
        clipPath: isOpen
          ? "circle(150% at 90% 10%)"
          : "circle(0% at 90% 10%)",
        transition: "clip-path 0.8s cubic-bezier(0.85, 0, 0.15, 1)",
        pointerEvents: isOpen ? "auto" : "none",
      }}
    >
      {/* Noise texture */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Perspective grid */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)",
          backgroundSize: "100px 100px",
          transform: "perspective(500px) rotateX(45deg) scale(2)",
        }}
      />

      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-10 right-12 w-16 h-16 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white transition-all z-50 group"
        aria-label="Close wallet connection"
      >
        <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
      </button>

      {/* Content */}
      <div className="relative z-10 w-full max-w-screen-xl px-6 md:px-12 flex flex-col md:flex-row gap-12 md:gap-20 items-center">
        {/* Left: Hero copy */}
        <div className="w-full md:w-1/2">
          <div className="w-16 h-1 bg-[#00FFA3] mb-12" />
          <h2 className="text-5xl md:text-7xl lg:text-8xl tracking-tighter mb-6 leading-none font-black text-white">
            Initialize <br />
            <span
              className="italic bg-clip-text text-transparent bg-gradient-to-r from-[#00FFA3] to-cyan-400"
              style={{ fontFamily: "var(--font-instrument-serif), serif" }}
            >
              Identity.
            </span>
          </h2>
          <p className="text-lg md:text-xl text-white/60 font-light max-w-md">
            Connect a Solana wallet to prove your skills and store your
            verifiable credentials entirely on-chain.
          </p>
        </div>

        {/* Right: Wallet options */}
        <div className="w-full md:w-1/2 flex flex-col gap-4">
          {mounted ? (
            <>
              {displayWallets.map((w) => {
                const installed =
                  w.readyState === WalletReadyState.Installed;
                const color = getWalletColor(w.adapter.name);

                return (
                  <button
                    key={w.adapter.name}
                    onClick={() => handleConnect(w)}
                    className="wallet-pill w-full p-6 md:p-8 border border-white/10 rounded-3xl bg-white/[0.02] backdrop-blur-md flex items-center justify-between text-left group"
                  >
                    <div className="flex items-center gap-4 md:gap-6 relative z-10">
                      <div
                        className="w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center p-2 md:p-3"
                        style={{ background: `${color}15` }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={w.adapter.icon}
                          className="w-full h-full"
                          alt={w.adapter.name}
                        />
                      </div>
                      <span
                        className={`text-2xl md:text-3xl font-bold tracking-tight transition-colors ${
                          installed
                            ? "text-white"
                            : "text-white/60 group-hover:text-white"
                        }`}
                      >
                        {w.adapter.name}
                      </span>
                    </div>
                    {installed && (
                      <span className="relative z-10 text-[10px] uppercase tracking-widest font-bold text-[#00FFA3] border border-[#00FFA3]/30 px-3 py-1 rounded-full bg-[#00FFA3]/10">
                        Installed
                      </span>
                    )}
                  </button>
                );
              })}

              {displayWallets.length === 0 && (
                <div className="text-center py-12 text-white/60">
                  <p className="text-lg mb-2">No wallets detected</p>
                  <p className="text-sm">
                    Install a Solana wallet like Phantom or Solflare to continue.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-white/60">
              <p className="text-lg mb-2">Detecting wallets...</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
