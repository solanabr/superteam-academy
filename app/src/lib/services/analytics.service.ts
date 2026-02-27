/**
 * Analytics Service
 * Utilities and helpers for analytics calculations and data processing
 */

import { User } from '@/models/User';
import { CourseEnrollment } from '@/models/CourseEnrollment';
import { CommunityPost } from '@/models/CommunityPost';
import { CommunityComment } from '@/models/CommunityComment';
import { CommunityLike } from '@/models/CommunityLike';
import { connectToDatabase } from '@/lib/mongodb';

export interface UserGrowthMetrics {
  totalUsers: number;
  newUsersThisMonth: number;
  newUsersThisWeek: number;
  growthRateMonthly: number;
  activeUsers: {
    last7Days: number;
    last30Days: number;
    last90Days: number;
  };
}

export interface EngagementMetrics {
  totalPosts: number;
  totalComments: number;
  totalLikes: number;
  engagementRate: number;
  engagedUsers: number;
  avgPostsPerUser: number;
  avgCommentsPerUser: number;
}

export interface LearningMetrics {
  totalEnrollments: number;
  completionRate: number;
  avgProgressPerUser: number;
  avgXpPerUser: number;
  certificatesIssued: number;
  topCourse: string;
}

/**
 * Calculate user growth metrics
 */
export async function calculateUserGrowthMetrics(): Promise<UserGrowthMetrics> {
  await connectToDatabase();

  const totalUsers = await User.countDocuments();

  // New users this month
  const monthStart = new Date();
  monthStart.setDate(1);
  const newUsersThisMonth = await User.countDocuments({
    created_at: { $gte: monthStart },
  });

  // New users this week
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const newUsersThisWeek = await User.countDocuments({
    created_at: { $gte: weekStart },
  });

  // Growth rate calculation
  const lastMonthStart = new Date(monthStart);
  lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
  const usersLastMonth = await User.countDocuments({
    created_at: { $gte: lastMonthStart, $lt: monthStart },
  });

  const growthRateMonthly =
    usersLastMonth > 0
      ? parseFloat((((newUsersThisMonth - usersLastMonth) / usersLastMonth) * 100).toFixed(2))
      : 0;

  // Active users
  const day7Ago = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const day30Ago = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const day90Ago = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const activeUsersLast7Days = await User.countDocuments({
    last_activity_at: { $gte: day7Ago },
  });

  const activeUsersLast30Days = await User.countDocuments({
    last_activity_at: { $gte: day30Ago },
  });

  const activeUsersLast90Days = await User.countDocuments({
    last_activity_at: { $gte: day90Ago },
  });

  return {
    totalUsers,
    newUsersThisMonth,
    newUsersThisWeek,
    growthRateMonthly,
    activeUsers: {
      last7Days: activeUsersLast7Days,
      last30Days: activeUsersLast30Days,
      last90Days: activeUsersLast90Days,
    },
  };
}

/**
 * Calculate engagement metrics
 */
export async function calculateEngagementMetrics(): Promise<EngagementMetrics> {
  await connectToDatabase();

  const totalPosts = await CommunityPost.countDocuments();
  const totalComments = await CommunityComment.countDocuments();
  const totalLikes = await CommunityLike.countDocuments();
  const totalUsers = await User.countDocuments();

  // Count unique users who engaged
  const postersCount = await CommunityPost.countDocuments();
  const commentersCount = await CommunityComment.countDocuments();
  const likersCount = await CommunityLike.countDocuments();

  const engagedUsers = new Set([
    ...(await CommunityPost.distinct('author')),
    ...(await CommunityComment.distinct('author')),
    ...(await CommunityLike.distinct('user_id')),
  ]).size;

  const engagementRate =
    totalUsers > 0 ? parseFloat(((engagedUsers / totalUsers) * 100).toFixed(2)) : 0;

  const avgPostsPerUser = totalUsers > 0 ? parseFloat((totalPosts / totalUsers).toFixed(2)) : 0;

  const avgCommentsPerUser =
    totalUsers > 0 ? parseFloat((totalComments / totalUsers).toFixed(2)) : 0;

  return {
    totalPosts,
    totalComments,
    totalLikes,
    engagementRate,
    engagedUsers,
    avgPostsPerUser,
    avgCommentsPerUser,
  };
}

