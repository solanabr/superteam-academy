import type { ExecutionResult, ChallengeSpec } from "./challenge-types";

export interface AnalyticsMetrics {
	challengeId: string;
	totalSubmissions: number;
	passRate: number;
	averageScore: number;
	averageExecutionTime: number;
	averageMemoryUsage: number;
	difficultyRating: number;
	commonFailurePoints: FailurePoint[];
	performanceDistribution: PerformanceBucket[];
	timeSeriesData: TimeSeriesPoint[];
}

export interface FailurePoint {
	testCaseId: string;
	failureRate: number;
	commonError: string;
	description: string;
}

export interface PerformanceBucket {
	range: string;
	count: number;
	percentage: number;
}

export interface TimeSeriesPoint {
	timestamp: string;
	submissions: number;
	passRate: number;
	avgTime: number;
}

export interface UserAnalytics {
	userId: string;
	challengesAttempted: number;
	challengesCompleted: number;
	averageScore: number;
	learningProgress: LearningProgress[];
	strengths: string[];
	weaknesses: string[];
	recommendedChallenges: string[];
}

export interface LearningProgress {
	track: string;
	completedChallenges: number;
	totalChallenges: number;
	proficiency: number; // 0-1
	recentActivity: Date;
}

export class TestAnalyticsEngine {
	private static readonly PERFORMANCE_BUCKETS = [
		{ min: 0, max: 25, label: "0-25%" },
		{ min: 25, max: 50, label: "25-50%" },
		{ min: 50, max: 75, label: "50-75%" },
		{ min: 75, max: 90, label: "75-90%" },
		{ min: 90, max: 100, label: "90-100%" },
	];

	private static readonly TIME_WINDOW_DAYS = 30;

	private challengeMetrics: Map<string, AnalyticsMetrics> = new Map();
	private userMetrics: Map<string, UserAnalytics> = new Map();
	private submissionHistory: SubmissionRecord[] = [];

	recordSubmission(
		userId: string,
		challengeId: string,
		challengeSpec: ChallengeSpec,
		executionResult: ExecutionResult,
		code: string
	): void {
		const record: SubmissionRecord = {
			userId,
			challengeId,
			timestamp: new Date(),
			executionResult,
			codeLength: code.length,
			passed: executionResult.success,
			score: this.calculateScore(executionResult),
		};

		this.submissionHistory.push(record);
		this.updateChallengeMetrics(challengeId, challengeSpec, record);
		this.updateUserMetrics(userId, record);
	}

	getChallengeAnalytics(challengeId: string): AnalyticsMetrics | null {
		return this.challengeMetrics.get(challengeId) || null;
	}

	getUserAnalytics(userId: string): UserAnalytics | null {
		return this.userMetrics.get(userId) || null;
	}

	getGlobalAnalytics(): {
		totalUsers: number;
		totalSubmissions: number;
		averagePassRate: number;
		popularChallenges: { challengeId: string; submissions: number }[];
		difficultyDistribution: { [key: string]: number };
	} {
		const allUsers = new Set(this.submissionHistory.map((s) => s.userId));
		const allSubmissions = this.submissionHistory.length;

		const passRate =
			allSubmissions > 0
				? this.submissionHistory.filter((s) => s.passed).length / allSubmissions
				: 0;

		const challengeCounts = new Map<string, number>();
		this.submissionHistory.forEach((s) => {
			challengeCounts.set(s.challengeId, (challengeCounts.get(s.challengeId) || 0) + 1);
		});

		const popularChallenges = Array.from(challengeCounts.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, 10)
			.map(([challengeId, submissions]) => ({ challengeId, submissions }));

		const difficultyDist: { [key: string]: number } = {};
		this.challengeMetrics.forEach((metrics) => {
			const difficulty = this.mapDifficultyToLabel(metrics.difficultyRating);
			difficultyDist[difficulty] = (difficultyDist[difficulty] || 0) + 1;
		});

		return {
			totalUsers: allUsers.size,
			totalSubmissions: allSubmissions,
			averagePassRate: passRate,
			popularChallenges,
			difficultyDistribution: difficultyDist,
		};
	}

	private updateChallengeMetrics(
		challengeId: string,
		challengeSpec: ChallengeSpec,
		newRecord: SubmissionRecord
	): void {
		const existing = this.challengeMetrics.get(challengeId);

		const recentSubmissions = this.submissionHistory.filter(
			(s) =>
				s.challengeId === challengeId &&
				Date.now() - s.timestamp.getTime() <
					TestAnalyticsEngine.TIME_WINDOW_DAYS * 24 * 60 * 60 * 1000
		);

		const passRate =
			recentSubmissions.filter((s) => s.passed).length / recentSubmissions.length;
		const averageScore =
			recentSubmissions.reduce((sum, s) => sum + s.score, 0) / recentSubmissions.length;
		const averageTime =
			recentSubmissions.reduce((sum, s) => sum + s.executionResult.executionTime, 0) /
			recentSubmissions.length;
		const averageMemory =
			recentSubmissions.reduce((sum, s) => sum + s.executionResult.memoryUsed, 0) /
			recentSubmissions.length;

		const failurePoints = this.analyzeFailurePoints(challengeId, challengeSpec);
		const performanceDist = this.calculatePerformanceDistribution(recentSubmissions);
		const timeSeriesData = this.updateTimeSeries(existing?.timeSeriesData || [], newRecord);

		const difficultyRating = this.calculateDifficultyRating(recentSubmissions, challengeSpec);

		this.challengeMetrics.set(challengeId, {
			challengeId,
			totalSubmissions: recentSubmissions.length,
			passRate,
			averageScore,
			averageExecutionTime: averageTime,
			averageMemoryUsage: averageMemory,
			difficultyRating,
			commonFailurePoints: failurePoints,
			performanceDistribution: performanceDist,
			timeSeriesData,
		});
	}

