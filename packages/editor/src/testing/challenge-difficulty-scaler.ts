import type { ChallengeSpec, TestCase } from "./challenge-types";

export interface DifficultyLevel {
	name: string;
	multiplier: number; // 0.5 = easier, 1.0 = normal, 2.0 = harder
	description: string;
	adjustments: DifficultyAdjustments;
}

export interface DifficultyAdjustments {
	timeLimitMultiplier: number;
	memoryLimitMultiplier: number;
	testCaseCountMultiplier: number;
	complexityMultiplier: number;
	hintReduction: number; // Number of hints to remove
	prerequisiteAddition: number; // Number of additional prerequisites
}

export interface LearnerProfile {
	userId: string;
	skillLevel: number; // 0-1, based on performance history
	preferredDifficulty: number; // 0-1, user's preferred challenge hardness
	strengths: string[]; // Topics/areas where user excels
	weaknesses: string[]; // Topics/areas needing improvement
	learningStyle: "visual" | "practical" | "theoretical" | "mixed";
	completedChallenges: CompletedChallenge[];
	currentStreak: number;
	averageScore: number;
}

export interface CompletedChallenge {
	challengeId: string;
	score: number;
	timeSpent: number;
	attempts: number;
	completedAt: Date;
	difficulty: number;
}

export interface AdaptiveChallenge {
	baseChallenge: ChallengeSpec;
	adjustedSpec: ChallengeSpec;
	difficultyLevel: DifficultyLevel;
	reasoning: string[];
	recommended: boolean;
}

const DIFFICULTY_LEVELS: DifficultyLevel[] = [
	{
		name: "Beginner",
		multiplier: 0.6,
		description: "Simplified version with extra time and hints",
		adjustments: {
			timeLimitMultiplier: 1.5,
			memoryLimitMultiplier: 1.2,
			testCaseCountMultiplier: 0.7,
			complexityMultiplier: 0.8,
			hintReduction: -1, // Add hints
			prerequisiteAddition: -1, // Remove prerequisites
		},
	},
	{
		name: "Easy",
		multiplier: 0.8,
		description: "Slightly easier with more time",
		adjustments: {
			timeLimitMultiplier: 1.2,
			memoryLimitMultiplier: 1.1,
			testCaseCountMultiplier: 0.9,
			complexityMultiplier: 0.9,
			hintReduction: 0,
			prerequisiteAddition: 0,
		},
	},
	{
		name: "Normal",
		multiplier: 1.0,
		description: "Standard difficulty",
		adjustments: {
			timeLimitMultiplier: 1.0,
			memoryLimitMultiplier: 1.0,
			testCaseCountMultiplier: 1.0,
			complexityMultiplier: 1.0,
			hintReduction: 0,
			prerequisiteAddition: 0,
		},
	},
	{
		name: "Hard",
		multiplier: 1.3,
		description: "Increased complexity and constraints",
		adjustments: {
			timeLimitMultiplier: 0.8,
			memoryLimitMultiplier: 0.9,
			testCaseCountMultiplier: 1.2,
			complexityMultiplier: 1.2,
			hintReduction: 1,
			prerequisiteAddition: 1,
		},
	},
	{
		name: "Expert",
		multiplier: 1.6,
		description: "Maximum difficulty with strict constraints",
		adjustments: {
			timeLimitMultiplier: 0.6,
			memoryLimitMultiplier: 0.8,
			testCaseCountMultiplier: 1.5,
			complexityMultiplier: 1.4,
			hintReduction: 2,
			prerequisiteAddition: 2,
		},
	},
];

export const ChallengeDifficultyScaler = {
	adaptChallengeForLearner(
		baseChallenge: ChallengeSpec,
		learnerProfile: LearnerProfile
	): AdaptiveChallenge {
		const targetDifficulty = calculateTargetDifficulty(learnerProfile);
		const difficultyLevel = selectDifficultyLevel(targetDifficulty);

		const adjustedSpec = applyDifficultyAdjustments(
			baseChallenge,
			difficultyLevel,
			learnerProfile
		);
		const reasoning = generateAdaptationReasoning(difficultyLevel, learnerProfile);

		return {
			baseChallenge,
			adjustedSpec,
			difficultyLevel,
			reasoning,
			recommended: isRecommendedForLearner(adjustedSpec, learnerProfile),
		};
	},

	generateDifficultyVariants(baseChallenge: ChallengeSpec): AdaptiveChallenge[] {
		return DIFFICULTY_LEVELS.map((level) => {
			const adjustedSpec = applyDifficultyAdjustments(baseChallenge, level);
			return {
				baseChallenge,
				adjustedSpec,
				difficultyLevel: level,
				reasoning: [`${level.name} variant created`],
				recommended: true,
			};
		});
	},
};

