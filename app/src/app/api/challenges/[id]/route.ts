import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { Challenge, ChallengeProgress, Course, User } from '@/models';
import { ChallengeService } from '@/services/challenge.service';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Ensure challenges are seeded
    await ChallengeService.ensureSeeded();

    const { id } = await params;

    // Get user by email to get ObjectId
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = user._id;

    // First try to find in Challenge collection
    let challenge = await Challenge.findOne({
      $or: [{ id }, { slug: id }],
      is_active: true,
    }).lean();

    let source = 'standalone';

    // If not found, search in course lessons
    if (!challenge) {
      const courses = await Course.find({
        'modules.lessons.id': id,
      }).lean();

      for (const course of courses) {
        if (course.modules) {
          for (const courseModule of course.modules) {
            if (courseModule.lessons) {
              const lesson = courseModule.lessons.find((l) => l.id === id && l.type === 'challenge');
              if (lesson) {
                const lessonDifficulty =
                  course.difficulty === 'beginner'
                    ? 'easy'
                    : course.difficulty === 'intermediate'
                      ? 'medium'
                      : 'hard';

                challenge = {
                  _id: null,
                  id: lesson.id,
                  slug: lesson.slug,
                  title: lesson.title,
                  description: lesson.content?.substring(0, 200) || '',
                  prompt: lesson.content || 'Complete the challenge below.',
                  difficulty: lessonDifficulty,
                  category: courseModule.title,
                  xp_reward: lesson.xpReward || 50,
                  time_estimate: lesson.duration || 15,
                  language: 'typescript',
                  starter_code: getDefaultStarterCode('typescript'),
                  solution_code: '',
                  test_cases: getDefaultTestCases(lesson.title),
                  function_name: 'solution',
                  hints: lesson.hints || [],
                  tags: [],
                  course_id: course.id,
                  lesson_id: lesson.id,
                  is_active: true,
                  created_at: new Date(),
                  updated_at: new Date(),
                } as any;
                source = 'course';
                break;
              }
            }
          }
          if (challenge) break;
        }
      }
    }

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    // Get user progress for this challenge
    const progress = await ChallengeProgress.findOne({
      user_id: userId,
      challenge_id: challenge.id,
    }).lean();

    return NextResponse.json({
      success: true,
      challenge: {
        id: challenge.id,
        slug: challenge.slug,
        title: challenge.title,
        description: challenge.description,
        prompt: challenge.prompt,
        difficulty: challenge.difficulty,
        category: challenge.category,
        xpReward: challenge.xp_reward,
        timeEstimate: challenge.time_estimate,
        language: challenge.language || 'typescript',
        starterCode: challenge.starter_code,
        solutionCode: challenge.solution_code,
        testCases: challenge.test_cases,
        functionName: challenge.function_name,
        hints: challenge.hints,
        tags: challenge.tags,
        courseId: challenge.course_id,
        lessonId: challenge.lesson_id,
      },
      progress: progress
        ? {
            completed: progress.completed,
            completedAt: progress.completed_at,
            attempts: progress.attempts,
            bestTimeMs: progress.best_time_ms,
            codeSubmitted: progress.code_submitted,
            testsPassed: progress.tests_passed,
            testsTotal: progress.tests_total,
            xpEarned: progress.xp_earned,
          }
        : null,
      source,
    });
  } catch (error) {
    console.error('Error fetching challenge:', error);
    return NextResponse.json({ error: 'Failed to fetch challenge' }, { status: 500 });
  }
}

function getDefaultStarterCode(language: string): string {
  switch (language) {
    case 'typescript':
    case 'javascript':
      return `// Write your solution here
function solution(input) {
  // Your code here
  return input;
}

// Export for testing
module.exports = { solution };
`;
    case 'rust':
      return `// Write your solution here
fn solution(input: i32) -> i32 {
    // Your code here
    input
}
`;
    default:
      return '// Write your solution here\n';
  }
}

function getDefaultTestCases(title: string): Array<{
  id: string;
  description: string;
  input: unknown;
  expectedOutput: unknown;
  hidden?: boolean;
}> {
  return [
    {
      id: 'test-1',
      description: 'Basic test case',
      input: 1,
      expectedOutput: 1,
      hidden: false,
    },
    {
      id: 'test-2',
      description: 'Edge case with zero',
      input: 0,
      expectedOutput: 0,
      hidden: false,
    },
    {
      id: 'test-3',
      description: 'Hidden test case',
      input: 10,
      expectedOutput: 10,
      hidden: true,
    },
  ];
}
