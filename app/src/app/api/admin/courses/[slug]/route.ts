import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { Course, User } from '@/models';

// Helper to check if user is admin
async function isAdmin(email: string): Promise<boolean> {
  const user = await User.findOne({ email }).lean();
  return user?.role === 'admin' || user?.role === 'super_admin';
}

// GET /api/admin/courses/[slug] - Get single course with full details
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    if (!(await isAdmin(session.user.email))) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { slug } = await params;

    const course = await Course.findOne({ slug }).lean();
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({ course });
  } catch (error) {
    console.error('Admin GET /api/admin/courses/[slug] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/courses/[slug] - Update a course
export async function PUT(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    if (!(await isAdmin(session.user.email))) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { slug } = await params;
    const body = await request.json();

    const course = await Course.findOne({ slug });
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // If slug is being changed, check it doesn't conflict
    if (body.slug && body.slug !== slug) {
      const existingCourse = await Course.findOne({ slug: body.slug });
      if (existingCourse) {
        return NextResponse.json(
          { error: 'A course with this slug already exists' },
          { status: 409 }
        );
      }
    }

    const {
      title,
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

    // Process modules if provided
    let processedModules;
    if (modules) {
      processedModules = modules.map((module: any, moduleIndex: number) => ({
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
    }

    // Update fields
    const updateData: any = {
      updated_at: new Date(),
    };

    if (body.slug !== undefined) updateData.slug = body.slug;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (thumbnail !== undefined) updateData.thumbnail = thumbnail;
    if (difficulty !== undefined) updateData.difficulty = difficulty;
    if (duration !== undefined) updateData.duration = duration;
    if (xpReward !== undefined) updateData.xpReward = xpReward;
    if (track !== undefined) updateData.track = track;
    if (tags !== undefined) updateData.tags = tags;
    if (prerequisites !== undefined) updateData.prerequisites = prerequisites;
    if (learningObjectives !== undefined) updateData.learningObjectives = learningObjectives;
    if (published !== undefined) updateData.published = published;

    if (processedModules) {
      updateData.modules = processedModules;
      updateData.modulesCount = processedModules.length;
      updateData.lessonsCount = processedModules.reduce(
        (acc: number, module: any) => acc + (module.lessons?.length || 0),
        0
      );
    }

    const updatedCourse = await Course.findOneAndUpdate(
      { slug },
      { $set: updateData },
      { returnDocument: 'after' }
    ).lean();

    return NextResponse.json({
      success: true,
      course: updatedCourse,
    });
  } catch (error) {
    console.error('Admin PUT /api/admin/courses/[slug] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/courses/[slug] - Delete a course
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    if (!(await isAdmin(session.user.email))) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { slug } = await params;

    const course = await Course.findOneAndDelete({ slug });
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    console.error('Admin DELETE /api/admin/courses/[slug] error:', error);
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
