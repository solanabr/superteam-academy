import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, courseSlug } = await req.json();

    if (!walletAddress || !courseSlug) {
      return NextResponse.json({ error: 'Missing walletAddress or courseSlug' }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findOneAndUpdate(
      { walletAddress },
      { 
        $addToSet: { enrolledCourses: courseSlug },
        $set: { lastActiveDate: new Date() }
      },
      { new: true, upsert: true } // Create user if not exists (though login should have handled it)
    );

    return NextResponse.json(user);
  } catch (error) {
    console.error('Enrollment error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
