"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  House,
  Book,
  Trophy,
  ChatCircle,
  List,
  X,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/auth-provider";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { AuthModal } from "@/components/auth/auth-modal";
import { UserMenu } from "@/components/auth/user-menu";
import { LevelBadge } from "@/components/gamification/level-badge";
import { xpToNextLevel, calculateLevel } from "@/lib/gamification/xp";
import { useXpBalance } from "@/lib/solana/hooks";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { key: "dashboard", icon: House, href: "/dashboard" },
  { key: "courses", icon: Book, href: "/courses" },
  { key: "community", icon: ChatCircle, href: "/community" },
  { key: "leaderboard", icon: Trophy, href: "/leaderboard" },
] as const;

export function Header() {
  const t = useTranslations("nav");
  const tA11y = useTranslations("a11y");
  const locale = useLocale();
  const pathname = usePathname();
  const { user, profile, isLoading: authLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // XP state
  const [displayedXp, setDisplayedXp] = useState(0);
  const [level, setLevel] = useState(0);
  const [glowing, setGlowing] = useState(false);
  const [xpGainAmount, setXpGainAmount] = useState<number | null>(null);
  const xpGainKeyRef = useRef(0);
  const targetXpRef = useRef(0);
  const prevLevelRef = useRef(0);
  const rafRef = useRef<number>(0);
  const xpGainTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const { balance: onChainXp } = useXpBalance();

  // XP fetching
  const fetchXp = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { data } = await supabase
      .from("user_xp")
      .select("total_xp, level")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (data) {
      const supabaseXp = data.total_xp ?? 0;
      // Preserve any higher on-chain value that was previously reconciled
      const newXp = Math.max(supabaseXp, targetXpRef.current);
      const prevXp = targetXpRef.current;
      targetXpRef.current = newXp;
      const newLevel = calculateLevel(newXp);
      prevLevelRef.current = newLevel;
      setLevel(newLevel);

      if (newXp > prevXp && prevXp > 0) {
        setGlowing(true);
        const diff = newXp - prevXp;
        const duration = Math.min(800, Math.max(300, diff * 20));
        const startTime = performance.now();

        const animate = (now: number) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setDisplayedXp(Math.round(prevXp + diff * eased));

          if (progress < 1) {
            rafRef.current = requestAnimationFrame(animate);
          } else {
            setDisplayedXp(newXp);
            setTimeout(() => setGlowing(false), 400);
          }
        };
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayedXp(newXp);
      }
    }
  }, []);

  useEffect(() => {
    if (user) fetchXp();
    return () => cancelAnimationFrame(rafRef.current);
  }, [user, fetchXp]);

  useEffect(() => {
    if (onChainXp > 0 && onChainXp > targetXpRef.current) {
      targetXpRef.current = onChainXp;
      setDisplayedXp(onChainXp);
      setLevel(calculateLevel(onChainXp));
    }
  }, [onChainXp]);

  useEffect(() => {
    const handleXpGain = (e: Event) => {
      const amount = (e as CustomEvent<{ amount: number }>).detail?.amount;
      if (amount > 0) {
        xpGainKeyRef.current += 1;
        setXpGainAmount(amount);
        clearTimeout(xpGainTimerRef.current);
        xpGainTimerRef.current = setTimeout(() => setXpGainAmount(null), 2600);
      }
      setTimeout(fetchXp, 500);
    };
    window.addEventListener("xp-gain", handleXpGain);
    return () => {
      window.removeEventListener("xp-gain", handleXpGain);
      clearTimeout(xpGainTimerRef.current);
    };
  }, [fetchXp]);

  const isLoggedIn = !!user && !!profile;
  const { xpInCurrentLevel, xpRequiredForNext } = xpToNextLevel(displayedXp);
  const xpRemaining = xpRequiredForNext - xpInCurrentLevel;

  return (
    <header className="fixed left-0 right-0 top-0 z-[200]">
      {/* Main header bar — bottom border is XP progress */}
      <div className="relative bg-transparent backdrop-blur-md">
        <div className="relative mx-auto flex h-[56px] max-w-[1600px] items-center px-[16px]">
          {/* Left: Superteam Brazil logo (desktop) */}
          <Link
            href={`/${locale}`}
            className="relative z-10 mr-auto hidden shrink-0 md:flex"
          >
            <Image
              src="/ST-DARK-GREEN-HORIZONTAL.png"
              alt="Superteam Brasil"
              width={160}
              height={32}
              className="h-6 w-auto dark:hidden"
            />
            <Image
              src="/ST-YELLOW-HORIZONTAL.png"
              alt="Superteam Brasil"
              width={160}
              height={32}
              className="hidden h-6 w-auto dark:block"
            />
          </Link>

          {/* Center: nav pill bar (desktop) */}
          {authLoading ? (
            <nav
              className="nav-bar absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:flex"
              aria-hidden="true"
            >
              {navItems.map((item) => (
                <div key={item.key} className="nav-link">
                  <div className="h-4 w-4 animate-pulse rounded bg-[var(--input)]" />
                  <div className="h-3 w-12 animate-pulse rounded bg-[var(--input)]" />
                </div>
              ))}
            </nav>
          ) : isLoggedIn ? (
            <nav
              className="nav-bar absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:flex"
              aria-label={tA11y("platformNavigation")}
            >
              {navItems.map((item) => {
                const fullHref = `/${locale}${item.href}`;
                const isActive = pathname.startsWith(fullHref);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.key}
                    href={fullHref}
                    aria-current={isActive ? "page" : undefined}
                    className={cn("nav-link", isActive && "active")}
                  >
                    <Icon size={16} weight={isActive ? "fill" : "bold"} />
                    <span>{t(item.key)}</span>
                  </Link>
                );
              })}
            </nav>
          ) : null}

          {/* Right: XP ring → lang → theme → user (desktop) */}
          <div className="relative z-10 ml-auto hidden shrink-0 items-center gap-[10px] md:flex">
            {isLoggedIn && (
              <div
                className={cn(
                  "group relative flex items-center gap-[8px] rounded-full border border-[var(--border)] bg-[var(--card)] py-[4px] pl-[4px] pr-[12px] transition-all duration-500",
                  glowing && "shadow-glow-xp"
                )}
                title={`${xpRemaining.toLocaleString()} XP to Level ${level + 1}`}
              >
                <LevelBadge level={level} size="sm" />

                {/* XP count */}
                <span
                  className={cn(
                    "font-display text-[13px] font-black tabular-nums text-[var(--xp)] transition-transform duration-300",
                    glowing && "scale-105"
                  )}
                >
                  {displayedXp.toLocaleString()}
                  <span className="ml-[2px] text-[10px] font-bold text-[var(--text-3)]">
                    XP
                  </span>
                </span>

                {/* Floating +XP gain indicator */}
                {xpGainAmount !== null && (
                  <span
                    key={xpGainKeyRef.current}
                    className="absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-[var(--xp-dim)] bg-[var(--card)] px-3 py-0.5 font-display text-[15px] font-black text-[var(--xp)] shadow-[0_2px_8px_var(--xp-dim)]"
                    style={{
                      animation:
                        "xp-float 2.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                    }}
                  >
                    +{xpGainAmount} XP
                  </span>
                )}
              </div>
            )}
            <LanguageSwitcher />
            <ThemeToggle />
            {authLoading ? (
              <div className="h-9 w-20 animate-pulse rounded-[var(--r-sm)] bg-[var(--card)]" />
            ) : isLoggedIn ? (
              <UserMenu
                username={profile.username}
                avatarUrl={profile.avatar_url}
                walletAddress={profile.wallet_address}
                locale={locale}
              />
            ) : (
              <AuthModal />
            )}
          </div>

          {/* Mobile: logo + hamburger */}
          <div className="flex flex-1 items-center justify-between gap-[12px] md:hidden">
            <Link
              href={user ? `/${locale}/dashboard` : `/${locale}`}
              className="flex items-center"
            >
              <Image
                src="/ST-DARK-GREEN-HORIZONTAL.png"
                alt="Superteam Brasil"
                width={160}
                height={32}
                className="h-6 w-auto dark:hidden"
              />
              <Image
                src="/ST-YELLOW-HORIZONTAL.png"
                alt="Superteam Brasil"
                width={160}
                height={32}
                className="hidden h-6 w-auto dark:block"
              />
            </Link>
            <button
              className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--r-sm)] border border-[var(--border-default)] bg-[var(--card)] text-[var(--text-2)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={
                mobileMenuOpen ? tA11y("closeMenu") : tA11y("openMenu")
              }
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X size={24} weight="bold" />
              ) : (
                <List size={24} weight="bold" />
              )}
            </button>
          </div>
        </div>

        {/* Bottom border */}
        <div className="h-px w-full bg-[var(--border-default)]" />
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="mx-[12px] mt-[4px] rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] md:hidden">
          <div className="space-y-2 px-[16px] py-4">
            {isLoggedIn && (
              <nav className="flex flex-col gap-[2px]">
                {navItems.map((item) => {
                  const fullHref = `/${locale}${item.href}`;
                  const isActive = pathname.startsWith(fullHref);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.key}
                      href={fullHref}
                      onClick={() => setMobileMenuOpen(false)}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-[10px] rounded-[var(--r-md)] px-[10px] py-[9px] text-[14px] font-semibold no-underline transition-all duration-150",
                        isActive
                          ? "bg-[var(--primary-dim)] text-[var(--primary)]"
                          : "text-[var(--text-3)] hover:bg-[var(--card-hover)] hover:text-[var(--text-2)]"
                      )}
                    >
                      <Icon size={18} weight="bold" />
                      <span>{t(item.key)}</span>
                    </Link>
                  );
                })}
              </nav>
            )}

            <div className="h-px bg-[var(--border)]" />

            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
            <div className="pt-1">
              {authLoading ? (
                <div className="h-9 w-20 animate-pulse rounded-[var(--r-sm)] bg-[var(--input)]" />
              ) : isLoggedIn ? (
                <UserMenu
                  username={profile.username}
                  avatarUrl={profile.avatar_url}
                  walletAddress={profile.wallet_address}
                  locale={locale}
                />
              ) : (
                <AuthModal />
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
