"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
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
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = createSupabaseBrowserClient();
  const { publicKey, signMessage, connected } = useWallet();
  const { setUser } = useAppStore();

  const [user, setAuthUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;
  const walletLinked = !!profile?.walletAddress;

  const mapRowToProfile = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (data: any): UserProfile => ({
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
      theme: data.theme ?? "light",
    }),
    []
  );

  const fetchProfile = useCallback(
    async (userId: string) => {
      // Try server API first (reliable for wallet-authenticated users)
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const { profile: row } = await res.json();
          if (row && row.id === userId) {
            const userProfile = mapRowToProfile(row);
            setProfile(userProfile);
            setUser(userProfile);
            return userProfile;
          }
        }
      } catch {
        // Server API unavailable — fall through to browser client
      }

      // Fallback: browser client (works for OAuth users)
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("[Auth] Failed to fetch profile:", error.message);
      }

      if (data) {
        const userProfile = mapRowToProfile(data);
        setProfile(userProfile);
        setUser(userProfile);
        return userProfile;
      }
      return null;
    },
    [supabase, setUser, mapRowToProfile]
  );

  const ensureProfile = useCallback(
    async (authUser: User) => {
      const existing = await fetchProfile(authUser.id);
      if (existing) return existing;

      // Try client-side upsert first
      const username =
        authUser.user_metadata?.preferred_username ??
        authUser.user_metadata?.user_name ??
        authUser.email?.split("@")[0] ??
        authUser.id.slice(0, 8);

      const { data, error } = await supabase
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

      if (error || !data) {
        console.error("[Auth] Client upsert failed, trying server fallback:", error?.message ?? "no data returned");
        // Fallback: ask the server to create the profile (admin client bypasses RLS)
        try {
          const res = await fetch("/api/auth/ensure-profile", { method: "POST" });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            console.error("[Auth] Server ensure-profile returned", res.status, body);
          }
        } catch (fetchErr) {
          console.error("[Auth] Server ensure-profile network error:", fetchErr);
        }
        const retryProfile = await fetchProfile(authUser.id);
        if (retryProfile) return retryProfile;
        return null;
      }

      return fetchProfile(authUser.id);
    },
    [supabase, fetchProfile]
  );

  // Listen for auth changes
  useEffect(() => {
    // Safety timeout — ensure isLoading resolves even if profile fetch hangs
    const safetyTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setAuthUser(newSession?.user ?? null);

      if (newSession?.user) {
        try {
          await ensureProfile(newSession.user);
        } catch {
          // Profile fetch failed — continue without profile
        }
      } else {
        setProfile(null);
        setUser(null);
      }
      setIsLoading(false);
    });

    // Initial session check
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      setSession(s);
      setAuthUser(s?.user ?? null);
      if (s?.user) {
        try {
          await ensureProfile(s.user);
        } catch {
          // Profile fetch failed — continue without profile
        }
      }
      setIsLoading(false);
    });

    return () => {
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
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
