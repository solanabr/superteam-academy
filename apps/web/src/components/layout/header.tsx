"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { House, Book, Trophy, List, X } from "@phosphor-icons/react";
import type { User } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { AuthModal } from "@/components/auth/auth-modal";
import { UserMenu } from "@/components/auth/user-menu";
import { dispatchLevelUp } from "@/components/gamification/level-up-overlay";
import { LevelBadge } from "@/components/gamification/level-badge";
import { xpToNextLevel } from "@/lib/gamification/xp";
import { useXpBalance } from "@/lib/solana/hooks";
import { createClient } from "@/lib/supabase/client";

interface UserProfile {
  username: string;
  avatar_url: string | null;
  wallet_address: string | null;
}

const navItems = [
  { key: "dashboard", icon: House, href: "/dashboard" },
  { key: "courses", icon: Book, href: "/courses" },
  { key: "leaderboard", icon: Trophy, href: "/leaderboard" },
] as const;

export function Header() {
  const t = useTranslations("nav");
  const tA11y = useTranslations("a11y");
  const locale = useLocale();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // XP state
  const [displayedXp, setDisplayedXp] = useState(0);
  const [level, setLevel] = useState(0);
  const [glowing, setGlowing] = useState(false);
  const targetXpRef = useRef(0);
  const prevLevelRef = useRef(0);
  const rafRef = useRef<number>(0);

  const { balance: onChainXp } = useXpBalance();

  // Auth + profile loading
  useEffect(() => {
    const supabase = createClient();

    async function loadUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const { data } = await supabase
          .from("profiles")
          .select("username, avatar_url, wallet_address")
          .eq("id", currentUser.id)
          .single();
        if (data) setProfile(data);
      }
      setAuthLoading(false);
    }

    loadUser();

    // IMPORTANT: This callback must NOT be async.
    // During initialization, GoTrue awaits all onAuthStateChange callbacks.
    // An async callback that calls supabase.from() would deadlock because the
    // Postgrest client internally calls getSession(), which awaits initializePromise.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);

      if (newUser) {
        supabase
          .from("profiles")
          .select("username, avatar_url, wallet_address")
          .eq("id", newUser.id)
          .single()
          .then(({ data }) => {
            if (data) setProfile(data as UserProfile);
          });
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
      const newXp = data.total_xp ?? 0;
      const prevXp = targetXpRef.current;
      targetXpRef.current = newXp;
      const newLevel = data.level ?? 0;
      const prevLevel = prevLevelRef.current;
      prevLevelRef.current = newLevel;
      setLevel(newLevel);

      if (newLevel > prevLevel && prevLevel > 0) {
        dispatchLevelUp(newLevel);
      }

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
    }
  }, [onChainXp]);

  useEffect(() => {
    const handleXpGain = () => setTimeout(fetchXp, 500);
    window.addEventListener("xp-gain", handleXpGain);
    return () => window.removeEventListener("xp-gain", handleXpGain);
  }, [fetchXp]);

  const isLoggedIn = !!user && !!profile;
  const { xpInCurrentLevel, xpRequiredForNext } = xpToNextLevel(displayedXp);
  const xpRemaining = xpRequiredForNext - xpInCurrentLevel;

  return (
    <header className="fixed left-0 right-0 top-0 z-[200]">
      {/* Main header bar — bottom border is XP progress */}
      <div className="relative bg-transparent backdrop-blur-md">
        <div className="relative mx-auto flex h-[56px] max-w-[1600px] items-center px-[16px]">
          {/* Center: nav links (desktop) — absolute to be truly centered */}
          <nav
            className="absolute inset-0 hidden items-center justify-center gap-[2px] md:flex"
            aria-label={tA11y("platformNavigation")}
          >
            {isLoggedIn &&
              navItems.map((item) => {
                const fullHref = `/${locale}${item.href}`;
                const isActive = pathname.startsWith(fullHref);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.key}
                    href={fullHref}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-[8px] rounded-[var(--r-md)] px-[14px] py-[7px] text-[13px] font-semibold no-underline transition-all duration-150",
                      isActive
                        ? "bg-[var(--primary-dim)] text-[var(--primary)]"
                        : "text-[var(--text-3)] hover:bg-[var(--card)] hover:text-[var(--text-2)]"
                    )}
                  >
                    <Icon size={16} weight="bold" />
                    <span>{t(item.key)}</span>
                  </Link>
                );
              })}
          </nav>

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
            <Link href={`/${locale}/dashboard`} className="flex items-center">
              <Image
                src="/logo-light.png"
                alt="Solarium"
                width={120}
                height={36}
                className="h-7 w-auto dark:hidden"
              />
              <Image
                src="/logo-dark.png"
                alt="Solarium"
                width={120}
                height={36}
                className="hidden h-7 w-auto dark:block"
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
