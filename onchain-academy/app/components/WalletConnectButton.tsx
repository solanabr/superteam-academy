/**
 * components/wallet/WalletConnectButton.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Drop-in wallet connect button that shows the user's address + XP once connected.
 *
 * USAGE:
 *   import { WalletConnectButton } from "@/components/wallet/WalletConnectButton";
 *   <WalletConnectButton />
 * ─────────────────────────────────────────────────────────────────────────────
 */

"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  // DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Wallet, LogOut, Star, ChevronDown } from "lucide-react";
import { learningProgressService, calculateLevel } from "@/lib/services/learning-progress";

function shortAddress(address: string): string {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export function WalletConnectButton() {
  const { publicKey, connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const [xp, setXp] = useState<number | null>(null);
  const [level, setLevel] = useState<number>(0);

  // Fetch XP when wallet connects
  useEffect(() => {
    if (!publicKey) {
      setXp(null);
      setLevel(0);
      return;
    }

    const userId = publicKey.toBase58();
    learningProgressService.getXP(userId).then(({ totalXP, level: lvl }) => {
      setXp(totalXP);
      setLevel(lvl);
    });
  }, [publicKey]);

  // Not connected — show connect button
  if (!connected || !publicKey) {
    return (
      <Button
        onClick={() => setVisible(true)}
        variant="outline"
        className="gap-2"
      >
        <Wallet className="h-4 w-4" />
        Connect Wallet
      </Button>
    );
  }

  // Connected — show address + XP dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Wallet className="h-4 w-4 text-green-400" />
          <span>{shortAddress(publicKey.toBase58())}</span>
          {xp !== null && (
            <Badge variant="secondary" className="ml-1 gap-1 text-xs">
              <Star className="h-3 w-3" />
              Lvl {level}
            </Badge>
          )}
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <div className="px-3 py-2 text-xs text-muted-foreground">
          {publicKey.toBase58()}
        </div>

        {xp !== null && (
          <div className="px-3 py-2 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total XP</span>
              <span className="font-medium">{xp.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Level</span>
              <span className="font-medium">{level}</span>
            </div>
          </div>
        )}

        {/* <DropdownMenuSeparator /> */}

        <DropdownMenuItem
          className="text-destructive gap-2 cursor-pointer"
          onClick={() => disconnect()}
        >
          <LogOut className="h-4 w-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
