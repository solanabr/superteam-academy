import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User, UserAchievement, CourseEnrollment, Course } from '@/models';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    await connectToDatabase();

    // Find user by username (case-insensitive)
    const user = await User.findOne({
      username: { $regex: new RegExp(`^${username}$`, 'i') },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if profile is public
    if (!user.profile_public) {
      return NextResponse.json({ error: 'This profile is private' }, { status: 403 });
    }

    // Get user's achievements (only earned ones for public view)
    const achievements = await UserAchievement.find({
      user_id: user._id,
      earned_at: { $exists: true, $ne: null },
    }).sort({ earned_at: -1 });

    // Get completed courses
    const completedEnrollments = await CourseEnrollment.find({
      user_id: user._id,
      $or: [{ progress_percentage: 100 }, { completed_at: { $exists: true, $ne: null } }],
    })
      .sort({ completed_at: -1 })
      .lean();

    // Get course details
    const enrollmentCourseIds = [
      ...new Set(completedEnrollments.map((e: any) => String(e.course_id))),
    ];
    const enrollmentCourseSlugs = [
      ...new Set(completedEnrollments.map((e: any) => String(e.course_slug)).filter(Boolean)),
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

    // Calculate skill levels for public profile
    const allEnrollments = await CourseEnrollment.find({ user_id: user._id }).lean();
    const skillCategories: Record<string, { level: number; count: number }> = {};

    for (const enrollment of allEnrollments) {
      const course =
        courseLookup.get(String((enrollment as any).course_id)) ||
        courseLookup.get(String((enrollment as any).course_slug));
      if (!course) continue;

      const progress = (enrollment as any).progress_percentage || 0;
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
        if (matchedSkill) {
          if (!skillCategories[matchedSkill]) {
            skillCategories[matchedSkill] = { level: 0, count: 0 };
          }
          skillCategories[matchedSkill].level += progress;
          skillCategories[matchedSkill].count += 1;
        }
      }
    }

    const skills = Object.entries(skillCategories)
      .map(([skill, data]) => ({
        skill,
        level: Math.min(100, Math.round(data.level / data.count)),
      }))
      .sort((a, b) => b.level - a.level)
      .slice(0, 6);

    // Transform data for public response (limited info)
    return NextResponse.json({
      user: {
        id: user._id.toString(),
        displayName: user.display_name,
        username: user.username,
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
        totalXP: user.total_xp || 0,
        level: user.level || 1,
        coursesCompleted: user.courses_completed || 0,
        currentStreak: user.current_streak || 0,
        joinedDate: user.created_at,
      },
      achievements: achievements.map((ach: any) => ({
        id: ach._id.toString(),
        name: ach.achievement_name,
        description: ach.description,
        icon: ach.icon || 'trophy',
        earned: true,
        earnedAt: ach.earned_at,
      })),
      completedCourses: completedEnrollments.map((enrollment: any) => {
        const course =
          courseLookup.get(String(enrollment.course_id)) ||
          courseLookup.get(String(enrollment.course_slug));
        return {
          id: course?._id?.toString() || '',
          title: course?.title || 'Unknown Course',
          slug: course?.slug || enrollment.course_slug || '',
          completedAt: enrollment.completed_at || enrollment.updated_at,
        };
      }),
      skills,
    });
  } catch (error) {
    console.error('Error fetching public profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}
