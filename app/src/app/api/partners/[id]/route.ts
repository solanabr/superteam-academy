import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Partner } from '@/models';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// PUT update partner
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();
    const body = await request.json();

    const partner = await Partner.findByIdAndUpdate(id, { $set: body }, { returnDocument: 'after' });

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    return NextResponse.json(partner);
  } catch (error) {
    console.error('Error updating partner:', error);
    return NextResponse.json({ error: 'Failed to update partner' }, { status: 500 });
  }
}

// DELETE partner
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    const partner = await Partner.findByIdAndDelete(id);

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting partner:', error);
    return NextResponse.json({ error: 'Failed to delete partner' }, { status: 500 });
  }
}
