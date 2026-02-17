"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  House,
  Book,
  Trophy,
  UserCircle,
  Certificate,
  GearSix,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { dispatchLevelUp } from "@/components/gamification/level-up-overlay";
import { xpToNextLevel } from "@/lib/gamification/xp";
import { useXpBalance } from "@/lib/solana/hooks";

const sidebarItems = [
  { key: "dashboard", icon: House, href: "/dashboard" },
  { key: "courses", icon: Book, href: "/courses" },
  { key: "leaderboard", icon: Trophy, href: "/leaderboard" },
  { key: "profile", icon: UserCircle, href: "/profile" },
  { key: "certificates", icon: Certificate, href: "/certificates" },
  { key: "settings", icon: GearSix, href: "/settings" },
] as const;

export function Sidebar() {
  const t = useTranslations("nav");
  const tGamification = useTranslations("gamification");
  const tA11y = useTranslations("a11y");
  const locale = useLocale();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [displayedXp, setDisplayedXp] = useState(0);
  const [level, setLevel] = useState(0);
  const [glowing, setGlowing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const targetXpRef = useRef(0);
  const prevLevelRef = useRef(0);
  const rafRef = useRef<number>(0);

  // On-chain XP balance as supplementary source
  const { balance: onChainXp } = useXpBalance();

  const fetchXp = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      setIsAuthenticated(false);
      return;
    }
    setIsAuthenticated(true);
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

      // Fire level-up celebration if level increased
      if (newLevel > prevLevel && prevLevel > 0) {
        dispatchLevelUp(newLevel);
      }

      // If XP increased, animate the count-up + glow
      if (newXp > prevXp && prevXp > 0) {
        setGlowing(true);
        const diff = newXp - prevXp;
        const duration = Math.min(800, Math.max(300, diff * 20)); // 300-800ms
        const startTime = performance.now();

        const animate = (now: number) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          // ease-out cubic for a satisfying deceleration
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

  // Fetch on mount
  useEffect(() => {
    fetchXp();
    return () => cancelAnimationFrame(rafRef.current);
  }, [fetchXp]);

  // Listen to auth state changes
  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const hasUser = !!session?.user;
      setIsAuthenticated(hasUser);
      if (hasUser) fetchXp();
    });
    return () => subscription.unsubscribe();
  }, [fetchXp]);

  // Reconcile on-chain XP: if on-chain balance is higher, update display
  useEffect(() => {
    if (onChainXp > 0 && onChainXp > targetXpRef.current) {
      targetXpRef.current = onChainXp;
      setDisplayedXp(onChainXp);
    }
  }, [onChainXp]);

  // Refresh when XP is awarded (xp-gain event from lesson completion)
  useEffect(() => {
    const handleXpGain = () => {
      // Small delay so the API has time to commit the new XP
      setTimeout(fetchXp, 500);
    };
    window.addEventListener("xp-gain", handleXpGain);
    return () => window.removeEventListener("xp-gain", handleXpGain);
  }, [fetchXp]);

  if (!isAuthenticated) return null;

  return (
    <div className="relative sticky top-16 z-20 hidden h-[calc(100vh-4rem)] shrink-0 lg:block">
      <aside
        className={cn(
          "bg-card/50 flex h-full flex-col overflow-y-auto border-r-[2.5px] border-border transition-all duration-300",
          collapsed ? "w-[68px]" : "w-[240px]"
        )}
      >
        <nav
          className="flex-1 space-y-1 p-3"
          aria-label={tA11y("platformNavigation")}
        >
          {sidebarItems.map((item) => {
            const fullHref = `/${locale}${item.href}`;
            const isActive = pathname.startsWith(fullHref);
            const Icon = item.icon;

            return (
              <Link
                key={item.key}
                href={fullHref}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-white"
                    : "text-text-2 hover:bg-subtle hover:text-text"
                )}
                title={collapsed ? t(item.key) : undefined}
              >
                <Icon size={20} weight="bold" className="shrink-0" />
                {!collapsed && <span>{t(item.key)}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t-[2.5px] border-border p-3">
          {!collapsed ? (
            <div
              className={cn(
                "rounded-lg border-[2.5px] border-border bg-card p-3.5 shadow-card transition-all duration-500",
                glowing &&
                  "border-accent shadow-[0_0_16px_rgba(13,148,136,0.5),0_0_32px_rgba(245,158,11,0.3)]"
              )}
            >
              <div className="mb-2 flex items-center justify-between">
                <span
                  className={cn(
                    "font-display text-xs font-black tracking-wide text-accent transition-transform duration-300",
                    glowing && "scale-110"
                  )}
                >
                  XP
                </span>
                <span
                  className={cn(
                    "font-display text-sm font-black tabular-nums text-text transition-colors duration-300",
                    glowing && "text-accent"
                  )}
                >
                  {displayedXp.toLocaleString()} {tGamification("xp")}
                </span>
              </div>
              <div className="mb-2.5 text-xs font-medium text-text-3">
                {tGamification("level")} {level}
              </div>
              <div className="progress-fat">
                <div
                  className="progress-fat-fill progress-fill-amber"
                  style={{
                    width: `${xpToNextLevel(displayedXp).progressPercent}%`,
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 rounded-lg border-[2.5px] border-border bg-card p-2 shadow-card">
              <span className="font-display text-xs font-black text-accent">
                XP
              </span>
              <span className="font-display text-[10px] font-bold tabular-nums text-text">
                {displayedXp.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </aside>

      {/* Collapse toggle — centered on the sidebar's right edge */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border-[2.5px] border-border bg-card text-text-3 shadow-push-sm transition-colors hover:bg-subtle hover:text-text"
        aria-label={
          collapsed ? tA11y("expandSidebar") : tA11y("collapseSidebar")
        }
      >
        {collapsed ? (
          <CaretRight size={12} weight="bold" />
        ) : (
          <CaretLeft size={12} weight="bold" />
        )}
      </button>
    </div>
  );
}
