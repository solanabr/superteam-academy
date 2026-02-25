"use client";

import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

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

  // Redirect to dashboard only on the *moment* of connection (false → true),
  // not on every render — so visiting `/` while already connected won't bounce you.
  const prevConnected = useRef(connected);
  useEffect(() => {
    if (connected && !prevConnected.current) {
      router.push("/dashboard");
    }
    prevConnected.current = connected;
  }, [connected, router]);

  const label =
    connected && publicKey
      ? displayName?.trim() || `${publicKey.toBase58().slice(0, 4)}…${publicKey.toBase58().slice(-4)}`
      : "Connect";

  if (connected) {
    return (
      <div ref={ref} className="relative">
        <Button
          variant="pixel"
          size="default"
          onClick={() => setOpen((o) => !o)}
          className="min-w-[140px] truncate font-game text-xl"
          aria-expanded={open}
          aria-haspopup="true"
        >
          {label}
        </Button>
        {open && (
          <div
            className={cn(
              "absolute right-0 top-full z-50 mt-2 min-w-[200px] rounded-xl border-2 border-zinc-700 bg-zinc-900 px-2 py-2 shadow-xl"
            )}
          >
            <button
              type="button"
              className="flex w-full items-center rounded-lg px-4 py-2.5 text-left font-game text-lg transition-colors hover:bg-zinc-800"
              onClick={() => {
                setOpen(false);
                router.push("/dashboard");
              }}
            >
              Dashboard
            </button>
            <button
              type="button"
              className="flex w-full items-center rounded-lg px-4 py-2.5 text-left font-game text-lg transition-colors hover:bg-zinc-800"
              onClick={() => {
                setOpen(false);
                setVisible(true);
              }}
            >
              Change wallet
            </button>
            <button
              type="button"
              className="flex w-full items-center rounded-lg px-4 py-2.5 text-left font-game text-lg transition-colors hover:bg-zinc-800"
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
              className="flex w-full items-center rounded-lg px-4 py-2.5 text-left font-game text-lg text-red-400 transition-colors hover:bg-zinc-800"
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
      variant="pixel"
      size="default"
      onClick={() => setVisible(true)}
      className="min-w-[140px] font-game text-xl"
    >
      {label}
    </Button>
  );
}
