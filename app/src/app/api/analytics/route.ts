import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { User, UserProgress, CourseEnrollment, Course } from '@/models';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email && !session?.user?.walletAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Find user by email or wallet
    const user = await User.findOne({
      $or: [{ email: session.user.email }, { wallet_address: session.user.walletAddress }],
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const timeRange = searchParams.get('range') || 'week';

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const rangeDurationMs = now.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - rangeDurationMs);

    // Get all enrollments for the user
    const enrollments = await CourseEnrollment.find({
      user_id: user._id,
    }).lean();

    // Get all progress records
    const progressRecords = await UserProgress.find({
      user_id: user._id,
      updated_at: { $gte: startDate },
    })
      .sort({ updated_at: 1 })
      .lean();

    // Get previous period progress records for trend comparison
    const previousProgressRecords = await UserProgress.find({
      user_id: user._id,
      updated_at: { $gte: previousStartDate, $lt: startDate },
    }).lean();

    const enrollmentCourseIds = [...new Set(enrollments.map((enrollment) => enrollment.course_id))];
    const enrollmentCourseSlugs = [
      ...new Set(enrollments.map((enrollment) => enrollment.course_slug).filter(Boolean)),
    ];
    const objectCourseIds = enrollmentCourseIds
      .filter((courseId) => mongoose.Types.ObjectId.isValid(courseId))
      .map((courseId) => new mongoose.Types.ObjectId(courseId));

    const courses = await Course.find({
      $or: [
        { id: { $in: enrollmentCourseIds } },
        { slug: { $in: enrollmentCourseSlugs } },
        { _id: { $in: objectCourseIds } },
      ],
    }).lean();

    const courseLookup = new Map<string, any>();
    for (const course of courses) {
      courseLookup.set(String(course.id), course);
      courseLookup.set(String(course._id), course);
      courseLookup.set(String(course.slug), course);
    }

    // Calculate metrics
    const totalXP = user.total_xp || 0;
    const completedCourses = enrollments.filter(
      (enrollment) =>
        enrollment.progress_percentage === 100 || enrollment.completed_at !== null
    ).length;
    const activeCourses = enrollments.filter(
      (enrollment) =>
        enrollment.progress_percentage > 0 &&
        enrollment.progress_percentage < 100 &&
        enrollment.completed_at === null
    ).length;
    const totalLessons = progressRecords.filter((p) => p.completed).length;
    const totalTimeSpentSeconds = progressRecords.reduce(
      (sum, record) => sum + (record.time_spent_seconds || 0),
      0
    );
    const averageTime =
      progressRecords.length > 0
        ? Math.round(totalTimeSpentSeconds / progressRecords.length / 60)
        : 0;

    const currentRangeXP = progressRecords.reduce((sum, record) => sum + (record.xp_earned || 0), 0);
    const previousRangeXP = previousProgressRecords.reduce(
      (sum, record) => sum + (record.xp_earned || 0),
      0
    );
    const xpDelta = currentRangeXP - previousRangeXP;

    const previousTotalTimeSpentSeconds = previousProgressRecords.reduce(
      (sum, record) => sum + (record.time_spent_seconds || 0),
      0
    );
    const previousAverageTime =
      previousProgressRecords.length > 0
        ? Math.round(previousTotalTimeSpentSeconds / previousProgressRecords.length / 60)
        : 0;
    const averageTimeDelta = averageTime - previousAverageTime;

    // Build weekly activity data
    const weeklyActivity: Array<{ day: string; xp: number; lessons: number }> = [];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayData: Record<string, { xp: number; lessons: number }> = {};

    // Initialize days
    days.forEach((day) => {
      dayData[day] = { xp: 0, lessons: 0 };
    });

    // Aggregate progress by day
    progressRecords.forEach((record) => {
      const date = new Date(record.updated_at);
      const dayIndex = (date.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
      const dayName = days[dayIndex];

      if (record.completed && dayData[dayName]) {
        dayData[dayName].lessons += 1;
        dayData[dayName].xp += record.xp_earned || 50;
      }
    });

    days.forEach((day) => {
      weeklyActivity.push({
        day,
        xp: dayData[day].xp,
        lessons: dayData[day].lessons,
      });
    });

    // Build course progress data
    const courseProgress = enrollments
      .filter((enrollment) => enrollment.progress_percentage > 0 && enrollment.progress_percentage < 100)
      .slice(0, 5)
      .map((enrollment) => {
        const course =
          courseLookup.get(String(enrollment.course_id)) ||
          courseLookup.get(String(enrollment.course_slug));

        return {
          name: course?.title || enrollment.course_slug || 'Unknown Course',
          progress: Math.round(enrollment.progress_percentage || 0),
          xp: enrollment.xp_earned || 0,
        };
      });

    // Calculate skill levels based on course progress and xp
    const skillCategories: Record<string, { level: number; count: number }> = {};

    for (const enrollment of enrollments) {
      const course =
        courseLookup.get(String(enrollment.course_id)) ||
        courseLookup.get(String(enrollment.course_slug));
      if (!course) continue;

      const progress = enrollment.progress_percentage || 0;
      const track = course.track || 'General';
      const tags = course.tags || [];

      if (!skillCategories[track]) {
        skillCategories[track] = { level: 0, count: 0 };
      }
      skillCategories[track].level += progress;
      skillCategories[track].count += 1;

      const skillKeywords = ['Rust', 'Anchor', 'Frontend', 'Security', 'DeFi', 'NFT', 'Web3'];
      for (const tag of tags) {
        const matchedSkill = skillKeywords.find((skill) =>
          tag.toLowerCase().includes(skill.toLowerCase())
        );
        if (!matchedSkill) continue;

        if (!skillCategories[matchedSkill]) {
          skillCategories[matchedSkill] = { level: 0, count: 0 };
        }
        skillCategories[matchedSkill].level += progress;
        skillCategories[matchedSkill].count += 1;
      }
    }

    const skillRadar = Object.entries(skillCategories)
      .map(([skill, data]) => ({
        skill,
        level: Math.min(100, Math.round(data.level / data.count)),
      }))
      .sort((a, b) => b.level - a.level)
      .slice(0, 5);

    // Generate key insights based only on computed database metrics
    const insights: string[] = [];

    if (currentRangeXP > 0) {
      insights.push(`You earned ${currentRangeXP} XP in this ${timeRange}.`);
    } else {
      insights.push(`No XP earned in this ${timeRange} yet — complete a lesson to get started.`);
    }

    const activeDays = Object.values(dayData).filter((d: any) => d.lessons > 0).length;
    insights.push(`You were active on ${activeDays} of the last 7 days.`);

    if (skillRadar.length > 0) {
      const strongestSkill = skillRadar[0];
      insights.push(`Your strongest area right now is ${strongestSkill.skill} (${strongestSkill.level}/100).`);
    }

    if (activeCourses > 0) {
      insights.push(
        `You have ${activeCourses} course${activeCourses > 1 ? 's' : ''} in progress. Stay focused!`
      );
    } else if (completedCourses > 0) {
      insights.push(
        `You have completed ${completedCourses} course${completedCourses > 1 ? 's' : ''} so far.`
      );
    }

    return NextResponse.json({
      totalXP,
      totalCourses: completedCourses,
      completedCourses,
      activeCourses,
      totalLessons,
      averageTime,
      averageTimeDelta,
      rangeXP: currentRangeXP,
      xpDelta,
      streak: user.current_streak || 0,
      weeklyActivity,
      courseProgress,
      skillRadar,
      insights: insights.slice(0, 4), // Return top 4 insights
    });
  } catch (error) {
    console.error('Analytics API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics data' }, { status: 500 });
  }
}
