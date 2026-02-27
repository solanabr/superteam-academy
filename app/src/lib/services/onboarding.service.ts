/**
 * Onboarding Service
 * Handles skill assessment, learning path recommendations, and profile setup
 */

import { OnboardingSession } from '@/models/OnboardingSession';
import { User } from '@/models/User';
import { UserAchievement } from '@/models/UserAchievement';
import { connectToDatabase } from '@/lib/mongodb';
import { createNotification } from '@/lib/services/notification.service';

export interface SkillAssessmentQuiz {
  id: string;
  question: string;
  options: {
    text: string;
    skillPoints: Record<'beginner' | 'intermediate' | 'advanced', number>;
    interestTags?: string[];
  }[];
}

const VALID_INTEREST_TAGS = new Set([
  'web3',
  'blockchain',
  'solana',
  'rust',
  'frontend',
  'backend',
  'devops',
  'security',
]);

const VALID_GOAL_TAGS = new Set([
  'learn_basics',
  'build_dapp',
  'contribute_to_projects',
  'get_job',
  'start_business',
  'improve_skills',
]);

export interface LearningPath {
  id: string;
  name: string;
  description: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  courses: string[];
  duration: string;
  difficulty: string;
}

// Skill Assessment Quiz Questions
export const SKILL_ASSESSMENT_QUIZ: SkillAssessmentQuiz[] = [
  {
    id: 'q1',
    question: 'What is your experience level with blockchain and Web3 technologies?',
    options: [
      {
        text: 'I have no prior experience with blockchain',
        skillPoints: { beginner: 3, intermediate: 0, advanced: 0 },
        interestTags: [],
      },
      {
        text: 'I know some basic concepts but never built anything',
        skillPoints: { beginner: 1, intermediate: 2, advanced: 0 },
        interestTags: ['blockchain'],
      },
      {
        text: 'I have built simple projects or contributed to hackathons',
        skillPoints: { beginner: 0, intermediate: 3, advanced: 0 },
        interestTags: ['blockchain', 'solana'],
      },
      {
        text: 'I have professional experience and shipped production apps',
        skillPoints: { beginner: 0, intermediate: 0, advanced: 3 },
        interestTags: ['blockchain', 'solana', 'web3'],
      },
    ],
  },
  {
    id: 'q2',
    question: 'Which programming language are you most comfortable with?',
    options: [
      {
        text: 'JavaScript/TypeScript',
        skillPoints: { beginner: 2, intermediate: 1, advanced: 0 },
        interestTags: ['frontend'],
      },
      {
        text: 'Python or Go',
        skillPoints: { beginner: 1, intermediate: 2, advanced: 1 },
        interestTags: ['backend'],
      },
      {
        text: 'Rust (or learning it)',
        skillPoints: { beginner: 0, intermediate: 2, advanced: 2 },
        interestTags: ['rust', 'solana'],
      },
      {
        text: 'Multiple languages / Just getting started',
        skillPoints: { beginner: 3, intermediate: 0, advanced: 0 },
        interestTags: [],
      },
    ],
  },
  {
    id: 'q3',
    question: 'What is your primary goal in learning Web3 development?',
    options: [
      {
        text: 'Build my own dApps and products',
        skillPoints: { beginner: 1, intermediate: 2, advanced: 2 },
        interestTags: ['build_dapp'],
      },
      {
        text: 'Get a job in a Web3/blockchain company',
        skillPoints: { beginner: 2, intermediate: 2, advanced: 1 },
        interestTags: ['get_job'],
      },
      {
        text: 'Contribute to open-source projects',
        skillPoints: { beginner: 1, intermediate: 2, advanced: 2 },
        interestTags: ['contribute_to_projects'],
      },
      {
        text: 'Understand and learn the fundamentals',
        skillPoints: { beginner: 3, intermediate: 1, advanced: 0 },
        interestTags: ['learn_basics'],
      },
    ],
  },
  {
    id: 'q4',
    question: 'How much time can you dedicate to learning per week?',
    options: [
      {
        text: '5+ hours per week',
        skillPoints: { beginner: 0, intermediate: 1, advanced: 2 },
        interestTags: [],
      },
      {
        text: '2-5 hours per week',
        skillPoints: { beginner: 1, intermediate: 2, advanced: 1 },
        interestTags: [],
      },
      {
        text: '< 2 hours per week',
        skillPoints: { beginner: 2, intermediate: 1, advanced: 0 },
        interestTags: [],
      },
      {
        text: 'Flexible / Learning at my own pace',
        skillPoints: { beginner: 1, intermediate: 1, advanced: 1 },
        interestTags: [],
      },
    ],
  },
  {
    id: 'q5',
    question: 'What interests you most about Web3?',
    options: [
      {
        text: 'Smart contracts and on-chain logic',
        skillPoints: { beginner: 1, intermediate: 2, advanced: 2 },
        interestTags: ['backend', 'security'],
      },
      {
        text: 'Frontend/UI for Web3 apps',
        skillPoints: { beginner: 2, intermediate: 1, advanced: 1 },
        interestTags: ['frontend', 'web3'],
      },
      {
        text: 'Security and auditing',
        skillPoints: { beginner: 0, intermediate: 1, advanced: 3 },
        interestTags: ['security', 'backend'],
      },
      {
        text: 'Everything - I want a full-stack understanding',
        skillPoints: { beginner: 1, intermediate: 2, advanced: 2 },
        interestTags: ['web3', 'backend', 'frontend'],
      },
    ],
  },
];

