import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { Course, User } from '@/models';
import mongoose from 'mongoose';

// Define Track schema inline since it may not exist
const TrackSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  thumbnail: { type: String, default: '' },
  icon: { type: String, default: '' },
  color: { type: String, default: '#3B82F6' },
  order: { type: Number, default: 0 },
  courseIds: [{ type: String }],
  published: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Get or create Track model
const Track = mongoose.models.Track || mongoose.model('Track', TrackSchema);

// Helper to check if user is admin
async function isAdmin(email: string): Promise<boolean> {
  const user = await User.findOne({ email }).lean();
  return user?.role === 'admin' || user?.role === 'super_admin';
}

// GET /api/admin/tracks/[slug] - Get single track with courses
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

    const track = await Track.findOne({ slug }).lean();
    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    // Fetch courses in this track
    const courses = await Course.find({
      $or: [{ track: slug }, { slug: { $in: (track as any).courseIds || [] } }],
    })
      .select('slug title thumbnail difficulty duration lessonsCount published')
      .sort({ order: 1 })
      .lean();

    return NextResponse.json({
      track,
      courses,
    });
  } catch (error) {
    console.error('Admin GET /api/admin/tracks/[slug] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/tracks/[slug] - Update a track
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

    const track = await Track.findOne({ slug });
    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    // If slug is being changed, check it doesn't conflict
    if (body.slug && body.slug !== slug) {
      const existingTrack = await Track.findOne({ slug: body.slug });
      if (existingTrack) {
        return NextResponse.json(
          { error: 'A track with this slug already exists' },
          { status: 409 }
        );
      }
    }

    const { title, description, thumbnail, icon, color, order, courseIds, published } = body;

    const updateData: any = {
      updated_at: new Date(),
    };

    if (body.slug !== undefined) updateData.slug = body.slug;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (thumbnail !== undefined) updateData.thumbnail = thumbnail;
    if (icon !== undefined) updateData.icon = icon;
    if (color !== undefined) updateData.color = color;
    if (order !== undefined) updateData.order = order;
    if (courseIds !== undefined) updateData.courseIds = courseIds;
    if (published !== undefined) updateData.published = published;

    // Update track reference on courses if courseIds changed
    if (courseIds !== undefined) {
      // Remove track from old courses
      await Course.updateMany({ track: slug }, { $unset: { track: '' } });

      // Add track to new courses
      const newSlug = body.slug || slug;
      if (courseIds.length > 0) {
        await Course.updateMany({ slug: { $in: courseIds } }, { $set: { track: newSlug } });
      }
    }

    const updatedTrack = await Track.findOneAndUpdate(
      { slug },
      { $set: updateData },
      { returnDocument: 'after' }
    ).lean();

    return NextResponse.json({
      success: true,
      track: updatedTrack,
    });
  } catch (error) {
    console.error('Admin PUT /api/admin/tracks/[slug] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/tracks/[slug] - Delete a track
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

    const track = await Track.findOneAndDelete({ slug });
    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    // Remove track reference from all courses
    await Course.updateMany({ track: slug }, { $unset: { track: '' } });

    return NextResponse.json({
      success: true,
      message: 'Track deleted successfully',
    });
  } catch (error) {
    console.error('Admin DELETE /api/admin/tracks/[slug] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
