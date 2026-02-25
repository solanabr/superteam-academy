"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/lib/wallet/context";
import { WalletGateway } from "@/components/wallet/wallet-gateway";
import { ConnectedWalletPill } from "@/components/wallet/connected-wallet-pill";

/**
 * Wallet-dependent navbar controls (connect button + gateway modal).
 * Lazy-loaded with ssr:false so it only renders on the client --
 * no hydration mismatch guard needed.
 */
export function NavbarWallet({ variant }: { variant: "desktop" | "mobile" }) {
  const { connected } = useWallet();
  const [gatewayOpen, setGatewayOpen] = useState(false);

  // Listen for custom event to open gateway from other components
  useEffect(() => {
    const handler = () => setGatewayOpen(true);
    window.addEventListener("open-wallet-gateway", handler);
    return () => window.removeEventListener("open-wallet-gateway", handler);
  }, []);

  const isMobile = variant === "mobile";

  return (
    <>
      {connected ? (
        <ConnectedWalletPill />
      ) : (
        <button
          onClick={() => setGatewayOpen(true)}
          className={`border border-white/20 rounded-full bg-white/5 backdrop-blur-md text-[10px] font-bold hover:bg-white hover:text-black transition-colors overflow-hidden group ${
            isMobile ? "w-full px-8 py-3" : "px-8 py-2.5"
          }`}
          style={{
            fontFamily: "var(--font-mono)",
            letterSpacing: "2px",
            textTransform: "uppercase",
            color: isMobile ? "var(--overlay-text-active)" : "var(--foreground)",
          }}
        >
          <span className={`relative z-10 flex items-center gap-2 ${isMobile ? "justify-center" : ""}`}>
            Connect
            <span className="w-1.5 h-1.5 bg-[#00FFA3] rounded-full group-hover:bg-black" />
          </span>
        </button>
      )}

      <WalletGateway
        isOpen={gatewayOpen}
        onClose={() => setGatewayOpen(false)}
      />
    </>
  );
}
