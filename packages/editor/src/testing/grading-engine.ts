import type { ExecutionResult, GradingConfig } from "./challenge-types";

export interface GradingWeights {
	correctness: number; // Weight for passing tests (0-1)
	performance: number; // Weight for execution time (0-1)
	efficiency: number; // Weight for memory usage (0-1)
	codeQuality: number; // Weight for code quality metrics (0-1)
}

export interface GradingPerformanceMetrics {
	averageTime: number;
	maxTime: number;
	averageMemory: number;
	maxMemory: number;
	timeEfficiency: number; // 0-1, higher is better
	memoryEfficiency: number; // 0-1, higher is better
}

export interface GradingCodeQualityMetrics {
	cyclomaticComplexity: number;
	maintainabilityIndex: number;
	linesOfCode: number;
	commentRatio: number;
	hasTests: boolean;
	followsConventions: boolean;
}

export interface GradingEngineResult {
	score: number;
	maxScore: number;
	grade: string;
	passed: boolean;
	feedback: string[];
	breakdown: {
		correctness: { score: number; weight: number };
		performance: { score: number; weight: number };
		efficiency: { score: number; weight: number };
		codeQuality: { score: number; weight: number };
	};
	metrics: {
		performance: GradingPerformanceMetrics;
		codeQuality: GradingCodeQualityMetrics;
	};
	timestamp: string;
}

const DEFAULT_WEIGHTS: GradingWeights = {
	correctness: 0.6,
	performance: 0.2,
	efficiency: 0.1,
	codeQuality: 0.1,
};

const PERFECT_SCORE = 100;
const PERFORMANCE_THRESHOLDS = {
	excellent: 0.8,
	good: 0.6,
	average: 0.4,
	poor: 0.2,
};

export const GradingEngine = {
	gradeSubmission(
		executionResult: ExecutionResult,
		code: string,
		config?: Partial<GradingConfig>
	): GradingEngineResult {
		const weights = { ...DEFAULT_WEIGHTS, ...config?.weights };
		const performanceMetrics = calculatePerformanceMetrics(executionResult);
		const codeQualityMetrics = analyzeCodeQuality(code, executionResult);

		const correctnessScore = calculateCorrectnessScore(executionResult);
		const performanceScore = calculatePerformanceScore(performanceMetrics, config);
		const efficiencyScore = calculateEfficiencyScore(performanceMetrics, config);
		const codeQualityScore = calculateCodeQualityScore(codeQualityMetrics);

		const totalScore = Math.round(
			correctnessScore * weights.correctness +
				performanceScore * weights.performance +
				efficiencyScore * weights.efficiency +
				codeQualityScore * weights.codeQuality
		);

		const feedback = generateFeedback({
			correctnessScore,
			performanceScore,
			efficiencyScore,
			codeQualityScore,
			performanceMetrics,
			codeQualityMetrics,
			executionResult,
		});

		const grade = determineGrade(totalScore);

		return {
			score: totalScore,
			maxScore: PERFECT_SCORE,
			grade,
			passed: executionResult.success,
			feedback,
			breakdown: {
				correctness: { score: correctnessScore, weight: weights.correctness },
				performance: { score: performanceScore, weight: weights.performance },
				efficiency: { score: efficiencyScore, weight: weights.efficiency },
				codeQuality: { score: codeQualityScore, weight: weights.codeQuality },
			},
			metrics: {
				performance: performanceMetrics,
				codeQuality: codeQualityMetrics,
			},
			timestamp: new Date().toISOString(),
		};
	},
};

function calculateCorrectnessScore(result: ExecutionResult): number {
	if (result.totalTests === 0) return 0;

	const passedTests = result.passedTests || 0;
	const baseScore = (passedTests / result.totalTests) * 100;

	const allTestsPassed = passedTests === result.totalTests;
	const bonus = allTestsPassed ? 10 : 0;

	return Math.min(baseScore + bonus, 100);
}

function calculatePerformanceScore(
	metrics: GradingPerformanceMetrics,
	config?: Partial<GradingConfig>
): number {
	const timeThreshold = config?.timeThreshold || 1000; // 1 second default
	const timeRatio = metrics.averageTime / timeThreshold;

	if (timeRatio <= PERFORMANCE_THRESHOLDS.excellent) return 100;
	if (timeRatio <= PERFORMANCE_THRESHOLDS.good) return 80;
	if (timeRatio <= PERFORMANCE_THRESHOLDS.average) return 60;
	if (timeRatio <= PERFORMANCE_THRESHOLDS.poor) return 40;

	return 20; // Very poor performance
}

function calculateEfficiencyScore(
	metrics: GradingPerformanceMetrics,
	config?: Partial<GradingConfig>
): number {
	const memoryThreshold = config?.memoryThreshold || 128; // 128MB default
	const memoryRatio = metrics.averageMemory / memoryThreshold;

	if (memoryRatio <= PERFORMANCE_THRESHOLDS.excellent) return 100;
	if (memoryRatio <= PERFORMANCE_THRESHOLDS.good) return 80;
	if (memoryRatio <= PERFORMANCE_THRESHOLDS.average) return 60;
	if (memoryRatio <= PERFORMANCE_THRESHOLDS.poor) return 40;

	return 20; // Very poor efficiency
}

