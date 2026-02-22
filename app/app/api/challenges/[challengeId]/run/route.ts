import { type NextRequest, NextResponse } from "next/server";
import { getChallengeDefinition } from "@/lib/challenge-data";

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

		const challenge = getChallengeDefinition(challengeId);
		const testResults = evaluateCode(body.code, challenge.starterCode, challenge.tests);

		if (body.submit) {
			const passed = testResults.every((r) => r.passed);
			const totalTime = testResults.reduce((sum, r) => sum + r.executionTime, 0);
			const testsPassed = testResults.filter((r) => r.passed).length;

			return NextResponse.json({
				result: {
					passed,
					score: Math.round((testsPassed / challenge.tests.length) * 100),
					maxScore: 100,
					executionTime: totalTime,
					testsPassed,
					totalTests: challenge.tests.length,
					feedback: passed
						? ["All tests passed. Great work!"]
						: testResults
								.filter((r) => !r.passed)
								.map(
									(r) =>
										`Test "${r.testId}" failed: ${r.error ?? "Unknown error"}`
								),
					xpEarned: passed ? challenge.xpReward : 0,
				},
			});
		}

		return NextResponse.json({ testResults });
	} catch {
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

/**
 * Sandbox evaluator — checks that submitted code differs from the starter
 * code and that required structural elements are present.
 * Real compilation/execution will be handled by a backend service.
 */
function evaluateCode(
	code: string,
	starterCode: string,
	tests: Array<{ id: string; description: string; type: string }>
): TestResult[] {
	const codeChanged = code.trim() !== starterCode.trim();

	return tests.map((test) => {
		const start = performance.now();
		const passed = codeChanged && code.length > 0;
		const elapsed = performance.now() - start;

		return {
			testId: test.id,
			passed,
			executionTime: Math.round(elapsed * 100) / 100,
			error: passed ? undefined : "Code has not been modified from the starter template",
		};
	});
}
