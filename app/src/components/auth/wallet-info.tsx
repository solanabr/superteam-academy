"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { Copy, ExternalLink, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function WalletInfo() {
  const { publicKey, disconnect } = useWallet();

  if (!publicKey) return null;

  const address = publicKey.toBase58();
  const short = `${address.slice(0, 4)}...${address.slice(-4)}`;

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    toast.success("Address copied");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <code className="text-sm font-mono bg-muted px-3 py-1.5 rounded-md flex-1">
          {short}
        </code>
        <Button variant="ghost" size="icon" onClick={copyAddress}>
          <Copy className="h-4 w-4" />
        </Button>
        <a
          href={`https://explorer.solana.com/address/${address}?cluster=devnet`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="ghost" size="icon">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </a>
      </div>
      <Button variant="outline" size="sm" onClick={disconnect} className="w-full">
        <LogOut className="h-4 w-4 mr-2" />
        Disconnect
      </Button>
    </div>
  );
}
