"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import {
  Copy,
  Check,
  ExternalLink,
  LogOut,
  ChevronDown,
  Wallet,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

const WALLET_NAMES: Record<string, string> = {
  phantom: "Phantom",
  solflare: "Solflare",
  backpack: "Backpack",
  coinbase_wallet: "Coinbase",
  privy: "Embedded Wallet",
};

function WalletIcon({
  walletClientType,
  size = 16,
}: {
  walletClientType: string;
  size?: number;
}) {
  const s = size;

  if (walletClientType === "phantom") {
    return (
      <svg
        width={s}
        height={s}
        viewBox="0 0 128 128"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="128" height="128" rx="24" fill="#AB9FF2" />
        <path
          d="M110.584 64.926c0 20.99-17.01 37.998-38 37.998-18.274 0-33.5-12.91-37.28-30.022-.496-2.238 1.27-4.338 3.56-4.338h3.824c1.83 0 3.394 1.244 3.858 3.02 2.996 11.526 13.48 20.04 25.962 20.04 14.79 0 26.78-11.99 26.78-26.782 0-14.792-11.99-26.782-26.78-26.782-6.846 0-13.082 2.578-17.776 6.808l6.388 6.388c1.656 1.656.484 4.488-1.858 4.488H40.584c-1.45 0-2.626-1.176-2.626-2.626V34.324c0-2.342 2.83-3.516 4.488-1.858l6.182 6.182C54.49 32.686 63.12 29 72.584 29c20.99 0 38 17.01 38 37.998v-2.072z"
          fill="white"
        />
        <ellipse cx="60.584" cy="63" rx="4" ry="4" fill="#AB9FF2" />
        <ellipse cx="76.584" cy="63" rx="4" ry="4" fill="#AB9FF2" />
      </svg>
    );
  }

  if (walletClientType === "solflare") {
    return (
      <svg
        width={s}
        height={s}
        viewBox="0 0 128 128"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="128" height="128" rx="24" fill="#FC5F04" />
        <path
          d="M64 20L90 56H78L96 88H66L80 108H48L64 88H34L52 56H40L64 20Z"
          fill="white"
        />
      </svg>
    );
  }

  if (walletClientType === "backpack") {
    return (
      <svg
        width={s}
        height={s}
        viewBox="0 0 128 128"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="128" height="128" rx="24" fill="#E33E3F" />
        <path
          d="M52 36c0-6.627 5.373-12 12-12s12 5.373 12 12v4H52v-4z"
          fill="white"
        />
        <rect x="30" y="44" width="68" height="56" rx="10" fill="white" />
        <rect x="44" y="58" width="40" height="6" rx="3" fill="#E33E3F" />
        <rect x="44" y="70" width="28" height="6" rx="3" fill="#E33E3F" />
      </svg>
    );
  }

  if (walletClientType === "coinbase_wallet") {
    return (
      <svg
        width={s}
        height={s}
        viewBox="0 0 128 128"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="128" height="128" rx="24" fill="#0052FF" />
        <circle cx="64" cy="64" r="32" fill="white" />
        <text
          x="64"
          y="72"
          textAnchor="middle"
          fontSize="28"
          fontWeight="bold"
          fill="#0052FF"
          fontFamily="sans-serif"
        >
          C
        </text>
      </svg>
    );
  }

  return <Wallet width={s} height={s} className="text-muted-foreground" />;
}

export function WalletMenu() {
  const { user, logout } = usePrivy();
  const [copied, setCopied] = useState(false);

  const wallet = user?.wallet;
  if (!wallet?.address) return null;

  const addr = wallet.address;
  const short = `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  const clientType = wallet.walletClientType ?? "unknown";
  const walletName = WALLET_NAMES[clientType] ?? clientType;

  function handleCopy() {
    navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Wallet menu"
        >
          <WalletIcon walletClientType={clientType} size={16} />
          <span className="hidden sm:inline">{short}</span>
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="flex items-center gap-2 font-normal text-muted-foreground">
          <WalletIcon walletClientType={clientType} size={20} />
          <span className="font-medium text-foreground">{walletName}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleCopy}>
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          Copy address
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a
            href={`https://solscan.io/account/${addr}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            View on Explorer
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => logout()}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
