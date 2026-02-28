import type { ChallengeSpec, TestResult } from "./challenge-types";

export interface CheatDetectionResult {
	isSuspicious: boolean;
	confidence: number; // 0-1
	flags: CheatFlag[];
	recommendations: string[];
}

export interface CheatFlag {
	type: "timing" | "pattern" | "similarity" | "resource" | "behavior";
	severity: "low" | "medium" | "high" | "critical";
	description: string;
	evidence: unknown;
}

export interface SubmissionPattern {
	userId: string;
	challengeId: string;
	submissionTime: Date;
	executionTime: number;
	codeLength: number;
	testResults: TestResult[];
}

export class AntiCheatSystem {
	private static readonly SUSPICIOUS_TIME_THRESHOLD = 100; // ms - suspiciously fast
	private static readonly PERFECT_SCORE_STREAK_LIMIT = 5;
	private static readonly SIMILARITY_THRESHOLD = 0.85; // 85% similar
	private static readonly PATTERN_ANALYSIS_WINDOW = 24 * 60 * 60 * 1000; // 24 hours

	private submissionHistory: Map<string, SubmissionPattern[]> = new Map();
	private codeSignatures: Map<string, string[]> = new Map();

	detectCheating(
		userId: string,
		challengeSpec: ChallengeSpec,
		code: string,
		executionResult: { testResults: TestResult[]; executionTime: number }
	): CheatDetectionResult {
		const flags: CheatFlag[] = [];

		const timingFlags = this.analyzeTiming(userId, challengeSpec, executionResult);
		flags.push(...timingFlags);

		const patternFlags = this.analyzePatterns(userId, challengeSpec, executionResult);
		flags.push(...patternFlags);

		const similarityFlags = this.analyzeCodeSimilarity(challengeSpec.id, code);
		flags.push(...similarityFlags);

		const resourceFlags = this.analyzeResourceUsage(executionResult);
		flags.push(...resourceFlags);

		const behaviorFlags = this.analyzeBehavior(userId, challengeSpec, code, executionResult);
		flags.push(...behaviorFlags);

		const confidence = this.calculateConfidence(flags);

		this.storeSubmission(userId, challengeSpec.id, code, executionResult);

		const recommendations = this.generateRecommendations(flags);

		return {
			isSuspicious: confidence > 0.7 || flags.some((f) => f.severity === "critical"),
			confidence,
			flags,
			recommendations,
		};
	}

	private analyzeTiming(
		_userId: string,
		_challengeSpec: ChallengeSpec,
		executionResult: { testResults: TestResult[]; executionTime: number }
	): CheatFlag[] {
		const flags: CheatFlag[] = [];

		const totalTime = executionResult.executionTime;
		const avgTimePerTest = totalTime / executionResult.testResults.length;

		if (avgTimePerTest < AntiCheatSystem.SUSPICIOUS_TIME_THRESHOLD) {
			flags.push({
				type: "timing",
				severity: "medium",
				description: "Execution time is suspiciously fast",
				evidence: { avgTimePerTest, threshold: AntiCheatSystem.SUSPICIOUS_TIME_THRESHOLD },
			});
		}

		const times = executionResult.testResults.map((r) => r.executionTime);
		const timeVariance = this.calculateVariance(times);

		if (timeVariance < 10) {
			flags.push({
				type: "timing",
				severity: "low",
				description: "Execution times are unusually consistent",
				evidence: { variance: timeVariance },
			});
		}

		return flags;
	}

	private analyzePatterns(
		userId: string,
		challengeSpec: ChallengeSpec,
		_executionResult: { testResults: TestResult[]; executionTime: number }
	): CheatFlag[] {
		const flags: CheatFlag[] = [];
		const userHistory = this.submissionHistory.get(userId) || [];
		const recentSubmissions = userHistory.filter(
			(s) =>
				s.challengeId === challengeSpec.id &&
				Date.now() - s.submissionTime.getTime() < AntiCheatSystem.PATTERN_ANALYSIS_WINDOW
		);

		const perfectScores = recentSubmissions.filter((s) =>
			s.testResults.every((r) => r.passed)
		).length;

		if (perfectScores >= AntiCheatSystem.PERFECT_SCORE_STREAK_LIMIT) {
			flags.push({
				type: "pattern",
				severity: "high",
				description: "Unusual streak of perfect scores",
				evidence: { perfectScores, limit: AntiCheatSystem.PERFECT_SCORE_STREAK_LIMIT },
			});
		}

		const recentTimestamps = recentSubmissions.map((s) => s.submissionTime.getTime());
		if (recentTimestamps.length >= 3) {
			const intervals: number[] = [];
			for (let i = 1; i < recentTimestamps.length; i++) {
				intervals.push(recentTimestamps[i] - recentTimestamps[i - 1]);
			}
			const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

			if (avgInterval < 5 * 60 * 1000) {
				flags.push({
					type: "pattern",
					severity: "medium",
					description: "Submissions are too frequent",
					evidence: { avgIntervalMinutes: avgInterval / (60 * 1000) },
				});
			}
		}

		return flags;
	}

	private analyzeCodeSimilarity(challengeId: string, code: string): CheatFlag[] {
		const flags: CheatFlag[] = [];
		const signatures = this.codeSignatures.get(challengeId) || [];

		for (const signature of signatures) {
			const similarity = this.calculateCodeSimilarity(code, signature);
			if (similarity > AntiCheatSystem.SIMILARITY_THRESHOLD) {
				flags.push({
					type: "similarity",
					severity: "high",
					description: "Code is very similar to previously submitted solutions",
					evidence: {
						similarity: similarity * 100,
						threshold: AntiCheatSystem.SIMILARITY_THRESHOLD * 100,
					},
				});
				break; // Only flag the most similar one
			}
		}

		return flags;
	}

