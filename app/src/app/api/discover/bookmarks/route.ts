import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { CourseBookmark, User } from '@/models';
import { CourseService } from '@/services/course.service';

export async function GET() {
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

    const bookmarks = await CourseBookmark.find({ user_id: user._id })
      .sort({ created_at: -1 })
      .lean();

    return NextResponse.json({
      bookmarks: bookmarks.map((bookmark: any) => ({
        id: bookmark._id.toString(),
        courseId: bookmark.course_id,
        courseSlug: bookmark.course_slug,
        createdAt: bookmark.created_at,
      })),
    });
  } catch (error) {
    console.error('GET /api/discover/bookmarks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    const bookmark = await CourseBookmark.findOneAndUpdate(
      { user_id: user._id, course_id: course.id },
      {
        $setOnInsert: {
          user_id: user._id,
          course_id: course.id,
          course_slug: course.slug,
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    return NextResponse.json({
      success: true,
      bookmark: {
        id: bookmark._id.toString(),
        courseId: bookmark.course_id,
        courseSlug: bookmark.course_slug,
      },
    });
  } catch (error) {
    console.error('POST /api/discover/bookmarks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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

    await CourseBookmark.deleteOne({ user_id: user._id, course_slug: courseSlug });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/discover/bookmarks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
