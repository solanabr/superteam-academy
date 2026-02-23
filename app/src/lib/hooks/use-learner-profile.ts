"use client";

/**
 * LearnerProfile account was removed in the program rewrite.
 * This stub preserves the hook API so existing consumers don't break.
 * Streak/achievement data is no longer stored on-chain in this program version.
 */
export function useLearnerProfile() {
  return {
    profile: null,
    loading: false,
    exists: false,
    refresh: async () => {},
  };
}
