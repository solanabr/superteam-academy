"use client";

import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getDisplayName, onDisplayNameChanged } from "@/lib/display-name";

export function WalletConnectButton() {
  const { setVisible } = useWalletModal();
  const { publicKey, connected, disconnect } = useWallet();
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayNameState] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const refreshDisplayName = () => {
    if (publicKey) {
      setDisplayNameState(getDisplayName(publicKey.toBase58()));
    } else {
      setDisplayNameState(null);
    }
  };

  useEffect(() => {
    refreshDisplayName();
  }, [publicKey]);

  useEffect(() => {
    return onDisplayNameChanged((walletAddress) => {
      if (publicKey && publicKey.toBase58() === walletAddress) {
        setDisplayNameState(getDisplayName(walletAddress));
      }
    });
  }, [publicKey]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [open]);

  const label =
    connected && publicKey
      ? displayName?.trim() || `${publicKey.toBase58().slice(0, 4)}…${publicKey.toBase58().slice(-4)}`
      : "Connect wallet";

  if (connected) {
    return (
      <div ref={ref} className="relative">
        <Button
          variant="default"
          size="default"
          onClick={() => setOpen((o) => !o)}
          className="min-w-[140px] truncate"
          aria-expanded={open}
          aria-haspopup="true"
        >
          {label}
        </Button>
        {open && (
          <div
            className={cn(
              "absolute right-0 top-full z-50 mt-2 min-w-[200px] rounded-xl border border-border bg-card px-2 py-2 shadow-xl"
            )}
          >
            <button
              type="button"
              className={cn(
                "flex w-full items-center rounded-lg px-4 py-2.5 text-left text-sm font-medium transition-colors",
                "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
              )}
              onClick={() => {
                setOpen(false);
                setVisible(true);
              }}
            >
              Change wallet
            </button>
            <button
              type="button"
              className={cn(
                "flex w-full items-center rounded-lg px-4 py-2.5 text-left text-sm font-medium transition-colors",
                "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
              )}
              onClick={() => {
                if (publicKey) {
                  navigator.clipboard.writeText(publicKey.toBase58());
                  toast.success("Address copied");
                  setOpen(false);
                }
              }}
            >
              Copy address
            </button>
            <button
              type="button"
              className={cn(
                "flex w-full items-center rounded-lg px-4 py-2.5 text-left text-sm font-medium transition-colors",
                "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
              )}
              onClick={() => {
                setOpen(false);
                disconnect();
              }}
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <Button
      variant="default"
      size="default"
      onClick={() => setVisible(true)}
      className="min-w-[140px]"
    >
      {label}
    </Button>
  );
}
