"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useAppStore } from "@/stores/app-store";
import type { UserProfile } from "@/types";
import type { User, Session } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  walletLinked: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  signInWithWallet: () => Promise<void>;
  linkWallet: () => Promise<void>;
  unlinkWallet: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

interface ProfileRow {
  id: string;
  wallet_address: string | null;
  email: string | null;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  social_links: Record<string, string> | null;
  created_at: string;
  is_public: boolean | null;
  preferred_language: string | null;
  theme: string | null;
  onboarding_completed: boolean | null;
}

function mapRowToProfile(data: ProfileRow): UserProfile {
  return {
    id: data.id,
    walletAddress: data.wallet_address,
    email: data.email,
    username: data.username ?? data.id.slice(0, 8),
    displayName: data.display_name ?? "Learner",
    bio: data.bio ?? "",
    avatarUrl: data.avatar_url,
    socialLinks: data.social_links ?? {},
    joinedAt: data.created_at,
    isPublic: data.is_public ?? true,
    preferredLanguage: data.preferred_language ?? "en",
    theme: (data.theme as UserProfile["theme"]) ?? "light",
    onboardingCompleted: data.onboarding_completed ?? false,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = createSupabaseBrowserClient();
  const { publicKey, signMessage } = useWallet();
  const { setUser } = useAppStore();

  const [user, setAuthUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initializedRef = useRef(false);

  const isAuthenticated = !!user;
  const walletLinked = !!profile?.walletAddress;

  const applyProfile = useCallback(
    (p: UserProfile) => {
      setProfile(p);
      setUser(p);
    },
    [setUser]
  );

  const fetchProfile = useCallback(
    async (userId: string): Promise<UserProfile | null> => {
      // Try browser Supabase client first (fastest, no server round-trip)
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (data) {
        const p = mapRowToProfile(data);
        applyProfile(p);
        return p;
      }

      // Fallback: server API (handles wallet-auth cookie sessions)
      if (error || !data) {
        try {
          const res = await fetch("/api/profile");
          if (res.ok) {
            const { profile: row } = await res.json();
            if (row && row.id === userId) {
              const p = mapRowToProfile(row);
              applyProfile(p);
              return p;
            }
          }
        } catch {
          // Both methods failed
        }
      }

      return null;
    },
    [supabase, applyProfile]
  );

  const ensureProfile = useCallback(
    async (authUser: User) => {
      const existing = await fetchProfile(authUser.id);
      if (existing) return existing;

      // Profile doesn't exist yet — create it
      // Try server fallback first (admin client bypasses RLS, most reliable)
      try {
        const res = await fetch("/api/auth/ensure-profile", { method: "POST" });
        if (res.ok) {
          const created = await fetchProfile(authUser.id);
          if (created) return created;
        }
      } catch {
        // Server unavailable
      }

      // Last resort: client-side upsert
      const username =
        authUser.user_metadata?.preferred_username ??
        authUser.user_metadata?.user_name ??
        authUser.email?.split("@")[0] ??
        authUser.id.slice(0, 8);

      const { data } = await supabase
        .from("profiles")
        .upsert(
          {
            id: authUser.id,
            email: authUser.email,
            username,
            display_name:
              authUser.user_metadata?.full_name ??
              authUser.user_metadata?.name ??
              username,
            avatar_url: authUser.user_metadata?.avatar_url ?? null,
            wallet_address: authUser.user_metadata?.wallet_address ?? null,
            is_public: true,
            preferred_language: "en",
            theme: "light",
          },
          { onConflict: "id" }
        )
        .select()
        .single();

      if (data) {
        const p = mapRowToProfile(data);
        applyProfile(p);
        return p;
      }

      console.error("[Auth] All profile creation attempts failed for user:", authUser.id);
      return null;
    },
    [supabase, fetchProfile, applyProfile]
  );

  // Bootstrap session + listen for changes
  useEffect(() => {
    let cancelled = false;

    // Safety timeout — ensure isLoading resolves even if profile fetch hangs
    const safetyTimeout = setTimeout(() => {
      if (!cancelled) setIsLoading(false);
    }, 5000);

    // 1) Bootstrap: get existing session (fast, uses cookies)
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (cancelled) return;
      setSession(s);
      setAuthUser(s?.user ?? null);
      if (s?.user) {
        await ensureProfile(s.user).catch(() => {});
      }
      initializedRef.current = true;
      if (!cancelled) setIsLoading(false);
    });

    // 2) Listen for subsequent auth events (sign-in, sign-out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (cancelled) return;
      // Skip initial event if we already bootstrapped
      if (!initializedRef.current) return;

      setSession(newSession);
      setAuthUser(newSession?.user ?? null);

      if (newSession?.user) {
        // Only re-fetch profile on actual sign-in, not token refreshes
        if (event === "SIGNED_IN") {
          await ensureProfile(newSession.user).catch(() => {});
        }
      } else {
        setProfile(null);
        setUser(null);
      }
    });

    return () => {
      cancelled = true;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, [supabase, ensureProfile, setUser]);

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
  };

  const signInWithGithub = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
  };

  const signOut = async () => {
    setProfile(null);
    setUser(null);
    setAuthUser(null);
    setSession(null);

    // Clear Supabase cookies manually to prevent auto-relogin
    document.cookie.split(";").forEach((c) => {
      const name = c.trim().split("=")[0];
      if (name.includes("supabase") || name.includes("sb-")) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      }
    });

    // Await signOut with a timeout so it doesn't hang forever
    try {
      await Promise.race([
        supabase.auth.signOut(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), 3000)
        ),
      ]);
    } catch {
      // Timeout or error — cookies already cleared above
    }

    if (window.location.pathname === "/") {
      window.location.reload();
    } else {
      window.location.href = "/";
    }
  };

  const signInWithWallet = async () => {
    if (!publicKey || !signMessage) {
      throw new Error("Wallet not connected or does not support message signing");
    }

    const walletAddress = publicKey.toBase58();
    const timestamp = Date.now();
    const msg = `Sign in to Superteam Academy with wallet ${walletAddress} at ${timestamp}`;
    const messageBytes = new TextEncoder().encode(msg);

    const signature = await signMessage(messageBytes);

    // Encode signature as base58
    const bs58 = await import("bs58");
    const signatureB58 = bs58.default.encode(signature);

    const res = await fetch("/api/auth/wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        walletAddress,
        signature: signatureB58,
        message: msg,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? "Wallet auth failed");
    }

    // Session cookies set server-side — redirect like OAuth callback
    window.location.href = "/dashboard";
  };

  const linkWallet = async () => {
    if (!publicKey || !signMessage) {
      throw new Error("Wallet not connected or does not support message signing");
    }
    if (!user) {
      throw new Error("Must be signed in to link a wallet");
    }

    const walletAddress = publicKey.toBase58();
    const timestamp = Date.now();
    const msg = `Link wallet ${walletAddress} to Superteam Academy account at ${timestamp}`;
    const messageBytes = new TextEncoder().encode(msg);
    const signature = await signMessage(messageBytes);

    const bs58 = await import("bs58");
    const signatureB58 = bs58.default.encode(signature);

    const res = await fetch("/api/auth/link-wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        walletAddress,
        signature: signatureB58,
        message: msg,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? "Failed to link wallet");
    }

    await refreshProfile();
  };

  const unlinkWallet = async () => {
    if (!user) {
      throw new Error("Must be signed in to unlink a wallet");
    }

    const res = await fetch("/api/auth/unlink-wallet", { method: "POST" });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? "Failed to unlink wallet");
    }

    // Optimistically clear wallet from local state so UI updates immediately
    if (profile) {
      applyProfile({ ...profile, walletAddress: null });
    }

    // Best-effort full refresh from server
    await refreshProfile().catch(() => {});
  };

  const refreshProfile = async () => {
    if (!user) return;
    await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isAuthenticated,
        walletLinked,
        signInWithGoogle,
        signInWithGithub,
        signInWithWallet,
        linkWallet,
        unlinkWallet,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
