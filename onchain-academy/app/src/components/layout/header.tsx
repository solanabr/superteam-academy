"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  BookOpen,
  Chrome,
  Copy,
  Github,
  LayoutDashboard,
  LogOut,
  Trophy,
  User,
  Globe,
  Menu,
  Zap,
  LogIn,
} from "lucide-react";
import { useLocale } from "@/providers/locale-provider";
import type { Locale } from "@/types/domain";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useUserStore } from "@/store/user-store";
import { useToast } from "@/hooks/use-toast";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

// UI Components
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const navItems = [
  { href: "/courses", labelKey: "nav.courses", icon: BookOpen },
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/leaderboard", labelKey: "nav.leaderboard", icon: Trophy },
  { href: "/profile", labelKey: "nav.profile", icon: User },
] as const;

export function Header(): React.JSX.Element {
  const pathname = usePathname();
  const { t, locale, setLocale } = useLocale();
  const locales: Locale[] = ["en", "pt-BR", "es"];
  const { publicKey, disconnect } = useWallet();
  const setWalletAddress = useUserStore((state) => state.setWalletAddress);
  const { xp, level, isLoading } = useUserStore();
  const [mounted, setMounted] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const { toast } = useToast();
  const { setVisible: setWalletVisible } = useWalletModal();

  useEffect(() => {
    setWalletAddress(publicKey ? publicKey.toBase58() : null);
  }, [publicKey, setWalletAddress]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isHome = pathname === "/";
  const localeLabel: Record<Locale, string> = {
    en: t("header.localeEnglish"),
    "pt-BR": t("header.localePortuguese"),
    es: t("header.localeSpanish"),
  };

  const handleMockLogin = (provider: "GitHub" | "Google") => {
    setLoginOpen(false);
    toast({
      title: t("header.mockLoginTitle"),
      description: `${provider} ${t("header.mockLoginDescription")}`,
    });
  };

  return (
    <>
      <header
        className={
          isHome
            ? "absolute top-0 left-0 right-0 z-40 w-full"
            : "sticky top-0 z-40 w-full border-b border-white/10 bg-black/70 backdrop-blur-[12px]"
        }
      >
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 sm:gap-6">
            <Link
              href="/"
              className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
            >
              <Image
                src="/superteam-logo.svg"
                alt="Superteam"
                width={132}
                height={28}
                className="h-6 w-auto sm:h-7"
                priority
              />
              <span className="font-display text-base font-semibold tracking-tight text-primary sm:text-lg">
                Academy
              </span>
            </Link>

            <nav className="ml-6 hidden items-center rounded-full border border-white/10 bg-black/35 p-1 backdrop-blur-xl md:flex">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "relative flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-white/10 text-foreground"
                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {t(item.labelKey)}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {publicKey && !isLoading && (
              <div className="hidden sm:flex items-center gap-2.5 bg-muted/30 border border-border/40 px-3 py-1.5 rounded-full">
                <Badge
                  variant="secondary"
                  className="bg-primary/15 text-primary border-primary/20 hover:bg-primary/20 text-xs font-mono font-bold tracking-wide"
                >
                  LVL {level}
                </Badge>
                <div className="flex items-center gap-1">
                  <Zap
                    className="h-3.5 w-3.5 fill-current"
                    style={{ color: "#f59e0b" }}
                  />
                  <span
                    className="text-sm font-mono font-bold"
                    style={{
                      color: "#f59e0b",
                      textShadow: "0 0 10px rgba(245,158,11,0.35)",
                    }}
                  >
                    {xp.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground text-[10px] font-mono">
                    {t("header.xp")}
                  </span>
                </div>
              </div>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden sm:flex h-9 w-9 rounded-full"
                >
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="sr-only">{t("header.toggleLanguage")}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-[120px] bg-background/95 backdrop-blur-md border-border/50"
              >
                {locales.map((l) => (
                  <DropdownMenuItem
                    key={l}
                    onClick={() => setLocale(l)}
                    className={cn(
                      "cursor-pointer focus:bg-primary/10 font-medium",
                      locale === l && "text-primary",
                    )}
                  >
                    {localeLabel[l]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Desktop: wallet connected → avatar dropdown; else → login button */}
            {mounted && publicKey ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hidden sm:flex h-9 w-9 rounded-full border border-primary/30 bg-primary/10 hover:bg-primary/20"
                  >
                    <User className="h-4 w-4 text-primary" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 bg-background/95 backdrop-blur-md border-border/50"
                >
                  <div className="px-3 py-2 border-b border-border/40">
                    <p className="font-mono text-xs text-muted-foreground truncate">
                      {publicKey.toBase58().slice(0, 4)}...
                      {publicKey.toBase58().slice(-4)}
                    </p>
                  </div>
                  <DropdownMenuItem
                    asChild
                    className="cursor-pointer focus:bg-primary/10"
                  >
                    <Link href="/profile" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {t("header.profile") ?? "Profile"}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer focus:bg-primary/10"
                    onClick={() => {
                      void navigator.clipboard.writeText(publicKey.toBase58());
                      toast({
                        title: t("header.addressCopied") ?? "Address copied",
                      });
                    }}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    {t("header.copyAddress") ?? "Copy address"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                    onClick={() => void disconnect()}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {t("header.disconnect") ?? "Disconnect"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : mounted ? (
              <Button
                type="button"
                onClick={() => setLoginOpen(true)}
                className="hero-cta-gradient hidden h-10 rounded-full border-0 px-5 text-sm font-bold text-black transition-all hover:scale-[1.04] shadow-[0_0_50px_rgba(153,69,255,0.3)] sm:inline-flex font-display"
              >
                <LogIn className="h-4 w-4 mr-2" />
                {t("header.login")}
              </Button>
            ) : (
              <Button
                type="button"
                className="hero-cta-gradient hidden h-10 rounded-full border-0 px-5 text-sm font-bold text-black shadow-[0_0_50px_rgba(153,69,255,0.3)] sm:inline-flex font-display disabled:opacity-70"
                disabled
              >
                {t("header.login")}
              </Button>
            )}

            {/* Mobile: wallet connected → avatar dropdown; else → login button */}
            {mounted && publicKey ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full border border-primary/30 bg-primary/10 md:hidden"
                  >
                    <User className="h-4 w-4 text-primary" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 bg-background/95 backdrop-blur-md border-border/50"
                >
                  <div className="px-3 py-2 border-b border-border/40">
                    <p className="font-mono text-xs text-muted-foreground truncate">
                      {publicKey.toBase58().slice(0, 4)}...
                      {publicKey.toBase58().slice(-4)}
                    </p>
                  </div>
                  <DropdownMenuItem
                    asChild
                    className="cursor-pointer focus:bg-primary/10"
                  >
                    <Link href="/profile" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {t("header.profile") ?? "Profile"}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer focus:bg-primary/10"
                    onClick={() => {
                      void navigator.clipboard.writeText(publicKey.toBase58());
                      toast({
                        title: t("header.addressCopied") ?? "Address copied",
                      });
                    }}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    {t("header.copyAddress") ?? "Copy address"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                    onClick={() => void disconnect()}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {t("header.disconnect") ?? "Disconnect"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                type="button"
                onClick={() => setLoginOpen(true)}
                className="hero-cta-gradient h-9 rounded-full border-0 px-4 text-xs font-bold text-black transition-all hover:scale-[1.04] shadow-[0_0_50px_rgba(153,69,255,0.3)] md:hidden"
              >
                {t("header.login")}
              </Button>
            )}

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden h-9 w-9"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">
                    {t("header.toggleMobileMenu")}
                  </span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[280px] bg-background/95 backdrop-blur-xl border-l-border/30 pt-10"
              >
                <nav className="flex flex-col gap-4">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors",
                        pathname === item.href
                          ? "bg-secondary/15 text-secondary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {t(item.labelKey)}
                    </Link>
                  ))}

                  <div className="h-px w-full bg-border/40 my-2" />

                  <div className="grid grid-cols-3 gap-2 px-2">
                    {locales.map((l) => (
                      <Button
                        key={l}
                        variant={locale === l ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setLocale(l)}
                        className="text-xs w-full"
                      >
                        {l === "pt-BR" ? "PT" : l.toUpperCase()}
                      </Button>
                    ))}
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Login Dialog */}
      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="sm:max-w-[400px] bg-[#0a0a12] border border-white/10 backdrop-blur-xl p-8">
          <DialogHeader className="text-center mb-2">
            <div className="flex justify-center mb-4">
              <Image
                src="/superteam-logo.svg"
                alt="Superteam Academy"
                width={120}
                height={26}
                className="h-6 w-auto opacity-90"
              />
            </div>
            <DialogTitle className="text-xl font-bold text-white">
              {t("header.loginModalTitle")}
            </DialogTitle>
            <DialogDescription className="text-white/50 text-sm mt-1">
              {t("header.loginModalSubtitle")}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 mt-6">
            <button
              type="button"
              onClick={() => handleMockLogin("GitHub")}
              className="group flex items-center gap-3 w-full rounded-xl border border-white/10 bg-white/5 px-5 py-3.5 text-sm font-semibold text-white transition-all hover:bg-white/10 hover:border-white/20"
            >
              <Github className="h-5 w-5 shrink-0" />
              <span>{t("header.loginWithGithub")}</span>
            </button>

            <button
              type="button"
              onClick={() => handleMockLogin("Google")}
              className="group flex items-center gap-3 w-full rounded-xl border border-white/10 bg-white/5 px-5 py-3.5 text-sm font-semibold text-white transition-all hover:bg-white/10 hover:border-white/20"
            >
              <Chrome className="h-5 w-5 shrink-0" />
              <span>{t("header.loginWithGoogle")}</span>
            </button>

            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-white/30">
                {t("header.loginOrWallet")}
              </span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <button
              type="button"
              onClick={() => {
                setLoginOpen(false);
                setWalletVisible(true);
              }}
              className="hero-cta-gradient group flex w-full items-center gap-3 rounded-xl border-0 px-5 py-3.5 text-sm font-bold text-black transition-all hover:scale-[1.02] shadow-[0_0_35px_rgba(153,69,255,0.28)]"
            >
              <Zap className="h-5 w-5 shrink-0" />
              <span>{t("header.loginWithWallet")}</span>
            </button>
          </div>

          <p className="text-center text-xs text-white/30 mt-6">
            {t("header.loginModalDisclaimer")}
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
