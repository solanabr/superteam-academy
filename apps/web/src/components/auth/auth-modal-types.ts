/**
 * Types shared by the auth modal and the two button modules it composes.
 * Their own home would be `auth-modal.tsx`, but the body imports them and
 * `auth-modal.tsx` imports the body — a plain type module breaks the cycle
 * and stays free of any runtime import.
 */
export type AuthLoadingMethod = "solana" | "google" | "github" | null;

/** The two providers offered through both the Dynamic and Supabase rails. */
export type SocialProvider = "google" | "github";
