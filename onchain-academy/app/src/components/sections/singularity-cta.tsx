"use client";

import { useState, useEffect } from "react";

export function SingularityCTA() {
  // Listen for wallet connection status via custom DOM events to avoid
  // importing @solana/wallet-adapter-react into this below-fold chunk.
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    window.addEventListener("wallet-connected", onConnect);
    window.addEventListener("wallet-disconnected", onDisconnect);
    return () => {
      window.removeEventListener("wallet-connected", onConnect);
      window.removeEventListener("wallet-disconnected", onDisconnect);
    };
  }, []);

  const handleClick = () => {
    if (connected) return;
    window.dispatchEvent(new Event("open-wallet-gateway"));
  };

  return (
    <section
      onClick={handleClick}
      className={`singularity-section h-screen flex items-center justify-center relative overflow-hidden bg-[#010101] ${
        connected ? "" : "cursor-pointer"
      } group`}
    >
      {/* Title with mix-blend-mode difference */}
      <h2
        className="relative z-10 text-[clamp(6rem,18vw,20rem)] font-black leading-[0.8] tracking-[-0.06em] text-white text-center pointer-events-none select-none"
        style={{ mixBlendMode: "difference" }}
      >
        DEPLOY.
      </h2>

      {/* Subtitle */}
      <div
        className="singularity-sub absolute bottom-[10vh] z-10 text-xs uppercase tracking-[0.3em] text-white opacity-70 transition-opacity duration-500"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {connected
          ? "Wallet connected — ready to deploy"
          : "Click anywhere to initialize wallet connection"}
      </div>
    </section>
  );
}
