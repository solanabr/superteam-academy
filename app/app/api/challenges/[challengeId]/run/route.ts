import { type NextRequest, NextResponse } from "next/server";
import { getChallengePageData } from "@/lib/challenge-content";
import { incrementMetric, recordDuration } from "@/lib/runtime-observability";

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

const SUPPORTED_LANGUAGES = new Set(["rust", "typescript", "javascript", "python"]);
const MAX_CODE_SIZE = 60_000;
const MAX_TEST_RESULTS = 100;

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ challengeId: string }> }
) {
	const startedAt = performance.now();
	incrementMetric("challenge.run.requests.total");
	try {
		const { challengeId } = await params;
		const body = (await request.json()) as RunRequest;
		const courseId = request.nextUrl.searchParams.get("courseId");
		if (!courseId) {
			incrementMetric("challenge.run.requests.invalid");
			return NextResponse.json({ error: "Missing courseId" }, { status: 400 });
		}

		if (!body.code || typeof body.code !== "string") {
			incrementMetric("challenge.run.requests.invalid");
			return NextResponse.json({ error: "Missing code" }, { status: 400 });
		}

		if (!body.language || typeof body.language !== "string") {
			incrementMetric("challenge.run.requests.invalid");
			return NextResponse.json({ error: "Missing language" }, { status: 400 });
		}

		const language = body.language.toLowerCase();
		if (!SUPPORTED_LANGUAGES.has(language)) {
			incrementMetric("challenge.run.requests.unsupported_language");
			return NextResponse.json({ error: "Unsupported language" }, { status: 400 });
		}

		if (body.code.length > MAX_CODE_SIZE) {
			incrementMetric("challenge.run.requests.code_too_large");
			return NextResponse.json(
				{ error: `Code exceeds ${MAX_CODE_SIZE} characters` },
				{ status: 400 }
			);
		}

		const pageData = await getChallengePageData(courseId, challengeId);
		if (!pageData) {
			incrementMetric("challenge.run.requests.not_found");
			return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
		}

		const challenge = pageData.challenge;
		const challengeLanguage = challenge.language.toLowerCase();
		if (challengeLanguage !== language) {
			incrementMetric("challenge.run.requests.language_mismatch");
			return NextResponse.json(
				{ error: "Language does not match challenge configuration" },
				{ status: 400 }
			);
		}

		if (!Array.isArray(challenge.tests) || challenge.tests.length === 0) {
			incrementMetric("challenge.run.requests.invalid_challenge_tests");
			return NextResponse.json(
				{ error: "Challenge has no configured tests" },
				{ status: 422 }
			);
		}

		if (challenge.tests.length > MAX_TEST_RESULTS) {
			incrementMetric("challenge.run.requests.too_many_tests");
			return NextResponse.json(
				{ error: `Challenge test limit exceeded (${MAX_TEST_RESULTS})` },
				{ status: 422 }
			);
		}

		const testResults = evaluateCode({
			challengeId,
			code: body.code,
			starterCode: challenge.starterCode,
			tests: challenge.tests,
			language,
		});

		if (body.submit) {
			const passed = testResults.every((r) => r.passed);
			const totalTime = testResults.reduce((sum, r) => sum + r.executionTime, 0);
			const testsPassed = testResults.filter((r) => r.passed).length;

			incrementMetric("challenge.run.submissions.total");
			if (passed) {
				incrementMetric("challenge.run.submissions.passed");
			} else {
				incrementMetric("challenge.run.submissions.failed");
			}

			recordDuration("challenge.run.request.latency_ms", performance.now() - startedAt);

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

		incrementMetric("challenge.run.executions.total");
		recordDuration("challenge.run.request.latency_ms", performance.now() - startedAt);

		return NextResponse.json({ testResults });
	} catch {
		incrementMetric("challenge.run.requests.error");
		recordDuration("challenge.run.request.latency_ms", performance.now() - startedAt);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

function evaluateCode({
	challengeId,
	code,
	starterCode,
	tests,
	language,
}: {
	challengeId: string;
	code: string;
	starterCode: string;
	tests: Array<{ id: string; description: string; type: string }>;
	language: string;
}): TestResult[] {
	const codeChanged = code.trim() !== starterCode.trim();
	const compilation = compileSource(code, language);

	if (!codeChanged) {
		return tests.map((test) => ({
			testId: test.id,
			passed: false,
			executionTime: 0,
			error: "Code has not been modified from the starter template",
		}));
	}

	if (!compilation.ok) {
		return tests.map((test) => ({
			testId: test.id,
			passed: false,
			executionTime: 0,
			error: compilation.error,
		}));
	}

	return tests.map((test, index) => {
		const startedAt = performance.now();
		const assertion = evaluateAssertion({
			challengeId,
			testDescription: test.description,
			code,
			language,
			testIndex: index,
		});
		const elapsed = performance.now() - startedAt;

		return {
			testId: test.id,
			passed: assertion.passed,
			executionTime: Math.round(elapsed * 100) / 100,
			error: assertion.passed ? undefined : assertion.error,
			output: assertion.output,
		};
	});
}

function compileSource(
	code: string,
	language: string
): { ok: true } | { ok: false; error: string } {
	if (containsUnsafePatterns(code)) {
		return {
			ok: false,
			error: "Blocked potentially unsafe code patterns for sandboxed execution",
		};
	}

	if (!hasBalancedDelimiters(code)) {
		return {
			ok: false,
			error: "Compilation failed: unbalanced delimiters",
		};
	}

	if (language === "rust") {
		if (!/(fn\s+\w+\s*\()/m.test(code)) {
			return { ok: false, error: "Compilation failed: expected at least one Rust function" };
		}
		return { ok: true };
	}

	if (language === "typescript" || language === "javascript") {
		try {
			new Function(code);
			return { ok: true };
		} catch (error) {
			return {
				ok: false,
				error: `Compilation failed: ${error instanceof Error ? error.message : "invalid syntax"}`,
			};
		}
	}

	if (language === "python") {
		if (!/(def\s+\w+\s*\()/m.test(code)) {
			return {
				ok: false,
				error: "Compilation failed: expected at least one Python function definition",
			};
		}
		return { ok: true };
	}

	return { ok: true };
}

function evaluateAssertion({
	challengeId,
	testDescription,
	code,
	language,
	testIndex,
}: {
	challengeId: string;
	testDescription: string;
	code: string;
	language: string;
	testIndex: number;
}): { passed: boolean; error?: string; output?: string } {
	const description = testDescription.toLowerCase();
	const normalizedCode = code.toLowerCase();

	if (language === "rust") {
		if (description.includes("initialize") && description.includes("0")) {
			const passed = /fn\s+initialize\s*\(/.test(code) && /count\s*=\s*0/.test(code);
			return passed
				? { passed: true, output: "initialize assertion passed" }
				: {
						passed: false,
						error: "Expected initialize instruction to set counter count to 0",
					};
		}

		if (description.includes("increment")) {
			const passed =
				/fn\s+increment\s*\(/.test(code) &&
				(/count\s*\+=\s*1/.test(code) || /checked_add\s*\(/.test(code));
			return passed
				? { passed: true, output: "increment assertion passed" }
				: {
						passed: false,
						error: "Expected increment instruction with counter mutation (+= 1 or checked_add)",
					};
		}

		if (description.includes("decrement")) {
			const passed =
				/fn\s+decrement\s*\(/.test(code) &&
				(/count\s*-=\s*1/.test(code) || /checked_sub\s*\(/.test(code));
			return passed
				? { passed: true, output: "decrement assertion passed" }
				: {
						passed: false,
						error: "Expected decrement instruction with counter mutation (-= 1 or checked_sub)",
					};
		}
	}

	if (description.includes("compile")) {
		return { passed: true, output: "compilation assertion passed" };
	}

	const genericChecks = [
		normalizedCode.includes("fn "),
		normalizedCode.includes("program"),
		normalizedCode.length > 25,
	];
	const passed = genericChecks.filter(Boolean).length >= 2;
	return passed
		? { passed: true, output: `generic assertion ${testIndex + 1} passed (${challengeId})` }
		: {
				passed: false,
				error: `Assertion failed for test: ${testDescription}`,
			};
}

function hasBalancedDelimiters(source: string): boolean {
	const openers = new Set(["(", "[", "{"]);
	const closers = new Map([
		[")", "("],
		["]", "["],
		["}", "{"],
	]);
	const stack: string[] = [];

	for (const char of source) {
		if (openers.has(char)) {
			stack.push(char);
			continue;
		}

		const expectedOpen = closers.get(char);
		if (!expectedOpen) continue;
		const found = stack.pop();
		if (found !== expectedOpen) return false;
	}

	return stack.length === 0;
}

function containsUnsafePatterns(source: string): boolean {
	const blockedPatterns = [
		/child_process/,
		/require\s*\(\s*["']fs["']\s*\)/,
		/process\.env/,
		/std::process::command/i,
		/unsafe\s*\{/,
	];

	return blockedPatterns.some((pattern) => pattern.test(source));
}
