"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { useWallet } from "@solana/wallet-adapter-react";
import { useParams } from "next/navigation";
import { Menu, Flame, ChevronDown, LogOut } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { WalletButton } from "./WalletButton";
import { ThemeToggle } from "./ThemeToggle";
import { useXpBalance } from "@/hooks/useXpBalance";
import { useSigningMode } from "@/hooks/useSigningMode";
import { useStubXp } from "@/hooks/useStubXp";
import { useTheme } from "@/hooks/useTheme";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import {
  IDENTITY_PROFILE_UPDATED_EVENT,
  getProfileBySubject,
  resolveCurrentSubject,
} from "@/services/IdentityProfileService";
import { getCurrentStreak, STREAK_UPDATED_EVENT } from "@/lib/streak";

export function Nav() {
  const { connected, publicKey } = useWallet();
  const { data: session } = useSession();
  const { data: xp } = useXpBalance();
  const signingMode = useSigningMode();
  const localXp = useStubXp();
  const pathname = usePathname();
  const params = useParams();
  const locale = (params?.locale as string) ?? "en";
  const t = useTranslations("Nav");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [identityVersion, setIdentityVersion] = useState(0);
  const [streak, setStreak] = useState(0);
  const desktopMenuRef = useRef<HTMLDetailsElement | null>(null);
  const { theme, resolved } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Server always assumes dark. Defers client evaluation to post-mount.
  const isDark = mounted ? resolved === "dark" : true;

  const walletAddress = publicKey?.toBase58() ?? null;
  const walletShort = walletAddress
    ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
    : null;

  const subject = useMemo(
    () =>
      resolveCurrentSubject(
        session
          ? {
            provider: session.provider,
            providerAccountId: session.providerAccountId,
          }
          : null,
        walletAddress,
      ),
    [session, walletAddress],
  );

  useEffect(() => {
    function handleIdentityUpdate() {
      setIdentityVersion((value) => value + 1);
    }

    window.addEventListener(IDENTITY_PROFILE_UPDATED_EVENT, handleIdentityUpdate);
    window.addEventListener("storage", handleIdentityUpdate);

    return () => {
      window.removeEventListener(IDENTITY_PROFILE_UPDATED_EVENT, handleIdentityUpdate);
      window.removeEventListener("storage", handleIdentityUpdate);
    };
  }, []);

  useEffect(() => {
    function closeDesktopMenuIfOutside(event: MouseEvent) {
      const menu = desktopMenuRef.current;
      if (!menu?.open) return;
      if (event.target instanceof Node && !menu.contains(event.target)) {
        menu.open = false;
      }
    }

    function closeDesktopMenuOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      const menu = desktopMenuRef.current;
      if (!menu?.open) return;
      menu.open = false;
    }

    document.addEventListener("mousedown", closeDesktopMenuIfOutside);
    document.addEventListener("keydown", closeDesktopMenuOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeDesktopMenuIfOutside);
      document.removeEventListener("keydown", closeDesktopMenuOnEscape);
    };
  }, []);

  useEffect(() => {
    function syncStreak() {
      setStreak(getCurrentStreak());
    }

    syncStreak();
    window.addEventListener(STREAK_UPDATED_EVENT, syncStreak);
    window.addEventListener("storage", syncStreak);

    return () => {
      window.removeEventListener(STREAK_UPDATED_EVENT, syncStreak);
      window.removeEventListener("storage", syncStreak);
    };
  }, []);

  void identityVersion;
  const identityProfile = getProfileBySubject(subject);

  const displayXp = signingMode === "stub" ? localXp : (xp?.amount ?? 0);
  const displayLevel =
    signingMode === "stub" ? Math.floor(Math.sqrt(displayXp / 100)) : (xp?.level ?? 0);

  const isLoggedIn = Boolean(session) || connected;
  const hasSocialSession = Boolean(session);

  const stableReturnTo = `/${locale}`;
  const authHref = `/auth?returnTo=${encodeURIComponent(stableReturnTo)}`;
  const authCallbackHref = `/${locale}/auth?returnTo=${encodeURIComponent(stableReturnTo)}`;
  const socialLinkHref = connected ? "/settings" : authHref;
  const displayIdentity =
    session?.user?.name ||
    session?.user?.email ||
    identityProfile?.displayName ||
    identityProfile?.username ||
    walletShort ||
    t("accountLabel");
  const avatarInitial = displayIdentity.trim().charAt(0).toUpperCase();

  function isActive(href: string, exact = false) {
    if (exact) return pathname === href;
    return pathname === href || pathname?.startsWith(href + "/");
  }

  const homeHref = `/`;
  const coursesHref = `/courses`;
  const dashboardHref = `/dashboard`;
  const leaderboardHref = `/leaderboard`;
  const profileHref = `/profile`;
  const settingsHref = `/settings`;

  const coursesActive = isActive(coursesHref);

  const publicLinks = [
    { href: coursesHref, label: t("courses"), active: coursesActive },
    { href: leaderboardHref, label: t("leaderboard"), active: isActive(leaderboardHref) },
    { href: dashboardHref, label: t("dashboard"), active: isActive(dashboardHref) },
  ];

  const loggedInLinks = [
    { href: profileHref, label: t("profile"), active: isActive(profileHref) },
    { href: settingsHref, label: t("settings"), active: isActive(settingsHref) },
  ];

  function closeDesktopMenu() {
    const menu = desktopMenuRef.current;
    if (!menu?.open) return;
    menu.open = false;
  }

  function closeDesktopMenuDeferred() {
    if (typeof window === "undefined") {
      closeDesktopMenu();
      return;
    }
    window.requestAnimationFrame(closeDesktopMenu);
  }

  return (
    <nav
      className="sticky top-0 z-50 border-b px-4 py-0"
      style={{
        background: "var(--bg-base)",
        borderColor: "var(--border-subtle)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <div className="mx-auto max-w-6xl relative flex items-center justify-between h-14">
        <div className="flex items-center">
          <Link
            href={homeHref}
            prefetch={false}
            aria-label={t("homeAria")}
            className="shrink-0 flex items-center"
          >
            <Image
              src={
                isDark
                  ? "/brand/superteam/ST-YELLOW-HORIZONTAL.svg"
                  : "/brand/superteam/ST-DARK-GREEN-HORIZONTAL.svg"
              }
              alt={t("logoAlt")}
              width={148}
              height={34}
              priority
              className="h-8 w-auto"
            />
          </Link>
        </div>

        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-0.5">
          {publicLinks.map((link) => (
            <NavLink key={link.href} href={link.href} active={link.active}>
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {connected && streak > 0 && (
            <div
              className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-full text-sm font-semibold"
              style={{
                background: "rgba(248,113,113,0.1)",
                border: "1px solid rgba(248,113,113,0.25)",
                color: "#f87171",
              }}
              title={t("streakTitle", { count: streak })}
            >
              <Flame size={13} aria-hidden="true" />
              <span>{streak}</span>
            </div>
          )}

          {connected && (
            <div
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
              style={{
                background: "rgba(153,69,255,0.1)",
                border: "1px solid rgba(153,69,255,0.25)",
                color: "var(--text-purple)",
              }}
            >
              <span
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--solana-purple)" }}
                aria-hidden="true"
              />
              <span>{displayXp.toLocaleString("en-US")} XP</span>
              <span style={{ color: "var(--text-muted)" }}>·</span>
              <span>{t("levelShort", { level: displayLevel })}</span>
            </div>
          )}

          {!isLoggedIn ? (
            <Link
              href={authHref}
              prefetch={false}
              className="hidden md:inline-flex min-h-[40px] items-center rounded-lg px-3 text-sm font-medium transition-all duration-150"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
              }}
            >
              {t("login")}
            </Link>
          ) : (
            <details ref={desktopMenuRef} className="hidden md:block relative">
              <summary
                className="list-none inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-lg px-3 text-sm font-medium"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-primary)",
                }}
                aria-label={t("userMenuAria")}
              >
                <span
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold"
                  style={{
                    background: "rgba(153,69,255,0.16)",
                    color: "var(--text-purple)",
                    border: "1px solid rgba(153,69,255,0.24)",
                  }}
                >
                  {avatarInitial || "U"}
                </span>
                <span className="max-w-[110px] truncate">{displayIdentity}</span>
                <ChevronDown size={14} aria-hidden="true" />
              </summary>
              <div
                className="absolute right-0 z-[70] mt-2 w-72 overflow-visible rounded-xl"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div
                  className="px-3 py-2.5 text-xs"
                  style={{
                    color: "var(--text-muted)",
                    borderBottom: "1px solid var(--border-subtle)",
                  }}
                >
                  {walletShort
                    ? t("walletConnected", { address: walletShort })
                    : t("walletDisconnected")}
                </div>
                {loggedInLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    prefetch={false}
                    onClick={closeDesktopMenu}
                    className="block px-3 py-2.5 text-sm"
                    style={{
                      color: link.active ? "var(--text-primary)" : "var(--text-secondary)",
                      background: link.active ? "var(--bg-elevated)" : "transparent",
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
                <div
                  className="px-3 py-3 space-y-3"
                  style={{ borderTop: "1px solid var(--border-subtle)" }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {t("language")}
                    </span>
                    <LocaleSwitcher variant="nav" onSwitched={closeDesktopMenu} />
                  </div>
                  <div
                    className="flex items-center justify-between gap-3"
                    onClick={closeDesktopMenuDeferred}
                  >
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {t("appearance")}
                    </span>
                    <ThemeToggle />
                  </div>
                  <div>
                    <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
                      {t("walletSection")}
                    </p>
                    <WalletButton />
                  </div>
                </div>
                {!hasSocialSession && (
                  <Link
                    href={socialLinkHref}
                    prefetch={false}
                    onClick={closeDesktopMenu}
                    className="block px-3 py-2.5 text-xs"
                    style={{
                      color: "var(--text-muted)",
                      borderTop: "1px solid var(--border-subtle)",
                    }}
                  >
                    {t("socialOptional")}
                  </Link>
                )}
                {hasSocialSession && (
                  <button
                    onClick={() => {
                      closeDesktopMenu();
                      signOut({ callbackUrl: authCallbackHref });
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm"
                    style={{
                      color: "#f87171",
                      borderTop: "1px solid var(--border-subtle)",
                      textAlign: "left",
                    }}
                  >
                    <LogOut size={13} aria-hidden="true" />
                    {t("signOut")}
                  </button>
                )}
              </div>
            </details>
          )}

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                className="md:hidden inline-flex items-center justify-center rounded-lg p-2 min-h-[44px] min-w-[44px] transition-colors"
                style={{ color: "var(--text-secondary)" }}
                aria-label={t("openMenuAria")}
              >
                <Menu className="w-5 h-5" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[280px] p-0 border-l"
              style={{
                background: "var(--bg-surface)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <SheetTitle className="sr-only">{t("mobileMenuTitle")}</SheetTitle>
              <div
                className="h-14 border-b px-5 flex items-center"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <span
                  className="text-lg font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {t("menuLabel")}
                </span>
              </div>

              {connected && (
                <div
                  className="mx-5 mt-4 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium"
                  style={{
                    background: "rgba(153,69,255,0.1)",
                    border: "1px solid rgba(153,69,255,0.25)",
                    color: "var(--text-purple)",
                  }}
                >
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full"
                    style={{ background: "var(--solana-purple)" }}
                    aria-hidden="true"
                  />
                  <span>{displayXp.toLocaleString("en-US")} XP</span>
                  <span style={{ color: "var(--text-muted)" }}>·</span>
                  <span>{t("levelShort", { level: displayLevel })}</span>
                </div>
              )}

              <div className="flex flex-col px-3 mt-4 gap-1">
                {publicLinks.map((link) => (
                  <MobileNavLink
                    key={link.href}
                    href={link.href}
                    active={link.active}
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </MobileNavLink>
                ))}
                {isLoggedIn &&
                  loggedInLinks.map((link) => (
                    <MobileNavLink
                      key={link.href}
                      href={link.href}
                      active={link.active}
                      onClick={() => setMobileOpen(false)}
                    >
                      {link.label}
                    </MobileNavLink>
                  ))}

                {!hasSocialSession ? (
                  <MobileNavLink
                    href={socialLinkHref}
                    active={connected ? isActive(settingsHref) : isActive("/auth")}
                    onClick={() => setMobileOpen(false)}
                  >
                    {connected ? t("socialOptional") : t("login")}
                  </MobileNavLink>
                ) : (
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      signOut({ callbackUrl: authCallbackHref });
                    }}
                    className="flex items-center gap-2 px-3 py-3 text-sm font-medium rounded-xl min-h-[44px]"
                    style={{
                      color: "#f87171",
                      background: "transparent",
                    }}
                  >
                    <LogOut size={14} aria-hidden="true" />
                    {t("signOut")}
                  </button>
                )}
              </div>

              <div className="px-5 mt-5">
                <LocaleSwitcher
                  variant="settings"
                  fullWidth
                  onSwitched={() => setMobileOpen(false)}
                />
              </div>

              <div className="px-5 mt-5">
                <WalletButton />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      className="relative px-3 py-2 text-sm rounded-md transition-colors duration-150"
      style={{
        color: active ? "var(--text-primary)" : "var(--text-secondary)",
        background: active ? "var(--bg-elevated)" : "transparent",
      }}
    >
      {children}
      {active && (
        <span
          className="absolute bottom-0 left-3 right-3 h-px rounded-full"
          style={{ background: "var(--solana-purple)" }}
        />
      )}
    </Link>
  );
}

function MobileNavLink({
  href,
  active,
  children,
  onClick,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      onClick={onClick}
      className="flex items-center px-3 py-3 text-sm font-medium rounded-xl min-h-[44px] transition-colors duration-150"
      style={{
        color: active ? "var(--text-primary)" : "var(--text-secondary)",
        background: active ? "var(--bg-elevated)" : "transparent",
      }}
    >
      {children}
      {active && (
        <span
          className="ml-auto inline-block w-1.5 h-1.5 rounded-full"
          style={{ background: "var(--solana-purple)" }}
        />
      )}
    </Link>
  );
}

