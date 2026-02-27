import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import {
  User,
  CourseEnrollment,
  UserStreak,
  UserProgress,
  Course,
  UserAchievement,
} from '@/models';
import { XPIndexingService } from '@/lib/services/xp-indexing.service';

// Helper to find next lesson for a course
function findNextLesson(
  course: any,
  completedLessons: string[] = []
): { slug: string; title: string; moduleTitle: string } | null {
  if (!course?.modules) return null;

  for (const courseModule of course.modules) {
    for (const lesson of courseModule.lessons || []) {
      if (!completedLessons.includes(lesson.slug)) {
        return {
          slug: lesson.slug,
          title: lesson.title,
          moduleTitle: courseModule.title,
        };
      }
    }
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Find user by email, or create a basic profile if not exists
    let user = await User.findOne({ email: session.user.email });

    if (!user) {
      // Create user from session data
      user = await User.create({
        email: session.user.email,
        display_name: session.user.name || 'User',
        avatar_url: session.user.image || '',
        total_xp: 0,
        level: 0,
      });
    }

    // Sync/calculate effective XP from indexed on-chain + off-chain sources
    const indexedUser = await XPIndexingService.indexUser(user._id.toString());

    // Get user enrollments (support both snake_case and legacy camelCase)
    const enrollments = await CourseEnrollment.find({
      $or: [{ user_id: user._id }, { userId: user._id }, { userId: user._id.toString() }],
    })
      .sort({ last_accessed_at: -1, updated_at: -1, updatedAt: -1 })
      .lean();
    const streakData = await UserStreak.findOne({
      $or: [{ user_id: user._id }, { userId: user._id }, { userId: user._id.toString() }],
    });

    // Calculate user progress from User model
    const totalXP = indexedUser?.totalXp ?? user.total_xp ?? 0;
    const level = Math.floor(Math.sqrt(totalXP / 100));
    const currentStreak = streakData?.current_streak || 0;
    const longestStreak = streakData?.longest_streak || 0;
    const streakHistory = (streakData?.streak_history || []).map((entry: any) => ({
      date: entry.date,
      hasActivity: (entry.lessons_completed || 0) > 0 || (entry.challenges_solved || 0) > 0,
    }));

    // Resolve enrolled courses using course slug/id from enrollment documents
    const enrolledCourseSlugs = enrollments
      .map((enrollment: any) => enrollment.course_slug)
      .filter(Boolean);
    const enrolledCourseIds = enrollments.map((enrollment: any) => enrollment.course_id).filter(Boolean);

    const enrolledCourses = await Course.find({
      $or: [{ slug: { $in: enrolledCourseSlugs } }, { id: { $in: enrolledCourseIds } }],
    }).lean();

    const courseBySlug = new Map(enrolledCourses.map((course: any) => [course.slug, course]));
    const courseById = new Map(enrolledCourses.map((course: any) => [course.id, course]));

    // Collect completed lessons per enrolled course for next lesson resolution
    const completedProgressRows = await UserProgress.find({
      $or: [{ user_id: user._id }, { userId: user._id }],
      completed: true,
      course_id: { $in: enrolledCourseIds },
    })
      .select('course_id lesson_id')
      .lean();

    const completedLessonsByCourseId = new Map<string, string[]>();
    for (const row of completedProgressRows as any[]) {
      const key = String(row.course_id || '');
      if (!key) continue;
      const existing = completedLessonsByCourseId.get(key) || [];
      existing.push(String(row.lesson_id || ''));
      completedLessonsByCourseId.set(key, existing);
    }

    // Get current courses with progress and next lesson
    const currentCourses = enrollments
      .filter((enrollment: any) => (enrollment.progress_percentage || 0) < 100)
      .slice(0, 4)
      .map((enrollment: any) => {
        const linkedCourse =
          courseBySlug.get(enrollment.course_slug) || courseById.get(enrollment.course_id) || null;
        const completedLessons = completedLessonsByCourseId.get(String(enrollment.course_id || '')) || [];
        const nextLesson = linkedCourse ? findNextLesson(linkedCourse, completedLessons) : null;

        return {
          id: linkedCourse?._id?.toString() || String(enrollment.course_id || ''),
          slug: linkedCourse?.slug || enrollment.course_slug || '',
          title: linkedCourse?.title || 'Unknown Course',
          progress: enrollment.progress_percentage || 0,
          lastAccessed: enrollment.last_accessed_at || enrollment.updated_at || enrollment.enrolled_at,
          lessonsCompleted: enrollment.lessons_completed || 0,
          totalLessons:
            enrollment.total_lessons ||
            linkedCourse?.lessonsCount ||
            linkedCourse?.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) ||
            0,
          instructor: linkedCourse?.instructor || 'Unknown',
          difficulty: linkedCourse?.difficulty || 'beginner',
          thumbnail: linkedCourse?.thumbnail || '',
          nextLesson: nextLesson
            ? {
                slug: nextLesson.slug,
                title: nextLesson.title,
                moduleTitle: nextLesson.moduleTitle,
              }
            : null,
        };
      });

    // Get recommended courses (courses not enrolled in)
    const recommendedCourses = await Course.find({
      slug: { $nin: enrolledCourseSlugs },
      published: true,
    })
      .sort({ enrolledCount: -1 })
      .limit(4)
      .lean();

    const recommendedCoursesFormatted = recommendedCourses.map((course: any) => ({
      id: course._id?.toString(),
      slug: course.slug,
      title: course.title,
      description: course.description,
      difficulty: course.difficulty,
      duration: course.duration,
      lessonsCount:
        course.lessonsCount ||
        course.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) ||
        0,
      xpReward: course.xpReward || 0,
      thumbnail: course.thumbnail || '',
      track: course.track || '',
      tags: course.tags || [],
    }));

    // Get user achievements
    const userAchievements = await UserAchievement.find({
      $or: [{ user_id: user._id }, { userId: user._id }],
    })
      .sort({ earned_at: -1, unlockedAt: -1, created_at: -1 })
      .lean();

    const normalizedAchievements = userAchievements.map((achievement: any) => ({
      id: achievement._id?.toString?.() || achievement._id,
      achievementId: achievement.achievement_id || achievement.achievementId,
      unlockedAt:
        achievement.earned_at || achievement.unlockedAt || achievement.created_at || new Date(),
      xpReward: achievement.xp_reward || achievement.xpReward || 0,
      nftMintAddress: achievement.nft_mint_address || achievement.nftMintAddress,
    }));

    // Get user rank (simple count of users with more XP)
    const usersWithMoreXP = await User.countDocuments({ total_xp: { $gt: totalXP } });
    const userRank = usersWithMoreXP + 1;
    const totalUsers = await User.countDocuments();

    // Get recent activity from completed lessons
    const recentActivity = await UserProgress.aggregate([
      { $match: { userId: user._id } },
      { $unwind: '$completedLessons' },
      { $sort: { 'completedLessons.completedAt': -1 } },
      { $limit: 10 },
      {
        $project: {
          type: { $literal: 'lesson_completed' },
          title: '$completedLessons.lessonTitle',
          description: { $concat: ['Completed ', '$completedLessons.lessonTitle'] },
          timestamp: '$completedLessons.completedAt',
          xpEarned: '$completedLessons.xpEarned',
        },
      },
    ]);

    const onboardingAchievement = normalizedAchievements.find(
      (achievement) => achievement.achievementId === 'onboarding-complete'
    );

    if (onboardingAchievement) {
      recentActivity.push({
        type: 'onboarding_completed',
        title: 'Onboarding Completed',
        description: 'Completed onboarding and earned your first achievement',
        timestamp: onboardingAchievement.unlockedAt || new Date(),
        xpEarned: onboardingAchievement.xpReward || 100,
      });
    }

    recentActivity.sort(
      (a: { timestamp: string | Date }, b: { timestamp: string | Date }) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const formattedRecentActivity = recentActivity.slice(0, 10);

    // Get upcoming challenges (courses that are enrolled but not started or barely started)
    const upcomingChallenges = enrollments
      .filter((enrollment: any) => (enrollment.progress_percentage || 0) < 10)
      .slice(0, 5)
      .map((enrollment: any) => ({
        id: String(enrollment.course_id || ''),
        title:
          courseBySlug.get(enrollment.course_slug)?.title ||
          courseById.get(enrollment.course_id)?.title ||
          'Unknown Course',
        type: 'course',
        difficulty:
          courseBySlug.get(enrollment.course_slug)?.difficulty ||
          courseById.get(enrollment.course_id)?.difficulty ||
          'beginner',
        xpReward: 100, // Could be calculated based on course data
        timeEstimate:
          courseBySlug.get(enrollment.course_slug)?.duration ||
          courseById.get(enrollment.course_id)?.duration ||
          '1 hour',
        deadline: null,
        tags:
          courseBySlug.get(enrollment.course_slug)?.tags ||
          courseById.get(enrollment.course_id)?.tags ||
          [],
      }));

    // Calculate stats
    const completedCourses = enrollments.filter((e: any) => (e.progress_percentage || 0) >= 100).length;
    const totalCourses = enrollments.length;
    const completionRate =
      totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0;

    return NextResponse.json({
      userProgress: {
        totalXP,
        level,
        currentStreak,
        longestStreak,
        completedCourses,
        totalCourses,
        completionRate,
        userRank,
        totalUsers,
      },
      streakData: {
        currentStreak,
        longestStreak,
        streakHistory,
        lastActivityDate: streakData?.last_activity_date || null,
      },
      currentCourses,
      recommendedCourses: recommendedCoursesFormatted,
      achievements: normalizedAchievements,
      recentActivity: formattedRecentActivity,
      upcomingChallenges,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
