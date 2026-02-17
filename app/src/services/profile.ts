import type {
  UserProfile,
  UserStats,
  Enrollment,
  ProfileUpdateData,
} from "@/types/user";
import type { ProfileService } from "./interfaces";
import { getAdminClient } from "@/lib/supabase/admin";
import {
  rowToProfile,
  rowToUserStats,
  rowToEnrollment,
} from "@/lib/supabase/mappers";

// --- Mock Implementation ---

const MOCK_PROFILE: UserProfile = {
  id: "mock-user-id",
  username: "me",
  displayName: "Developer",
  email: "dev@example.com",
  bio: "Learning Solana development at Superteam Academy",
  avatarUrl: "",
  socialLinks: { github: "dev" },
  walletAddress: "HN7c...YWrH",
  isPublic: true,
  emailNotifications: true,
  preferredLanguage: "en",
  preferredTheme: "brasil",
  createdAt: "2026-01-15T00:00:00Z",
  updatedAt: "2026-02-16T00:00:00Z",
};

const MOCK_STATS: UserStats = {
  userId: "mock-user-id",
  totalXP: 3420,
  level: 5,
  currentStreak: 12,
  longestStreak: 15,
  lastActivityDate: "2026-02-16",
  streakFreezes: 1,
  coursesCompleted: 1,
  lessonsCompleted: 18,
  challengesCompleted: 6,
  achievementFlags: [7, 0, 0, 0],
  updatedAt: "2026-02-16T00:00:00Z",
};

const MOCK_ENROLLMENTS: Enrollment[] = [
  {
    id: "enroll-1",
    userId: "mock-user-id",
    courseId: "intro-to-solana",
    enrolledAt: "2026-01-20T00:00:00Z",
    completedAt: "2026-02-10T00:00:00Z",
    progressPct: 100,
    lessonFlags: [1023, 0, 0, 0],
  },
];

class MockProfileService implements ProfileService {
  private profile = { ...MOCK_PROFILE };

  async getProfileByUsername(username: string): Promise<UserProfile | null> {
    if (username === "me" || username === this.profile.username) {
      return { ...this.profile };
    }
    return null;
  }

  async getProfileById(_userId: string): Promise<UserProfile | null> {
    return { ...this.profile };
  }

  async updateProfile(
    _userId: string,
    data: ProfileUpdateData,
  ): Promise<UserProfile> {
    Object.assign(this.profile, data, {
      updatedAt: new Date().toISOString(),
    });
    return { ...this.profile };
  }

  async checkUsernameAvailable(
    username: string,
    _excludeUserId?: string,
  ): Promise<boolean> {
    return username !== this.profile.username;
  }

  async getProfileStats(_userId: string): Promise<UserStats | null> {
    return { ...MOCK_STATS };
  }

  async getCompletedCourses(_userId: string): Promise<Enrollment[]> {
    return MOCK_ENROLLMENTS.filter((e) => e.completedAt !== null);
  }

  async ensureProfile(): Promise<void> {
    // No-op for mock
  }
}

// --- Supabase Implementation ---

class SupabaseProfileService implements ProfileService {
  private get db() {
    const client = getAdminClient();
    if (!client) throw new Error("Supabase admin client not configured");
    return client;
  }

  async getProfileByUsername(username: string): Promise<UserProfile | null> {
    const { data, error } = await this.db
      .from("profiles")
      .select("*")
      .eq("username", username)
      .single();
    if (error || !data) return null;
    return rowToProfile(data);
  }

  async getProfileById(userId: string): Promise<UserProfile | null> {
    const { data, error } = await this.db
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error || !data) return null;
    return rowToProfile(data);
  }

  async updateProfile(
    userId: string,
    data: ProfileUpdateData,
  ): Promise<UserProfile> {
    const dbData: Record<string, unknown> = {
      id: userId,
      updated_at: new Date().toISOString(),
    };
    if (data.displayName !== undefined) dbData.display_name = data.displayName;
    if (data.username !== undefined) dbData.username = data.username;
    if (data.bio !== undefined) dbData.bio = data.bio;
    if (data.avatarUrl !== undefined) dbData.avatar_url = data.avatarUrl;
    if (data.socialLinks !== undefined) dbData.social_links = data.socialLinks;
    if (data.isPublic !== undefined) dbData.is_public = data.isPublic;
    if (data.emailNotifications !== undefined)
      dbData.email_notifications = data.emailNotifications;
    if (data.preferredLanguage !== undefined)
      dbData.preferred_language = data.preferredLanguage;
    if (data.preferredTheme !== undefined)
      dbData.preferred_theme = data.preferredTheme;

    // Upsert: creates profile row if it doesn't exist yet (first save after OAuth sign-up)
    const { data: row, error } = await this.db
      .from("profiles")
      .upsert(dbData, { onConflict: "id" })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new Error("USERNAME_TAKEN");
      }
      throw error;
    }
    return rowToProfile(row);
  }

  async checkUsernameAvailable(
    username: string,
    excludeUserId?: string,
  ): Promise<boolean> {
    let query = this.db.from("profiles").select("id").eq("username", username);
    if (excludeUserId) {
      query = query.neq("id", excludeUserId);
    }
    const { data } = await query;
    return !data || data.length === 0;
  }

  async getProfileStats(userId: string): Promise<UserStats | null> {
    const { data, error } = await this.db
      .from("user_stats")
      .select("*")
      .eq("user_id", userId)
      .single();
    if (error || !data) return null;
    return rowToUserStats(data);
  }

  async getCompletedCourses(userId: string): Promise<Enrollment[]> {
    const { data, error } = await this.db
      .from("enrollments")
      .select("*")
      .eq("user_id", userId)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false });
    if (error || !data) return [];
    return data.map(rowToEnrollment);
  }

  async ensureProfile(user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    preferredTheme?: string;
    preferredLanguage?: string;
  }): Promise<void> {
    // Check if profile already exists
    const { data: existing } = await this.db
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (existing) return;

    // Create profile row
    const { error: profileError } = await this.db.from("profiles").insert({
      id: user.id,
      display_name: user.name ?? "New Learner",
      email: user.email ?? "",
      avatar_url: user.image ?? "",
      preferred_theme: user.preferredTheme ?? "brasil",
      preferred_language: user.preferredLanguage ?? "en",
    });

    if (profileError) {
      // 23505 = unique violation — another request already created it
      if (profileError.code === "23505") return;
      console.error("Failed to seed profile:", profileError);
      return;
    }

    // Create user_stats row (FK on profiles.id, so must come after profile insert)
    const { error: statsError } = await this.db.from("user_stats").insert({
      user_id: user.id,
    });

    if (statsError && statsError.code !== "23505") {
      console.error("Failed to seed user_stats:", statsError);
    }
  }
}

// --- Singleton with fallback ---

function createProfileService(): ProfileService {
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return new SupabaseProfileService();
  }
  return new MockProfileService();
}

export const profileService: ProfileService = createProfileService();