// Learning Paths Database
export const LEARNING_PATHS: Record<'beginner' | 'intermediate' | 'advanced', LearningPath[]> = {
  beginner: [
    {
      id: 'path-beginner-blockchain-101',
      name: 'Blockchain Fundamentals',
      description: 'Start with the basics of blockchain, cryptography, and how Solana works',
      skillLevel: 'beginner',
      courses: ['blockchain-101', 'solana-intro', 'web3-basics'],
      duration: '4 weeks',
      difficulty: 'Beginner',
    },
    {
      id: 'path-beginner-js-web3',
      name: 'JavaScript for Web3',
      description: 'Learn JavaScript fundamentals and build your first Web3 app',
      skillLevel: 'beginner',
      courses: ['js-basics', 'web3-js', 'first-dapp'],
      duration: '6 weeks',
      difficulty: 'Beginner',
    },
  ],
  intermediate: [
    {
      id: 'path-intermediate-solana-dev',
      name: 'Solana Development',
      description: 'Build programs and interact with the Solana blockchain',
      skillLevel: 'intermediate',
      courses: ['rust-basics', 'anchor-framework', 'solana-programs'],
      duration: '8 weeks',
      difficulty: 'Intermediate',
    },
    {
      id: 'path-intermediate-dapp-builder',
      name: 'Full-Stack dApp Development',
      description: 'Build complete decentralized applications from frontend to smart contracts',
      skillLevel: 'intermediate',
      courses: ['frontend-advanced', 'smart-contracts', 'full-stack-dapp'],
      duration: '10 weeks',
      difficulty: 'Intermediate',
    },
  ],
  advanced: [
    {
      id: 'path-advanced-security',
      name: 'Smart Contract Security & Auditing',
      description: 'Master security best practices and learn to audit smart contracts',
      skillLevel: 'advanced',
      courses: ['security-advanced', 'auditing', 'exploit-analysis'],
      duration: '6 weeks',
      difficulty: 'Advanced',
    },
    {
      id: 'path-advanced-protocol-dev',
      name: 'Protocol Development',
      description: 'Design and implement your own protocols and complex systems',
      skillLevel: 'advanced',
      courses: ['protocol-design', 'advanced-rust', 'system-architecture'],
      duration: '12 weeks',
      difficulty: 'Advanced',
    },
  ],
};

/**
 * Calculate skill level from quiz answers
 */
