"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Menu, X, Globe, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useWallet } from "@solana/wallet-adapter-react";
import { cn } from "@/lib/utils";
import { SuperteamLogo } from "@/components/ui/superteam-logo";
import { locales, localeLabels, type Locale } from "@/i18n/config";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
  { ssr: false },
);

export function Navbar({ locale }: { locale: string }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const { connected } = useWallet();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Detect courses listing page (not /courses/[slug]) to disable mix-blend-mode
  const isCoursesPage =
    pathname === `/${locale}/courses` || pathname === `/${locale}/courses/`;

  const links = [
    { href: `/${locale}`, label: t("home") },
    { href: `/${locale}/courses`, label: t("courses") },
    { href: `/${locale}/dashboard`, label: t("dashboard") },
    { href: `/${locale}/leaderboard`, label: t("leaderboard") },
  ];

  const isActive = (href: string) => {
    if (href === `/${locale}`) {
      return pathname === `/${locale}` || pathname === `/${locale}/`;
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      <header
        className="v9-nav"
        style={{
          mixBlendMode: isCoursesPage ? "normal" : undefined,
        }}
        role="banner"
      >
        <nav
          className="flex w-full items-center justify-between"
          aria-label="Main navigation"
        >
          {/* Left: Logo */}
          <Link
            href={`/${locale}`}
            className="flex items-center gap-2.5"
            aria-label="Superteam Academy home"
          >
            <SuperteamLogo size={20} className="text-white" />
            <span className="v9-nav-logo">Superteam</span>
          </Link>

          {/* Right: Nav links + actions */}
          <div className="hidden items-center gap-8 md:flex">
            {/* Nav links */}
            {links.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn("v9-nav-link", active && "active")}
                  style={
                    isCoursesPage
                      ? { color: "rgba(255,255,255,0.7)" }
                      : undefined
                  }
                >
                  {link.label}
                </Link>
              );
            })}

            {/* Theme toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="v9-nav-link"
              aria-label={
                mounted
                  ? theme === "dark"
                    ? "Switch to light mode"
                    : "Switch to dark mode"
                  : "Toggle theme"
              }
              style={
                isCoursesPage ? { color: "rgba(255,255,255,0.7)" } : undefined
              }
            >
              {mounted && theme === "dark" ? (
                <Sun className="h-3.5 w-3.5" />
              ) : (
                <Moon className="h-3.5 w-3.5" />
              )}
            </button>

            {/* Language selector */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="v9-nav-link flex items-center gap-1"
                aria-label="Switch language"
                aria-expanded={langOpen}
                aria-haspopup="true"
                style={
                  isCoursesPage ? { color: "rgba(255,255,255,0.7)" } : undefined
                }
              >
                <Globe className="h-3.5 w-3.5" />
              </button>
              {langOpen && (
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setLangOpen(false)}
                  aria-hidden="true"
                />
              )}
              <div
                role="menu"
                aria-label="Language options"
                className={cn(
                  "absolute right-0 top-full z-50 mt-3 min-w-[120px] overflow-hidden border border-[rgba(255,255,255,0.1)] shadow-[0_8px_32px_rgba(0,0,0,0.6)] transition-all duration-200 origin-top-right",
                  langOpen
                    ? "opacity-100 scale-100 translate-y-0"
                    : "opacity-0 scale-95 -translate-y-1 pointer-events-none",
                )}
                style={{
                  background: "var(--v9-dark)",
                  fontFamily: "var(--v9-mono)",
                  fontSize: "10px",
                  letterSpacing: "2px",
                  textTransform: "uppercase" as const,
                }}
              >
                {locales.map((loc) => (
                  <Link
                    key={loc}
                    href={pathname.replace(`/${locale}`, `/${loc}`)}
                    onClick={() => setLangOpen(false)}
                    role="menuitem"
                    aria-current={locale === loc ? "true" : undefined}
                    className={cn(
                      "block w-full px-4 py-3 transition-colors",
                      locale === loc
                        ? "text-[var(--v9-sol-green)]"
                        : "text-[rgba(255,255,255,0.5)] hover:text-white",
                    )}
                  >
                    {localeLabels[loc as Locale]}
                  </Link>
                ))}
              </div>
            </div>

            {/* Wallet button */}
            {mounted ? (
              <WalletMultiButton
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.3)",
                  borderRadius: "9999px",
                  height: "30px",
                  padding: "0 16px",
                  fontFamily: "var(--v9-mono)",
                  fontSize: "10px",
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  color: "#fff",
                  fontWeight: 400,
                  lineHeight: 1,
                }}
              />
            ) : (
              <div
                className="animate-pulse"
                style={{
                  height: "30px",
                  width: "120px",
                  borderRadius: "9999px",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              />
            )}
          </div>

          {/* Mobile: actions + hamburger */}
          <div className="flex items-center gap-4 md:hidden">
            {/* Mobile theme toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="v9-nav-link"
              aria-label={
                mounted
                  ? theme === "dark"
                    ? "Switch to light mode"
                    : "Switch to dark mode"
                  : "Toggle theme"
              }
            >
              {mounted && theme === "dark" ? (
                <Sun className="h-3.5 w-3.5" />
              ) : (
                <Moon className="h-3.5 w-3.5" />
              )}
            </button>

            {/* Mobile hamburger */}
            <button
              className="v9-nav-link"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[89] flex flex-col md:hidden"
          style={{
            background: "var(--v9-dark)",
            paddingTop: "80px",
          }}
        >
          <nav className="flex flex-1 flex-col px-10 py-8 gap-1">
            {links.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "py-4 transition-opacity",
                    active ? "opacity-100" : "opacity-50 hover:opacity-80",
                  )}
                  style={{
                    fontFamily: "var(--v9-mono)",
                    fontSize: "11px",
                    letterSpacing: "3px",
                    textTransform: "uppercase" as const,
                    color: "var(--v9-white)",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {link.label}
                  {active && (
                    <span
                      className="ml-3 inline-block"
                      style={{
                        width: "4px",
                        height: "4px",
                        borderRadius: "1px",
                        background: "var(--v9-sol-green)",
                      }}
                    />
                  )}
                </Link>
              );
            })}

            {/* Mobile language selector */}
            <div
              className="mt-8 flex items-center gap-4"
              style={{
                borderTop: "1px solid rgba(255,255,255,0.06)",
                paddingTop: "24px",
              }}
            >
              <Globe
                className="h-3.5 w-3.5"
                style={{ color: "rgba(255,255,255,0.3)" }}
              />
              {locales.map((loc) => (
                <Link
                  key={loc}
                  href={pathname.replace(`/${locale}`, `/${loc}`)}
                  onClick={() => {
                    setLangOpen(false);
                    setMobileOpen(false);
                  }}
                  className={cn(
                    "transition-opacity",
                    locale === loc
                      ? "opacity-100"
                      : "opacity-40 hover:opacity-70",
                  )}
                  style={{
                    fontFamily: "var(--v9-mono)",
                    fontSize: "10px",
                    letterSpacing: "2px",
                    textTransform: "uppercase" as const,
                    color:
                      locale === loc
                        ? "var(--v9-sol-green)"
                        : "var(--v9-white)",
                  }}
                >
                  {localeLabels[loc as Locale]}
                </Link>
              ))}
            </div>

            {/* Mobile wallet button */}
            <div className="mt-8">
              {mounted ? (
                <WalletMultiButton
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: "9999px",
                    height: "36px",
                    padding: "0 20px",
                    fontFamily: "var(--v9-mono)",
                    fontSize: "10px",
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    color: "var(--v9-white)",
                    fontWeight: 400,
                    width: "100%",
                    display: "flex",
                    justifyContent: "center",
                  }}
                />
              ) : (
                <div
                  className="animate-pulse"
                  style={{
                    height: "36px",
                    borderRadius: "9999px",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                />
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
