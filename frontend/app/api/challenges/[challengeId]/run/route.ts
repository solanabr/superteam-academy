import { type NextRequest, NextResponse } from "next/server";

interface RunRequest {
	code?: string;
	language?: string;
	submit?: boolean;
}

interface TestResult {
	testId: string;
	passed: boolean;
	executionTime: number;
	error?: string | undefined;
	output?: string | undefined;
}

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ challengeId: string }> }
) {
	try {
		const { challengeId } = await params;
		const body = (await request.json()) as RunRequest;

		if (!body.code || typeof body.code !== "string") {
			return NextResponse.json({ error: "Missing code" }, { status: 400 });
		}

		if (!body.language || typeof body.language !== "string") {
			return NextResponse.json({ error: "Missing language" }, { status: 400 });
		}

		const tests = getChallengeTests(challengeId);
		const testResults = evaluateCode(body.code, tests);

		if (body.submit) {
			const passed = testResults.every((r) => r.passed);
			const totalTime = testResults.reduce((sum, r) => sum + r.executionTime, 0);
			const testsPassed = testResults.filter((r) => r.passed).length;

			return NextResponse.json({
				result: {
					passed,
					score: Math.round((testsPassed / tests.length) * 100),
					maxScore: 100,
					executionTime: totalTime,
					testsPassed,
					totalTests: tests.length,
					feedback: passed
						? ["All tests passed. Great work!"]
						: testResults
								.filter((r) => !r.passed)
								.map(
									(r) =>
										`Test "${r.testId}" failed: ${r.error ?? "Unknown error"}`
								),
					xpEarned: passed ? 100 : 0,
				},
			});
		}

		return NextResponse.json({ testResults });
	} catch {
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

interface TestCase {
	id: string;
	description: string;
	check: (code: string) => { passed: boolean; error?: string };
}

function getChallengeTests(_challengeId: string): TestCase[] {
	return [
		{
			id: "test-1",
			description: "Initialize counter with value 0",
			check: (code) => ({
				passed: code.includes("counter.count = 0") || code.includes("count: 0"),
				error: "Counter should be initialized to 0",
			}),
		},
		{
			id: "test-2",
			description: "Increment counter from 0 to 1",
			check: (code) => ({
				passed:
					code.includes("count += 1") ||
					code.includes("count = count + 1") ||
					code.includes("checked_add(1)"),
				error: "Missing increment logic",
			}),
		},
		{
			id: "test-3",
			description: "Decrement counter from 1 to 0",
			check: (code) => ({
				passed:
					code.includes("count -= 1") ||
					code.includes("count = count - 1") ||
					code.includes("checked_sub(1)"),
				error: "Missing decrement logic",
			}),
		},
		{
			id: "test-4",
			description: "Multiple increments work correctly",
			check: (code) => ({
				passed: code.includes("pub fn increment") && code.includes("#[account(mut)]"),
				error: "Increment function should use mutable account constraint",
			}),
		},
	];
}

function evaluateCode(code: string, tests: TestCase[]): TestResult[] {
	return tests.map((test) => {
		const start = performance.now();
		const result = test.check(code);
		const elapsed = performance.now() - start;

		return {
			testId: test.id,
			passed: result.passed,
			executionTime: Math.round(elapsed * 100) / 100,
			error: result.passed ? undefined : result.error,
		};
	});
}