function calculateTargetDifficulty(profile: LearnerProfile): number {
	let targetDifficulty = (profile.skillLevel + profile.preferredDifficulty) / 2;

	const recentChallenges = profile.completedChallenges
		.filter((c) => Date.now() - c.completedAt.getTime() < 30 * 24 * 60 * 60 * 1000) // Last 30 days
		.slice(-10); // Last 10 challenges

	if (recentChallenges.length > 0) {
		const avgScore =
			recentChallenges.reduce((sum, c) => sum + c.score, 0) / recentChallenges.length;
		const scoreAdjustment = (avgScore - 70) / 100; // Adjust based on score above/below 70%
		targetDifficulty += scoreAdjustment * 0.3;
	}

	if (profile.currentStreak > 5) {
		targetDifficulty += 0.1; // Increase difficulty for good streaks
	} else if (profile.currentStreak === 0) {
		targetDifficulty -= 0.2; // Decrease difficulty after breaks
	}

	return Math.max(0, Math.min(1, targetDifficulty));
}

function selectDifficultyLevel(targetDifficulty: number): DifficultyLevel {
	const levelIndex = Math.round(targetDifficulty * (DIFFICULTY_LEVELS.length - 1));
	return DIFFICULTY_LEVELS[Math.max(0, Math.min(DIFFICULTY_LEVELS.length - 1, levelIndex))];
}

function applyDifficultyAdjustments(
	baseChallenge: ChallengeSpec,
	difficultyLevel: DifficultyLevel,
	learnerProfile?: LearnerProfile
): ChallengeSpec {
	const adjustments = difficultyLevel.adjustments;
	let adjusted: ChallengeSpec = { ...baseChallenge };

	adjusted.timeLimit = Math.round(baseChallenge.timeLimit * adjustments.timeLimitMultiplier);
	adjusted.memoryLimit = Math.round(
		baseChallenge.memoryLimit * adjustments.memoryLimitMultiplier
	);

	const targetTestCaseCount = Math.round(
		baseChallenge.testCases.length * adjustments.testCaseCountMultiplier
	);
	if (targetTestCaseCount < baseChallenge.testCases.length) {
		adjusted.testCases = baseChallenge.testCases.slice(0, Math.max(1, targetTestCaseCount));
	} else if (targetTestCaseCount > baseChallenge.testCases.length) {
		adjusted.testCases = generateAdditionalTestCases(
			baseChallenge.testCases,
			targetTestCaseCount - baseChallenge.testCases.length
		);
	}

	if (adjustments.hintReduction !== 0) {
		if (adjustments.hintReduction > 0) {
			adjusted.hints = (baseChallenge.hints || []).slice(
				0,
				Math.max(0, (baseChallenge.hints || []).length - adjustments.hintReduction)
			);
		} else {
			const additionalHints = generateAdditionalHints(
				baseChallenge,
				Math.abs(adjustments.hintReduction)
			);
			adjusted.hints = [...(baseChallenge.hints || []), ...additionalHints];
		}
	}

	if (adjustments.prerequisiteAddition !== 0 && baseChallenge.prerequisites) {
		if (adjustments.prerequisiteAddition > 0) {
			const additionalPrereqs = generateAdditionalPrerequisites(
				baseChallenge,
				adjustments.prerequisiteAddition
			);
			adjusted.prerequisites = [...baseChallenge.prerequisites, ...additionalPrereqs];
		} else {
			adjusted.prerequisites = baseChallenge.prerequisites.slice(
				0,
				Math.max(
					0,
					baseChallenge.prerequisites.length - Math.abs(adjustments.prerequisiteAddition)
				)
			);
		}
	}

	adjusted.xpReward = Math.round(baseChallenge.xpReward * difficultyLevel.multiplier);

	adjusted.title = `${baseChallenge.title} (${difficultyLevel.name})`;
	adjusted.description = `${baseChallenge.description}\n\nDifficulty: ${difficultyLevel.description}`;

	if (learnerProfile) {
		adjusted = personalizeForLearner(adjusted, learnerProfile);
	}

	return adjusted;
}

