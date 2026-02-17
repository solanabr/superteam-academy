"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import {
  BookOpen,
  LayoutDashboard,
  Trophy,
  User,
  Settings,
  Menu,
  X,
  Flame,
  Zap,
  LogOut,
  Wallet,
  Loader2,
  Sun,
  Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWalletAuth } from "@/components/providers/wallet-auth-provider";
import { useIdentitySnapshot } from "@/hooks/use-identity-snapshot";

const navLinks = [
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

function openWalletModal(setVisible: (v: boolean) => void) {
  try {
    setTimeout(() => {
      try {
        setVisible(true);
      } catch (err) {
        console.error("Failed to open wallet modal:", err);
        if (
          typeof window !== "undefined" &&
          (window as any).solana?.isPhantom
        ) {
          (window as any).solana.connect().catch(() => undefined);
        }
      }
    }, 100);
  } catch (err) {
    console.error("Wallet connection error:", err);
  }
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const { isLoading, isAuthenticated, user, status, logout } = useWalletAuth();
  const { snapshot } = useIdentitySnapshot();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const profile = snapshot?.profile;
  const connectedAddress = publicKey?.toBase58() ?? null;
  const activeAddress = user?.walletAddress ?? connectedAddress;
  const visibleNavLinks = isAuthenticated ? navLinks : [];

  // Determine what to show in the wallet area
  const showConnectButton = !connected || status === "disconnected";
  const showAuthProgress = connected && isLoading;
  const showAuthenticatedUI = isAuthenticated;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="logo" width={128} height={164} />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-3 md:flex">
          <nav className="flex items-center gap-1">
            {visibleNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right side - Desktop */}
        <div className="hidden items-center gap-3 md:flex">
          {/* Theme toggle (always visible) */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          )}

          {showConnectButton && (
            <Button
              variant="outline"
              className="border-primary/30 text-primary hover:bg-primary/10"
              onClick={() => openWalletModal(setVisible)}
            >
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
            </Button>
          )}

          {showAuthProgress && (
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="border-border text-muted-foreground"
              >
                {shortAddress(connectedAddress)}
              </Badge>
              <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-1.5 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {status === "signing" ? "Signing in..." : "Verifying..."}
              </div>
            </div>
          )}

          {showAuthenticatedUI && (
            <>
              {/* Streak */}
              <div className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5">
                <Flame className="h-4 w-4 text-[hsl(var(--gold))]" />
                <span className="text-sm font-semibold text-foreground">
                  {profile?.streak ?? "—"}
                </span>
              </div>

              {/* XP */}
              <div className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  {(profile?.xp ?? 0).toLocaleString()}
                </span>
              </div>

              {/* Profile dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full border border-primary/30 outline-none transition-colors hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/50">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/20 text-xs text-primary">
                        {profile?.name?.slice(0, 2) ??
                          activeAddress?.slice(0, 2) ??
                          "?"}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => router.push("/profile")}>
                    <User className="h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => router.push("/settings")}>
                    <Settings className="h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => void logout().catch(() => undefined)}
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Badge
                variant="outline"
                className="border-primary/30 text-primary"
              >
                {shortAddress(activeAddress)}
              </Badge>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-muted-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-background px-4 py-4 md:hidden">
          <div className="mb-4 flex flex-col gap-2 border-b border-border pb-4">
            {showConnectButton && (
              <Button
                variant="outline"
                className="w-full border-primary/30 text-primary hover:bg-primary/10"
                onClick={() => openWalletModal(setVisible)}
              >
                <Wallet className="mr-2 h-4 w-4" />
                Connect Wallet
              </Button>
            )}

            {showAuthProgress && (
              <div className="flex w-full items-center justify-center gap-2 rounded-lg bg-secondary px-3 py-2.5 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {status === "signing"
                  ? "Signing in..."
                  : "Verifying session..."}
              </div>
            )}

            {showAuthenticatedUI && (
              <Button
                variant="outline"
                className="w-full border-primary/30 text-primary hover:bg-primary/10"
                disabled={isLoading}
                onClick={() => void logout().catch(() => undefined)}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout ({shortAddress(activeAddress)})
              </Button>
            )}
          </div>

          {showAuthenticatedUI && (
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
              <Avatar className="h-10 w-10 border border-primary/30">
                <AvatarFallback className="bg-primary/20 text-sm text-primary">
                  {profile?.name?.slice(0, 2) ??
                    activeAddress?.slice(0, 2) ??
                    "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {profile?.name ?? shortAddress(activeAddress)}
                </p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Flame className="h-3 w-3 text-[hsl(var(--gold))]" />{" "}
                    {profile?.streak ?? "—"}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Zap className="h-3 w-3 text-primary" />{" "}
                    {(profile?.xp ?? 0).toLocaleString()} XP
                  </span>
                </div>
              </div>
              <Badge
                variant="outline"
                className="ml-auto border-primary/30 text-primary text-xs"
              >
                Lvl {profile?.level ?? "—"}
              </Badge>
            </div>
          )}

          {/* Mobile theme toggle */}
          {mounted && (
            <button
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 mb-1 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </button>
          )}

          <nav className="flex flex-col gap-1">
            {visibleNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                onClick={() => setMobileOpen(false)}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
            {showAuthenticatedUI && (
              <>
                <Link
                  href="/profile"
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  onClick={() => setMobileOpen(false)}
                >
                  <User className="h-4 w-4" />
                  Profile
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  onClick={() => setMobileOpen(false)}
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

function shortAddress(address: string | null): string {
  if (!address) return "Wallet Connected";
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}
