import { getCourseCards } from "@/lib/courses";
import { getAdminClient } from "@/lib/supabase/admin";
import type { CourseRecommendation, OnboardingService } from "./interfaces";

const INTEREST_TO_TRACK: Record<string, string[]> = {
  defi: ["DeFi", "defi"],
  nft: ["NFT", "nft", "Art"],
  web3: ["Frontend", "Full-Stack", "web3", "fullstack"],
  programs: ["Core", "Solana", "Programs", "solana-core"],
};

const BADGE_LABELS = ["Start Here", "Recommended", "Popular", "Deep Dive"];

class DefaultOnboardingService implements OnboardingService {
  private get db() {
    const client = getAdminClient();
    if (!client) throw new Error("Supabase not configured");
    return client;
  }

  async isOnboarded(userId: string): Promise<boolean> {
    const { data } = await this.db
      .from("profiles")
      .select("onboarded")
      .eq("id", userId)
      .single();
    return data?.onboarded === true;
  }

  async completeOnboarding(userId: string): Promise<void> {
    await this.db
      .from("profiles")
      .update({ onboarded: true })
      .eq("id", userId);
  }

  async getRecommendations(params: {
    experienceLevel: string;
    web3Level: string;
    interest: string;
  }): Promise<CourseRecommendation[]> {
    const courses = await getCourseCards();

    // Map experience level to difficulty filter
    const difficultyMap: Record<string, string[]> = {
      beginner: ["beginner"],
      intermediate: ["beginner", "intermediate"],
      advanced: ["intermediate", "advanced"],
    };
    const allowedDifficulties = difficultyMap[params.experienceLevel] ?? ["beginner"];

    // Filter by difficulty
    let filtered = courses.filter((c) =>
      allowedDifficulties.includes(c.difficulty),
    );

    // Filter by interest/track
    const trackKeywords = INTEREST_TO_TRACK[params.interest] ?? [];
    if (trackKeywords.length > 0) {
      const trackFiltered = filtered.filter((c) =>
        trackKeywords.some(
          (kw) =>
            c.trackName?.toLowerCase().includes(kw.toLowerCase()) ||
            c.title?.toLowerCase().includes(kw.toLowerCase()),
        ),
      );
      if (trackFiltered.length > 0) {
        filtered = trackFiltered;
      }
      // If no matches, keep the difficulty-filtered list (progressive relaxation)
    }

    // If still too few, fall back to all courses sorted by difficulty
    if (filtered.length < 2) {
      filtered = courses.slice(0, 4);
    }

    return filtered.slice(0, 4).map((c, i) => ({
      title: c.title,
      slug: c.slug,
      difficulty: c.difficulty,
      trackName: c.trackName ?? "",
      totalXP: c.totalXP,
      badge: BADGE_LABELS[i] ?? "Recommended",
    }));
  }
}

export const onboardingService: OnboardingService = new DefaultOnboardingService();
