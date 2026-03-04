"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { useWalletStore } from "@/stores/wallet-store";
import { getSupabaseBrowserClient } from "@/lib/auth/supabase-client";
import { backendClient } from "@/lib/backend/client";
import { getLearnerId } from "@/lib/learner";
import { DEFAULT_AVATAR_SRC, normalizeAvatarUrl } from "@/lib/avatar";
import { onProfileUpdated } from "@/lib/profile-sync";
import { useTheme } from "next-themes";

const localeLabels: Record<string, string> = {
  en: "English",
  "pt-BR": "Português",
  es: "Español",
};

export function PlatformLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const locale = useLocale();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const supabase = getSupabaseBrowserClient();
  
  const connected = useWalletStore((state) => state.connected);
  const walletAddress = useWalletStore((state) => state.walletAddress);
  const disconnectWallet = useWalletStore((state) => state.disconnect);
  const [authUser, setAuthUser] = useState<{ id: string; email: string | null } | null>(null);
  const [profileIdentity, setProfileIdentity] = useState<{ displayName: string; role: string; avatarUrl: string }>({
    displayName: "",
    role: "",
    avatarUrl: "",
  });
  const [authResolved, setAuthResolved] = useState(() => !supabase);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [profileSyncTick, setProfileSyncTick] = useState(0);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        const user = data.session?.user;
        setAuthUser(user ? { id: user.id, email: user.email ?? null } : null);
      })
      .finally(() => setAuthResolved(true));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      setAuthUser(user ? { id: user.id, email: user.email ?? null } : null);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  const isLoggedIn = Boolean(authUser || walletAddress);
  const protectedRoutes = useMemo(() => ["/dashboard", "/profile", "/settings"], []);
  const learnerId = useMemo(() => getLearnerId(walletAddress, authUser ?? undefined), [walletAddress, authUser]);

  useEffect(() => {
    if (!authResolved) return;
    const needsAuth = protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
    if (needsAuth && !isLoggedIn) {
      router.replace("/login");
    }
  }, [authResolved, isLoggedIn, pathname, protectedRoutes, router]);

  useEffect(() => {
    return onProfileUpdated(() => setProfileSyncTick((value) => value + 1));
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!authUser) return;
    backendClient
      .getProfile(learnerId)
      .then((profile) => {
        if (cancelled || !profile) return;
        const displayName = profile.username?.trim() || profile.displayName?.trim() || "";
        setProfileIdentity({
          displayName,
          role: profile.role?.trim() || "",
          avatarUrl: normalizeAvatarUrl(profile.avatarUrl),
        });
      })
      .catch(() => {
        if (!cancelled) setProfileIdentity({ displayName: "", role: "", avatarUrl: "" });
      });
    return () => {
      cancelled = true;
    };
  }, [authUser, learnerId, profileSyncTick]);

  const signedInLabel = useMemo(() => {
    if (profileIdentity.displayName) return profileIdentity.displayName;
    const email = authUser?.email;
    if (email) return email.split("@")[0] ?? "Builder";
    if (walletAddress) return `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;
    return "Builder";
  }, [profileIdentity.displayName, walletAddress, authUser?.email]);

  const handleSignOut = () => {
    supabase?.auth.signOut().catch(() => undefined);
    if (connected) {
      disconnectWallet().catch(() => undefined);
    }
    router.push("/");
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const navItems = isLoggedIn
    ? [
        { href: "/dashboard", label: "Dashboard", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
        { href: "/courses", label: t("courses"), icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> },
        { href: "/leaderboard", label: t("leaderboard"), icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10M18 20V4M6 20v-4"/></svg> },
        { href: "/profile", label: "Profile", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
      ]
    : [
        { href: "/courses", label: t("courses"), icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> },
        { href: "/leaderboard", label: t("leaderboard"), icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10M18 20V4M6 20v-4"/></svg> },
      ];

  return (
    <div className="platform-shell min-h-screen bg-background text-foreground flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 bg-[#050505] border-r border-white/5 z-50">
        <div className="h-[72px] flex items-center px-6 border-b border-white/5 shrink-0">
          <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
            <svg className="h-[20px] w-[20px] text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span className="font-bold tracking-[0.15em] ml-1 text-[15px] uppercase">ACADEMY</span>
          </Link>
        </div>

        <div className="p-5 border-b border-white/5">
          {authUser ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                <Image
                  src={normalizeAvatarUrl(profileIdentity.avatarUrl) || DEFAULT_AVATAR_SRC}
                  alt="avatar"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover opacity-80"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-white truncate">{signedInLabel}</p>
                <p className="text-[12px] text-white/50 truncate">{profileIdentity.role || "Pro Builder"}</p>
              </div>
            </div>
          ) : (
            <Link href="/login" className="block w-full">
              <Button variant="outline" className="w-full border-white/10 text-white hover:bg-white/5 h-10">
                Sign In
              </Button>
            </Link>
          )}
        </div>

        <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-white/30 mb-3">Menu</p>
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3.5 px-3 py-2.5 rounded-lg transition-colors capitalize tracking-tight ${active ? "bg-white/10 text-white font-medium" : "text-white/50 hover:text-white hover:bg-white/5"}`}
              >
                <span className={active ? "text-white" : "text-white/40"}>{item.icon}</span>
                <span className="text-[14px]">{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-white/5 space-y-2">
          <button
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-colors text-[14px]"
            onClick={() => setTheme((resolvedTheme ?? "dark") === "dark" ? "light" : "dark")}
          >
            <span>Theme</span>
            <span className="text-white/50" suppressHydrationWarning>{(resolvedTheme ?? "dark") === "dark" ? "Light" : "Dark"}</span>
          </button>
          <select
            className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-[13px] text-white/70 outline-none focus:border-white/30 cursor-pointer"
            value={locale}
            onChange={(event) => router.replace(pathname, { locale: event.target.value })}
          >
            {routing.locales.map((option) => (
              <option key={option} value={option} className="bg-background text-white">
                {localeLabels[option]}
              </option>
            ))}
          </select>
          {authUser && (
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors text-[14px]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Sign Out
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen md:pl-64">
        {/* Mobile Header */}
        <header className="md:hidden h-16 border-b border-white/5 flex items-center justify-between px-5 sticky top-0 bg-background/80 backdrop-blur-xl z-40">
          <Link href="/" className="flex items-center gap-2">
            <svg className="h-[20px] w-[20px] text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span className="font-bold tracking-[0.15em] ml-1 text-[15px] uppercase">ACADEMY</span>
          </Link>
          <button onClick={() => setIsMobileOpen(!isMobileOpen)} className="p-2 text-white">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isMobileOpen ? (
                <><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></>
              ) : (
                <><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="6" x2="20" y2="6"></line><line x1="4" y1="18" x2="20" y2="18"></line></>
              )}
            </svg>
          </button>
        </header>

        {/* Mobile Menu Drawer */}
        {isMobileOpen && (
          <div className="fixed inset-0 top-16 z-40 bg-background border-t border-white/5 flex flex-col md:hidden animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-colors capitalize ${active ? "bg-white/10 text-white font-medium" : "text-white/60 hover:text-white hover:bg-white/5"}`}
                    onClick={() => setIsMobileOpen(false)}
                  >
                    <span className={active ? "text-white" : "text-white/50"}>{item.icon}</span>
                    <span className="text-[16px]">{item.label}</span>
                  </Link>
                );
              })}
            </div>
            <div className="p-6 border-t border-white/5 space-y-4">
              <button
                className="w-full flex items-center justify-between rounded-xl border border-white/10 px-4 py-3 text-[15px] text-white/80"
                onClick={() => setTheme((resolvedTheme ?? "dark") === "dark" ? "light" : "dark")}
              >
                <span>Theme</span>
                <span className="text-white/50" suppressHydrationWarning>{(resolvedTheme ?? "dark") === "dark" ? "Light" : "Dark"}</span>
              </button>
              <select
                className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-[15px] text-white outline-none focus:border-white/30"
                value={locale}
                onChange={(event) => router.replace(pathname, { locale: event.target.value })}
              >
                {routing.locales.map((option) => (
                  <option key={option} value={option} className="bg-background text-white">
                    {localeLabels[option]}
                  </option>
                ))}
              </select>
              {authUser ? (
                <button 
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-colors text-[15px] font-medium"
                >
                  Sign Out
                </button>
              ) : (
                <Link href="/login" className="block w-full">
                  <Button variant="default" className="w-full h-12 text-[15px]">Sign In</Button>
                </Link>
              )}
            </div>
          </div>
        )}

        <main className="flex-1 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