	private analyzeResourceUsage(executionResult: {
		testResults: TestResult[];
		executionTime: number;
	}): CheatFlag[] {
		const flags: CheatFlag[] = [];

		const zeroMemoryTests = executionResult.testResults.filter(
			(r) => r.memoryUsed === 0
		).length;
		if (zeroMemoryTests === executionResult.testResults.length) {
			flags.push({
				type: "resource",
				severity: "medium",
				description: "No memory usage reported for any test",
				evidence: { zeroMemoryTests: zeroMemoryTests },
			});
		}

		const memoryUsages = executionResult.testResults.map((r) => r.memoryUsed);
		const uniqueMemories = new Set(memoryUsages);
		if (uniqueMemories.size === 1 && memoryUsages[0] > 0) {
			flags.push({
				type: "resource",
				severity: "low",
				description: "Identical memory usage across all tests",
				evidence: { memoryUsage: memoryUsages[0] },
			});
		}

		return flags;
	}

	private analyzeBehavior(
		_userId: string,
		challengeSpec: ChallengeSpec,
		code: string,
		_executionResult: { testResults: TestResult[]; executionTime: number }
	): CheatFlag[] {
		const flags: CheatFlag[] = [];

		const expectedOutputs = challengeSpec.testCases.map((tc) => String(tc.expectedOutput));
		const codeContainsExpected = expectedOutputs.some(
			(output) => code.includes(output) && output.length > 3 // Avoid flagging short outputs
		);

		if (codeContainsExpected) {
			flags.push({
				type: "behavior",
				severity: "critical",
				description: "Code appears to contain hardcoded expected outputs",
				evidence: { expectedOutputsFound: expectedOutputs.filter((o) => code.includes(o)) },
			});
		}

		const dangerousPatterns = [
			/eval\s*\(/,
			/new\s+Function\s*\(/,
			/process\.env/,
			/require\s*\(\s*['"`]fs['"`]\s*\)/,
			/require\s*\(\s*['"`]child_process['"`]\s*\)/,
		];

		const foundPatterns = dangerousPatterns.filter((pattern) => pattern.test(code));
		if (foundPatterns.length > 0) {
			flags.push({
				type: "behavior",
				severity: "high",
				description: "Code contains potentially dangerous patterns",
				evidence: { patterns: foundPatterns.map((p) => p.source) },
			});
		}

		return flags;
	}

	private calculateConfidence(flags: CheatFlag[]): number {
		if (flags.length === 0) return 0;

		const severityWeights = {
			low: 0.2,
			medium: 0.5,
			high: 0.8,
			critical: 1.0,
		};

		const weightedSum = flags.reduce((sum, flag) => sum + severityWeights[flag.severity], 0);
		return Math.min(weightedSum / flags.length, 1.0);
	}

	private generateRecommendations(flags: CheatFlag[]): string[] {
		const recommendations: string[] = [];

		const hasTimingIssues = flags.some((f) => f.type === "timing");
		const hasSimilarityIssues = flags.some((f) => f.type === "similarity");
		const hasBehavioralIssues = flags.some((f) => f.type === "behavior");

		if (hasTimingIssues) {
			recommendations.push("Review execution timing patterns manually");
		}

		if (hasSimilarityIssues) {
			recommendations.push("Compare with other submissions for plagiarism");
		}

		if (hasBehavioralIssues) {
			recommendations.push("Manual code review recommended for suspicious patterns");
		}

		if (flags.some((f) => f.severity === "critical")) {
			recommendations.push("Immediate manual review required");
		}

		return recommendations;
	}

	private storeSubmission(
		userId: string,
		challengeId: string,
		code: string,
		executionResult: { testResults: TestResult[]; executionTime: number }
	): void {
		const pattern: SubmissionPattern = {
			userId,
			challengeId,
			submissionTime: new Date(),
			executionTime: executionResult.executionTime,
			codeLength: code.length,
			testResults: executionResult.testResults,
		};

		if (!this.submissionHistory.has(userId)) {
			this.submissionHistory.set(userId, []);
		}

		this.submissionHistory.get(userId)?.push(pattern);

		const signature = this.generateCodeSignature(code);
		if (!this.codeSignatures.has(challengeId)) {
			this.codeSignatures.set(challengeId, []);
		}
		this.codeSignatures.get(challengeId)?.push(signature);
	}

	private calculateVariance(numbers: number[]): number {
		const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
		const squaredDiffs = numbers.map((n) => (n - mean) ** 2);
		return squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length;
	}

	private calculateCodeSimilarity(code1: string, code2: string): number {
		const tokens1 = this.tokenizeCode(code1);
		const tokens2 = this.tokenizeCode(code2);

		const intersection = new Set(tokens1.filter((t) => tokens2.includes(t)));
		const union = new Set([...tokens1, ...tokens2]);

		return intersection.size / union.size;
	}

	private tokenizeCode(code: string): string[] {
		return code
			.replace(/[^\w\s]/g, " ")
			.split(/\s+/)
			.filter((token) => token.length > 2)
			.map((token) => token.toLowerCase());
	}

	private generateCodeSignature(code: string): string {
		const tokens = this.tokenizeCode(code);
		return tokens.slice(0, 20).join(" "); // First 20 significant tokens
	}
}
