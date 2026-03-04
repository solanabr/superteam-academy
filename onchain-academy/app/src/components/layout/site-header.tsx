"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { useWalletStore } from "@/stores/wallet-store";
import { syncAuthIdentity } from "@/lib/auth/sync-auth";
import { getSupabaseBrowserClient } from "@/lib/auth/supabase-client";
import { useTheme } from "next-themes";

const localeLabels: Record<string, string> = {
  en: "EN",
  "pt-BR": "PT",
  es: "ES",
};

export function SiteHeader() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const locale = useLocale();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const supabase = getSupabaseBrowserClient();
  const connected = useWalletStore((state) => state.connected);
  const disconnectWallet = useWalletStore((state) => state.disconnect);
  const [authUser, setAuthUser] = useState<{ id: string; email: string | null } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [oauthLoadingProvider, setOauthLoadingProvider] = useState<"github" | "google" | null>(null);

  const isActive = (href: string) => pathname === href;
  const isLanding = pathname === "/";

  const signedInLabel = useMemo(() => {
    const email = authUser?.email;
    if (email) return email.split("@")[0] ?? "Builder";
    return "Builder";
  }, [authUser?.email]);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      setAuthUser(user ? { id: user.id, email: user.email ?? null } : null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      setAuthUser(user ? { id: user.id, email: user.email ?? null } : null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!authUser) return;
    syncAuthIdentity({
      authUser: authUser,
      walletAddress: null,
      authMethod: "supabase",
    }).catch(() => undefined);
  }, [authUser]);

  const signInWithSupabaseProvider = async (provider: "github" | "google") => {
    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/${locale}/courses` : undefined;
    if (!redirectTo) return;
    if (!supabase) {
      alert("Supabase auth is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }
    setOauthLoadingProvider(provider);
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
      if (error) {
        alert(`Sign in failed: ${error.message}`);
        setOauthLoadingProvider(null);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      alert(`Sign in failed: ${message}`);
      setOauthLoadingProvider(null);
    }
  };
  const signInWithEmailPassword = async () => {
    if (!supabase) {
      alert("Supabase auth is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }
    if (!email.trim() || !password) {
      alert("Enter your email and password.");
      return;
    }
    setIsEmailLoading(true);
    try {
      if (isCreatingAccount) {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (error) {
          alert(`Account creation failed: ${error.message}`);
          return;
        }
        alert("Account created. If email confirmation is enabled, check your inbox.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) {
          alert(`Sign in failed: ${error.message}`);
          return;
        }
        router.push("/courses");
      }
      setShowAuthModal(false);
      setPassword("");
    } finally {
      setIsEmailLoading(false);
    }
  };
  const sendPasswordReset = async () => {
    if (!supabase) {
      alert("Supabase auth is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }
    if (!email.trim()) {
      alert("Enter your account email first.");
      return;
    }
    setIsResetLoading(true);
    try {
      const redirectTo =
        typeof window !== "undefined" ? `${window.location.origin}/${locale}/auth/reset-password` : undefined;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });
      if (error) {
        alert(`Reset email failed: ${error.message}`);
        return;
      }
      alert("Password reset email sent. Check your inbox.");
    } finally {
      setIsResetLoading(false);
    }
  };
  const handleSignInClick = () => {
    router.push("/login");
  };

  const handleSignOut = () => {
    supabase?.auth.signOut().catch(() => undefined);
    if (connected) {
      disconnectWallet().catch(() => undefined);
    }
    router.push("/");
  };

  const headerClass = "sticky top-0 z-50 w-full glass-nav border-b border-white/10 relative";

  const linkClass = (href: string) => {
    return isActive(href) ? "text-white font-semibold" : "text-white/70 hover:text-white";
  };

  const textClass = "text-white";
  const selectClass = "bg-transparent text-[12px] text-white/70 hover:text-white outline-none cursor-pointer";

  if (isLanding) {
    return null;
  }

  return (
    <header className={headerClass}>
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5 md:px-12 text-[14px] font-medium">
        
        {/* Logo */}
        <Link href="/" className={`flex items-center gap-2 transition-opacity hover:opacity-70 ${textClass}`} onClick={() => setMobileMenuOpen(false)}>
          <svg className="h-[20px] w-[20px]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          <span className="font-bold tracking-[0.15em] ml-1 text-[15px] uppercase hidden sm:inline-block">ACADEMY</span>
        </Link>

        {/* Center Nav */}
        {!isLanding && (
          <nav className="hidden lg:flex items-center gap-10">
            {[
              { href: "/courses", label: t("courses") },
              { href: "/dashboard", label: "Dashboard" },
              { href: "/profile", label: "Profile" },
              { href: "/leaderboard", label: t("leaderboard") },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`transition-colors capitalize tracking-tight ${linkClass(href)}`}
              >
                {label}
              </Link>
            ))}
          </nav>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-4 md:gap-6">
          {!isLanding && (
            <select
              className={selectClass}
              value={locale}
              onChange={(event) => router.replace(pathname, { locale: event.target.value })}
            >
              {routing.locales.map((option) => (
                <option key={option} value={option} className="text-black">
                  {localeLabels[option]}
                </option>
              ))}
            </select>
          )}
          <button
            className="text-[12px] rounded-full border border-white/20 px-2.5 py-1 text-white/80 hover:text-white hover:border-white/40 transition-colors"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {resolvedTheme === "dark" ? "Light" : "Dark"}
          </button>
          
          <div className={`${isLanding ? "flex" : "hidden sm:flex"} items-center gap-4 md:gap-6`}>
            {Boolean(authUser) ? (
              <>
                <Link href="/dashboard" className={`capitalize tracking-tight ${linkClass("/dashboard")}`}>
                  {signedInLabel}
                </Link>
                <button
                  className={`font-semibold capitalize tracking-tight transition-colors ${isLanding ? "text-white/70 hover:text-white" : "text-foreground/70 hover:text-foreground"}`}
                  onClick={handleSignOut}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <button
                  className={`font-semibold capitalize tracking-tight transition-colors ${isLanding ? "text-white/70 hover:text-white" : "text-foreground/70 hover:text-foreground"}`}
                  onClick={handleSignInClick}
                >
                  Sign in
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          {!isLanding && (
            <button
              className={`lg:hidden p-1 ${textClass}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {mobileMenuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </>
                ) : (
                  <>
                    <line x1="4" y1="12" x2="20" y2="12"></line>
                    <line x1="4" y1="6" x2="20" y2="6"></line>
                    <line x1="4" y1="18" x2="20" y2="18"></line>
                  </>
                )}
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="absolute top-16 left-0 w-full bg-black/95 backdrop-blur-xl border-b border-white/10 p-6 flex flex-col gap-6 lg:hidden animate-in fade-in slide-in-from-top-4 duration-200">
          {!isLanding && (
            <>
              <nav className="flex flex-col gap-4">
                {[
                  { href: "/courses", label: t("courses") },
                  { href: "/dashboard", label: "Dashboard" },
                  { href: "/profile", label: "Profile" },
                  { href: "/leaderboard", label: t("leaderboard") },
                ].map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="text-[18px] font-medium text-white/90 hover:text-white transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
              <div className="h-px w-full bg-white/10" />
            </>
          )}
          
          <div className="flex flex-col gap-4">
            {Boolean(authUser) ? (
              <>
                <Link 
                  href="/dashboard" 
                  className="text-[16px] font-medium text-white/90 hover:text-white transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {signedInLabel}
                </Link>
                <button
                  className="text-left text-[16px] font-medium text-white/70 hover:text-white transition-colors"
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <button
                  className="text-left text-[16px] font-medium text-white/90 hover:text-white transition-colors"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignInClick();
                  }}
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {showAuthModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-[24px] bg-surface border border-white/10 p-6 apple-shadow text-white normal-case tracking-normal">
            <h3 className="text-[24px] font-semibold tracking-[-0.02em] text-white">
              {isCreatingAccount ? "Create account" : "Sign in"}
            </h3>
            <p className="mt-2 text-[14px] text-white/70">
              {isCreatingAccount
                ? "Create your account with email/password, or continue with Google / GitHub."
                : "Use your email and password, or continue with Google / GitHub."}
            </p>
            <div className="mt-4 grid grid-cols-2 rounded-[12px] border border-white/10 bg-background p-1">
              <button
                onClick={() => setIsCreatingAccount(false)}
                className={`h-9 rounded-[10px] text-[13px] font-semibold transition-colors ${
                  !isCreatingAccount ? "bg-white text-black" : "text-white/60 hover:text-white"
                }`}
              >
                Sign in
              </button>
              <button
                onClick={() => setIsCreatingAccount(true)}
                className={`h-9 rounded-[10px] text-[13px] font-semibold transition-colors ${
                  isCreatingAccount ? "bg-white text-black" : "text-white/60 hover:text-white"
                }`}
              >
                Create account
              </button>
            </div>
            <div className="mt-5 space-y-3">
              <div className="space-y-2">
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email"
                  className="h-10 w-full rounded-[12px] bg-background border border-white/10 px-3 text-[14px] text-white placeholder:text-white/30 outline-none focus:border-white/30"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password"
                  className="h-10 w-full rounded-[12px] bg-background border border-white/10 px-3 text-[14px] text-white placeholder:text-white/30 outline-none focus:border-white/30"
                />
                <Button
                  variant="default"
                  size="sm"
                  className="h-10 w-full rounded-[12px]"
                  onClick={signInWithEmailPassword}
                  disabled={isEmailLoading}
                >
                  {isEmailLoading ? "Please wait..." : isCreatingAccount ? "Create account" : "Sign in"}
                </Button>
                <button
                  onClick={sendPasswordReset}
                  className="text-[12px] text-white/50 hover:text-white disabled:opacity-60"
                  disabled={isResetLoading}
                >
                  {isResetLoading ? "Sending reset email..." : "Forgot password?"}
                </button>
              </div>
              <div className="flex items-center gap-3 py-1">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-[11px] uppercase tracking-[0.12em] text-white/30">Or continue with</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>
              <div className="grid grid-cols-1 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 justify-start border-white/10 text-white hover:bg-white/5"
                  onClick={() => signInWithSupabaseProvider("google")}
                  disabled={oauthLoadingProvider !== null}
                >
                  {oauthLoadingProvider === "google" ? "Redirecting to Google..." : "Continue with Google"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 justify-start border-white/10 text-white hover:bg-white/5"
                  onClick={() => signInWithSupabaseProvider("github")}
                  disabled={oauthLoadingProvider !== null}
                >
                  {oauthLoadingProvider === "github" ? "Redirecting to GitHub..." : "Continue with GitHub"}
                </Button>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowAuthModal(false)} className="text-white hover:bg-white/10">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
