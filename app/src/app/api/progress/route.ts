import { NextRequest, NextResponse } from 'next/server';

// In-memory store for demo purposes
// In production, this would be a database (Postgres, MongoDB, etc.)
// or on-chain storage via Solana
const progressStore = new Map<string, UserProgress>();

interface LessonProgress {
  lessonId: string;
  courseSlug: string;
  completed: boolean;
  completedAt?: string;
  xpEarned: number;
  attempts: number;
  lastAttemptAt: string;
}

interface UserProgress {
  walletAddress: string;
  totalXP: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityAt: string;
  completedLessons: LessonProgress[];
  completedCourses: string[];
  achievements: string[];
}

// GET /api/progress?wallet=<address>
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const wallet = searchParams.get('wallet');

  if (!wallet) {
    return NextResponse.json(
      { error: 'Wallet address required' },
      { status: 400 }
    );
  }

  const progress = progressStore.get(wallet);

  if (!progress) {
    // Return default progress for new users
    return NextResponse.json({
      walletAddress: wallet,
      totalXP: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastActivityAt: null,
      completedLessons: [],
      completedCourses: [],
      achievements: []
    });
  }

  return NextResponse.json(progress);
}

// POST /api/progress
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, lessonId, courseSlug, xpEarned } = body;

    if (!walletAddress || !lessonId || !courseSlug) {
      return NextResponse.json(
        { error: 'walletAddress, lessonId, and courseSlug are required' },
        { status: 400 }
      );
    }

    // Get or create user progress
    let progress = progressStore.get(walletAddress);
    const now = new Date().toISOString();

    if (!progress) {
      progress = {
        walletAddress,
        totalXP: 0,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityAt: now,
        completedLessons: [],
        completedCourses: [],
        achievements: []
      };
    }

    // Check if lesson already completed
    const existingLesson = progress.completedLessons.find(
      (l) => l.lessonId === lessonId && l.courseSlug === courseSlug
    );

    if (existingLesson) {
      // Update attempt count
      existingLesson.attempts += 1;
      existingLesson.lastAttemptAt = now;
    } else {
      // Add new lesson completion
      progress.completedLessons.push({
        lessonId,
        courseSlug,
        completed: true,
        completedAt: now,
        xpEarned: xpEarned || 50,
        attempts: 1,
        lastAttemptAt: now
      });

      // Add XP
      progress.totalXP += xpEarned || 50;

      // Update streak logic
      const lastActivity = progress.lastActivityAt ? new Date(progress.lastActivityAt) : null;
      const today = new Date();
      const oneDayAgo = new Date(today.getTime() - 24 * 60 * 60 * 1000);

      if (lastActivity && lastActivity >= oneDayAgo) {
        // Continuing streak
        const lastActivityDate = lastActivity.toDateString();
        const todayDate = today.toDateString();
        if (lastActivityDate !== todayDate) {
          progress.currentStreak += 1;
          if (progress.currentStreak > progress.longestStreak) {
            progress.longestStreak = progress.currentStreak;
          }
        }
      } else if (!lastActivity || lastActivity < oneDayAgo) {
        // Streak broken or first activity
        progress.currentStreak = 1;
      }

      // Check for achievements
      checkAchievements(progress);
    }

    progress.lastActivityAt = now;
    progressStore.set(walletAddress, progress);

    return NextResponse.json({
      success: true,
      progress,
      newXP: xpEarned || 50,
      totalXP: progress.totalXP
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}

function checkAchievements(progress: UserProgress): void {
  const achievements = progress.achievements;

  // First lesson
  if (progress.completedLessons.length === 1 && !achievements.includes('first_lesson')) {
    achievements.push('first_lesson');
  }

  // 10 lessons
  if (progress.completedLessons.length >= 10 && !achievements.includes('ten_lessons')) {
    achievements.push('ten_lessons');
  }

  // 100 XP
  if (progress.totalXP >= 100 && !achievements.includes('xp_100')) {
    achievements.push('xp_100');
  }

  // 500 XP
  if (progress.totalXP >= 500 && !achievements.includes('xp_500')) {
    achievements.push('xp_500');
  }

  // 7-day streak
  if (progress.currentStreak >= 7 && !achievements.includes('streak_7')) {
    achievements.push('streak_7');
  }

  // 30-day streak
  if (progress.currentStreak >= 30 && !achievements.includes('streak_30')) {
    achievements.push('streak_30');
  }
}
