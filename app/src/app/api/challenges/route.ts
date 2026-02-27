import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { Course, Challenge, ChallengeProgress, User } from '@/models';
import { ChallengeService } from '@/services/challenge.service';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Ensure challenges are seeded
    await ChallengeService.ensureSeeded();

    // Get user by email to get ObjectId
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = user._id;

    // Get search params
    const searchParams = request.nextUrl.searchParams;
    const difficulty = searchParams.get('difficulty');
    const category = searchParams.get('category');

    // Build query for standalone challenges
    const challengeQuery: Record<string, unknown> = { is_active: true };
    if (difficulty && difficulty !== 'all') {
      challengeQuery.difficulty = difficulty;
    }
    if (category && category !== 'all') {
      challengeQuery.category = category;
    }

    // Fetch standalone challenges from Challenge collection
    const standaloneChalllenges = await Challenge.find(challengeQuery).lean();

    // Also extract challenges from courses (lessons with type 'challenge')
    const courseChallenges: Array<{
      id: string;
      slug: string;
      title: string;
      description: string;
      prompt: string;
      difficulty: string;
      category: string;
      xp_reward: number;
      time_estimate: number;
      language: string;
      starter_code: string;
      solution_code: string;
      test_cases: unknown[];
      function_name?: string;
      hints?: string[];
      course_id: string;
      course_title: string;
      lesson_id: string;
    }> = [];

    const courses = await Course.find({
      'modules.lessons.type': 'challenge',
    }).lean();

    for (const course of courses) {
      if (course.modules) {
        for (const courseModule of course.modules) {
          if (courseModule.lessons) {
            for (const lesson of courseModule.lessons) {
              if (lesson.type === 'challenge') {
                // Apply filters
                const lessonDifficulty =
                  course.difficulty === 'beginner'
                    ? 'easy'
                    : course.difficulty === 'intermediate'
                      ? 'medium'
                      : 'hard';
                if (difficulty && difficulty !== 'all' && lessonDifficulty !== difficulty) continue;
                if (category && category !== 'all' && courseModule.title !== category) continue;

                courseChallenges.push({
                  id: lesson.id,
                  slug: lesson.slug,
                  title: lesson.title,
                  description: lesson.content?.substring(0, 200) || '',
                  prompt: lesson.content || '',
                  difficulty: lessonDifficulty,
                  category: courseModule.title,
                  xp_reward: lesson.xpReward || 50,
                  time_estimate: lesson.duration || 15,
                  language: 'typescript',
                  starter_code: '',
                  solution_code: '',
                  test_cases: [],
                  hints: lesson.hints || [],
                  course_id: course.id,
                  course_title: course.title,
                  lesson_id: lesson.id,
                });
              }
            }
          }
        }
      }
    }

    // Get user progress for all challenges
    const allChallengeIds = [
      ...standaloneChalllenges.map((c) => c.id),
      ...courseChallenges.map((c) => c.id),
    ];

    const userProgress = await ChallengeProgress.find({
      user_id: userId,
      challenge_id: { $in: allChallengeIds },
    }).lean();

    const progressMap = new Map(userProgress.map((p) => [p.challenge_id, p]));

    // Merge and format challenges
    const challenges = [
      ...standaloneChalllenges.map((c) => {
        const progress = progressMap.get(c.id);
        return {
          id: c.id,
          slug: c.slug,
          title: c.title,
          description: c.description,
          difficulty: c.difficulty,
          category: c.category,
          xpReward: c.xp_reward,
          timeEstimate: c.time_estimate,
          completed: progress?.completed || false,
          attempts: progress?.attempts || 0,
          courseId: c.course_id,
          language: c.language,
          tags: c.tags,
        };
      }),
      ...courseChallenges.map((c) => {
        const progress = progressMap.get(c.id);
        return {
          id: c.id,
          slug: c.slug,
          title: c.title,
          description: c.description,
          difficulty: c.difficulty,
          category: c.category,
          xpReward: c.xp_reward,
          timeEstimate: c.time_estimate,
          completed: progress?.completed || false,
          attempts: progress?.attempts || 0,
          courseId: c.course_id,
          courseTitle: c.course_title,
          language: c.language,
        };
      }),
    ];

    // Get unique categories for filtering
    const categories = [...new Set(challenges.map((c) => c.category))];

    return NextResponse.json({
      success: true,
      challenges,
      categories,
      total: challenges.length,
      stats: {
        total: challenges.length,
        completed: challenges.filter((c) => c.completed).length,
        inProgress: challenges.filter((c) => !c.completed && c.attempts > 0).length,
        xpEarned: userProgress.reduce((sum, p) => sum + (p.xp_earned || 0), 0),
      },
    });
  } catch (error) {
    console.error('Error fetching challenges:', error);
    return NextResponse.json({ error: 'Failed to fetch challenges' }, { status: 500 });
  }
}