/**
 * Calculate learning metrics
 */
export async function calculateLearningMetrics(): Promise<LearningMetrics> {
  await connectToDatabase();

  const totalEnrollments = await CourseEnrollment.countDocuments();
  const completedEnrollments = await CourseEnrollment.countDocuments({
    completed_at: { $exists: true, $ne: null },
  });

  const completionRate =
    totalEnrollments > 0
      ? parseFloat(((completedEnrollments / totalEnrollments) * 100).toFixed(2))
      : 0;

  const totalUsers = await User.countDocuments();

  // Average progress
  const progressStats = await CourseEnrollment.aggregate([
    {
      $group: {
        _id: null,
        avgProgress: { $avg: '$progress_percentage' },
      },
    },
  ]);

  const avgProgressPerUser = progressStats[0]?.avgProgress || 0;

  // Average XP
  const xpStats = await CourseEnrollment.aggregate([
    {
      $group: {
        _id: null,
        totalXp: { $sum: '$xp_earned' },
      },
    },
  ]);

  const avgXpPerUser =
    totalUsers > 0 ? parseFloat(((xpStats[0]?.totalXp || 0) / totalUsers).toFixed(2)) : 0;

  const certificatesIssued = await CourseEnrollment.countDocuments({
    certificate_issued: true,
  });

  // Top course
  const topCourseData = await CourseEnrollment.aggregate([
    {
      $group: {
        _id: '$course_slug',
        enrollments: { $sum: 1 },
      },
    },
    { $sort: { enrollments: -1 } },
    { $limit: 1 },
  ]);

  const topCourse = topCourseData[0]?._id || 'N/A';

  return {
    totalEnrollments,
    completionRate,
    avgProgressPerUser: parseFloat(avgProgressPerUser.toFixed(2)),
    avgXpPerUser,
    certificatesIssued,
    topCourse,
  };
}

/**
 * Generate summary report of all key metrics
 */
export async function generateSummaryReport() {
  try {
    const userGrowth = await calculateUserGrowthMetrics();
    const engagement = await calculateEngagementMetrics();
    const learning = await calculateLearningMetrics();

    return {
      generatedAt: new Date().toISOString(),
      userGrowth,
      engagement,
      learning,
    };
  } catch (error) {
    console.error('Error generating summary report:', error);
    throw error;
  }
}

/**
 * Get top performers across all categories
 */
export async function getTopPerformers(limit: number = 10) {
  await connectToDatabase();

  const topPerformers = await User.find({
    role: 'user',
  })
    .select('_id display_name username avatar_url total_xp level courses_completed current_streak')
    .sort({ total_xp: -1 })
    .limit(limit);

  return topPerformers;
}

/**
 * Get user retention cohort analysis
 */
export async function getUserRetentionCohorts() {
  await connectToDatabase();

  const cohorts = [];

  // Get cohorts for last 6 months
  for (let i = 5; i >= 0; i--) {
    const cohortStart = new Date();
    cohortStart.setMonth(cohortStart.getMonth() - i);
    cohortStart.setDate(1);

    const cohortEnd = new Date(cohortStart);
    cohortEnd.setMonth(cohortEnd.getMonth() + 1);

    const cohortUsers = await User.countDocuments({
      created_at: { $gte: cohortStart, $lt: cohortEnd },
    });

    // Check retention at different intervals
    const day30 = new Date(cohortStart);
    day30.setDate(day30.getDate() + 30);
    const retainedDay30 = await User.countDocuments({
      created_at: { $gte: cohortStart, $lt: cohortEnd },
      last_activity_at: { $gte: day30 },
    });

    cohorts.push({
      month: cohortStart.toISOString().split('T')[0],
      totalUsers: cohortUsers,
      retained30Days: retainedDay30,
      retentionRate: cohortUsers > 0 ? (retainedDay30 / cohortUsers) * 100 : 0,
    });
  }

  return cohorts;
}
