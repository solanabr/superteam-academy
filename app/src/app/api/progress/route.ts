import { NextRequest, NextResponse } from 'next/server';
import { ProgressService } from '@/services/progress.service';
import { UserService } from '@/services/user.service';

/**
 * GET /api/progress
 * Get all course progress for a user
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const walletAddress = searchParams.get('wallet');
    const courseId = searchParams.get('courseId');

    let resolvedUserId = userId;

    // Find user by wallet if wallet address provided
    if (!resolvedUserId && walletAddress) {
      const user = await UserService.findByWalletAddress(walletAddress);
      if (user) {
        resolvedUserId = user._id.toString();
      }
    }

    if (!resolvedUserId) {
      return NextResponse.json({ error: 'User ID or wallet address required' }, { status: 400 });
    }

    // If courseId specified, get specific course progress
    if (courseId) {
      const progress = await ProgressService.getCourseProgress(resolvedUserId, courseId);
      return NextResponse.json({ progress });
    }

    // Get all courses progress
    const courses = await ProgressService.getAllCoursesProgress(resolvedUserId);
    const streak = await ProgressService.getStreakData(resolvedUserId);

    return NextResponse.json({
      courses,
      streak,
    });
  } catch (error) {
    console.error('GET /api/progress error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/progress
 * Record lesson completion or course enrollment
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      action,
      userId,
      courseId,
      courseSlug,
      lessonId,
      totalLessons,
      totalChallenges,
      xpEarned,
      challengeData,
    } = body;

    if (!userId || !courseId) {
      return NextResponse.json({ error: 'User ID and course ID required' }, { status: 400 });
    }

    switch (action) {
      case 'enroll': {
        const enrollment = await ProgressService.enrollInCourse(
          userId,
          courseId,
          courseSlug || courseId,
          totalLessons || 0,
          totalChallenges || 0
        );

        return NextResponse.json({
          success: true,
          enrollment: {
            courseId: enrollment.course_id,
            enrolledAt: enrollment.enrolled_at,
            progressPercentage: enrollment.progress_percentage,
          },
        });
      }

      case 'complete-lesson': {
        if (!lessonId) {
          return NextResponse.json({ error: 'Lesson ID required for completion' }, { status: 400 });
        }

        const result = await ProgressService.completeLesson({
          userId,
          courseId,
          courseSlug: courseSlug || courseId,
          lessonId,
          xpEarned: xpEarned || 0,
          challengeData,
        });

        return NextResponse.json({
          success: true,
          lessonProgress: {
            lessonId: result.lessonProgress.lesson_id,
            completed: result.lessonProgress.completed,
            xpEarned: result.lessonProgress.xp_earned,
          },
          enrollment: result.enrollment
            ? {
                progressPercentage: result.enrollment.progress_percentage,
                lessonsCompleted: result.enrollment.lessons_completed,
                completed: result.enrollment.completed_at !== null,
              }
            : null,
          xpEarned: xpEarned || 0,
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "enroll" or "complete-lesson"' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('POST /api/progress error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
