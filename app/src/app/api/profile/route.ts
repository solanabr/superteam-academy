import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import {
  User,
  CourseEnrollment,
  UserAchievement,
  UserProgress,
  Certificate,
  Course,
} from '@/models';
import mongoose from 'mongoose';
import { XPIndexingService } from '@/lib/services/xp-indexing.service';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Find user by email
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const indexedUser = await XPIndexingService.indexUser(user._id.toString());
    const effectiveTotalXp = indexedUser?.totalXp ?? user.total_xp ?? 0;
    const effectiveLevel = Math.floor(Math.sqrt(effectiveTotalXp / 100));

    // Get user's achievements
    const achievements = await UserAchievement.find({ user_id: user._id }).sort({ earned_at: -1 });

    // Get user's certificates
    const certificates = await Certificate.find({ user_id: user._id })
      .sort({ issued_at: -1 })
      .lean();

    // Get all enrolled courses (including in-progress and completed)
    const allEnrollments = await CourseEnrollment.find({ user_id: user._id })
      .sort({ created_at: -1 })
      .lean();

    const enrollmentCourseIds = [...new Set(allEnrollments.map((e: any) => String(e.course_id)))];
    const enrollmentCourseSlugs = [
      ...new Set(allEnrollments.map((e: any) => String(e.course_slug)).filter(Boolean)),
    ];
    const objectCourseIds = enrollmentCourseIds
      .filter((courseId) => mongoose.Types.ObjectId.isValid(courseId))
      .map((courseId) => new mongoose.Types.ObjectId(courseId));

    const enrolledCourses = await Course.find({
      $or: [
        { id: { $in: enrollmentCourseIds } },
        { slug: { $in: enrollmentCourseSlugs } },
        { _id: { $in: objectCourseIds } },
      ],
    }).lean();

    const courseLookup = new Map<string, any>();
    for (const course of enrolledCourses) {
      courseLookup.set(String(course.id), course);
      courseLookup.set(String(course._id), course);
      courseLookup.set(String(course.slug), course);
    }

    // Get completed courses
    const completedEnrollments = allEnrollments.filter(
      (enrollment: any) =>
        enrollment.progress_percentage === 100 || enrollment.completed_at !== null
    );

    // Calculate skill levels based on course tracks and progress
    const skillCategories: Record<string, { level: number; count: number }> = {};

    // Map courses to skill categories based on track/tags
    for (const enrollment of allEnrollments) {
      const course =
        courseLookup.get(String(enrollment.course_id)) ||
        courseLookup.get(String(enrollment.course_slug));
      if (!course) continue;

      const progress = enrollment.progress_percentage || 0;
      const track = course.track || 'General';
      const tags = course.tags || [];

      // Add skill for the track
      if (!skillCategories[track]) {
        skillCategories[track] = { level: 0, count: 0 };
      }
      skillCategories[track].level += progress;
      skillCategories[track].count += 1;

      // Add skills for specific tags that match skill categories
      const skillKeywords = [
        'Rust',
        'Anchor',
        'Frontend',
        'Security',
        'DeFi',
        'NFT',
        'Web3',
        'TypeScript',
        'Solana',
      ];
      for (const tag of tags) {
        const matchedSkill = skillKeywords.find((skill) =>
          tag.toLowerCase().includes(skill.toLowerCase())
        );
        if (matchedSkill) {
          if (!skillCategories[matchedSkill]) {
            skillCategories[matchedSkill] = { level: 0, count: 0 };
          }
          skillCategories[matchedSkill].level += progress;
          skillCategories[matchedSkill].count += 1;
        }
      }
    }

    // Convert to array and calculate average levels
    const skills = Object.entries(skillCategories)
      .map(([skill, data]) => ({
        skill,
        level: Math.min(100, Math.round(data.level / data.count)),
      }))
      .sort((a, b) => b.level - a.level)
      .slice(0, 6);

    // Get recent activity from UserProgress
    const activityHistory = await UserProgress.find({ user_id: user._id })
      .sort({ updated_at: -1 })
      .limit(20);

    // Transform data for response
    const completedCourses = completedEnrollments.map((enrollment: any) => ({
      id: courseLookup.get(String(enrollment.course_id))?._id?.toString() || '',
      title: courseLookup.get(String(enrollment.course_id))?.title || 'Unknown Course',
      slug: courseLookup.get(String(enrollment.course_id))?.slug || enrollment.course_slug || '',
      instructor: 'Unknown',
      completedAt: enrollment.completed_at || enrollment.updated_at,
      grade: Math.round(enrollment.progress_percentage || 0),
      duration: courseLookup.get(String(enrollment.course_id))?.duration || 0,
      thumbnail: courseLookup.get(String(enrollment.course_id))?.thumbnail || '',
    }));

    const activity = activityHistory.map((progress: any) => ({
      type: progress.completed ? 'lesson_completed' : 'lesson_started',
      title: progress.lesson_id || 'Lesson',
      courseId: progress.course_id,
      date: progress.updated_at,
      xp: progress.xp_earned || 0,
    }));

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        walletAddress: user.wallet_address,
        displayName: user.display_name,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatar_url,
        bio: user.bio,
        location: user.location,
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
        totalXP: effectiveTotalXp,
        level: effectiveLevel,
        coursesCompleted: user.courses_completed || 0,
        currentStreak: user.current_streak || 0,
        joinedDate: user.created_at,
        profilePublic: user.profile_public,
        showOnLeaderboard: user.show_on_leaderboard,
      },
      achievements: achievements.map((ach: any) => ({
        id: ach._id.toString(),
        name: ach.achievement_name,
        description: ach.description,
        icon: ach.icon || 'trophy',
        earned: !!ach.earned_at,
        earnedAt: ach.earned_at,
        category: ach.category || 'general',
      })),
      certificates: certificates.map((cert: any) => ({
        id: cert._id.toString(),
        courseId: cert.course_id || '',
        courseTitle: cert.course_name,
        issuedAt: cert.issued_at,
        certificateUrl: cert.metadata_uri,
        verificationCode: cert.credential_id,
      })),
      coursesEnrolled: allEnrollments.map((enrollment: any) => {
        // Try lookup by course_id first, then by course_slug as fallback
        const course =
          courseLookup.get(String(enrollment.course_id)) ||
          courseLookup.get(String(enrollment.course_slug));
        return {
          _id: enrollment._id.toString(),
          courseId: course
            ? {
                _id: course._id?.toString(),
                id: course.id,
                slug: course.slug,
                title: course.title,
                description: course.description || '',
                duration: course.duration,
                thumbnail: course.thumbnail,
                difficulty: course.difficulty,
                track: course.track,
                xpReward: course.xpReward,
                lessonsCount: course.lessonsCount,
                tags: course.tags || [],
              }
            : null,
          progress_percentage: enrollment.progress_percentage || 0,
          lessons_completed: enrollment.lessons_completed || 0,
          total_lessons: enrollment.total_lessons || 0,
          completed_at: enrollment.completed_at,
          certificate_issued: enrollment.certificate_issued || false,
          last_accessed_at: enrollment.last_accessed_at,
          created_at: enrollment.created_at,
        };
      }),
      completedCourses,
      activityHistory: activity,
      skills,
    });
  } catch (error) {
    console.error('Error fetching profile data:', error);
    return NextResponse.json({ error: 'Failed to fetch profile data' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const { profilePublic, showOnLeaderboard } = body;

    const updateData: Record<string, boolean> = {};
    if (typeof profilePublic === 'boolean') {
      updateData.profile_public = profilePublic;
    }
    if (typeof showOnLeaderboard === 'boolean') {
      updateData.show_on_leaderboard = showOnLeaderboard;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      profilePublic: user.profile_public,
      showOnLeaderboard: user.show_on_leaderboard,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
