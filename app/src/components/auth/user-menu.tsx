"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { SignInModal } from "./sign-in-modal";
import { User, Settings, LayoutDashboard, LogOut, Trophy, Star, Zap, Flame, Shield, BookOpen } from "lucide-react";

interface Stats { xp: number; level: number; streak: number }

export function UserMenu() {
  const { data: session, status } = useSession();
  const t = useTranslations("common");
  const wallet = useWallet();
  const [signInOpen, setSignInOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => setMounted(true), []);

  function handleOpenChange(open: boolean) {
    if (!open || !session?.user) return;
    setStats(null);
    setLoadingStats(true);
    fetch("/api/gamification?type=stats")
      .then((r) => r.json())
      .then((d: { xp?: number; level?: number; streak?: { currentStreak?: number } }) => {
        if (d.xp !== undefined) {
          setStats({ xp: d.xp, level: d.level ?? 0, streak: d.streak?.currentStreak ?? 0 });
        }
      })
      .catch(() => { })
      .finally(() => setLoadingStats(false));
  }

  if (!mounted || status === "loading") {
    return <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />;
  }

  if (!session?.user) {
    return (
      <>
        <Button
          onClick={() => setSignInOpen(true)}
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {t("getStarted")}
        </Button>
        <SignInModal open={signInOpen} onOpenChange={setSignInOpen} />
      </>
    );
  }

  const initials = session.user.name
    ? session.user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
    : "U";

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full" aria-label="User menu">
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={session.user.image ?? undefined}
              alt={session.user.name ?? "User"}
              referrerPolicy="no-referrer"
            />
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center gap-2 p-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={session.user.image ?? undefined} referrerPolicy="no-referrer" />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{session.user.name}</span>
            <span className="text-xs text-muted-foreground">
              {session.user.email ?? t("walletConnected")}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-center gap-3 px-2 pb-2 text-xs min-h-[1.5rem]">
          {loadingStats ? (
            <>
              <Skeleton className="h-3.5 w-14" />
              <Skeleton className="h-3.5 w-10" />
              <Skeleton className="h-3.5 w-8" />
            </>
          ) : stats ? (
            <>
              <span className="flex items-center gap-1 text-primary">
                <Star className="h-3 w-3 fill-current" />
                {stats.xp.toLocaleString()} {t("xp")}
              </span>
              <span className="flex items-center gap-1 text-gold">
                <Zap className="h-3 w-3" />
                {t("levelShort", { level: stats.level })}
              </span>
              <span className="flex items-center gap-1 text-orange-500">
                <Flame className="h-3 w-3" />
                {stats.streak}{t("days").charAt(0)}
              </span>
            </>
          ) : null}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard" className="cursor-pointer">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            {t("dashboard")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            {t("profile")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/leaderboard" className="cursor-pointer">
            <Trophy className="mr-2 h-4 w-4" />
            {t("leaderboard")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/creator" className="cursor-pointer">
            <BookOpen className="mr-2 h-4 w-4" />
            {t("creator")}
          </Link>
        </DropdownMenuItem>
        {session.isAdmin && (
          <DropdownMenuItem asChild>
            <Link href="/admin" className="cursor-pointer">
              <Shield className="mr-2 h-4 w-4" />
              {t("admin")}
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href="/settings" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            {t("settings")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive"
          onClick={async () => {
            if (wallet.connected) {
              try { await wallet.disconnect(); } catch { /* ignore */ }
            }
            signOut({ redirectTo: "/" });
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {t("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