	private updateUserMetrics(userId: string, _newRecord: SubmissionRecord): void {
		const userSubmissions = this.submissionHistory.filter((s) => s.userId === userId);

		const challengesAttempted = new Set(userSubmissions.map((s) => s.challengeId)).size;
		const challengesCompleted = new Set(
			userSubmissions.filter((s) => s.passed).map((s) => s.challengeId)
		).size;

		const averageScore =
			userSubmissions.reduce((sum, s) => sum + s.score, 0) / userSubmissions.length;

		const learningProgress = this.calculateLearningProgress(userId);
		const strengths = this.identifyStrengths(userId);
		const weaknesses = this.identifyWeaknesses(userId);
		const recommendedChallenges = this.generateRecommendations(userId);

		this.userMetrics.set(userId, {
			userId,
			challengesAttempted,
			challengesCompleted,
			averageScore,
			learningProgress,
			strengths,
			weaknesses,
			recommendedChallenges,
		});
	}

	private calculateScore(result: ExecutionResult): number {
		if (result.totalTests === 0) return 0;
		return ((result.passedTests || 0) / result.totalTests) * 100;
	}

	private analyzeFailurePoints(
		challengeId: string,
		challengeSpec: ChallengeSpec
	): FailurePoint[] {
		const submissions = this.submissionHistory.filter((s) => s.challengeId === challengeId);
		const failureCounts = new Map<string, number>();

		submissions.forEach((submission) => {
			submission.executionResult.testResults.forEach((result) => {
				if (!result.passed) {
					const count = failureCounts.get(result.testCaseId) || 0;
					failureCounts.set(result.testCaseId, count + 1);
				}
			});
		});

		return Array.from(failureCounts.entries())
			.map(([testCaseId, failures]) => {
				const testCase = challengeSpec.testCases.find((tc) => tc.id === testCaseId);
				const failureRate = failures / submissions.length;

				return {
					testCaseId,
					failureRate,
					commonError: this.extractCommonError(submissions, testCaseId),
					description: testCase?.description || "Unknown test case",
				};
			})
			.sort((a, b) => b.failureRate - a.failureRate)
			.slice(0, 5); // Top 5 failure points
	}

	private calculatePerformanceDistribution(submissions: SubmissionRecord[]): PerformanceBucket[] {
		const scores = submissions.map((s) => s.score);
		const buckets = TestAnalyticsEngine.PERFORMANCE_BUCKETS.map((bucket) => ({
			range: bucket.label,
			count: 0,
			percentage: 0,
		}));

		scores.forEach((score) => {
			const bucket = buckets.find((b) => {
				const [min, max] = b.range.split("-").map((n) => parseInt(n, 10));
				return score >= min && score <= max;
			});
			if (bucket) bucket.count++;
		});

		buckets.forEach((bucket) => {
			bucket.percentage = submissions.length > 0 ? bucket.count / submissions.length : 0;
		});

		return buckets;
	}

	private updateTimeSeries(
		existing: TimeSeriesPoint[],
		newRecord: SubmissionRecord
	): TimeSeriesPoint[] {
		const now = new Date();
		const today = now.toISOString().split("T")[0];

		const todayPoint = existing.find((p) => p.timestamp.startsWith(today));
		if (todayPoint) {
			todayPoint.submissions++;
			todayPoint.passRate =
				(todayPoint.passRate * (todayPoint.submissions - 1) + (newRecord.passed ? 1 : 0)) /
				todayPoint.submissions;
			todayPoint.avgTime =
				(todayPoint.avgTime * (todayPoint.submissions - 1) +
					newRecord.executionResult.executionTime) /
				todayPoint.submissions;
		} else {
			existing.push({
				timestamp: today,
				submissions: 1,
				passRate: newRecord.passed ? 1 : 0,
				avgTime: newRecord.executionResult.executionTime,
			});
		}

		return existing
			.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
			.slice(-30);
	}

