import type { UserProfile } from "@/types";

export interface ProfileService {
  getProfile(userId: string): Promise<UserProfile | null>;
  getProfileByUsername(username: string): Promise<UserProfile | null>;
  getProfileByWallet(walletAddress: string): Promise<UserProfile | null>;
  updateProfile(
    userId: string,
    data: Partial<
      Pick<
        UserProfile,
        | "username"
        | "displayName"
        | "bio"
        | "avatarUrl"
        | "socialLinks"
        | "isPublic"
        | "preferredLanguage"
        | "theme"
      >
    >,
  ): Promise<UserProfile>;
}
