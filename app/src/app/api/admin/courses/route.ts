import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { Course, User } from '@/models';
import mongoose from 'mongoose';

// Helper to check if user is admin
async function isAdmin(email: string): Promise<boolean> {
  const user = await User.findOne({ email }).lean();
  return user?.role === 'admin' || user?.role === 'super_admin';
}

// GET /api/admin/courses - List all courses for admin
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    if (!(await isAdmin(session.user.email))) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const track = searchParams.get('track');
    const difficulty = searchParams.get('difficulty');

    const query: any = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    if (track) query.track = track;
    if (difficulty) query.difficulty = difficulty;

    const [courses, total, tracks] = await Promise.all([
      Course.find(query)
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Course.countDocuments(query),
      Course.distinct('track', { track: { $ne: null } }),
    ]);

    return NextResponse.json({
      courses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      filters: {
        tracks: tracks.filter(Boolean),
        difficulties: ['beginner', 'intermediate', 'advanced'],
      },
    });
  } catch (error) {
    console.error('Admin GET /api/admin/courses error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/courses - Create a new course
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    if (!(await isAdmin(session.user.email))) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      slug,
      description,
      thumbnail,
      difficulty,
      duration,
      xpReward,
      track,
      tags,
      prerequisites,
      learningObjectives,
      modules,
      published,
    } = body;

    // Validate required fields
    if (!title || !slug) {
      return NextResponse.json({ error: 'Title and slug are required' }, { status: 400 });
    }

    // Check if slug already exists
    const existingCourse = await Course.findOne({ slug });
    if (existingCourse) {
      return NextResponse.json(
        { error: 'A course with this slug already exists' },
        { status: 409 }
      );
    }

    // Generate unique ID
    const courseId = `course-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Calculate lesson count and module count
    const processedModules = (modules || []).map((module: any, moduleIndex: number) => ({
      id: module.id || `module-${Date.now()}-${moduleIndex}`,
      title: module.title,
      description: module.description || '',
      order: module.order ?? moduleIndex + 1,
      lessons: (module.lessons || []).map((lesson: any, lessonIndex: number) => ({
        id: lesson.id || `lesson-${Date.now()}-${moduleIndex}-${lessonIndex}`,
        slug: lesson.slug || generateSlug(lesson.title),
        title: lesson.title,
        type: lesson.type || 'content',
        order: lesson.order ?? lessonIndex + 1,
        moduleId: module.id || `module-${Date.now()}-${moduleIndex}`,
        xpReward: lesson.xpReward || 50,
        duration: lesson.duration || 10,
        content: lesson.content || '',
        videoUrl: lesson.videoUrl || null,
        videoProvider: lesson.videoProvider || null,
        hints: lesson.hints || [],
      })),
    }));

    const lessonsCount = processedModules.reduce(
      (acc: number, module: any) => acc + (module.lessons?.length || 0),
      0
    );

    const course = await Course.create({
      id: courseId,
      slug,
      title,
      description: description || '',
      thumbnail: thumbnail || '',
      difficulty: difficulty || 'beginner',
      duration: duration || 0,
      xpReward: xpReward || 500,
      track: track || null,
      tags: tags || [],
      prerequisites: prerequisites || [],
      learningObjectives: learningObjectives || [],
      modules: processedModules,
      lessonsCount,
      modulesCount: processedModules.length,
      published: published ?? false,
    });

    return NextResponse.json(
      {
        success: true,
        course: course.toObject(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Admin POST /api/admin/courses error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
