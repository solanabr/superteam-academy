"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Menu, X, Globe, Shield, Settings } from "lucide-react";
import { useState, useEffect } from "react";
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Detect pages that need normal blend mode (not mix-blend-mode: difference)
  const isCoursesPage =
    pathname === `/${locale}/courses` || pathname === `/${locale}/courses/`;
  const isCommunityPage =
    pathname === `/${locale}/community` ||
    pathname.startsWith(`/${locale}/community/`);

  const links = [
    { href: `/${locale}`, label: t("home") },
    { href: `/${locale}/courses`, label: t("courses") },
    { href: `/${locale}/dashboard`, label: t("dashboard") },
    { href: `/${locale}/leaderboard`, label: t("leaderboard") },
    { href: `/${locale}/community`, label: t("community") },
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
          mixBlendMode: isCoursesPage || isCommunityPage ? "normal" : undefined,
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
            aria-label="Superteam home"
          >
            <SuperteamLogo size={20} />
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
                    isCoursesPage || isCommunityPage
                      ? { color: "var(--c-text-muted)" }
                      : undefined
                  }
                >
                  {link.label}
                </Link>
              );
            })}

            {/* Admin link with hand-drawn arrow */}
            <div className="relative group">
              <Link
                href={`/${locale}/admin`}
                className={cn("v9-nav-link", isActive(`/${locale}/admin`) && "active")}
                style={
                  isCoursesPage || isCommunityPage
                    ? { color: "var(--c-text-muted)" }
                    : undefined
                }
                aria-label="Admin panel"
              >
                <Shield className="h-3.5 w-3.5" />
              </Link>
              {/* Hand-drawn arrow + label */}
              <div
                className="pointer-events-none absolute left-1/2 top-full pt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ transform: "translateX(-50%)" }}
              >
                {/* SVG hand-drawn arrow curving down */}
                <svg
                  width={60}
                  height={36}
                  viewBox="0 0 60 36"
                  fill="none"
                  style={{ display: "block", margin: "0 auto" }}
                >
                  <path
                    d="M30,2 C26,8 20,14 22,22 C24,28 30,30 34,26"
                    stroke="var(--v9-sol-green)"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeDasharray="80"
                    strokeDashoffset="80"
                    className="group-hover:animate-[tour-draw_0.6s_ease_forwards_0.1s]"
                  />
                  <polygon
                    points="30,32 38,24 34,22"
                    fill="var(--v9-sol-green)"
                    className="opacity-0 group-hover:animate-[tour-fade_0.2s_ease_forwards_0.5s]"
                  />
                </svg>
                <span
                  style={{
                    fontFamily: "var(--font-caveat), 'Caveat', cursive",
                    fontSize: 15,
                    color: "var(--v9-sol-green)",
                    display: "block",
                    textAlign: "center",
                    transform: "rotate(-3deg)",
                    whiteSpace: "nowrap",
                    marginTop: -2,
                  }}
                >
                  admin login here
                </span>
              </div>
            </div>

            {/* Language selector */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="v9-nav-link flex items-center gap-1"
                aria-label="Switch language"
                aria-expanded={langOpen}
                aria-haspopup="true"
                style={
                  isCoursesPage ? { color: "var(--c-text-muted)" } : undefined
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
                  "absolute right-0 top-full z-50 mt-3 min-w-[120px] overflow-hidden transition-all duration-200 origin-top-right",
                  langOpen
                    ? "opacity-100 scale-100 translate-y-0"
                    : "opacity-0 scale-95 -translate-y-1 pointer-events-none",
                )}
                style={{
                  background: "var(--overlay-bg)",
                  border: "1px solid var(--overlay-border)",
                  boxShadow: "var(--overlay-shadow)",
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
                    className="block w-full px-4 py-3 transition-colors min-h-[48px] flex items-center"
                    style={{
                      color: locale === loc
                        ? "var(--v9-sol-green)"
                        : "var(--overlay-text)",
                    }}
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
                  border: "1px solid var(--overlay-border)",
                  borderRadius: "9999px",
                  height: "30px",
                  padding: "0 16px",
                  fontFamily: "var(--v9-mono)",
                  fontSize: "10px",
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  color: "var(--foreground)",
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
                  border: "1px solid var(--overlay-border)",
                }}
              />
            )}

            {/* Settings */}
            <Link
              href={`/${locale}/settings`}
              className={cn("v9-nav-link", isActive(`/${locale}/settings`) && "active")}
              aria-label="Settings"
              style={
                isCoursesPage || isCommunityPage
                  ? { color: "var(--c-text-muted)" }
                  : undefined
              }
            >
              <Settings className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Mobile: actions + hamburger */}
          <div className="flex items-center gap-4 md:hidden">
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
            background: "var(--overlay-bg)",
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
                    color: "var(--overlay-text-active)",
                    borderBottom: "1px solid var(--overlay-divider)",
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

            {/* Mobile admin link */}
            <Link
              href={`/${locale}/admin`}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "py-4 transition-opacity flex items-center gap-2",
                isActive(`/${locale}/admin`) ? "opacity-100" : "opacity-50 hover:opacity-80",
              )}
              style={{
                fontFamily: "var(--v9-mono)",
                fontSize: "11px",
                letterSpacing: "3px",
                textTransform: "uppercase" as const,
                color: "var(--overlay-text-active)",
                borderBottom: "1px solid var(--overlay-divider)",
              }}
            >
              <Shield className="h-3.5 w-3.5" />
              Admin
              {isActive(`/${locale}/admin`) && (
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

            {/* Mobile settings link */}
            <Link
              href={`/${locale}/settings`}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "py-4 transition-opacity flex items-center gap-2",
                isActive(`/${locale}/settings`) ? "opacity-100" : "opacity-50 hover:opacity-80",
              )}
              style={{
                fontFamily: "var(--v9-mono)",
                fontSize: "11px",
                letterSpacing: "3px",
                textTransform: "uppercase" as const,
                color: "var(--overlay-text-active)",
                borderBottom: "1px solid var(--overlay-divider)",
              }}
            >
              <Settings className="h-3.5 w-3.5" />
              Settings
              {isActive(`/${locale}/settings`) && (
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

            {/* Mobile language selector */}
            <div
              className="mt-8 flex items-center gap-4"
              style={{
                borderTop: "1px solid var(--overlay-divider)",
                paddingTop: "24px",
              }}
            >
              <Globe
                className="h-3.5 w-3.5"
                style={{ color: "var(--overlay-text)" }}
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
                        : "var(--overlay-text-active)",
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
                    border: "1px solid var(--overlay-border)",
                    borderRadius: "9999px",
                    height: "36px",
                    padding: "0 20px",
                    fontFamily: "var(--v9-mono)",
                    fontSize: "10px",
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    color: "var(--overlay-text-active)",
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
                    border: "1px solid var(--overlay-border)",
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
