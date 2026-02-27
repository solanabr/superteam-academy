import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { User } from '@/models/User';
import { CourseEnrollment } from '@/models/CourseEnrollment';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';
import { hasAdminAllowlist, isAllowlistedAdmin } from '@/lib/admin-access';

/**
 * GET /api/admin/analytics/courses
 * Returns course enrollment and completion analytics
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allowlistEnabled = hasAdminAllowlist();
    if (
      allowlistEnabled &&
      !isAllowlistedAdmin({ id: session.user.id, email: session.user.email })
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectToDatabase();

    if (!allowlistEnabled) {
      const adminLookupFilters: Record<string, unknown>[] = [];

      if (session.user.id && mongoose.Types.ObjectId.isValid(session.user.id)) {
        adminLookupFilters.push({ _id: new mongoose.Types.ObjectId(session.user.id) });
      }

      if (session.user.email) {
        adminLookupFilters.push({ email: session.user.email });
      }

      if (session.user.walletAddress) {
        adminLookupFilters.push({ wallet_address: session.user.walletAddress });
      }

      if (adminLookupFilters.length === 0) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const adminUser = await User.findOne({ $or: adminLookupFilters });
      if (!adminUser || !['admin', 'super_admin'].includes(adminUser.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Get total enrollments
    const totalEnrollments = await CourseEnrollment.countDocuments();

    // Get completed enrollments
    const completedEnrollments = await CourseEnrollment.countDocuments({
      completed_at: { $exists: true, $ne: null },
    });

    // Get completion rate
    const completionRate =
      totalEnrollments > 0
        ? (((completedEnrollments / totalEnrollments) * 100).toFixed(2) as any)
        : 0;

    // Get certificates issued
    const certificatesIssued = await CourseEnrollment.countDocuments({
      certificate_issued: true,
    });

    // Get top courses by enrollment
    const topCoursesByEnrollment = await CourseEnrollment.aggregate([
      {
        $group: {
          _id: '$course_slug',
          enrollments: { $sum: 1 },
          completed: {
            $sum: {
              $cond: [{ $eq: ['$completed_at', null] }, 0, 1],
            },
          },
          avgProgress: { $avg: '$progress_percentage' },
          avgXpEarned: { $avg: '$xp_earned' },
        },
      },
      { $sort: { enrollments: -1 } },
      { $limit: 10 },
    ]);

    // Get enrollment trends (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const enrollmentTrends = await CourseEnrollment.aggregate([
      {
        $match: {
          enrolled_at: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$enrolled_at' },
            month: { $month: '$enrolled_at' },
            day: { $dayOfMonth: '$enrolled_at' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 },
      },
    ]);

    // Get completion trends (last 30 days)
    const completionTrends = await CourseEnrollment.aggregate([
      {
        $match: {
          completed_at: {
            $gte: thirtyDaysAgo,
            $ne: null,
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$completed_at' },
            month: { $month: '$completed_at' },
            day: { $dayOfMonth: '$completed_at' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 },
      },
    ]);

    // Get progress distribution
    const progressDistribution = await CourseEnrollment.aggregate([
      {
        $bucket: {
          groupBy: '$progress_percentage',
          boundaries: [0, 25, 50, 75, 100],
          default: 'Other',
          output: {
            count: { $sum: 1 },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get average lesson completion
    const lessonStats = await CourseEnrollment.aggregate([
      {
        $group: {
          _id: null,
          avgLessonsCompleted: { $avg: '$lessons_completed' },
          avgChallengesSolved: { $avg: '$challenges_solved' },
          totalLessonsCompleted: { $sum: '$lessons_completed' },
          totalChallengesSolved: { $sum: '$challenges_solved' },
        },
      },
    ]);

    // Get average XP earned per enrollment
    const xpStats = await CourseEnrollment.aggregate([
      {
        $group: {
          _id: null,
          avgXpEarned: { $avg: '$xp_earned' },
          totalXpEarned: { $sum: '$xp_earned' },
          maxXpEarned: { $max: '$xp_earned' },
        },
      },
    ]);

    // Get users with most course completions
    const topLearners = await CourseEnrollment.aggregate([
      {
        $group: {
          _id: '$user_id',
          coursesCompleted: {
            $sum: {
              $cond: [{ $eq: ['$completed_at', null] }, 0, 1],
            },
          },
          totalEnrollments: { $sum: 1 },
          totalXpEarned: { $sum: '$xp_earned' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
      { $sort: { coursesCompleted: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 1,
          user: {
            _id: 1,
            display_name: 1,
            username: 1,
          },
          coursesCompleted: 1,
          totalEnrollments: 1,
          totalXpEarned: 1,
        },
      },
    ]);

    return NextResponse.json(
      {
        overview: {
          totalEnrollments,
          completedEnrollments,
          completionRate: parseFloat(completionRate as any),
          certificatesIssued,
        },
        topCourses: topCoursesByEnrollment,
        trends: {
          enrollments: enrollmentTrends,
          completions: completionTrends,
        },
        progressDistribution,
        lessonStats: lessonStats[0] || {},
        xpStats: xpStats[0] || {},
        topLearners,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching courses analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch courses analytics' }, { status: 500 });
  }
}
