import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { Challenge, ChallengeProgress, User, UserStreak } from '@/models';
import mongoose from 'mongoose';

interface CompleteRequest {
  challengeId: string;
  code: string;
  testsPassed: number;
  testsTotal: number;
  executionTimeMs: number;
  timeSpentSeconds?: number;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body: CompleteRequest = await request.json();
    const { challengeId, code, testsPassed, testsTotal, executionTimeMs, timeSpentSeconds } = body;

    if (!challengeId || testsPassed === undefined || testsTotal === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: challengeId, testsPassed, testsTotal' },
        { status: 400 }
      );
    }

    // All tests must pass to complete
    if (testsPassed !== testsTotal) {
      return NextResponse.json(
        { error: 'All tests must pass to complete the challenge' },
        { status: 400 }
      );
    }

    // Get user by email to get ObjectId
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = user._id;

    // Find the challenge to get XP reward
    let xpReward = 50; // Default XP
    const challenge = await Challenge.findOne({ id: challengeId }).lean();
    if (challenge) {
      xpReward = challenge.xp_reward;
    }

    // Check if already completed
    const existingProgress = await ChallengeProgress.findOne({
      user_id: userId,
      challenge_id: challengeId,
    });

    const alreadyCompleted = existingProgress?.completed || false;

    // Update or create progress
    const progress = await ChallengeProgress.findOneAndUpdate(
      { user_id: userId, challenge_id: challengeId },
      {
        $set: {
          completed: true,
          completed_at: new Date(),
          code_submitted: code,
          tests_passed: testsPassed,
          tests_total: testsTotal,
          best_time_ms: existingProgress?.best_time_ms
            ? Math.min(existingProgress.best_time_ms, executionTimeMs)
            : executionTimeMs,
          ...(alreadyCompleted ? {} : { xp_earned: xpReward }),
        },
        $inc: {
          attempts: 1,
          time_spent_seconds: timeSpentSeconds || 0,
        },
        $setOnInsert: {
          user_id: userId,
          challenge_id: challengeId,
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    // Award XP if first completion
    let totalXp = user.total_xp || 0;
    if (!alreadyCompleted) {
      await User.findByIdAndUpdate(userId, {
        $inc: { total_xp: xpReward },
      });
      totalXp += xpReward;

      // Update streak
      await updateStreak(userId.toString(), xpReward, 1);
    }

    return NextResponse.json({
      success: true,
      firstCompletion: !alreadyCompleted,
      xpAwarded: alreadyCompleted ? 0 : xpReward,
      totalXp,
      progress: {
        completed: progress.completed,
        completedAt: progress.completed_at,
        attempts: progress.attempts,
        bestTimeMs: progress.best_time_ms,
        testsPassed: progress.tests_passed,
        testsTotal: progress.tests_total,
        xpEarned: progress.xp_earned,
      },
    });
  } catch (error) {
    console.error('Error completing challenge:', error);
    return NextResponse.json({ error: 'Failed to complete challenge' }, { status: 500 });
  }
}

async function updateStreak(
  userId: string,
  xpGained: number,
  challengesSolved: number
): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const userObjectId = new mongoose.Types.ObjectId(userId);

  let streak = await UserStreak.findOne({ user_id: userObjectId });

  if (!streak) {
    streak = new UserStreak({
      user_id: userObjectId,
      current_streak: 1,
      longest_streak: 1,
      last_activity_date: new Date(),
      streak_history: [],
    });
  }

  const lastActivity = streak.last_activity_date ? new Date(streak.last_activity_date) : null;
  lastActivity?.setHours(0, 0, 0, 0);

  const isToday = lastActivity?.getTime() === today.getTime();
  const isYesterday =
    lastActivity && today.getTime() - lastActivity.getTime() === 24 * 60 * 60 * 1000;

  if (!isToday) {
    if (isYesterday) {
      streak.current_streak += 1;
    } else {
      streak.current_streak = 1;
    }

    streak.last_activity_date = new Date();
  }

  if (streak.current_streak > streak.longest_streak) {
    streak.longest_streak = streak.current_streak;
  }

  // Update today's activity
  const todayIndex = streak.streak_history.findIndex(
    (a: { date: Date }) => new Date(a.date).toDateString() === today.toDateString()
  );

  if (todayIndex >= 0) {
    streak.streak_history[todayIndex].xp += xpGained;
    streak.streak_history[todayIndex].challenges_solved += challengesSolved;
  } else {
    streak.streak_history.push({
      date: today,
      lessons_completed: 0,
      challenges_solved: challengesSolved,
      xp: xpGained,
    });
  }

  // Keep only last 90 days
  if (streak.streak_history.length > 90) {
    streak.streak_history = streak.streak_history.slice(-90);
  }

  await streak.save();
}
