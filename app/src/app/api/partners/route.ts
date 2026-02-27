import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Partner } from '@/models';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET all partners (admin)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const partners = await Partner.find({}).sort({ order: 1, created_at: -1 }).lean();

    return NextResponse.json(partners);
  } catch (error) {
    console.error('Error fetching partners:', error);
    return NextResponse.json({ error: 'Failed to fetch partners' }, { status: 500 });
  }
}

// POST create new partner
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const body = await request.json();

    const { name, logo_url, website_url, is_active, order } = body;

    if (!name || !logo_url) {
      return NextResponse.json({ error: 'Name and logo_url are required' }, { status: 400 });
    }

    const partner = new Partner({
      name,
      logo_url,
      website_url,
      is_active: is_active !== false,
      order: order || 0,
    });

    await partner.save();

    return NextResponse.json(partner, { status: 201 });
  } catch (error) {
    console.error('Error creating partner:', error);
    return NextResponse.json({ error: 'Failed to create partner' }, { status: 500 });
  }
}
