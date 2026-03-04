import { fetchWithAuth } from "./api";

export type AchievementCategory =
    | "progress"
    | "streaks"
    | "skills"
    | "community"
    | "special";

export interface AchievementType {
    key: string;
    category: AchievementCategory;
    name: string;
    description: string;
    badgeImageUrl: string;
    xpReward: number;
    supplyCap: number | null;
    mintedCount: number;
    isActive: boolean;
}

export interface AchievementReceipt {
    userId: string;
    achievementTypeKey: string;
    mintStub: {
        name: string;
        uri: string;
        minted: boolean;
        mintedAt: string;
    };
    xpAwarded: number;
    awardedAt: string;
    achievementType?: AchievementType | null;
}

export interface AchievementsResponse {
    success: boolean;
    data: AchievementReceipt[];
    total: number;
}

export interface AchievementTypesResponse {
    success: boolean;
    data: AchievementType[];
}

export const achievementsApi = {
    /**
     * Get the authenticated user's earned achievements
     */
    async getMyAchievements(): Promise<AchievementsResponse> {
        return fetchWithAuth<AchievementsResponse>("/achievements/me", { method: "GET" });
    },

    /**
     * Get all active achievement types (catalog)
     */
    async getAchievementTypes(): Promise<AchievementTypesResponse> {
        return fetchWithAuth<AchievementTypesResponse>("/achievements/types", { method: "GET" });
    },
};
