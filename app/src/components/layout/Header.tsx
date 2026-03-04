"use client";

import Link from "next/link";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { useXpBalance } from "@/hooks/useXpBalance";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";
import dynamic from "next/dynamic";

export function Header() {
  const { connected } = useWallet();

  // Always call hooks (React rule)
  const xpQuery = useXpBalance();
  const xp = connected ? xpQuery.data : undefined;
  const isLoading = connected ? xpQuery.isLoading : false;
  const error = connected ? xpQuery.error : null;

  const { language, setLanguage, t } = useLanguage();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const [animatedXp, setAnimatedXp] = useState<number>(0);
  const [isPulsing, setIsPulsing] = useState(false);
  const [mounted, setMounted] = useState(false);

  const previousXpRef = useRef<number>(0);
  const WalletButton = dynamic(
    () => import("@solana/wallet-adapter-react-ui").then(m => m.WalletMultiButton),
    { ssr: false }
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  /* ---------------- Sync Initial XP ---------------- */

  useEffect(() => {
    if (!mounted) return;

    if (xp !== undefined && xp !== null) {
      setAnimatedXp(xp);
      previousXpRef.current = xp;
    }
  }, [xp, mounted]);

  /* ---------------- Animate XP Increase ---------------- */

  useEffect(() => {
    if (!mounted) return;
    if (xp === undefined || xp === null) return;

    // Prevent animation on first load
    if (previousXpRef.current === 0) {
      previousXpRef.current = xp;
      return;
    }

    if (xp <= previousXpRef.current) return;

    const start = previousXpRef.current;
    const end = xp;
    const duration = 600;
    const startTime = performance.now();

    setIsPulsing(true);

    function animate(time: number) {
      const progress = Math.min((time - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(start + (end - start) * eased);

      setAnimatedXp(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        previousXpRef.current = end;
        setIsPulsing(false);
      }
    }

    requestAnimationFrame(animate);

  }, [xp, mounted]);

  /* ---------------- Load Language Once ---------------- */

  useEffect(() => {
  if (!mounted) return;

  const id = setTimeout(() => {
      const stored = localStorage.getItem("superteam:language");
      if (stored && stored !== language) {
        setLanguage(stored as "en" | "pt" | "es");
      }
    }, 0);

    return () => clearTimeout(id);
  }, [mounted]);

  const navItems = useMemo(() => [
  { href: "/dashboard", label: t("nav.dashboard") },
  { href: "/courses", label: t("nav.courses") },
  { href: "/profile", label: t("nav.profile") },
  { href: "/leaderboard", label: t("nav.leaderboard") },
  { href: "/settings", label: t("nav.settings") },
], [t]);

if (!mounted) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-10 py-5">

        {/* Brand */}
        <Link href="/" className="flex flex-col leading-tight group">
          <span className="text-lg font-semibold tracking-tight group-hover:opacity-80 transition-opacity">
            Superteam Academy
          </span>
          <span className="text-xs text-muted-foreground">
            {t("nav.tagline")}
          </span>
        </Link>

        {/* Navigation */}
        {connected && (
          <nav className="hidden md:flex items-center gap-10 text-sm">
            {navItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link key={item.href} href={item.href} className="relative group">
                  <span
                    className={
                      isActive
                        ? "text-foreground font-medium"
                        : "text-muted-foreground group-hover:text-foreground transition-colors"
                    }
                  >
                    {item.label}
                  </span>

                  <span
                    className={`absolute left-0 -bottom-2 h-[2px] rounded-full transition-[width] duration-300 ${
                      isActive ? "w-full bg-foreground" : "w-0 bg-foreground group-hover:w-full"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>
        )}

        {/* Controls */}
        <div className="flex items-center gap-6">

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              setTheme(theme === "dark" ? "light" : "dark")
            }
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </Button>

          {/* Language */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-muted/30 hover:bg-muted/50 transition-colors">
            <span className="text-sm">🌍</span>
            <select
              value={language}
              onChange={(e) => {
                const newLang = e.target.value as "en" | "pt" | "es";
                setLanguage(newLang);
                localStorage.setItem("superteam:language", newLang);
              }}
              className="text-sm bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="en">EN</option>
              <option value="pt">PT</option>
              <option value="es">ES</option>
            </select>
          </div>

          {/* XP */}
          {connected && (
            <div
              className={`flex items-center gap-2 px-5 py-2 rounded-full border bg-muted/40 text-sm font-medium transition-transform duration-300 ${
                isPulsing ? "scale-105" : "scale-100"
              }`}
            >
              {isLoading && (
                <span className="text-muted-foreground">
                  {t("nav.loading")}
                </span>
              )}

              {error && (
                <span className="text-red-500">
                  {t("nav.xpError")}
                </span>
              )}

              {!isLoading && !error && (
                <>
                  <span className="text-muted-foreground tracking-wide">
                    XP
                  </span>
                  <span className="font-semibold text-base">
                    {animatedXp}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Wallet */}
          
            <WalletButton />
          

        </div>
      </div>
    </header>
  );
}