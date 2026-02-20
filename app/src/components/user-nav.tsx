// app/src/components/user-nav.tsx
"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import dynamic from "next/dynamic";

// Важно: WalletMultiButton должен грузиться динамически
const WalletButton = dynamic(
  () => import("@/components/WalletButton"), 
  { ssr: false }
);

export function UserNav() {
  const { publicKey, disconnect } = useWallet();

  // Если кошелек не подключен - показываем кнопку подключения
  if (!publicKey) {
    return <WalletButton />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            {/* Генерируем аватарку на основе адреса кошелька (dicebear) */}
            <AvatarImage src={`https://api.dicebear.com/7.x/identicon/svg?seed=${publicKey.toString()}`} alt="User Avatar" />
            <AvatarFallback>XP</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Solana Developer</p>
            <p className="text-xs leading-none text-muted-foreground">
              {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
            <Link href="/profile">
                <DropdownMenuItem>Profile</DropdownMenuItem>
            </Link>
          <DropdownMenuItem>Settings</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={disconnect}>
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}