	private calculateDifficultyRating(
		submissions: SubmissionRecord[],
		challengeSpec: ChallengeSpec
	): number {
		if (submissions.length === 0) return 0.5; // Default medium difficulty

		const passRate = submissions.filter((s) => s.passed).length / submissions.length;
		const avgTime =
			submissions.reduce((sum, s) => sum + s.executionResult.executionTime, 0) /
			submissions.length;

		const passRateDifficulty = 1 - passRate; // Lower pass rate = higher difficulty
		const timeDifficulty = Math.min(avgTime / (challengeSpec.timeLimit * 1000), 1); // Longer execution = higher difficulty

		return passRateDifficulty * 0.7 + timeDifficulty * 0.3;
	}

	private calculateLearningProgress(userId: string): LearningProgress[] {
		const userSubmissions = this.submissionHistory.filter((s) => s.userId === userId);
		const tracks = new Map<string, { completed: number; total: number; recent: Date }>();

		userSubmissions.forEach((submission) => {
			const track = submission.challengeId.split("-")[0]; // Assume track-challenge format

			if (!tracks.has(track)) {
				tracks.set(track, { completed: 0, total: 0, recent: submission.timestamp });
			}

			const trackData = tracks.get(track);
			if (trackData) {
				trackData.total++;

				if (submission.passed) {
					trackData.completed++;
				}

				if (submission.timestamp > trackData.recent) {
					trackData.recent = submission.timestamp;
				}
			}
		});

		return Array.from(tracks.entries()).map(([track, data]) => ({
			track,
			completedChallenges: data.completed,
			totalChallenges: data.total,
			proficiency: data.total > 0 ? data.completed / data.total : 0,
			recentActivity: data.recent,
		}));
	}

	private identifyStrengths(userId: string): string[] {
		const userSubmissions = this.submissionHistory.filter((s) => s.userId === userId);
		const strengths: string[] = [];

		const challengeTypes = new Map<string, { passed: number; total: number }>();
		userSubmissions.forEach((submission) => {
			const type = submission.challengeId.split("-")[1] || "general";
			if (!challengeTypes.has(type)) {
				challengeTypes.set(type, { passed: 0, total: 0 });
			}
			const stats = challengeTypes.get(type);
			if (stats) {
				stats.total++;
				if (submission.passed) stats.passed++;
			}
		});

		challengeTypes.forEach((stats, type) => {
			const rate = stats.passed / stats.total;
			if (rate > 0.8 && stats.total >= 3) {
				strengths.push(
					`Strong in ${type} challenges (${Math.round(rate * 100)}% success rate)`
				);
			}
		});

		return strengths;
	}

	private identifyWeaknesses(userId: string): string[] {
		const userSubmissions = this.submissionHistory.filter((s) => s.userId === userId);
		const weaknesses: string[] = [];

		const challengeTypes = new Map<string, { passed: number; total: number }>();
		userSubmissions.forEach((submission) => {
			const type = submission.challengeId.split("-")[1] || "general";
			if (!challengeTypes.has(type)) {
				challengeTypes.set(type, { passed: 0, total: 0 });
			}
			const stats = challengeTypes.get(type);
			if (stats) {
				stats.total++;
				if (submission.passed) stats.passed++;
			}
		});

		challengeTypes.forEach((stats, type) => {
			const rate = stats.passed / stats.total;
			if (rate < 0.5 && stats.total >= 3) {
				weaknesses.push(
					`Needs improvement in ${type} challenges (${Math.round(rate * 100)}% success rate)`
				);
			}
		});

		return weaknesses;
	}

	private generateRecommendations(userId: string): string[] {
		const userAnalytics = this.userMetrics.get(userId);
		if (!userAnalytics) return [];

		const recommendations: string[] = [];

		userAnalytics.weaknesses.forEach((weakness) => {
			if (weakness.includes("algorithms")) {
				recommendations.push("algorithm-basics-1");
			} else if (weakness.includes("data structures")) {
				recommendations.push("data-structures-1");
			}
		});

		if (userAnalytics.averageScore > 80) {
			recommendations.push("advanced-algorithms-1");
		}

		return recommendations.slice(0, 5); // Limit to 5 recommendations
	}

	private extractCommonError(submissions: SubmissionRecord[], testCaseId: string): string {
		const errors = submissions
			.filter((s) =>
				s.executionResult.testResults.some((r) => r.testCaseId === testCaseId && !r.passed)
			)
			.map(
				(s) =>
					s.executionResult.testResults.find(
						(r) => r.testCaseId === testCaseId && !r.passed
					)?.error
			)
			.filter(Boolean) as string[];

		const errorCounts = new Map<string, number>();
		errors.forEach((error) => {
			const count = errorCounts.get(error) || 0;
			errorCounts.set(error, count + 1);
		});

		const mostCommon = Array.from(errorCounts.entries()).sort((a, b) => b[1] - a[1])[0];

		return mostCommon ? mostCommon[0] : "Various errors";
	}

	private mapDifficultyToLabel(rating: number): string {
		if (rating < 0.3) return "Beginner";
		if (rating < 0.6) return "Intermediate";
		return "Advanced";
	}
}

interface SubmissionRecord {
	userId: string;
	challengeId: string;
	timestamp: Date;
	executionResult: ExecutionResult;
	codeLength: number;
	passed: boolean;
	score: number;
}
