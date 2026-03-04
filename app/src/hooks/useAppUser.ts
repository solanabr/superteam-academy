"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useUserStore } from "@/store/user-store";
import type { AppUser } from "@/store/user-store";

export type AppUserRole = "student" | "professor" | "admin";

/**
 * Thin read-only wrapper around useUserStore + Privy.
 * Returns the current user from the Zustand store.
 * 
 * IMPORTANT: This hook does NOT call setUser or fetchUser.
 * User creation/fetching is handled by SyncUserOnLogin and AuthGuard.
 * This hook is purely a consumer of the store state.
 */
export function useAppUser(): { user: AppUser | null; role: AppUserRole | null; isLoading: boolean } {
  const { authenticated } = usePrivy();

  const user = useUserStore((s) => s.user);
  const isLoading = useUserStore((s) => s.isLoading);

  // If not authenticated, return null without mutating the store
  if (!authenticated) {
    return { user: null, role: null, isLoading: false };
  }

  const role = user?.role as AppUserRole | undefined;
  return {
    user,
    role: role && ["student", "professor", "admin"].includes(role) ? role : null,
    isLoading,
  };
}

