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
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { LevelBadge } from "@/components/gamification/level-badge";
import { xpToNextLevel, calculateLevel } from "@/lib/gamification/xp";
import { useXpBalance } from "@/lib/solana/hooks";

const sidebarItems = [
  { key: "dashboard", icon: House, href: "/dashboard" },
  { key: "courses", icon: Book, href: "/courses" },
  { key: "leaderboard", icon: Trophy, href: "/leaderboard" },
  { key: "certificates", icon: Certificate, href: "/certificates" },
  { key: "profile", icon: UserCircle, href: "/profile" },
] as const;

export function Sidebar() {
  const t = useTranslations("nav");
  const tA11y = useTranslations("a11y");
  const locale = useLocale();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(true);

  // Persist collapsed preference
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) setCollapsed(saved === "true");
  }, []);
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
      const supabaseXp = data.total_xp ?? 0;
      // Preserve any higher on-chain value that was previously reconciled
      const newXp = Math.max(supabaseXp, targetXpRef.current);
      const prevXp = targetXpRef.current;
      targetXpRef.current = newXp;
      const newLevel = calculateLevel(newXp);
      prevLevelRef.current = newLevel;
      setLevel(newLevel);

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
      setLevel(calculateLevel(onChainXp));
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

  const { progressPercent, xpInCurrentLevel, xpRequiredForNext } =
    xpToNextLevel(displayedXp);
  const xpRemaining = xpRequiredForNext - xpInCurrentLevel;

  return (
    <aside
      className={cn(
        "sidebar-scroll relative sticky top-[40vh] hidden shrink-0 -translate-y-1/2 flex-col self-start lg:flex",
        "rounded-[var(--r-lg)] border border-[var(--border-default)] bg-[var(--surface)] shadow-[var(--shadow)]",
        "p-[16px_10px]",
        "ml-[16px]",
        "transition-all duration-300",
        collapsed ? "w-[68px]" : "w-[216px]"
      )}
      aria-label={tA11y("platformNavigation")}
    >
      <nav className="flex flex-col gap-[2px]">
        {sidebarItems.map((item) => {
          const fullHref = `/${locale}${item.href}`;
          const isActive = pathname.startsWith(fullHref);
          const Icon = item.icon;

          return (
            <Link
              key={item.key}
              href={fullHref}
              aria-current={isActive ? "page" : undefined}
              title={collapsed ? t(item.key) : undefined}
              className={cn(
                "flex items-center gap-[10px] rounded-[var(--r-md)] px-[10px] py-[9px] text-[14px] font-semibold no-underline transition-all duration-150",
                isActive
                  ? "bg-[var(--primary-dim)] text-[var(--primary)]"
                  : "text-[var(--text-3)] hover:bg-[var(--card)] hover:text-[var(--text-2)]",
                collapsed && "justify-center"
              )}
            >
              <span className="flex w-[20px] shrink-0 items-center justify-center">
                <Icon size={18} weight="bold" />
              </span>
              {!collapsed && <span>{t(item.key)}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle — on the border between nav and XP */}
      <div className="relative mb-[12px] mt-[40px]">
        <div className="h-px bg-[var(--border)]" />
        <button
          onClick={() => {
            const next = !collapsed;
            setCollapsed(next);
            localStorage.setItem("sidebar-collapsed", String(next));
          }}
          className="absolute -right-[22px] top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--text-3)] shadow-[var(--shadow)] transition-colors hover:bg-[var(--card-hover)]"
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

      {/* XP panel */}
      <div>
        {!collapsed ? (
          <div
            className={cn(
              "rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--card)] p-[12px] transition-all duration-500",
              glowing && "shadow-glow-xp"
            )}
          >
            <div className="mb-[3px] flex items-baseline justify-between">
              <span
                className={cn(
                  "font-display text-[17px] font-black tabular-nums text-[var(--xp)] transition-colors duration-300",
                  glowing && "scale-110"
                )}
              >
                {displayedXp.toLocaleString()} XP
              </span>
              <LevelBadge level={level} size="sm" />
            </div>
            <div className="mb-[7px] font-mono text-[10px] text-[var(--text-3)]">
              {xpRemaining.toLocaleString()} XP to Level {level + 1}
            </div>
            <div
              className="sidebar-prog overflow-hidden rounded-full"
              style={{ height: "6px", background: "var(--input)" }}
            >
              <div
                className="sidebar-prog-fill h-full rounded-full"
                style={{
                  width: `${progressPercent}%`,
                  background:
                    "linear-gradient(90deg, var(--primary-dark), var(--primary))",
                  transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
                }}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 overflow-hidden rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--card)] p-2">
            <LevelBadge level={level} size="sm" />
            <span className="font-display text-[10px] font-bold tabular-nums text-[var(--xp)]">
              {displayedXp.toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
