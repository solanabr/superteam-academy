import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import {
  User,
  UserProgress,
  UserStreak,
  UserAchievement,
  CourseEnrollment,
  Certificate,
  CommunityPost,
  CommunityComment,
  CommunityLike,
} from '@/models';

/**
 * DELETE /api/users/delete
 * Permanently delete user account and all associated data (GDPR compliance)
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Require confirmation in request body
    const body = await request.json().catch(() => ({}));
    if (body.confirmDelete !== 'DELETE_MY_ACCOUNT') {
      return NextResponse.json(
        { error: 'Confirmation required. Send { "confirmDelete": "DELETE_MY_ACCOUNT" }' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find the user by session ID
    const user = await User.findById(session.user.id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = user._id;

    // Delete all related data in parallel
    const deletionResults = await Promise.allSettled([
      // Learning data
      UserProgress.deleteMany({ user_id: userId }),
      UserStreak.deleteMany({ user_id: userId }),
      UserAchievement.deleteMany({ user_id: userId }),
      CourseEnrollment.deleteMany({ user_id: userId }),
      Certificate.deleteMany({ user_id: userId }),

      // Community data
      CommunityPost.deleteMany({ author_id: userId }),
      CommunityComment.deleteMany({ author_id: userId }),
      CommunityLike.deleteMany({ user_id: userId }),

      // Finally, delete the user
      User.deleteOne({ _id: userId }),
    ]);

    // Count successful deletions
    const successCount = deletionResults.filter((r) => r.status === 'fulfilled').length;
    const failedCount = deletionResults.filter((r) => r.status === 'rejected').length;

    if (failedCount > 0) {
      console.error(
        'Some deletions failed:',
        deletionResults.filter((r) => r.status === 'rejected')
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Account and all associated data have been permanently deleted',
      deletedCollections: successCount,
      note: 'Please sign out and clear your browser cache. Any on-chain credentials (NFTs) will remain on the blockchain as they are immutable.',
    });
  } catch (error) {
    console.error('DELETE /api/users/delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
