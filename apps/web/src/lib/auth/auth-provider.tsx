"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export interface UserProfile {
  username: string;
  avatar_url: string | null;
  wallet_address: string | null;
}

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  userId: string | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const PROFILE_COLUMNS = "username, avatar_url, wallet_address";

// Single state object — ensures ONE render per state transition.
// Three separate useState calls would cause three render cycles,
// which is exactly the staggered flash we're eliminating.
interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    isLoading: true,
  });
  const userRef = useRef<User | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function initialize() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;

        const currentProfile = currentUser
          ? await supabase
              .from("profiles")
              .select(PROFILE_COLUMNS)
              .eq("id", currentUser.id)
              .single()
              .then((r) => r.data as UserProfile | null)
          : null;

        if (cancelled) return;

        userRef.current = currentUser;
        setState({
          user: currentUser,
          profile: currentProfile,
          isLoading: false,
        });
      } catch {
        if (!cancelled) {
          setState({ user: null, profile: null, isLoading: false });
        }
      }
    }

    initialize();

    // IMPORTANT: This callback must NOT be async.
    // During initialization, GoTrue awaits all onAuthStateChange callbacks.
    // An async callback that calls supabase.from() would deadlock because the
    // Postgrest client internally calls getSession(), which awaits initializePromise.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ?? null;

      if (!newUser) {
        if (!cancelled) {
          userRef.current = null;
          setState({ user: null, profile: null, isLoading: false });
        }
        return;
      }

      // Fire profile fetch immediately, commit both together
      Promise.resolve(
        supabase
          .from("profiles")
          .select(PROFILE_COLUMNS)
          .eq("id", newUser.id)
          .single()
      )
        .then(({ data }) => {
          if (!cancelled) {
            userRef.current = newUser;
            setState({
              user: newUser,
              profile: (data as UserProfile) ?? null,
              isLoading: false,
            });
          }
        })
        .catch(() => {
          if (!cancelled) {
            userRef.current = newUser;
            setState({ user: newUser, profile: null, isLoading: false });
          }
        });
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = useCallback(async () => {
    const currentUser = userRef.current;
    if (!currentUser) return;

    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("id", currentUser.id)
      .single();

    // Handles null gracefully — covers first-time OAuth users
    // before their profile row is created.
    setState((prev) => ({ ...prev, profile: (data as UserProfile) ?? null }));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: state.user,
      profile: state.profile,
      userId: state.user?.id ?? null,
      isLoading: state.isLoading,
      refreshProfile,
    }),
    [state, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