export function calculateSkillLevel(answers: Array<{ questionId: string; optionIndex: number }>): {
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  interests: string[];
  goals: string[];
  points: Record<'beginner' | 'intermediate' | 'advanced', number>;
} {
  const points = { beginner: 0, intermediate: 0, advanced: 0 };
  const interestSet = new Set<string>();
  const goalSet = new Set<string>();

  // Process each answer
  answers.forEach(({ questionId, optionIndex }) => {
    const question = SKILL_ASSESSMENT_QUIZ.find((q) => q.id === questionId);
    if (question && question.options[optionIndex]) {
      const option = question.options[optionIndex];

      // Add skill points
      points.beginner += option.skillPoints.beginner;
      points.intermediate += option.skillPoints.intermediate;
      points.advanced += option.skillPoints.advanced;

      // Collect interests
      if (option.interestTags) {
        option.interestTags.forEach((tag) => {
          if (VALID_INTEREST_TAGS.has(tag)) {
            interestSet.add(tag);
          } else if (VALID_GOAL_TAGS.has(tag)) {
            goalSet.add(tag);
          }
        });
      }
    }
  });

  // Determine skill level based on highest score
  let skillLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
  if (points.advanced >= points.intermediate && points.advanced >= points.beginner) {
    skillLevel = 'advanced';
  } else if (points.intermediate >= points.beginner) {
    skillLevel = 'intermediate';
  }

  return {
    skillLevel,
    interests: Array.from(interestSet),
    goals: Array.from(goalSet),
    points,
  };
}

/**
 * Get recommended learning path for skill level and interests
 */
export function getRecommendedLearningPath(
  skillLevel: 'beginner' | 'intermediate' | 'advanced',
  interests: string[]
): LearningPath {
  const paths = LEARNING_PATHS[skillLevel];

  if (paths.length === 0) {
    // Fallback to beginner
    return LEARNING_PATHS.beginner[0];
  }

  // If we can match interests, return best match, otherwise return first path
  if (interests.includes('backend') && interests.includes('rust')) {
    return paths[0]; // Usually Solana dev for intermediate
  }

  return paths[0];
}

export function getLearningPathById(
  learningPathId?: string,
  skillLevel?: 'beginner' | 'intermediate' | 'advanced'
): LearningPath | null {
  if (!learningPathId) {
    return null;
  }

  if (skillLevel) {
    const scopedPath = LEARNING_PATHS[skillLevel].find((path) => path.id === learningPathId);
    if (scopedPath) {
      return scopedPath;
    }
  }

  for (const level of Object.keys(LEARNING_PATHS) as Array<
    'beginner' | 'intermediate' | 'advanced'
  >) {
    const path = LEARNING_PATHS[level].find((item) => item.id === learningPathId);
    if (path) {
      return path;
    }
  }

  return null;
}

/**
 * Create or get onboarding session for user
 */
export async function getOrCreateOnboardingSession(userId: string) {
  await connectToDatabase();

  let session = await OnboardingSession.findOne({ user_id: userId });

  if (!session) {
    session = await OnboardingSession.create({
      user_id: userId,
    });
  }

  return session;
}

/**
 * Complete skill assessment
 */
export async function completeSkillAssessment(
  userId: string,
  answers: Array<{ questionId: string; optionIndex: number }>
) {
  await connectToDatabase();

  const assessment = calculateSkillLevel(answers);
  const learningPath = getRecommendedLearningPath(assessment.skillLevel, assessment.interests);

  const session = await OnboardingSession.findOneAndUpdate(
    { user_id: userId },
    {
      skill_level: assessment.skillLevel,
      interests: assessment.interests,
      goals: assessment.goals,
      learning_path_id: learningPath.id,
      assessment_complete: true,
    },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
  );

  return {
    session,
    skillLevel: assessment.skillLevel,
    learningPath,
  };
}

/**
 * Complete profile setup
 */
export async function completeProfileSetup(
  userId: string,
  profile: {
    bio?: string;
    avatar_url?: string;
    website?: string;
    twitter?: string;
    github?: string;
    discord?: string;
  }
) {
  await connectToDatabase();

  // Update user profile
  await User.findByIdAndUpdate(userId, {
    bio: profile.bio,
    avatar_url: profile.avatar_url,
    website: profile.website,
    twitter: profile.twitter,
    github: profile.github,
    discord: profile.discord,
  });

  // Update onboarding session
  const session = await OnboardingSession.findOneAndUpdate(
    { user_id: userId },
    {
      profile_setup_complete: true,
      profile_photo_set: !!profile.avatar_url,
      bio_set: !!profile.bio,
      social_links_set: !!(profile.twitter || profile.github || profile.discord),
    },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
  );

  return session;
}

/**
 * Award first-time achievement
 */
