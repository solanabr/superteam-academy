import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sanityClient } from "@/lib/sanity/client";
import { isAdminWallet } from "@/lib/admin";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function verifyAdmin(req: NextRequest): Promise<string | null> {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("wallet_address")
    .eq("id", user.id)
    .single();

  const wallet = profile?.wallet_address;
  if (!wallet || !isAdminWallet(wallet)) return null;
  return wallet;
}

/**
 * GET /api/admin/analytics
 * Returns comprehensive platform analytics. Admin only.
 */
export async function GET(req: NextRequest) {
  try {
    const adminWallet = await verifyAdmin(req);
    if (!adminWallet) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Parallel fetches for all analytics data
    const [
      profilesResult,
      recentProfilesResult,
      courseProgressResult,
      activitiesResult,
      recentActivitiesResult,
      streaksResult,
      achievementsResult,
      commentsResult,
      sanityCoursesResult,
    ] = await Promise.all([
      // All profiles
      supabaseAdmin
        .from("profiles")
        .select("id, username, display_name, avatar_url, wallet_address, created_at, onboarding_completed"),

      // Profiles created in last 30 days
      supabaseAdmin
        .from("profiles")
        .select("id, created_at")
        .gte("created_at", thirtyDaysAgo),

      // All course progress records
      supabaseAdmin
        .from("course_progress")
        .select("id, user_id, course_id, completed_lessons, total_lessons, is_completed, is_finalized, xp_earned, enrolled_at, completed_at"),

      // All activities
      supabaseAdmin
        .from("activities")
        .select("id, user_id, type, title, xp, course_id, lesson_index, created_at"),

      // Recent activities (30 days)
      supabaseAdmin
        .from("activities")
        .select("id, user_id, type, xp, course_id, created_at")
        .gte("created_at", thirtyDaysAgo)
        .order("created_at", { ascending: false }),

      // All streaks
      supabaseAdmin
        .from("streaks")
        .select("id, user_id, current_streak, longest_streak, last_activity_date"),

      // All user achievements
      supabaseAdmin
        .from("user_achievements")
        .select("id, user_id, achievement_id, earned_at"),

      // All comments
      supabaseAdmin
        .from("comments")
        .select("id, user_id, course_id, created_at"),

      // Sanity courses for mapping IDs to titles
      sanityClient.fetch<
        { _id: string; courseId: string | null; title: string; slug: string; difficulty: number; trackId: number; lessonCount: number; status: string; isActive: boolean | null; xpPerLesson: number }[]
      >(
        `*[_type == "course"]{ _id, courseId, title, "slug": slug.current, difficulty, trackId, lessonCount, status, isActive, xpPerLesson }`,
      ),
    ]);

    const profiles = profilesResult.data ?? [];
    const recentProfiles = recentProfilesResult.data ?? [];
    const courseProgress = courseProgressResult.data ?? [];
    const activities = activitiesResult.data ?? [];
    const recentActivities = recentActivitiesResult.data ?? [];
    const streaks = streaksResult.data ?? [];
    const achievements = achievementsResult.data ?? [];
    const comments = commentsResult.data ?? [];
    const sanityCourses = sanityCoursesResult ?? [];

    // ─── Platform Overview ─────────────────────────────
    const totalUsers = profiles.length;
    const newUsersLast30Days = recentProfiles.length;
    const usersWithWallet = profiles.filter((p) => p.wallet_address).length;
    const onboardedUsers = profiles.filter((p) => p.onboarding_completed).length;
    const totalEnrollments = courseProgress.length;
    const totalCompletions = courseProgress.filter((cp) => cp.is_completed).length;
    const totalFinalizations = courseProgress.filter((cp) => cp.is_finalized).length;
    const totalXpEarned = courseProgress.reduce((sum, cp) => sum + (cp.xp_earned ?? 0), 0);
    const totalLessonsCompleted = courseProgress.reduce(
      (sum, cp) => sum + (cp.completed_lessons?.length ?? 0),
      0,
    );
    const totalAchievementsEarned = achievements.length;
    const totalComments = comments.length;
    const completionRate =
      totalEnrollments > 0
        ? Math.round((totalCompletions / totalEnrollments) * 100)
        : 0;

    // ─── Course Statistics ─────────────────────────────
    const courseStats = sanityCourses.map((course) => {
      // Match by courseId (on-chain ID used by enrollment), slug, or _id (Sanity internal ID)
      const enrollments = courseProgress.filter(
        (cp) =>
          (course.courseId && cp.course_id === course.courseId) ||
          cp.course_id === course.slug ||
          cp.course_id === course._id,
      );
      const completions = enrollments.filter((cp) => cp.is_completed);
      const avgProgress =
        enrollments.length > 0
          ? Math.round(
              enrollments.reduce((sum, cp) => {
                const total = cp.total_lessons || course.lessonCount || 1;
                const completed = cp.completed_lessons?.length ?? 0;
                return sum + (completed / total) * 100;
              }, 0) / enrollments.length,
            )
          : 0;
      const xpGenerated = enrollments.reduce((sum, cp) => sum + (cp.xp_earned ?? 0), 0);

      return {
        courseId: course._id,
        title: course.title,
        slug: course.slug,
        difficulty: course.difficulty,
        trackId: course.trackId,
        status: course.status,
        isActive: course.isActive,
        lessonCount: course.lessonCount,
        enrollments: enrollments.length,
        completions: completions.length,
        completionRate:
          enrollments.length > 0
            ? Math.round((completions.length / enrollments.length) * 100)
            : 0,
        avgProgress,
        xpGenerated,
      };
    });

    // Sort by enrollments desc
    courseStats.sort((a, b) => b.enrollments - a.enrollments);

    // ─── User Analytics ────────────────────────────────
    const userStatsMap = new Map<
      string,
      {
        userId: string;
        username: string;
        displayName: string;
        avatarUrl: string | null;
        walletAddress: string | null;
        joinedAt: string;
        coursesEnrolled: number;
        coursesCompleted: number;
        lessonsCompleted: number;
        xpEarned: number;
        currentStreak: number;
        longestStreak: number;
        achievementCount: number;
        commentCount: number;
        activityCount: number;
        lastActive: string | null;
      }
    >();

    for (const p of profiles) {
      userStatsMap.set(p.id, {
        userId: p.id,
        username: p.username ?? "",
        displayName: p.display_name ?? "",
        avatarUrl: p.avatar_url,
        walletAddress: p.wallet_address,
        joinedAt: p.created_at,
        coursesEnrolled: 0,
        coursesCompleted: 0,
        lessonsCompleted: 0,
        xpEarned: 0,
        currentStreak: 0,
        longestStreak: 0,
        achievementCount: 0,
        commentCount: 0,
        activityCount: 0,
        lastActive: null,
      });
    }

    // Aggregate course progress per user
    for (const cp of courseProgress) {
      const user = userStatsMap.get(cp.user_id);
      if (!user) continue;
      user.coursesEnrolled++;
      if (cp.is_completed) user.coursesCompleted++;
      user.lessonsCompleted += cp.completed_lessons?.length ?? 0;
      user.xpEarned += cp.xp_earned ?? 0;
    }

    // Aggregate streaks
    for (const s of streaks) {
      const user = userStatsMap.get(s.user_id);
      if (!user) continue;
      user.currentStreak = s.current_streak ?? 0;
      user.longestStreak = s.longest_streak ?? 0;
      user.lastActive = s.last_activity_date;
    }

    // Aggregate achievements
    for (const a of achievements) {
      const user = userStatsMap.get(a.user_id);
      if (!user) continue;
      user.achievementCount++;
    }

    // Aggregate comments
    for (const c of comments) {
      const user = userStatsMap.get(c.user_id);
      if (!user) continue;
      user.commentCount++;
    }

    // Aggregate activity count
    for (const a of activities) {
      const user = userStatsMap.get(a.user_id);
      if (!user) continue;
      user.activityCount++;
    }

    const allUsers = Array.from(userStatsMap.values());

    // Most active users (by XP)
    const topUsersByXp = [...allUsers].sort((a, b) => b.xpEarned - a.xpEarned).slice(0, 20);

    // Most active users (by lessons completed)
    const topUsersByLessons = [...allUsers]
      .sort((a, b) => b.lessonsCompleted - a.lessonsCompleted)
      .slice(0, 20);

    // Most active users (by activity count)
    const topUsersByActivity = [...allUsers]
      .sort((a, b) => b.activityCount - a.activityCount)
      .slice(0, 20);

    // Users with streaks
    const usersWithStreaks = [...allUsers]
      .filter((u) => u.currentStreak > 0)
      .sort((a, b) => b.currentStreak - a.currentStreak)
      .slice(0, 20);

    // ─── Enrollment Timeline (daily, last 30 days) ─────
    const enrollmentTimeline: Record<string, number> = {};
    const completionTimeline: Record<string, number> = {};
    const signupTimeline: Record<string, number> = {};

    // Initialize last 30 days
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split("T")[0];
      enrollmentTimeline[key] = 0;
      completionTimeline[key] = 0;
      signupTimeline[key] = 0;
    }

    for (const cp of courseProgress) {
      if (cp.enrolled_at) {
        const key = new Date(cp.enrolled_at).toISOString().split("T")[0];
        if (key in enrollmentTimeline) enrollmentTimeline[key]++;
      }
      if (cp.completed_at) {
        const key = new Date(cp.completed_at).toISOString().split("T")[0];
        if (key in completionTimeline) completionTimeline[key]++;
      }
    }

    for (const p of recentProfiles) {
      if (p.created_at) {
        const key = new Date(p.created_at).toISOString().split("T")[0];
        if (key in signupTimeline) signupTimeline[key]++;
      }
    }

    // ─── Recent activity breakdown ─────────────────────
    const activityTypeBreakdown: Record<string, number> = {};
    for (const a of recentActivities) {
      activityTypeBreakdown[a.type] = (activityTypeBreakdown[a.type] ?? 0) + 1;
    }

    // ─── Users per course ──────────────────────────────
    const usersPerCourse = courseStats.map((cs) => ({
      courseId: cs.courseId,
      title: cs.title,
      enrollments: cs.enrollments,
      completions: cs.completions,
    }));

    // ─── Difficulty distribution ───────────────────────
    const difficultyDist = { beginner: 0, intermediate: 0, advanced: 0 };
    for (const c of sanityCourses) {
      if (c.difficulty === 1) difficultyDist.beginner++;
      else if (c.difficulty === 2) difficultyDist.intermediate++;
      else if (c.difficulty === 3) difficultyDist.advanced++;
    }

    // ─── Active users last 7 days ──────────────────────
    const recentActivityUserIds = new Set(
      (recentActivities ?? [])
        .filter((a) => new Date(a.created_at) >= new Date(sevenDaysAgo))
        .map((a) => a.user_id),
    );
    const activeUsersLast7Days = recentActivityUserIds.size;

    return NextResponse.json({
      overview: {
        totalUsers,
        newUsersLast30Days,
        activeUsersLast7Days,
        usersWithWallet,
        onboardedUsers,
        totalCourses: sanityCourses.length,
        approvedCourses: sanityCourses.filter((c) => c.status === "approved").length,
        pendingCourses: sanityCourses.filter((c) => c.status === "pending_review").length,
        totalEnrollments,
        totalCompletions,
        totalFinalizations,
        completionRate,
        totalXpEarned,
        totalLessonsCompleted,
        totalAchievementsEarned,
        totalComments,
      },
      courseStats,
      usersPerCourse,
      topUsersByXp,
      topUsersByLessons,
      topUsersByActivity,
      usersWithStreaks,
      timelines: {
        enrollments: Object.entries(enrollmentTimeline).map(([date, count]) => ({ date, count })),
        completions: Object.entries(completionTimeline).map(([date, count]) => ({ date, count })),
        signups: Object.entries(signupTimeline).map(([date, count]) => ({ date, count })),
      },
      activityTypeBreakdown,
      difficultyDistribution: difficultyDist,
      allUsers: allUsers.sort((a, b) => b.xpEarned - a.xpEarned),
    });
  } catch (err) {
    console.error("[admin/analytics]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
