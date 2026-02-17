import type { ChallengeSpec, TestCase, ExecutionResult, TestResult } from "./challenge-types";
import { ChallengeSpecValidator } from "./challenge-validator";

export interface ExecutionContext {
	code: string;
	language: string;
	testCase: TestCase;
	timeLimit: number;
	memoryLimit: number;
}

export interface SandboxConfig {
	timeout: number;
	memoryLimit: number;
	allowedModules: string[];
	networkAccess: boolean;
	fileSystemAccess: boolean;
}

const DEFAULT_SANDBOX_CONFIG: SandboxConfig = {
	timeout: 30_000, // 30 seconds
	memoryLimit: 256, // 256MB
	allowedModules: [],
	networkAccess: false,
	fileSystemAccess: false,
};

export async function executeChallenge(
	spec: ChallengeSpec,
	userCode: string
): Promise<ExecutionResult> {
	// Validate challenge spec
	const validation = ChallengeSpecValidator.validate(spec);
	if (!validation.valid) {
		return {
			success: false,
			error: `Invalid challenge specification: ${validation.errors.join(", ")}`,
			testResults: [],
			executionTime: 0,
			memoryUsed: 0,
			passedTests: 0,
			totalTests: 0,
		};
	}

	// Prepare execution context
	const results: TestResult[] = [];
	let totalExecutionTime = 0;
	let maxMemoryUsed = 0;

	for (const testCase of spec.testCases) {
		const context: ExecutionContext = {
			code: userCode,
			language: spec.language,
			testCase,
			timeLimit: spec.timeLimit,
			memoryLimit: spec.memoryLimit,
		};

		const result = await executeTestCase(context);
		results.push(result);

		totalExecutionTime += result.executionTime;
		maxMemoryUsed = Math.max(maxMemoryUsed, result.memoryUsed);

		// Stop execution if test fails and we don't want to continue
		if (!result.passed && !spec.continueOnFailure) {
			break;
		}
	}

	const passedTests = results.filter((r) => r.passed).length;
	const success = passedTests === spec.testCases.length;

	return {
		success,
		testResults: results,
		executionTime: totalExecutionTime,
		memoryUsed: maxMemoryUsed,
		passedTests,
		totalTests: spec.testCases.length,
	};
}

async function executeTestCase(context: ExecutionContext): Promise<TestResult> {
	const startTime = Date.now();

	try {
		// Create sandbox configuration
		const sandboxConfig: SandboxConfig = {
			...DEFAULT_SANDBOX_CONFIG,
			timeout: Math.min(context.timeLimit * 1000, DEFAULT_SANDBOX_CONFIG.timeout),
			memoryLimit: Math.min(context.memoryLimit, DEFAULT_SANDBOX_CONFIG.memoryLimit),
		};

		// Execute code in sandbox
		const result = await executeInSandbox(context, sandboxConfig);

		const executionTime = Date.now() - startTime;

		// Validate result
		const passed = validateTestResult(result, context.testCase);

		return {
			testCaseId: context.testCase.id,
			passed,
			executionTime,
			memoryUsed: result.memoryUsed || 0,
			stdout: result.output,
			...(result.error !== undefined ? { error: result.error } : {}),
			expectedOutput: context.testCase.expectedOutput,
			actualOutput: result.output,
		};
	} catch (error) {
		const executionTime = Date.now() - startTime;
		return {
			testCaseId: context.testCase.id,
			passed: false,
			executionTime,
			memoryUsed: 0,
			stdout: "",
			error: error instanceof Error ? error.message : "Unknown execution error",
			expectedOutput: context.testCase.expectedOutput,
			actualOutput: "",
		};
	}
}

async function executeInSandbox(
	context: ExecutionContext,
	config: SandboxConfig
): Promise<{ output: string; error?: string; memoryUsed?: number }> {
	// This is a simplified implementation. In production, you'd use:
	// - Docker containers for isolation
	// - Firejail or similar sandboxing tools
	// - Language-specific execution environments

	switch (context.language) {
		case "javascript":
		case "typescript":
			return executeJavaScript(context, config);
		case "python":
			return executePython(context, config);
		case "rust":
			return executeRust(context, config);
		default:
			throw new Error(`Unsupported language: ${context.language}`);
	}
}

async function executeJavaScript(
	context: ExecutionContext,
	config: SandboxConfig
): Promise<{ output: string; error?: string; memoryUsed?: number }> {
	// In a real implementation, this would run in a secure VM or container
	// For now, we'll use a basic timeout mechanism

	return new Promise((resolve, reject) => {
		const timeout = setTimeout(() => {
			reject(new Error("Execution timeout"));
		}, config.timeout);

		try {
			// Simulate execution - in production, use vm2 or similar
			const result = simulateJSExecution(context);
			clearTimeout(timeout);
			resolve(result);
		} catch (error) {
			clearTimeout(timeout);
			reject(error);
		}
	});
}

async function executePython(
	context: ExecutionContext,
	_config: SandboxConfig
): Promise<{ output: string; error?: string; memoryUsed?: number }> {
	// Python execution would use a secure Python interpreter
	// For now, simulate
	return simulatePythonExecution(context);
}

async function executeRust(
	context: ExecutionContext,
	_config: SandboxConfig
): Promise<{ output: string; error?: string; memoryUsed?: number }> {
	// Rust execution would compile and run in sandbox
	// For now, simulate
	return simulateRustExecution(context);
}

function simulateJSExecution(context: ExecutionContext): {
	output: string;
	memoryUsed: number;
} {
	// This is a placeholder - real implementation would execute the code
	// For demonstration, we'll just return the expected output if code looks valid
	const code = context.code.trim();
	if (code.length === 0) {
		throw new Error("Empty code");
	}

	// Simulate some basic validation
	if (context.language === "javascript" && !code.includes("function")) {
		throw new Error("JavaScript code should contain a function");
	}

	return {
		output: context.testCase.expectedOutput as string,
		memoryUsed: Math.random() * 50 + 10, // Simulate memory usage
	};
}

function simulatePythonExecution(context: ExecutionContext): {
	output: string;
	memoryUsed: number;
} {
	const code = context.code.trim();
	if (code.length === 0) {
		throw new Error("Empty code");
	}

	if (!code.includes("def ")) {
		throw new Error("Python code should contain a function definition");
	}

	return {
		output: context.testCase.expectedOutput as string,
		memoryUsed: Math.random() * 30 + 5,
	};
}

function simulateRustExecution(context: ExecutionContext): {
	output: string;
	memoryUsed: number;
} {
	const code = context.code.trim();
	if (code.length === 0) {
		throw new Error("Empty code");
	}

	if (!code.includes("fn ")) {
		throw new Error("Rust code should contain a function");
	}

	return {
		output: context.testCase.expectedOutput as string,
		memoryUsed: Math.random() * 40 + 15,
	};
}

function validateTestResult(
	result: { output: string; error?: string },
	testCase: TestCase
): boolean {
	if (result.error) {
		return false;
	}

	// Normalize outputs for comparison
	const actual = result.output.trim();
	const expected = String(testCase.expectedOutput).trim();

	// For exact match tests
	if (testCase.validationType === "exact") {
		return actual === expected;
	}

	// For regex match tests
	if (testCase.validationType === "regex" && testCase.expectedOutput instanceof RegExp) {
		return testCase.expectedOutput.test(actual);
	}

	// For custom validation (would use testCase.validator function)
	if (testCase.validationType === "custom" && testCase.validator) {
		try {
			return testCase.validator(actual, expected);
		} catch {
			return false;
		}
	}

	// Default to exact match
	return actual === expected;
}