export async function awardFirstTimeAchievement(userId: string) {
  await connectToDatabase();

  const upsertResult = await UserAchievement.updateOne(
    {
      user_id: userId,
      achievement_id: 'onboarding-complete',
    },
    {
      $setOnInsert: {
        user_id: userId,
        achievement_id: 'onboarding-complete',
        achievement_name: 'Welcome to CapySolBuild!',
        achievement_description: 'Completed the onboarding flow and set up your profile',
        achievement_icon: '🎉',
        xp_reward: 100,
        earned_at: new Date(),
      },
    },
    {
      upsert: true,
    }
  );

  const isNewAchievement = upsertResult.upsertedCount > 0;

  if (isNewAchievement) {
    await User.findByIdAndUpdate(userId, {
      $inc: { total_xp: 100 },
    });

    await createNotification({
      userId,
      type: 'achievement',
      title: 'Achievement Unlocked: Welcome to CapySolBuild!',
      message: 'You completed onboarding and earned your first achievement (+100 XP).',
      actionUrl: '/profile?tab=achievements',
      actionLabel: 'View Achievement',
    });
  }

  await OnboardingSession.findOneAndUpdate(
    { user_id: userId },
    {
      $set: {
        first_achievement_unlocked: true,
      },
    },
    {
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  const achievement = await UserAchievement.findOne({
    user_id: userId,
    achievement_id: 'onboarding-complete',
  });

  if (!achievement) {
    throw new Error('Failed to create or fetch onboarding achievement');
  }

  return achievement;
}

/**
 * Check if onboarding is complete
 */
export async function isOnboardingComplete(userId: string): Promise<boolean> {
  await connectToDatabase();

  const session = await OnboardingSession.findOne({ user_id: userId });

  if (!session) {
    return false;
  }

  const currentInterests = Array.isArray(session.interests) ? session.interests : [];
  const currentGoals = Array.isArray(session.goals) ? session.goals : [];

  const sanitizedInterests = currentInterests.filter((tag) => VALID_INTEREST_TAGS.has(tag));
  const inferredGoals = currentInterests.filter((tag) => VALID_GOAL_TAGS.has(tag));
  const mergedGoals = Array.from(new Set([...currentGoals, ...inferredGoals])).filter((tag) =>
    VALID_GOAL_TAGS.has(tag)
  );

  if (
    sanitizedInterests.length !== currentInterests.length ||
    mergedGoals.length !== currentGoals.length
  ) {
    await OnboardingSession.updateOne(
      { _id: session._id },
      {
        $set: {
          interests: sanitizedInterests,
          goals: mergedGoals,
        },
      }
    );
  }

  const hasFinishedSteps =
    session.assessment_complete && session.profile_setup_complete && session.first_achievement_unlocked;

  if (!hasFinishedSteps) {
    return false;
  }

  if (!session.completed_at) {
    await OnboardingSession.updateOne(
      { _id: session._id },
      {
        $set: {
          completed_at: new Date(),
        },
      }
    );
  }

  return true;
}

/**
 * Get onboarding progress
 */
export async function getOnboardingProgress(userId: string) {
  await connectToDatabase();

  const session = await OnboardingSession.findOne({ user_id: userId });

  if (!session) {
    return {
      started: false,
      assessmentComplete: false,
      profileSetupComplete: false,
      achievementUnlocked: false,
      overallProgress: 0,
    };
  }

  const steps = {
    assessment: session.assessment_complete ? 1 : 0,
    profile: session.profile_setup_complete ? 1 : 0,
    achievement: session.first_achievement_unlocked ? 1 : 0,
  };

  const totalSteps = 3;
  const completedSteps = steps.assessment + steps.profile + steps.achievement;
  const overallProgress = (completedSteps / totalSteps) * 100;
  const learningPathData = getLearningPathById(
    session.learning_path_id,
    session.skill_level as 'beginner' | 'intermediate' | 'advanced'
  );

  return {
    started: true,
    assessmentComplete: session.assessment_complete,
    profileSetupComplete: session.profile_setup_complete,
    achievementUnlocked: session.first_achievement_unlocked,
    interests: session.interests || [],
    goals: session.goals || [],
    skillLevel: session.skill_level,
    learningPath: session.learning_path_id,
    learningPathData,
    overallProgress: Math.round(overallProgress),
    completedAt: session.completed_at,
  };
}
