import { fetchWithAuth } from "./api";

export interface ProfileData {
    profile: {
        id: string;
        username: string | null;
        email?: string | null;
        name: string | null;
        bio: string | null;
        avatar: string | null;
        twitter: string | null;
        github: string | null;
        discord: string | null;
        website: string | null;
        language?: string;
        theme?: string;
        isPublic?: boolean;
        level: number;
        currentStreak: number;
        longestStreak: number;
        lastActive: string | null;
        createdAt: string;
        updatedAt?: string;
    };
    xp: {
        total: number;
        locked?: number;
        progressPercent?: number;
        level?: number;
    };
}

export interface ProfileResponse {
    success: boolean;
    data: ProfileData;
}

export const profileApi = {
    /**
     * Get the authenticated user's profile
     */
    async getMe(): Promise<ProfileResponse> {
        return fetchWithAuth<ProfileResponse>("/profile/me", { method: "GET" });
    },

    /**
     * Update the authenticated user's profile
     */
    async updateMe(data: Partial<ProfileData["profile"]>): Promise<ProfileResponse> {
        return fetchWithAuth<ProfileResponse>("/profile/me", {
            method: "PUT",
            body: JSON.stringify(data),
        });
    },

    /**
     * Get a user's public profile by username
     */
    async getPublicProfile(username: string): Promise<ProfileResponse> {
        return fetchWithAuth<ProfileResponse>(`/profile/${username}`, { method: "GET" });
    }
};
