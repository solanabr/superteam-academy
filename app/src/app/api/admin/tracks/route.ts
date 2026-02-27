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

// GET /api/admin/tracks - List all learning tracks
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

    const tracks = await Track.find().sort({ order: 1 }).lean();

    // Fetch course counts for each track
    const tracksWithCounts = await Promise.all(
      tracks.map(async (track: any) => {
        const courseCount = await Course.countDocuments({
          $or: [{ track: track.slug }, { slug: { $in: track.courseIds || [] } }],
        });
        return {
          ...track,
          courseCount,
        };
      })
    );

    return NextResponse.json({ tracks: tracksWithCounts });
  } catch (error) {
    console.error('Admin GET /api/admin/tracks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/tracks - Create a new learning track
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
    const { title, slug, description, thumbnail, icon, color, order, courseIds, published } = body;

    // Validate required fields
    if (!title || !slug) {
      return NextResponse.json({ error: 'Title and slug are required' }, { status: 400 });
    }

    // Check if slug already exists
    const existingTrack = await Track.findOne({ slug });
    if (existingTrack) {
      return NextResponse.json({ error: 'A track with this slug already exists' }, { status: 409 });
    }

    const trackId = `track-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const track = await Track.create({
      id: trackId,
      slug,
      title,
      description: description || '',
      thumbnail: thumbnail || '',
      icon: icon || '',
      color: color || '#3B82F6',
      order: order ?? 0,
      courseIds: courseIds || [],
      published: published ?? false,
    });

    // Update courses to reference this track
    if (courseIds && courseIds.length > 0) {
      await Course.updateMany({ slug: { $in: courseIds } }, { $set: { track: slug } });
    }

    return NextResponse.json(
      {
        success: true,
        track: track.toObject(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Admin POST /api/admin/tracks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
