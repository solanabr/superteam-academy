// app/src/components/user-nav.tsx
"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useSession, signIn, signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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

const WalletButton = dynamic(() => import("@/components/WalletButton"), { ssr: false });

export function UserNav() {
  const { publicKey, disconnect } = useWallet();
  const { data: session } = useSession();
  const { userDb } = useUser(); 

  // Определяем, залогинен ли пользователь хоть как-то
  const isLoggedIn = !!publicKey || !!session;

  const avatarSrc = 
    userDb?.image || // Из БД (GitHub image сохраняется сюда при создании)
    session?.user?.image || // Из текущей сессии
    `https://api.dicebear.com/7.x/identicon/svg?seed=${publicKey?.toString() || "user"}`;


  const handleLogout = async () => {
    if (publicKey) await disconnect();
    if (session) await signOut();
  };

  if (!isLoggedIn) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button>Sign In</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Sign In to Academy</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-3">
               {/* 1. Wallet */}
               <div className="w-full">
                 <WalletButton /> 
                 {/* Примечание: WalletAdapter UI сам рисует кнопку, мы просто оборачиваем ее */}
               </div>
               
               <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or continue with</span></div>
               </div>

               {/* 2. Socials */}
               <Button variant="outline" onClick={() => signIn('google')} className="gap-2">
                 <FaGoogle /> Google
               </Button>
               <Button variant="outline" onClick={() => signIn('github')} className="gap-2">
                 <FaGithub /> GitHub
               </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Если залогинен - показываем профиль
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarSrc} />
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