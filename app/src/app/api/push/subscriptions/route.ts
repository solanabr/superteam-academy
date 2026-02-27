import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';

// Get or create PushSubscription model
function getPushSubscriptionModel() {
  if (mongoose.models.PushSubscription) {
    return mongoose.models.PushSubscription;
  }

  const PushSubscriptionSchema = new mongoose.Schema(
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
      endpoint: { type: String, required: true, unique: true },
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
      userAgent: { type: String },
    },
    { timestamps: true }
  );

  return mongoose.model('PushSubscription', PushSubscriptionSchema);
}

/**
 * GET - Get user's push subscriptions
 * POST - Subscribe to push notifications
 * DELETE - Unsubscribe from push notifications
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const PushSubscription = getPushSubscriptionModel();

    const subscriptions = await PushSubscription.find({
      user: new mongoose.Types.ObjectId(session.user.id),
    } as any).lean();

    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error('Error fetching push subscriptions:', error);
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const PushSubscription = getPushSubscriptionModel();

    const body = await request.json();
    const { subscription } = body;

    if (
      !subscription ||
      !subscription.endpoint ||
      !subscription.keys ||
      !subscription.keys.p256dh ||
      !subscription.keys.auth
    ) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
    }

    // Check if subscription already exists
    const existing = await PushSubscription.findOne({
      endpoint: subscription.endpoint,
    } as any);

    if (existing) {
      // Update user if subscription moved to different account
      if (existing.user.toString() !== session.user.id) {
        await PushSubscription.updateOne(
          { endpoint: subscription.endpoint } as any,
          { user: new mongoose.Types.ObjectId(session.user.id) } as any
        );
      }
    } else {
      // Create new subscription
      await PushSubscription.create({
        user: new mongoose.Types.ObjectId(session.user.id),
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent: request.headers.get('user-agent'),
      });
    }

    return NextResponse.json({ message: 'Subscription saved successfully' });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const PushSubscription = getPushSubscriptionModel();

    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
    }

    const result = await PushSubscription.deleteOne({
      endpoint,
      user: new mongoose.Types.ObjectId(session.user.id),
    } as any);

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Subscription deleted successfully' });
  } catch (error) {
    console.error('Error deleting push subscription:', error);
    return NextResponse.json({ error: 'Failed to delete subscription' }, { status: 500 });
  }
}
