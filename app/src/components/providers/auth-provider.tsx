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
  signOut: () => Promise<void>;
  linkWallet: () => Promise<void>;
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

  const fetchProfile = useCallback(
    async (userId: string) => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (data) {
        const userProfile: UserProfile = {
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
        };
        setProfile(userProfile);
        setUser(userProfile);
        return userProfile;
      }
      return null;
    },
    [supabase, setUser]
  );

  const ensureProfile = useCallback(
    async (authUser: User) => {
      const existing = await fetchProfile(authUser.id);
      if (existing) return existing;

      // Create profile if it doesn't exist
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
            is_public: true,
            preferred_language: "en",
            theme: "light",
          },
          { onConflict: "id" }
        )
        .select()
        .single();

      if (data) {
        return fetchProfile(authUser.id);
      }
      return null;
    },
    [supabase, fetchProfile]
  );

  // Listen for auth changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setAuthUser(newSession?.user ?? null);

      if (newSession?.user) {
        await ensureProfile(newSession.user);
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
        await ensureProfile(s.user);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
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
    await supabase.auth.signOut();
    setProfile(null);
    setUser(null);
    setAuthUser(null);
    setSession(null);
  };

  const linkWallet = async () => {
    if (!publicKey || !user || !signMessage) return;

    const walletAddress = publicKey.toBase58();

    // Sign a message to prove ownership
    const message = new TextEncoder().encode(
      `Link wallet ${walletAddress} to Superteam Academy account ${user.id}`
    );

    try {
      const signature = await signMessage(message);

      // Store the wallet link
      await supabase
        .from("profiles")
        .update({ wallet_address: walletAddress })
        .eq("id", user.id);

      // Store wallet-user mapping
      await supabase.from("wallet_links").upsert(
        {
          user_id: user.id,
          wallet_address: walletAddress,
          signature: Buffer.from(signature).toString("base64"),
          linked_at: new Date().toISOString(),
        },
        { onConflict: "wallet_address" }
      );

      await fetchProfile(user.id);
    } catch {
      // User rejected signature
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
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
        signOut,
        linkWallet,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