function generateAdditionalTestCases(existingTests: TestCase[], count: number): TestCase[] {
	const additionalTests: TestCase[] = [];
	const baseTest = existingTests[0]; // Use first test as template

	for (let i = 0; i < count; i++) {
		const variation = createTestVariation(baseTest, i + 1);
		additionalTests.push(variation);
	}

	return [...existingTests, ...additionalTests];
}

function createTestVariation(baseTest: TestCase, index: number): TestCase {
	return {
		...baseTest,
		id: `${baseTest.id}_var${index}`,
		description: `${baseTest.description} (Variation ${index})`,
	};
}

function generateAdditionalHints(_challenge: ChallengeSpec, count: number): string[] {
	const hints: string[] = [];
	const baseHints = [
		"Break down the problem into smaller steps.",
		"Consider edge cases in your solution.",
		"Test your code with sample inputs.",
		"Review the problem requirements carefully.",
		"Think about the most efficient approach.",
	];

	for (let i = 0; i < count; i++) {
		hints.push(baseHints[i % baseHints.length]);
	}

	return hints;
}

function generateAdditionalPrerequisites(_challenge: ChallengeSpec, count: number): string[] {
	const prereqs = [
		"basic-programming-concepts",
		"variables-and-data-types",
		"control-structures",
		"functions-and-methods",
		"basic-algorithms",
	];

	return prereqs.slice(0, count);
}

function personalizeForLearner(challenge: ChallengeSpec, profile: LearnerProfile): ChallengeSpec {
	const personalized = { ...challenge };

	if (profile.weaknesses.length > 0) {
		const weaknessHints = profile.weaknesses.map(
			(weakness) => `Remember to focus on ${weakness} concepts.`
		);
		personalized.hints = [...(personalized.hints || []), ...weaknessHints];
	}

	switch (profile.learningStyle) {
		case "visual":
			personalized.description += "\n\n💡 Try drawing a diagram of the problem.";
			break;
		case "practical":
			personalized.description += "\n\n🔧 Focus on writing working code first.";
			break;
		case "theoretical":
			personalized.description += "\n\n📚 Consider the algorithm theory behind this.";
			break;
		default:
			break;
	}

	return personalized;
}

function generateAdaptationReasoning(
	difficultyLevel: DifficultyLevel,
	profile: LearnerProfile
): string[] {
	const reasoning: string[] = [];

	reasoning.push(`Selected ${difficultyLevel.name} difficulty based on skill assessment`);

	if (profile.skillLevel < 0.3) {
		reasoning.push("Lower difficulty recommended due to beginner skill level");
	} else if (profile.skillLevel > 0.8) {
		reasoning.push("Higher difficulty appropriate for advanced skill level");
	}

	if (profile.currentStreak > 5) {
		reasoning.push("Increased difficulty to maintain engagement during learning streak");
	}

	if (profile.averageScore > 85) {
		reasoning.push("Difficulty increased based on consistently high performance");
	} else if (profile.averageScore < 60) {
		reasoning.push("Difficulty decreased to build confidence and skills");
	}

	return reasoning;
}

function isRecommendedForLearner(challenge: ChallengeSpec, profile: LearnerProfile): boolean {
	const challengeDifficulty = estimateChallengeDifficulty(challenge);
	const skillGap = Math.abs(challengeDifficulty - profile.skillLevel);

	return skillGap <= 0.3;
}

function estimateChallengeDifficulty(challenge: ChallengeSpec): number {
	let difficulty = 0.5; // Base difficulty

	if (challenge.timeLimit < 30) difficulty += 0.2; // Strict time limit
	if (challenge.memoryLimit < 64) difficulty += 0.1; // Low memory limit

	if (challenge.testCases.length > 10) difficulty += 0.1;

	difficulty += Math.min(0.2, (challenge.xpReward - 50) / 200);

	return Math.max(0, Math.min(1, difficulty));
}
