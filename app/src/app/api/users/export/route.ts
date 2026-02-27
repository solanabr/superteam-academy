import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import {
  User,
  UserProgress,
  UserStreak,
  UserAchievement,
  CourseEnrollment,
  Certificate,
} from '@/models';

/**
 * GET /api/users/export
 * Export all user data as JSON (GDPR compliance)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Get the user
    const user = await User.findById(session.user.id).lean();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = user._id;

    // Fetch all related data in parallel
    const [progress, streak, achievements, enrollments, certificates] = await Promise.all([
      UserProgress.find({ user_id: userId }).lean(),
      UserStreak.findOne({ user_id: userId }).lean(),
      UserAchievement.find({ user_id: userId }).lean(),
      CourseEnrollment.find({ user_id: userId }).lean(),
      Certificate.find({ user_id: userId }).lean(),
    ]);

    // Construct the export data
    const exportData = {
      exportedAt: new Date().toISOString(),
      platform: 'CapySolBuild Academy',
      user: {
        id: user._id.toString(),
        username: user.username,
        displayName: user.display_name,
        fullName: user.full_name,
        email: user.email,
        bio: user.bio,
        location: user.location,
        avatarUrl: user.avatar_url,
        walletAddress: user.wallet_address,
        totalXp: user.total_xp,
        level: user.level,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        socialLinks: {
          website: user.website,
          twitter: user.twitter,
          github: user.github,
          linkedin: user.linkedin,
          facebook: user.facebook,
          instagram: user.instagram,
          whatsapp: user.whatsapp,
          telegram: user.telegram,
          discord: user.discord,
          medium: user.medium,
          youtube: user.youtube,
          tiktok: user.tiktok,
        },
        preferences: {
          profilePublic: user.profile_public,
          showOnLeaderboard: user.show_on_leaderboard,
          showActivity: user.show_activity,
        },
        linkedAccounts: {
          google: !!user.google_id,
          github: !!user.github_id,
          wallet: !!user.wallet_address,
        },
      },
      streak: streak
        ? {
            currentStreak: streak.current_streak,
            longestStreak: streak.longest_streak,
            lastActivityDate: streak.last_activity_date,
            streakHistory: streak.streak_history,
            freezeAvailable: streak.freeze_available,
          }
        : null,
      courseEnrollments: enrollments.map((enrollment) => ({
        courseId: enrollment.course_id,
        courseSlug: enrollment.course_slug,
        enrolledAt: enrollment.enrolled_at,
        completedAt: enrollment.completed_at,
        progressPercentage: enrollment.progress_percentage,
        lessonsCompleted: enrollment.lessons_completed,
        totalLessons: enrollment.total_lessons,
        xpEarned: enrollment.xp_earned,
        lastAccessedAt: enrollment.last_accessed_at,
      })),
      progress: progress.map((p) => ({
        courseId: p.course_id,
        lessonId: p.lesson_id,
        completed: p.completed,
        completedAt: p.completed_at,
        xpEarned: p.xp_earned,
        timeSpentSeconds: p.time_spent_seconds,
        attempts: p.attempts,
        challengeData: p.challenge_data,
      })),
      achievements: achievements.map((a) => ({
        achievementId: a.achievement_id,
        name: a.achievement_name,
        description: a.achievement_description,
        icon: a.achievement_icon,
        earnedAt: a.earned_at,
        xpReward: a.xp_reward,
      })),
      certificates: certificates.map((cert) => ({
        id: cert._id.toString(),
        credentialId: cert.credential_id,
        courseId: cert.course_id,
        courseSlug: cert.course_slug,
        courseName: cert.course_name,
        recipientName: cert.recipient_name,
        issuedAt: cert.issued_at,
        status: cert.status,
        onChain: cert.on_chain,
        mintAddress: cert.mint_address,
        metadataUri: cert.metadata_uri,
      })),
    };

    // Return as downloadable JSON
    const jsonString = JSON.stringify(exportData, null, 2);

    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="capysolbuild-data-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error('GET /api/users/export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
