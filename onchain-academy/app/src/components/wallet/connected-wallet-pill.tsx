"use client";

import { useWallet } from "@/lib/wallet/context";
import { User } from "lucide-react";

function truncateAddress(address: string): string {
  if (address.length <= 8) return address;
  return `${address.slice(0, 4)}..${address.slice(-4)}`;
}

interface ConnectedWalletPillProps {
  onClick?: () => void;
}

export function ConnectedWalletPill({ onClick }: ConnectedWalletPillProps) {
  const { publicKey, disconnect } = useWallet();

  if (!publicKey) return null;

  const address = truncateAddress(publicKey.toBase58());

  return (
    <button
      onClick={onClick ?? disconnect}
      className="border border-[#00FFA3]/30 rounded-full px-4 py-2 bg-[#00FFA3]/10 backdrop-blur-md text-[#00FFA3] flex items-center gap-3 cursor-pointer group"
    >
      <div className="w-1.5 h-1.5 bg-[#00FFA3] rounded-full animate-pulse shadow-[0_0_10px_#00FFA3]" />
      <span
        className="text-[10px] font-bold tracking-widest"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {address}
      </span>
      <div className="w-5 h-5 rounded-full bg-black/50 flex items-center justify-center border border-[#00FFA3]/20 group-hover:bg-[#00FFA3] group-hover:text-black transition-colors">
        <User className="w-2.5 h-2.5" />
      </div>
    </button>
  );
}
