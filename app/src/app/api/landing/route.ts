import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User, Course, Certificate, CourseEnrollment, Testimonial, Partner } from '@/models';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // Revalidate every 5 minutes

export interface LandingStats {
  activeUsers: number;
  totalCourses: number;
  totalCompletions: number;
  totalXP: number;
}

export interface LandingPath {
  id: string;
  slug: string;
  title: string;
  description: string;
  courses: number;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  lessonsCount: number;
}

export interface LandingTestimonial {
  id: string;
  name: string;
  role: string;
  avatar_url?: string;
  content: string;
  rating: number;
}

export interface LandingPartner {
  id: string;
  name: string;
  logo_url: string;
  website_url?: string;
}

export interface LandingPageData {
  stats: LandingStats;
  learningPaths: LandingPath[];
  testimonials: LandingTestimonial[];
  partners: LandingPartner[];
  useApiData: boolean; // True when platform has 100+ users
  totalUsers: number;
}

export async function GET() {
  try {
    await connectToDatabase();

    const TrackSchema = new mongoose.Schema(
      {
        id: { type: String, required: true, unique: true },
        slug: { type: String, required: true, unique: true },
        title: { type: String, required: true },
        description: { type: String, default: '' },
        order: { type: Number, default: 0 },
        courseIds: [{ type: String }],
        published: { type: Boolean, default: false },
      },
      { strict: false }
    );

    const Track = mongoose.models.Track || mongoose.model('Track', TrackSchema);

    // Get total users count
    const totalUsers = await User.countDocuments();

    // Get total courses
    const totalCourses = await Course.countDocuments();

    // Get total certificates (completions)
    const totalCertificates = await Certificate.countDocuments();

    // Get total course completions
    const totalEnrollmentCompletions = await CourseEnrollment.countDocuments({
      completed: true,
    });

    const totalCompletions = totalCertificates + totalEnrollmentCompletions;

    // Aggregate total XP from all users
    const xpResult = await User.aggregate([
      {
        $group: {
          _id: null,
          totalXP: { $sum: '$total_xp' },
        },
      },
    ]);
    const totalXP = xpResult[0]?.totalXP || 0;

    const tracks = await Track.find({ published: true }).sort({ order: 1 }).lean();

    const trackDocs =
      tracks.length > 0 ? tracks : await Track.find({}).sort({ order: 1, created_at: -1 }).lean();

    const learningPaths: LandingPath[] = await Promise.all(
      trackDocs.map(async (track: any) => {
        const trackSlug = track.slug || '';

        const linkedCourses = await Course.find({
          $or: [{ track: trackSlug }, { slug: { $in: track.courseIds || [] } }],
        })
          .select('difficulty duration lessonsCount')
          .lean();

        const courseCount = linkedCourses.length;
        const totalMinutes = linkedCourses.reduce((sum: number, c: any) => sum + (c.duration || 0), 0);
        const totalLessons = linkedCourses.reduce(
          (sum: number, c: any) => sum + (c.lessonsCount || 0),
          0
        );

        const difficultyCounts = linkedCourses.reduce(
          (acc: Record<string, number>, c: any) => {
            const key = c.difficulty || 'beginner';
            acc[key] = (acc[key] || 0) + 1;
            return acc;
          },
          { beginner: 0, intermediate: 0, advanced: 0 }
        );

        const dominantDifficulty =
          (Object.entries(difficultyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as
            | 'beginner'
            | 'intermediate'
            | 'advanced') || 'beginner';

        return {
          id: track.id || track._id?.toString() || trackSlug,
          slug: trackSlug,
          title: track.title || 'Learning Path',
          description: track.description || 'Structured learning path curated by our team.',
          courses: courseCount,
          duration: formatDuration(totalMinutes),
          difficulty: dominantDifficulty,
          lessonsCount: totalLessons,
        };
      })
    );

    const stats: LandingStats = {
      activeUsers: totalUsers,
      totalCourses,
      totalCompletions,
      totalXP,
    };

    // Fetch active testimonials
    const dbTestimonials = await Testimonial.find({ is_active: true })
      .sort({ order: 1, created_at: -1 })
      .limit(6)
      .lean();

    const testimonials: LandingTestimonial[] = dbTestimonials.map((t) => ({
      id: t._id?.toString() || '',
      name: t.name,
      role: t.role,
      avatar_url: t.avatar_url,
      content: t.content,
      rating: t.rating,
    }));

    // Fetch active partners
    const dbPartners = await Partner.find({ is_active: true })
      .sort({ order: 1, created_at: -1 })
      .limit(10)
      .lean();

    const partners: LandingPartner[] = dbPartners.map((p) => ({
      id: p._id?.toString() || '',
      name: p.name,
      logo_url: p.logo_url,
      website_url: p.website_url,
    }));

    const response: LandingPageData = {
      stats,
      learningPaths,
      testimonials,
      partners,
      useApiData: totalUsers >= 100,
      totalUsers,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching landing page data:', error);
    return NextResponse.json(
      {
        stats: { activeUsers: 0, totalCourses: 0, totalCompletions: 0, totalXP: 0 },
        learningPaths: [],
        testimonials: [],
        partners: [],
        useApiData: false,
        totalUsers: 0,
      },
      { status: 500 }
    );
  }
}

function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return '1 hour';
  const hours = Math.round(minutes / 60);
  if (hours < 1) return `${minutes} mins`;
  if (hours === 1) return '1 hour';
  return `${hours} hours`;
}