function calculateCodeQualityScore(metrics: GradingCodeQualityMetrics): number {
	let score = 100;

	if (metrics.cyclomaticComplexity > 10) {
		score -= Math.min((metrics.cyclomaticComplexity - 10) * 5, 30);
	}

	if (metrics.maintainabilityIndex < 50) {
		score -= Math.min((50 - metrics.maintainabilityIndex) * 2, 30);
	}

	if (metrics.linesOfCode > 100) {
		score -= Math.min((metrics.linesOfCode - 100) * 0.5, 20);
	}

	if (metrics.commentRatio > 0.2) {
		score += 10;
	}

	if (metrics.followsConventions) {
		score += 10;
	}

	if (metrics.hasTests) {
		score += 10;
	}

	return Math.max(0, Math.min(score, 100));
}

function calculatePerformanceMetrics(result: ExecutionResult): GradingPerformanceMetrics {
	if (result.testResults.length === 0) {
		return {
			averageTime: 0,
			maxTime: 0,
			averageMemory: 0,
			maxMemory: 0,
			timeEfficiency: 0,
			memoryEfficiency: 0,
		};
	}

	const times = result.testResults.map((r) => r.executionTime);
	const memories = result.testResults.map((r) => r.memoryUsed);

	const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
	const maxTime = Math.max(...times);
	const averageMemory = memories.reduce((a, b) => a + b, 0) / memories.length;
	const maxMemory = Math.max(...memories);

	const timeEfficiency = Math.max(0, 1 - averageTime / 5000); // Assume 5s is baseline
	const memoryEfficiency = Math.max(0, 1 - averageMemory / 512); // Assume 512MB is baseline

	return {
		averageTime,
		maxTime,
		averageMemory,
		maxMemory,
		timeEfficiency,
		memoryEfficiency,
	};
}

function analyzeCodeQuality(code: string, _result: ExecutionResult): GradingCodeQualityMetrics {
	// - ESLint/TSLint for JavaScript/TypeScript
	// - Pylint for Python
	// - Clippy for Rust

	const lines = code.split("\n").filter((line) => line.trim().length > 0);
	const linesOfCode = lines.length;

	const complexityKeywords = ["if", "for", "while", "switch", "case", "catch", "&&", "||"];
	const cyclomaticComplexity = complexityKeywords.reduce((count, keyword) => {
		return count + (code.split(keyword).length - 1);
	}, 1);

	const maintainabilityIndex = Math.max(0, 100 - linesOfCode * 0.5 - cyclomaticComplexity * 5);

	const commentLines = lines.filter(
		(line) => line.trim().startsWith("//") || line.trim().startsWith("/*")
	).length;
	const commentRatio = commentLines / linesOfCode;

	const followsConventions = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(code.split(/\s+/)[0] || "");

	const hasTests = /test|spec|describe|it\(|assert|expect/.test(code);

	return {
		cyclomaticComplexity,
		maintainabilityIndex,
		linesOfCode,
		commentRatio,
		hasTests,
		followsConventions,
	};
}

function generateFeedback(context: {
	correctnessScore: number;
	performanceScore: number;
	efficiencyScore: number;
	codeQualityScore: number;
	performanceMetrics: GradingPerformanceMetrics;
	codeQualityMetrics: GradingCodeQualityMetrics;
	executionResult: ExecutionResult;
}): string[] {
	const feedback: string[] = [];

	if (context.correctnessScore === 100) {
		feedback.push("🎉 Excellent! All tests passed.");
	} else if (context.correctnessScore >= 80) {
		feedback.push("✅ Good job! Most tests passed.");
	} else if (context.correctnessScore >= 60) {
		feedback.push("⚠️ Some tests failed. Review your logic.");
	} else {
		feedback.push("❌ Many tests failed. Check your implementation.");
	}

	if (context.performanceScore >= 80) {
		feedback.push("⚡ Great performance! Execution is very fast.");
	} else if (context.performanceScore >= 60) {
		feedback.push("🕐 Decent performance, but could be faster.");
	} else {
		feedback.push("🐌 Performance could be improved. Consider optimizing your algorithm.");
	}

	if (context.efficiencyScore >= 80) {
		feedback.push("💾 Memory usage is efficient.");
	} else if (context.efficiencyScore >= 60) {
		feedback.push("📈 Memory usage is acceptable but could be optimized.");
	} else {
		feedback.push("💥 High memory usage detected. Try to reduce memory consumption.");
	}

	if (context.codeQualityScore >= 80) {
		feedback.push("📝 Code quality is excellent!");
	} else if (context.codeQualityScore >= 60) {
		feedback.push("📝 Code quality is good, but could be improved.");
	} else {
		feedback.push(
			"📝 Consider improving code quality: add comments, reduce complexity, follow conventions."
		);
	}

	if (context.codeQualityMetrics.cyclomaticComplexity > 15) {
		feedback.push(
			"🔄 Your code is quite complex. Consider breaking it into smaller functions."
		);
	}

	if (context.codeQualityMetrics.commentRatio < 0.1) {
		feedback.push("💬 Add more comments to explain your code logic.");
	}

	if (context.performanceMetrics.averageTime > 2000) {
		feedback.push("⏱️ Execution time is high. Look for performance bottlenecks.");
	}

	return feedback;
}

function determineGrade(score: number): string {
	if (score >= 95) return "A+";
	if (score >= 90) return "A";
	if (score >= 85) return "A-";
	if (score >= 80) return "B+";
	if (score >= 75) return "B";
	if (score >= 70) return "B-";
	if (score >= 65) return "C+";
	if (score >= 60) return "C";
	if (score >= 55) return "C-";
	if (score >= 50) return "D";
	return "F";
}
