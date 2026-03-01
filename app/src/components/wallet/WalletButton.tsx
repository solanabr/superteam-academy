"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useEffect, useState } from "react";
import { getXpBalance } from "@/lib/services/xp-service";
import { PublicKey } from "@solana/web3.js";

export function WalletButton() {
  const { publicKey, disconnect, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const [xpBalance, setXpBalance] = useState<number>(0);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (publicKey) {
      getXpBalance(publicKey).then(setXpBalance).catch(() => setXpBalance(0));
    }
  }, [publicKey]);

  if (!connected || !publicKey) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="relative group px-5 py-2.5 rounded-xl font-semibold text-sm
          bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white
          hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-200
          active:scale-95"
      >
        Connect Wallet
      </button>
    );
  }

  const shortAddr = `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`;

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-3 px-4 py-2 rounded-xl
          bg-white/5 border border-white/10 hover:bg-white/10
          transition-all duration-200"
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#14F195] animate-pulse" />
          <span className="text-sm font-medium text-white/90">{shortAddr}</span>
        </div>
        <div className="h-4 w-px bg-white/20" />
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold text-[#14F195]">{xpBalance.toLocaleString()}</span>
          <span className="text-xs text-white/50">XP</span>
        </div>
      </button>
      
      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-[#1a1a2e] border border-white/10 shadow-xl z-50 overflow-hidden">
            <a
              href="/profile"
              className="block px-4 py-3 text-sm text-white/80 hover:bg-white/5 transition-colors"
              onClick={() => setShowMenu(false)}
            >
              👤 Profile
            </a>
            <button
              onClick={() => { disconnect(); setShowMenu(false); }}
              className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-white/5 transition-colors"
            >
              🔌 Disconnect
            </button>
          </div>
        </>
      )}
    </div>
  );
}
