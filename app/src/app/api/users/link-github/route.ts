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
    const { githubId, email, name, image } = body;

    if (!githubId) {
      return NextResponse.json({ error: 'Missing required field: githubId' }, { status: 400 });
    }

    // Link GitHub account to user
    const updatedUser = await UserService.linkGitHub(
      session.user.id,
      githubId,
      email || undefined,
      name || undefined,
      image || undefined
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'Failed to link GitHub account' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser._id.toString(),
        github_id: updatedUser.github_id,
        display_name: updatedUser.display_name,
        avatar_url: updatedUser.avatar_url,
      },
    });
  } catch (error: unknown) {
    console.error('Error linking GitHub account:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to link GitHub account' }, { status: 500 });
  }
}
