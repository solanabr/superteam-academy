"use client";

import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRef, useState, useEffect, useLayoutEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getDisplayName, onDisplayNameChanged } from "@/lib/display-name";
import { useIsMobile } from "@/hooks/use-mobile";

const DROPDOWN_APPROX_HEIGHT = 220;

export function WalletConnectButton({
  className,
}: { className?: string } = {}) {
  const { setVisible } = useWalletModal();
  const { publicKey, connected, disconnect } = useWallet();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayNameState] = useState<string | null>(null);
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

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

  useLayoutEffect(() => {
    if (!open || !ref.current) return;
    const el = ref.current;
    const rect = el.getBoundingClientRect();
    const minW = 200;
    const left = Math.max(8, rect.right - minW);
    const maxLeft = typeof window !== "undefined" ? window.innerWidth - minW - 8 : left;
    const top = isMobile
      ? Math.max(8, rect.top - DROPDOWN_APPROX_HEIGHT - 8)
      : rect.bottom + 8;
    setDropdownRect({ top, left: Math.min(left, maxLeft) });
    return () => setDropdownRect(null);
  }, [open, isMobile]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ref.current?.contains(target)) return;
      const id = "wallet-dropdown-portal";
      if (document.getElementById(id)?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [open]);

  // Redirect to dashboard only on the *moment* of connection (false → true),
  // and only when not already on a page that should stay (e.g. /studio, /admin, /profile).
  const prevConnected = useRef(connected);
  useEffect(() => {
    if (connected && !prevConnected.current) {
      const stayOn =
        pathname === "/studio" ||
        pathname?.startsWith("/studio/") ||
        pathname?.startsWith("/admin") ||
        pathname?.startsWith("/profile");
      if (!stayOn) {
        router.push("/dashboard");
      }
    }
    prevConnected.current = connected;
  }, [connected, router, pathname]);

  const label =
    connected && publicKey
      ? displayName?.trim() || `${publicKey.toBase58().slice(0, 4)}…${publicKey.toBase58().slice(-4)}`
      : "Connect";

  if (connected) {
    const dropdownContent = open && dropdownRect && typeof document !== "undefined" && (
      <div
        id="wallet-dropdown-portal"
        role="menu"
        className="fixed z-[100] min-w-[200px] rounded-xl border-2 border-border bg-popover px-2 py-2 shadow-xl"
        style={{ top: dropdownRect.top, left: dropdownRect.left }}
      >
        <button
          type="button"
          role="menuitem"
          className="flex w-full items-center rounded-lg px-4 py-2.5 text-left font-game text-lg transition-colors hover:bg-accent"
          onClick={() => {
            setOpen(false);
            router.push("/dashboard");
          }}
        >
          Dashboard
        </button>
        <button
          type="button"
          role="menuitem"
          className="flex w-full items-center rounded-lg px-4 py-2.5 text-left font-game text-lg transition-colors hover:bg-accent"
          onClick={() => {
            setOpen(false);
            setVisible(true);
          }}
        >
          Change wallet
        </button>
        <button
          type="button"
          role="menuitem"
          className="flex w-full items-center rounded-lg px-4 py-2.5 text-left font-game text-lg transition-colors hover:bg-accent"
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
          role="menuitem"
          className="flex w-full items-center rounded-lg px-4 py-2.5 text-left font-game text-lg text-red-400 transition-colors hover:bg-accent"
          onClick={() => {
            setOpen(false);
            disconnect();
          }}
        >
          Disconnect
        </button>
      </div>
    );

    return (
      <>
        <div ref={ref} className={cn("relative", className)}>
          <Button
            variant="pixel"
            size="default"
            onClick={() => setOpen((o) => !o)}
            className={cn("min-w-[140px] truncate font-game text-xl", className)}
            aria-expanded={open}
            aria-haspopup="true"
          >
            {label}
          </Button>
        </div>
        {dropdownContent && createPortal(dropdownContent, document.body)}
      </>
    );
  }

  return (
    <Button
      variant="pixel"
      size="default"
      onClick={() => setVisible(true)}
      className={cn("min-w-[140px] font-game text-xl", className)}
    >
      {label}
    </Button>
  );
}
