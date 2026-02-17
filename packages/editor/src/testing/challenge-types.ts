export interface ChallengeSpec {
	id: string;
	title: string;
	description: string;
	difficulty: "beginner" | "intermediate" | "advanced";
	language: "javascript" | "typescript" | "rust" | "python";
	track: string;
	xpReward: number;
	timeLimit: number; // in seconds
	memoryLimit: number; // in MB
	testCases: TestCase[];
	solutionTemplate: string;
	hints: string[];
	prerequisites: string[]; // challenge IDs
	tags: string[];
	continueOnFailure?: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface TestCase {
	id: string;
	input: unknown;
	expectedOutput: unknown;
	isHidden: boolean;
	timeout: number;
	description?: string;
	validationType?: "exact" | "regex" | "custom";
	validator?: (actual: string, expected: string) => boolean;
}

export interface ExecutionResult {
	success: boolean;
	error?: string;
	testResults: TestResult[];
	executionTime: number;
	memoryUsed: number;
	passedTests: number;
	totalTests: number;
}

export interface GradingConfig {
	weights?: Partial<{
		correctness: number;
		performance: number;
		efficiency: number;
		codeQuality: number;
	}>;
	timeThreshold?: number;
	memoryThreshold?: number;
}

export interface ChallengeExecution {
	challengeId: string;
	userId: string;
	code: string;
	language: string;
	startTime: Date;
	endTime?: Date;
	status: "running" | "completed" | "failed" | "timeout" | "error";
	results: TestResult[];
	executionTime: number;
	memoryUsed: number;
	error?: string;
}

export interface TestResult {
	testCaseId: string;
	passed: boolean;
	actualOutput?: unknown;
	expectedOutput: unknown;
	executionTime: number;
	memoryUsed: number;
	error?: string;
	stdout?: string;
	stderr?: string;
}

export interface GradingResult {
	challengeId: string;
	userId: string;
	score: number; // 0-100
	grade?: string;
	passed: boolean;
	totalTests: number;
	passedTests: number;
	executionTime: number;
	memoryUsed: number;
	feedback: string[];
	awardedXP: number;
	gradedAt: Date;
}

export interface ChallengeValidationResult {
	valid: boolean;
	errors: string[];
	warnings: string[];
}
