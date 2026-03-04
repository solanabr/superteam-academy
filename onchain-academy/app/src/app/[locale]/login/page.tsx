"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/auth/supabase-client";

export default function LoginPage() {
  const locale = useLocale();
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const [authUser, setAuthUser] = useState<{ id: string; email: string | null } | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);

  const [oauthLoadingProvider, setOauthLoadingProvider] = useState<"github" | "google" | null>(null);

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
    return () => subscription.unsubscribe();
  }, [supabase]);

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
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
      if (error) {
        alert(`Reset email failed: ${error.message}`);
        return;
      }
      alert("Password reset email sent. Check your inbox.");
    } finally {
      setIsResetLoading(false);
    }
  };

  return (
    <div className="bg-background min-h-[calc(100vh-56px)] py-12 px-4 text-foreground">
      <div className="mx-auto max-w-[560px] rounded-[28px] bg-surface border border-white/10 p-7 md:p-8 apple-shadow">
        <p className="text-[13px] uppercase tracking-[0.14em] text-white/50 font-semibold">Authentication</p>
        <h1 className="mt-2 text-[34px] md:text-[42px] leading-[1.08] font-semibold tracking-[-0.03em] text-white">
          {isCreatingAccount ? "Create your account" : "Sign in"}
        </h1>
        <p className="mt-3 text-[14px] text-white/70">
          {isCreatingAccount
            ? "Use email/password, or continue with Google / GitHub."
            : "Welcome back. Continue with email, Google, or GitHub."}
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
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            className="h-11 w-full rounded-[14px] bg-background border border-white/10 px-3 text-[14px] text-white placeholder:text-white/30 outline-none focus:border-white/30"
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            className="h-11 w-full rounded-[14px] bg-background border border-white/10 px-3 text-[14px] text-white placeholder:text-white/30 outline-none focus:border-white/30"
          />
          <Button variant="default" className="h-11 w-full rounded-[14px]" onClick={signInWithEmailPassword} disabled={isEmailLoading}>
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

        <div className="mt-5 flex items-center gap-3 py-1">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-[11px] uppercase tracking-[0.12em] text-white/30">Or continue with</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2">
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

        {authUser && (
          <div className="mt-5 rounded-[12px] border border-white/10 bg-background px-4 py-3">
            <p className="text-[13px] text-white/70">
              Signed in as {authUser.email ?? authUser.id}
            </p>
            <Button variant="default" className="mt-3 h-9 rounded-[10px]" onClick={() => router.push("/courses")}>
              Go to courses
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

