"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useSession, signIn, signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
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
import { Wallet, LogOut, User, Sparkles, Settings } from "lucide-react";
import { FaGithub, FaGoogle } from "react-icons/fa";
import { Link } from "@/i18n/navigation";
import dynamic from "next/dynamic";
import { useUser } from "@/hooks/useUser";
import { useAuthWallet } from "@/hooks/useAuthWallet";
import { useTranslations } from "next-intl";

const WalletButton = dynamic(() => import("@/components/WalletButton"), { ssr: false });

export function UserNav() {
  const { publicKey, disconnect, connected } = useWallet();
  const { data: session, status } = useSession();
  const { userDb } = useUser();
  const { login } = useAuthWallet();
  const t = useTranslations("UserNav");

  const isLoggedIn = !!publicKey || status === "authenticated";

  const avatarSrc =
    userDb?.image ||
    session?.user?.image ||
    `https://api.dicebear.com/7.x/identicon/svg?seed=${publicKey?.toString() || "user"}`;

  const handleLogout = async () => {
    if (publicKey) await disconnect();
    if (session) await signOut();
  };

  useEffect(() => {
    if (connected && publicKey && status === "unauthenticated") login();
  }, [connected, publicKey, status, login]);

  if (!isLoggedIn) {
    return (
      <div className="flex items-center gap-2">
        <div className="hidden sm:block">
          <WalletButton />
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="border border-fuchsia-400/30 bg-gradient-to-r from-purple-600 to-fuchsia-600 shadow-[0_0_24px_rgba(168,85,247,0.45)]">
              {connected ? t("linkSocials") : t("signIn")}
            </Button>
          </DialogTrigger>
          <DialogContent className="border-white/20 bg-zinc-950/90 backdrop-blur-xl sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-fuchsia-100">
                <Sparkles className="h-4 w-4 text-cyan-300" /> {t("socialTitle")}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Button variant="outline" onClick={() => signIn("github")} className="justify-start gap-2 border-white/20 bg-black/40">
                <FaGithub /> {t("continueGithub")}
              </Button>
              <Button variant="outline" onClick={() => signIn("google")} className="justify-start gap-2 border-white/20 bg-black/40">
                <FaGoogle /> {t("continueGoogle")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  const displayName =
    session?.user?.name || (publicKey ? `${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}` : t("user"));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full border border-white/20 bg-black/30">
          <Avatar className="h-9 w-9">
            <AvatarImage src={avatarSrc} alt="User avatar" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 border-white/15 bg-zinc-950/95 text-zinc-100 backdrop-blur-xl" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-semibold leading-none">{displayName}</p>
            <p className="text-xs leading-none text-zinc-400">{session?.user?.email || t("web3User")}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuGroup>
          <Link href="/profile">
            <DropdownMenuItem className="cursor-pointer focus:bg-purple-500/20">
              <User className="mr-2 h-4 w-4" /> {t("profile")}
            </DropdownMenuItem>
          </Link>
          <Link href="/settings">
            <DropdownMenuItem className="cursor-pointer focus:bg-cyan-500/20">
              <Settings className="mr-2 h-4 w-4" /> {t("settings")}
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-rose-300 focus:bg-rose-500/20 focus:text-rose-200">
          <LogOut className="mr-2 h-4 w-4" /> {t("logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
