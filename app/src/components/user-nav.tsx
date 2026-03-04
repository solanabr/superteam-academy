// app/src/components/user-nav.tsx
"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useSession, signIn, signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Wallet, LogOut, User } from "lucide-react";
import { FaGithub, FaGoogle } from "react-icons/fa";
import { Link } from "@/i18n/navigation";
import dynamic from "next/dynamic";
import {useUser} from '@/hooks/useUser'
import { useAuthWallet } from "@/hooks/useAuthWallet";

const WalletButton = dynamic(() => import("@/components/WalletButton"), { ssr: false });

export function UserNav() {
  const { publicKey, disconnect, connected } = useWallet();
  const { data: session, status } = useSession();
  const { userDb } = useUser();
  const { login } = useAuthWallet();

  // Определяем, залогинен ли пользователь хоть как-то
  const isLoggedIn = !!publicKey || status === "authenticated";

  const avatarSrc = 
    userDb?.image || // Из БД (GitHub image сохраняется сюда при создании)
    session?.user?.image || // Из текущей сессии
    `https://api.dicebear.com/7.x/identicon/svg?seed=${publicKey?.toString() || "user"}`;


  const handleLogout = async () => {
    if (publicKey) await disconnect();
    if (session) await signOut();
  };


  useEffect(() => {
    if (connected && publicKey && status === "unauthenticated") {
      login();
    }
  }, [connected, publicKey, status, login]);

  if (!isLoggedIn) {
    return (
      <div className="flex items-center gap-2">
        {/* 1. Кнопка кошелька СНАРУЖИ */}
        <div className="hidden sm:block">
            <WalletButton />
        </div>

        {/* 2. Кнопка Sign In (только соцсети) */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant={connected ? "secondary" : "default"}>
                {connected ? "Link Socials" : "Sign In"}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Sign In with Socials</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
               <Button variant="outline" onClick={() => signIn('github')} className="gap-2">
                 <FaGithub /> Continue with GitHub
               </Button>
               <Button variant="outline" onClick={() => signIn('google')} className="gap-2">
                 <FaGoogle /> Continue with Google
               </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Если залогинен - показываем профиль
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarSrc} alt="Avatar-from-user-nav" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
                {session?.user?.name || (publicKey ? `${publicKey.toString().slice(0,4)}...${publicKey.toString().slice(-4)}` : "User")}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {session?.user?.email || "Web3 User"}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Link href="/profile"><DropdownMenuItem><User className="mr-2 h-4 w-4"/> Profile</DropdownMenuItem></Link>
          <Link href="/settings"><DropdownMenuItem><Wallet className="mr-2 h-4 w-4"/> Settings</DropdownMenuItem></Link>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4"/> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}