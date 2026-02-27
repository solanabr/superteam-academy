import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { CourseEnrollment, CourseBookmark, User } from '@/models';
import { CourseService } from '@/services/course.service';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user?._id) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q')?.toLowerCase().trim() || '';
    const difficulty = searchParams.get('difficulty');
    const track = searchParams.get('track');

    let courses = await CourseService.getAllCourses();

    if (q) {
      courses = courses.filter(
        (course: any) =>
          course.title.toLowerCase().includes(q) ||
          course.description.toLowerCase().includes(q) ||
          (course.tags || []).some((tag: string) => tag.toLowerCase().includes(q))
      );
    }

    if (difficulty && difficulty !== 'all') {
      courses = courses.filter((course: any) => course.difficulty === difficulty);
    }

    if (track && track !== 'all') {
      courses = courses.filter((course: any) => course.track === track);
    }

    const [enrollments, bookmarks, tracks] = await Promise.all([
      CourseEnrollment.find({ user_id: user._id }).lean(),
      CourseBookmark.find({ user_id: user._id }).lean(),
      CourseService.getAllTracks(),
    ]);

    const enrollmentBySlug = new Map(
      enrollments.map((enrollment: any) => [enrollment.course_slug, enrollment])
    );
    const bookmarkedSlugs = new Set(bookmarks.map((bookmark: any) => bookmark.course_slug));

    const discoverCourses = courses.map((course: any) => {
      const enrollment = enrollmentBySlug.get(course.slug);
      return {
        ...course,
        enrolled: !!enrollment,
        enrollmentId: enrollment?._id?.toString(),
        enrollmentProgress: enrollment?.progress_percentage || 0,
        bookmarked: bookmarkedSlugs.has(course.slug),
      };
    });

    return NextResponse.json({
      courses: discoverCourses,
      tracks,
      total: discoverCourses.length,
    });
  } catch (error) {
    console.error('GET /api/discover/courses error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
