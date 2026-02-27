import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Testimonial } from '@/models';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET all testimonials (admin)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const testimonials = await Testimonial.find({}).sort({ order: 1, created_at: -1 }).lean();

    return NextResponse.json(testimonials);
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return NextResponse.json({ error: 'Failed to fetch testimonials' }, { status: 500 });
  }
}

// POST create new testimonial
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const body = await request.json();

    const { name, role, avatar_url, content, rating, is_active, order } = body;

    if (!name || !role || !content) {
      return NextResponse.json({ error: 'Name, role, and content are required' }, { status: 400 });
    }

    const testimonial = new Testimonial({
      name,
      role,
      avatar_url,
      content,
      rating: rating || 5,
      is_active: is_active !== false,
      order: order || 0,
    });

    await testimonial.save();

    return NextResponse.json(testimonial, { status: 201 });
  } catch (error) {
    console.error('Error creating testimonial:', error);
    return NextResponse.json({ error: 'Failed to create testimonial' }, { status: 500 });
  }
}
