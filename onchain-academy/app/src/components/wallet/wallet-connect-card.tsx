"use client";

import { useEffect, useState } from "react";
import { onchainIdentityService } from "@/services/onchain-identity-service";
import { useWalletStore } from "@/stores/wallet-store";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";

export function WalletConnectCard() {
  const connected = useWalletStore((state) => state.connected);
  const walletAddress = useWalletStore((state) => state.walletAddress);
  const { disconnect } = useWallet();
  const [xpBalance, setXpBalance] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    if (walletAddress) {
      onchainIdentityService.getXPBalance(walletAddress).then((balance) => {
        if (active) {
          setXpBalance(balance);
        }
      });
    } else {
      Promise.resolve().then(() => {
        if (active) {
          setXpBalance(null);
        }
      });
    }
    return () => {
      active = false;
    };
  }, [walletAddress]);

  return (
    <div className="bg-surface border border-white/10 rounded-[32px] p-8 apple-shadow h-full flex flex-col justify-center text-white">
      {!connected || !walletAddress ? (
        <div className="text-center">
          <div className="w-20 h-20 mx-auto bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6" />
            </svg>
          </div>
          <p className="font-bold text-[24px] tracking-tight mb-2">Connect your wallet</p>
          <p className="text-[15px] text-white/50 mb-8 leading-relaxed">Link your Solana wallet to track your progress and earn on-chain credentials.</p>
          <WalletMultiButton className="!w-full !rounded-[12px] !h-11 !bg-white !text-black hover:!opacity-90 !font-semibold" />
        </div>
      ) : (
        <div>
          <p className="text-white/50 text-[13px] font-semibold uppercase tracking-wide mb-4">Connected Wallet</p>
          <div className="flex items-center gap-6 mb-8 p-4 bg-background border border-white/5 rounded-[24px]">
            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="font-bold text-[17px] tracking-tight truncate">
                {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
              </p>
              <p className="text-[14px] text-white/70 font-medium">
                {xpBalance !== null ? `${xpBalance} XP` : "Loading XP..."}
              </p>
            </div>
          </div>
          <button
            className="w-full text-[15px] font-semibold border border-white/10 text-white hover:bg-white/10 rounded-[12px] h-11 transition-colors"
            onClick={() => disconnect().catch(() => undefined)}
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
