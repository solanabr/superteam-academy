import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { CourseEnrollment, User } from '@/models';
import { CourseService } from '@/services/course.service';
import { ProgressService } from '@/services/progress.service';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseSlug } = await request.json();
    if (!courseSlug) {
      return NextResponse.json({ error: 'Course slug is required' }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findOne({ email: session.user.email });
    if (!user?._id) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const course = await CourseService.getCourseBySlug(courseSlug);
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const existingEnrollment = await CourseEnrollment.findOne({
      user_id: user._id,
      course_slug: course.slug,
    });

    if (existingEnrollment) {
      return NextResponse.json({
        success: true,
        alreadyEnrolled: true,
        enrollment: {
          id: existingEnrollment._id.toString(),
          courseId: existingEnrollment.course_id,
          courseSlug: existingEnrollment.course_slug,
          progress: existingEnrollment.progress_percentage,
          enrolled: true,
        },
      });
    }

    const totalLessons = (course.modules || []).reduce(
      (acc: number, module: any) => acc + (module.lessons?.length || 0),
      0
    );
    const totalChallenges = (course.modules || []).reduce(
      (acc: number, module: any) =>
        acc + (module.lessons || []).filter((lesson: any) => lesson.type === 'challenge').length,
      0
    );

    const enrollment = await ProgressService.enrollInCourse(
      user._id.toString(),
      course.id,
      course.slug,
      totalLessons,
      totalChallenges
    );

    return NextResponse.json({
      success: true,
      enrollment: {
        id: enrollment._id.toString(),
        courseId: enrollment.course_id,
        courseSlug: enrollment.course_slug,
        progress: enrollment.progress_percentage,
        enrolled: true,
      },
    });
  } catch (error) {
    console.error('POST /api/discover/enroll error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
