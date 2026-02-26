"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useTheme } from "next-themes";
import {
  Zap,
  BookOpen,
  Trophy,
  Users,
  LayoutDashboard,
  User,
  Settings,
  Menu,
  X,
  Sun,
  Moon,
  Globe,
  LogOut,
  Wallet,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { formatXP } from "@/lib/utils/xp";

const navLinks = [
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/community", label: "Community", icon: Users },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

const languages = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "pt-BR", label: "Português", flag: "🇧🇷" },
  { code: "es", label: "Español", flag: "🇪🇸" },
];

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { connected, publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const walletShort = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
    : "";

  const handleLocaleChange = (locale: string) => {
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000`;
    window.location.reload();
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-lg"
          : "bg-transparent"
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 bg-gradient-to-br from-[#9945FF] to-[#14F195] rounded-lg rotate-3 group-hover:rotate-6 transition-transform duration-300" />
              <div className="relative w-8 h-8 bg-gradient-to-br from-[#9945FF] to-[#14F195] rounded-lg flex items-center justify-center shadow-glow-purple">
                <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <span className="font-bold text-lg hidden sm:block">
              <span className="gradient-text">Superteam</span>{" "}
              <span className="text-foreground/80">Academy</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  pathname === href || pathname.startsWith(href + "/")
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hidden md:flex h-8 w-8">
                  <Globe className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => handleLocaleChange(lang.code)}
                    className="gap-2 cursor-pointer"
                  >
                    <span>{lang.flag}</span>
                    {lang.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme Toggle */}
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            )}

            {/* Wallet/Auth */}
            {connected && publicKey ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="glass"
                    size="sm"
                    className="gap-2 hidden md:flex"
                  >
                    <div className="w-2 h-2 rounded-full bg-[#14F195] animate-pulse" />
                    <span className="font-mono text-xs">{walletShort}</span>
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    <div>
                      <p className="font-medium">Wallet Connected</p>
                      <p className="text-xs text-muted-foreground font-mono">{walletShort}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="gap-2 cursor-pointer">
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="gap-2 cursor-pointer">
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="gap-2 cursor-pointer">
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => disconnect()}
                    className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="gradient"
                size="sm"
                onClick={() => setVisible(true)}
                className="hidden md:flex"
              >
                <Wallet className="h-4 w-4" />
                Connect Wallet
              </Button>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-8 w-8"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    pathname === href
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}

              <div className="pt-3 border-t border-border">
                {connected ? (
                  <div className="flex items-center justify-between px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#14F195] animate-pulse" />
                      <span className="font-mono text-sm text-muted-foreground">{walletShort}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => disconnect()}>
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="gradient"
                    className="w-full"
                    onClick={() => {
                      setVisible(true);
                      setMobileOpen(false);
                    }}
                  >
                    <Wallet className="h-4 w-4" />
                    Connect Wallet
                  </Button>
                )}
              </div>

              <div className="flex gap-2 px-3 pt-2">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLocaleChange(lang.code)}
                    className="text-xs px-2 py-1 rounded-md bg-muted hover:bg-accent transition-colors"
                  >
                    {lang.flag} {lang.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
