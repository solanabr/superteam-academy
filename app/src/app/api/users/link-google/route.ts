import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UserService } from '@/services/user.service';

export async function POST(request: NextRequest) {
  try {
    // Get current session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { googleId, email, name, image } = body;

    if (!googleId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: googleId, email' },
        { status: 400 }
      );
    }

    // Link Google account to user
    const updatedUser = await UserService.linkGoogle(
      session.user.id,
      googleId,
      email,
      name || undefined,
      image || undefined
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'Failed to link Google account' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser._id.toString(),
        google_id: updatedUser.google_id,
        display_name: updatedUser.display_name,
        avatar_url: updatedUser.avatar_url,
      },
    });
  } catch (error: unknown) {
    console.error('Error linking Google account:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to link Google account' }, { status: 500 });
  }
}
